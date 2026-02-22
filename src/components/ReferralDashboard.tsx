import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralService } from '@/services/referralService';
import CampaignManagement from './CampaignManagement';
import {
  Trophy,
  Users,
  Link as LinkIcon,
  Share2,
  Plus,
  TrendingUp,
  Gift,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  MessageCircle,
  Linkedin,
  Facebook,
  Twitter
} from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date?: string;
  created_at: string;
}

interface ReferralLink {
  id: string;
  campaign_id: string;
  referral_code: string;
  full_url: string;
  clicks_count: number;
  conversions_count: number;
  points_earned: number;
  status: 'active' | 'inactive' | 'expired';
}

interface UserStats {
  totalClicks: number;
  totalConversions: number;
  totalPoints: number;
  availablePoints: number;
  currentTier: string;
  links: ReferralLink[];
  conversions: any[];
}

interface LeaderboardEntry {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  total_clicks: number;
  total_conversions: number;
  total_points: number;
  rank: number;
}

const ReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ReferralLink | null>(null);
  const [userReferralLink, setUserReferralLink] = useState<string>('');

  // Campaign creation form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load campaigns and stats in parallel
      const [campaignsResult, statsResult] = await Promise.all([
        ReferralService.getUserCampaigns(user.id),
        ReferralService.getUserReferralStats(user.id)
      ]);

      // Process campaigns
      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data);
        if (campaignsResult.data.length > 0) {
          setSelectedCampaign(campaignsResult.data[0].id);
        }
      }

      // Process user stats
      if (statsResult.success && statsResult.data) {
        setUserStats(statsResult.data);

        // Get user's referral link from the first available link
        if (statsResult.data.links && statsResult.data.links.length > 0) {
          const activeLink = statsResult.data.links.find(link => link.status === 'active');
          if (activeLink) {
            setUserReferralLink(activeLink.full_url);
          }
        }
      }

      // Load leaderboard and generate missing link in parallel (if needed)
      const additionalPromises: Promise<any>[] = [];

      // Load leaderboard for first active campaign
      if (campaignsResult.success && campaignsResult.data && campaignsResult.data.length > 0) {
        const activeCampaign = campaignsResult.data.find(c => c.status === 'active');
        if (activeCampaign) {
          additionalPromises.push(
            ReferralService.getCampaignLeaderboard(activeCampaign.id).then(result => {
              if (result.success) {
                setLeaderboard(result.data || []);
              }
            })
          );
        }
      }

      // Generate link if none exists
      if (!userReferralLink && campaignsResult.data?.[0]) {
        additionalPromises.push(
          ReferralService.getOrCreateReferralLink(user.id, campaignsResult.data[0].id).then(result => {
            if (result.success && result.data) {
              setUserReferralLink(result.data.full_url);
            }
          })
        );
      }

      // Wait for additional requests if any
      if (additionalPromises.length > 0) {
        await Promise.all(additionalPromises);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) return;

    try {
      const result = await ReferralService.createCampaign(user.id, campaignForm);
      if (result.success) {
        toast.success('Campaign created successfully!');
        setCreateDialogOpen(false);
        setCampaignForm({
          name: '',
          description: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: ''
        });
        loadData();
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleGenerateLink = async (campaignId: string) => {
    if (!user) return;

    try {
      const result = await ReferralService.getOrCreateReferralLink(user.id, campaignId);
      if (result.success) {
        toast.success('Referral link generated!');
        loadData();
      } else {
        toast.error(result.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate referral link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareOnSocial = (platform: string, url: string, message: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedMessage = encodeURIComponent(message);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Referral Program</h2>
          <p className="text-muted-foreground">Earn rewards by referring new users to OstrichAi</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Referral Campaign</DialogTitle>
              <DialogDescription>
                Set up a new referral campaign to start earning rewards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Summer Referral Program"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-description">Description (Optional)</Label>
                <Textarea
                  id="campaign-description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Describe your referral campaign..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign} className="w-full mt-4">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="manage">Manage Campaigns</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.totalConversions || 0}</p>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <LinkIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.totalClicks || 0}</p>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.totalPoints || 0}</p>
                    <p className="text-sm text-muted-foreground">Points Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Gift className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold capitalize">{userStats?.currentTier || 'None'}</p>
                    <p className="text-sm text-muted-foreground">Current Tier</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                  className="hover:border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                {campaigns.length > 0 && (
                  <Button
                    onClick={() => handleGenerateLink(campaigns[0].id)}
                    variant="outline"
                    className="hover:border-primary/50"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Generate Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Your Referral Link Section */}
        {userReferralLink && (
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20 mt-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full mb-4 shadow-lg shadow-primary/20">
                  <LinkIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">🎯 Your Referral Link</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Share this unique link to invite friends and compete for rewards! Every successful referral earns you points and moves you up the leaderboard.
                </p>

                <div className="bg-background rounded-lg p-2 max-w-xl mx-auto mb-6 shadow-sm border border-border flex items-center">
                  <code className="flex-1 text-sm p-2 font-mono truncate text-muted-foreground">{userReferralLink}</code>
                  <Button
                    onClick={() => copyToClipboard(userReferralLink)}
                    variant="ghost"
                    size="sm"
                    className="ml-2 hover:text-primary"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={() => shareOnSocial('twitter', userReferralLink, `Check out OstrichAi - amazing AI tools for creators! ${userReferralLink}`)}
                    variant="outline"
                    className="hover:bg-blue-400/10 hover:text-blue-400 border-border"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('facebook', userReferralLink, `Check out OstrichAi - amazing AI tools for creators! ${userReferralLink}`)}
                    variant="outline"
                    className="hover:bg-blue-600/10 hover:text-blue-600 border-border"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('linkedin', userReferralLink, `Check out OstrichAi - amazing AI tools for creators! ${userReferralLink}`)}
                    variant="outline"
                    className="hover:bg-blue-700/10 hover:text-blue-700 border-border"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('whatsapp', userReferralLink, `Check out OstrichAi - amazing AI tools for creators! ${userReferralLink}`)}
                    variant="outline"
                    className="hover:bg-green-500/10 hover:text-green-500 border-border"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-primary">{userStats?.totalClicks || 0}</div>
                    <div className="text-sm text-muted-foreground">Clicks</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-green-500">{userStats?.totalConversions || 0}</div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <div className="text-2xl font-bold text-purple-500">{userStats?.totalPoints || 0}</div>
                    <div className="text-sm text-muted-foreground">Points Earned</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="campaigns" className="space-y-6 mt-6">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">Create your first referral campaign to start earning rewards.</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <p className="text-muted-foreground">{campaign.description}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Started {new Date(campaign.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleGenerateLink(campaign.id)}
                          variant="outline"
                          size="sm"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Get Link
                        </Button>
                        <Button
                          onClick={() => {
                            const link = userStats?.links.find(l => l.campaign_id === campaign.id);
                            if (link) {
                              setSelectedLink(link);
                              setShareDialogOpen(true);
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6 mt-6">
          <CampaignManagement />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Leaderboard</CardTitle>
              <CardDescription>Top performers in the current active campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No leaderboard data available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold
                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              index === 2 ? 'bg-orange-500/20 text-orange-600' :
                                'bg-muted text-muted-foreground'
                          }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-medium">{entry.full_name || 'Anonymous'}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.total_conversions} conversions • {entry.total_clicks} clicks
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{entry.total_points}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Rewards</CardTitle>
              <CardDescription>Track your points and redeem rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-xl bg-card">
                  <div className="text-3xl font-bold text-blue-500 mb-1">{userStats?.totalPoints || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
                <div className="text-center p-6 border rounded-xl bg-card">
                  <div className="text-3xl font-bold text-green-500 mb-1">{userStats?.availablePoints || 0}</div>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                </div>
                <div className="text-center p-6 border rounded-xl bg-card">
                  <Badge variant="outline" className="text-lg py-1 px-4 mb-2 border-primary/50 text-primary">
                    {userStats?.currentTier || 'None'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Current Tier</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Tier Progress</h4>
                  <span className="text-sm text-muted-foreground">{Math.min((userStats?.totalPoints || 0), 1000)} / 1000 points (Bronze)</span>
                </div>

                <div className="relative w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((userStats?.totalPoints || 0) / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-right">Next tier: Silver at 2,000 points</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Referral Link</DialogTitle>
            <DialogDescription>
              Share this link to earn points when others sign up!
            </DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-medium mb-3 text-foreground">Your Referral Link:</p>
                <div className="flex items-center space-x-2">
                  <Input value={selectedLink.full_url} readOnly className="flex-1 font-mono text-sm" />
                  <Button
                    onClick={() => copyToClipboard(selectedLink.full_url)}
                    size="sm"
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-foreground">Share via:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => shareOnSocial('twitter', selectedLink.full_url, `Check out OstrichAi! ${selectedLink.full_url}`)}
                    variant="outline"
                    className="w-full justify-start hover:bg-blue-400/10 hover:text-blue-400"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('facebook', selectedLink.full_url, `Check out OstrichAi! ${selectedLink.full_url}`)}
                    variant="outline"
                    className="w-full justify-start hover:bg-blue-600/10 hover:text-blue-600"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('linkedin', selectedLink.full_url, `Check out OstrichAi! ${selectedLink.full_url}`)}
                    variant="outline"
                    className="w-full justify-start hover:bg-blue-700/10 hover:text-blue-700"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('whatsapp', selectedLink.full_url, `Check out OstrichAi! ${selectedLink.full_url}`)}
                    variant="outline"
                    className="w-full justify-start hover:bg-green-500/10 hover:text-green-500"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralDashboard;

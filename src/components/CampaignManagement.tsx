import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralService } from '@/services/referralService';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Share2,
  BarChart3,
  Users,
  Link as LinkIcon,
  Settings,
  Calendar,
  Target,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import ReferralSubmissionsDashboard from './ReferralSubmissionsDashboard';

interface Campaign {
   id: string;
   name: string;
   description?: string;
   status: 'draft' | 'active' | 'paused' | 'completed';
   start_date: string;
   end_date?: string;
   reward_config: {
     points_per_referral: number;
     points_per_conversion: number;
     tier_rewards: {
       bronze: { min_points: number; reward: string };
       silver: { min_points: number; reward: string };
       gold: { min_points: number; reward: string };
     };
     max_referrals_per_user: number;
     conversion_window_days: number;
   };
   landing_page_config?: any;
   sharing_config: {
     platforms: string[];
     default_message: string;
     custom_tracking: boolean;
   };
   analytics: any;
   created_at: string;
   updated_at: string;
 }

const CampaignManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [selectedCampaignForSubmissions, setSelectedCampaignForSubmissions] = useState<Campaign | null>(null);

  // Fetch campaigns with React Query caching
  const { data: campaigns = [], isLoading: loading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const result = await ReferralService.getUserCampaigns(user!.id);
      if (result.success) {
        return result.data || [];
      }
      throw new Error(result.error || 'Failed to load campaigns');
    },
    enabled: !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch analytics with React Query (only when dialog is open)
  const { data: campaignAnalytics, isFetching: analyticsLoading } = useQuery({
    queryKey: ['campaignAnalytics', selectedCampaign?.id, user?.id],
    queryFn: async () => {
      if (!selectedCampaign || !user) return null;
      const result = await ReferralService.getCampaignAnalytics(selectedCampaign.id, user.id);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to load analytics');
    },
    enabled: !!analyticsDialogOpen && !!selectedCampaign && !!user,
    staleTime: 20000, // Analytics can be fresh for 20 seconds
    gcTime: 180000, // Keep analytics in cache for 3 minutes
    refetchOnWindowFocus: false,
  });

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reward_config: {
      points_per_referral: 100,
      points_per_conversion: 500,
      tier_rewards: {
        bronze: { min_points: 1000, reward: '1_month_free' },
        silver: { min_points: 2500, reward: '3_months_free' },
        gold: { min_points: 5000, reward: '1_year_free' }
      },
      max_referrals_per_user: 100,
      conversion_window_days: 30
    },
    landing_page_config: {
      template: 'default',
      form_type: 'signup',
      title: 'Join the OstrichAi Referral Challenge! 🏆',
      subtitle: 'Share your link, refer friends, and compete for amazing rewards!',
      description: 'Be part of our viral referral competition! Every friend you bring earns you points, climbs the leaderboard, and unlocks exclusive rewards. The more you share, the more you win!',
      features: [
        '🏆 Compete on Leaderboards',
        '🎁 Earn Exclusive Rewards',
        '📈 Track Your Progress',
        '🤝 Help Friends Discover OstrichAi'
      ],
      primary_cta: 'Join the Competition!',
      secondary_cta: 'See Leaderboard',
      background_color: '#6366f1',
      text_color: '#ffffff',
      button_color: '#f59e0b',
      accent_color: '#8b5cf6',
      hero_image_url: '',
      gallery_images: [],
      logo_url: '',
      favicon_url: '',
      custom_css: '',
      custom_html: '',
      layout: 'centered',
      sections: ['hero', 'features', 'social_proof', 'cta'],
      hero_layout: 'horizontal',
      hero_layout_side: 'left',
      thank_you_page: {
        title: 'Welcome to the Team!',
        subtitle: 'Your referral link has been generated',
        description: 'Share this link to start earning rewards and climb the leaderboard!',
        show_referral_link: true,
        show_points_info: true,
        redirect_delay: 3000,
        redirect_url: ''
      },
      form_config: {
        fields: ['email', 'full_name'],
        require_verification: true,
        success_message: 'Check your email for verification!',
        lead_capture_fields: ['email', 'full_name', 'company', 'phone'],
        show_form_on_click: false
      },
      seo_config: {
        meta_title: 'Join OstrichAi - AI Tools for Creators',
        meta_description: 'Create stunning content with AI-powered tools. Join thousands of creators using OstrichAi.',
        og_image: '',
        twitter_card: 'summary_large_image'
      }
    },
    sharing_config: {
      platforms: ['email', 'twitter', 'facebook', 'linkedin', 'whatsapp'],
      default_message: 'Check out OstrichAi - amazing AI tools for creators!',
      custom_tracking: true
    }
  });

  const handleCreateCampaign = async () => {
    if (!user) return;

    try {
      const result = await ReferralService.createCampaign(user.id, campaignForm);
      if (result.success) {
        toast.success('Campaign created successfully!');
        setCreateDialogOpen(false);
        resetForm();
        // Invalidate and refetch campaigns
        queryClient.invalidateQueries({ queryKey: ['campaigns', user.id] });
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleUpdateCampaign = async () => {
    if (!user || !selectedCampaign) return;

    try {
      const result = await ReferralService.updateCampaign(
        selectedCampaign.id,
        user.id,
        campaignForm
      );
      if (result.success) {
        toast.success('Campaign updated successfully!');
        setEditDialogOpen(false);
        resetForm();
        // Invalidate and refetch campaigns
        queryClient.invalidateQueries({ queryKey: ['campaigns', user.id] });
      } else {
        toast.error(result.error || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await ReferralService.deleteCampaign(campaignId, user.id);
      if (result.success) {
        toast.success('Campaign deleted successfully!');
        // Invalidate and refetch campaigns
        queryClient.invalidateQueries({ queryKey: ['campaigns', user.id] });
      } else {
        toast.error(result.error || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: 'active' | 'paused' | 'completed') => {
    if (!user) return;

    try {
      const result = await ReferralService.updateCampaign(campaignId, user.id, { status: newStatus });
      if (result.success) {
        toast.success(`Campaign ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'completed'}!`);
        // Invalidate and refetch campaigns
        queryClient.invalidateQueries({ queryKey: ['campaigns', user.id] });
      } else {
        toast.error(result.error || 'Failed to update campaign status');
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
    }
  };

  const handleViewAnalytics = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAnalyticsDialogOpen(true);
    // Analytics will be fetched automatically by useQuery when dialog opens
  };

  const handleViewSubmissions = (campaign: Campaign) => {
    setSelectedCampaignForSubmissions(campaign);
    setSubmissionsDialogOpen(true);
  };

  const resetForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      reward_config: {
        points_per_referral: 100,
        points_per_conversion: 500,
        tier_rewards: {
          bronze: { min_points: 1000, reward: '1_month_free' },
          silver: { min_points: 2500, reward: '3_months_free' },
          gold: { min_points: 5000, reward: '1_year_free' }
        },
        max_referrals_per_user: 100,
        conversion_window_days: 30
      },
      landing_page_config: {
        template: 'default',
        form_type: 'signup',
        title: 'Join the OstrichAi Referral Challenge! 🏆',
        subtitle: 'Share your link, refer friends, and compete for amazing rewards!',
        description: 'Be part of our viral referral competition! Every friend you bring earns you points, climbs the leaderboard, and unlocks exclusive rewards. The more you share, the more you win!',
        features: [
          '🏆 Compete on Leaderboards',
          '🎁 Earn Exclusive Rewards',
          '📈 Track Your Progress',
          '🤝 Help Friends Discover OstrichAi'
        ],
        primary_cta: 'Join the Competition!',
        secondary_cta: 'See Leaderboard',
        background_color: '#6366f1',
        text_color: '#ffffff',
        button_color: '#f59e0b',
        accent_color: '#8b5cf6',
        hero_image_url: '',
        gallery_images: [],
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        custom_html: '',
        layout: 'centered',
        sections: ['hero', 'features', 'social_proof', 'cta'],
        hero_layout: 'horizontal',
        hero_layout_side: 'left',
        thank_you_page: {
          title: 'Welcome to the Team!',
          subtitle: 'Your referral link has been generated',
          description: 'Share this link to start earning rewards and climb the leaderboard!',
          show_referral_link: true,
          show_points_info: true,
          redirect_delay: 3000,
          redirect_url: ''
        },
        form_config: {
          fields: ['email', 'full_name'],
          require_verification: true,
          success_message: 'Check your email for verification!',
          lead_capture_fields: ['email', 'full_name', 'company', 'phone'],
          show_form_on_click: false
        },
        seo_config: {
          meta_title: 'Join OstrichAi - AI Tools for Creators',
          meta_description: 'Create stunning content with AI-powered tools. Join thousands of creators using OstrichAi.',
          og_image: '',
          twitter_card: 'summary_large_image'
        }
      },
      sharing_config: {
        platforms: ['email', 'twitter', 'facebook', 'linkedin', 'whatsapp'],
        default_message: 'Check out OstrichAi - amazing AI tools for creators!',
        custom_tracking: true
      }
    });
  };

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description || '',
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      reward_config: campaign.reward_config,
      landing_page_config: campaign.landing_page_config || {
        template: 'default',
        form_type: 'signup',
        title: 'Welcome to OstrichAi!',
        subtitle: 'Join thousands of creators using AI-powered tools',
        description: 'Create stunning videos, logos, ads, and more with our advanced AI platform.',
        features: [
          '🎬 AI Video Generation',
          '🎨 Professional Logo Design',
          '📱 Social Media Content',
          '📊 Advanced Analytics'
        ],
        primary_cta: 'Start Creating Now',
        secondary_cta: 'Learn More',
        background_color: '#f8fafc',
        text_color: '#1f2937',
        button_color: '#3b82f6',
        accent_color: '#6366f1',
        hero_image_url: '',
        gallery_images: [],
        logo_url: '',
        favicon_url: '',
        custom_css: '',
        custom_html: '',
        layout: 'centered',
        sections: ['hero', 'features', 'social_proof', 'cta'],
        hero_layout: 'horizontal',
        hero_layout_side: 'left',
        thank_you_page: {
          title: 'Welcome to the Team!',
          subtitle: 'Your referral link has been generated',
          description: 'Share this link to start earning rewards and climb the leaderboard!',
          show_referral_link: true,
          show_points_info: true,
          redirect_delay: 3000,
          redirect_url: ''
        },
        form_config: {
          fields: ['email', 'full_name'],
          require_verification: true,
          success_message: 'Check your email for verification!',
          lead_capture_fields: ['email', 'full_name', 'company', 'phone'],
          show_form_on_click: false
        },
        seo_config: {
          meta_title: 'Join OstrichAi - AI Tools for Creators',
          meta_description: 'Create stunning content with AI-powered tools. Join thousands of creators using OstrichAi.',
          og_image: '',
          twitter_card: 'summary_large_image'
        }
      },
      sharing_config: campaign.sharing_config
    });
    setEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <StopCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Management</h2>
          <p className="text-gray-600">Create and manage your referral campaigns</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new referral campaign with custom rewards and settings.
              </DialogDescription>
            </DialogHeader>
            <CampaignForm
              formData={campaignForm}
              setFormData={setCampaignForm}
              onSubmit={handleCreateCampaign}
              submitLabel="Create Campaign"
            />
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first referral campaign to start driving viral growth.</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getStatusIcon(campaign.status)}
                        <span className="capitalize">{campaign.status}</span>
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{campaign.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Started {new Date(campaign.start_date).toLocaleDateString()}</span>
                      </div>
                      {campaign.end_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Max {campaign.reward_config.max_referrals_per_user} referrals/user</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalytics(campaign)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(campaign)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Submissions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(campaign)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <div className="flex space-x-1">
                      {campaign.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(campaign.id, 'active')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(campaign.id, 'paused')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(campaign.id, 'active')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(campaign.status === 'active' || campaign.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(campaign.id, 'completed')}
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign settings and rewards.
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            formData={campaignForm}
            setFormData={setCampaignForm}
            onSubmit={handleUpdateCampaign}
            submitLabel="Update Campaign"
          />
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Analytics - {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Detailed performance metrics for your campaign.
            </DialogDescription>
          </DialogHeader>
          {campaignAnalytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{campaignAnalytics.totalClicks}</div>
                    <p className="text-sm text-gray-600">Total Clicks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{campaignAnalytics.totalConversions}</div>
                    <p className="text-sm text-gray-600">Conversions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{campaignAnalytics.conversionRate.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{campaignAnalytics.viralCoefficient.toFixed(2)}</div>
                    <p className="text-sm text-gray-600">Viral Coefficient</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Top Referrers</h4>
                <div className="space-y-2">
                  {campaignAnalytics.topReferrers.slice(0, 5).map((referrer: any, index: number) => (
                    <div key={referrer.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{referrer.full_name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">
                            {referrer.total_conversions} conversions • {referrer.total_clicks} clicks
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{referrer.total_points} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Form Submissions - {selectedCampaignForSubmissions?.name}</DialogTitle>
            <DialogDescription>
              Manage and review form submissions from your referral campaign
            </DialogDescription>
          </DialogHeader>
          {selectedCampaignForSubmissions && (
            <ReferralSubmissionsDashboard campaignId={selectedCampaignForSubmissions.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Campaign Form Component
interface CampaignFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitLabel: string;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ formData, setFormData, onSubmit, submitLabel }) => {
  const [activeTab, setActiveTab] = useState('basic');

  const updateRewardConfig = (key: string, value: any) => {
    setFormData({
      ...formData,
      reward_config: {
        ...formData.reward_config,
        [key]: value
      }
    });
  };

  const updateTierReward = (tier: string, field: string, value: any) => {
    setFormData({
      ...formData,
      reward_config: {
        ...formData.reward_config,
        tier_rewards: {
          ...formData.reward_config.tier_rewards,
          [tier]: {
            ...formData.reward_config.tier_rewards[tier],
            [field]: value
          }
        }
      }
    });
  };

  const updateSharingConfig = (key: string, value: any) => {
    setFormData({
      ...formData,
      sharing_config: {
        ...formData.sharing_config,
        [key]: value
      }
    });
  };

  const updateLandingConfig = (key: string, value: any) => {
    if (key.includes('.')) {
      // Handle nested keys like 'thank_you_page.title'
      const [parent, child] = key.split('.');
      setFormData({
        ...formData,
        landing_page_config: {
          ...formData.landing_page_config,
          [parent]: {
            ...formData.landing_page_config[parent],
            [child]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        landing_page_config: {
          ...formData.landing_page_config,
          [key]: value
        }
      });
    }
  };

  const togglePlatform = (platform: string) => {
    const currentPlatforms = formData.sharing_config.platforms;
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter((p: string) => p !== platform)
      : [...currentPlatforms, platform];

    updateSharingConfig('platforms', newPlatforms);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="rewards">Rewards</TabsTrigger>
        <TabsTrigger value="landing">Content</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="form">Form</TabsTrigger>
        <TabsTrigger value="thankyou">Thank You</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="sharing">Sharing</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="campaign-name">Campaign Name *</Label>
          <Input
            id="campaign-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Summer Referral Program"
            required
          />
        </div>
        <div>
          <Label htmlFor="campaign-description">Description</Label>
          <Textarea
            id="campaign-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your referral campaign..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date *</Label>
            <Input
              id="start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date (Optional)</Label>
            <Input
              id="end-date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="rewards" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="points-per-referral">Points per Referral Click</Label>
            <Input
              id="points-per-referral"
              type="number"
              value={formData.reward_config.points_per_referral}
              onChange={(e) => updateRewardConfig('points_per_referral', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="points-per-conversion">Points per Conversion</Label>
            <Input
              id="points-per-conversion"
              type="number"
              value={formData.reward_config.points_per_conversion}
              onChange={(e) => updateRewardConfig('points_per_conversion', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="max-referrals">Max Referrals per User</Label>
          <Input
            id="max-referrals"
            type="number"
            value={formData.reward_config.max_referrals_per_user}
            onChange={(e) => updateRewardConfig('max_referrals_per_user', parseInt(e.target.value) || 0)}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="conversion-window">Conversion Window (Days)</Label>
          <Input
            id="conversion-window"
            type="number"
            value={formData.reward_config.conversion_window_days}
            onChange={(e) => updateRewardConfig('conversion_window_days', parseInt(e.target.value) || 0)}
            min="1"
          />
        </div>

        <div>
          <Label className="text-base font-semibold">Tier Rewards</Label>
          <div className="space-y-3 mt-2">
            {Object.entries(formData.reward_config.tier_rewards).map(([tier, config]: [string, any]) => (
              <div key={tier} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{tier} Tier</h4>
                  <Badge variant="outline">{config.min_points} points</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min points"
                    type="number"
                    value={config.min_points}
                    onChange={(e) => updateTierReward(tier, 'min_points', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Reward description"
                    value={config.reward}
                    onChange={(e) => updateTierReward(tier, 'reward', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="landing" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template">Template</Label>
            <Select value={formData.landing_page_config.template} onValueChange={(value) => updateLandingConfig('template', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="layout">Layout</Label>
            <Select value={formData.landing_page_config.layout} onValueChange={(value) => updateLandingConfig('layout', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="split">Split Screen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="landing-title">Page Title</Label>
          <Input
            id="landing-title"
            value={formData.landing_page_config.title}
            onChange={(e) => updateLandingConfig('title', e.target.value)}
            placeholder="Welcome to OstrichAi!"
          />
        </div>

        <div>
          <Label htmlFor="landing-subtitle">Subtitle</Label>
          <Input
            id="landing-subtitle"
            value={formData.landing_page_config.subtitle}
            onChange={(e) => updateLandingConfig('subtitle', e.target.value)}
            placeholder="Join thousands of creators..."
          />
        </div>

        <div>
          <Label htmlFor="landing-description">Description</Label>
          <Textarea
            id="landing-description"
            value={formData.landing_page_config.description}
            onChange={(e) => updateLandingConfig('description', e.target.value)}
            placeholder="Describe your platform..."
            rows={3}
          />
        </div>

        <div>
          <Label>Features (one per line)</Label>
          <Textarea
            value={formData.landing_page_config.features.join('\n')}
            onChange={(e) => updateLandingConfig('features', e.target.value.split('\n').filter(f => f.trim()))}
            placeholder="🎬 AI Video Generation&#10;🎨 Professional Logo Design"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary-cta">Primary CTA Button</Label>
            <Input
              id="primary-cta"
              value={formData.landing_page_config.primary_cta}
              onChange={(e) => updateLandingConfig('primary_cta', e.target.value)}
              placeholder="Start Creating Now"
            />
          </div>
          <div>
            <Label htmlFor="secondary-cta">Secondary CTA Button (Optional)</Label>
            <Input
              id="secondary-cta"
              value={formData.landing_page_config.secondary_cta}
              onChange={(e) => updateLandingConfig('secondary_cta', e.target.value)}
              placeholder="Learn More"
            />
          </div>
        </div>

        <div>
          <Label>Page Sections</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['hero', 'features', 'social_proof', 'testimonials', 'pricing', 'cta'].map((section) => (
              <div key={section} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={section}
                  checked={formData.landing_page_config.sections?.includes(section) || false}
                  onChange={(e) => {
                    const currentSections = formData.landing_page_config.sections;
                    const newSections = e.target.checked
                      ? [...currentSections, section]
                      : currentSections.filter((s: string) => s !== section);
                    updateLandingConfig('sections', newSections);
                  }}
                  className="rounded"
                />
                <Label htmlFor={section} className="capitalize cursor-pointer">
                  {section.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="bg-color">Background</Label>
            <Input
              id="bg-color"
              type="color"
              value={formData.landing_page_config.background_color}
              onChange={(e) => updateLandingConfig('background_color', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="text-color">Text</Label>
            <Input
              id="text-color"
              type="color"
              value={formData.landing_page_config.text_color}
              onChange={(e) => updateLandingConfig('text_color', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="button-color">Button</Label>
            <Input
              id="button-color"
              type="color"
              value={formData.landing_page_config.button_color}
              onChange={(e) => updateLandingConfig('button_color', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accent-color">Accent</Label>
            <Input
              id="accent-color"
              type="color"
              value={formData.landing_page_config.accent_color}
              onChange={(e) => updateLandingConfig('accent_color', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="custom-css">Custom CSS (Optional)</Label>
          <Textarea
            id="custom-css"
            value={formData.landing_page_config.custom_css}
            onChange={(e) => updateLandingConfig('custom_css', e.target.value)}
            placeholder="body { font-family: 'Arial', sans-serif; }"
            rows={4}
          />
        </div>

        <div>
          <Label className="text-base font-semibold">Hero Layout</Label>
          <div className="space-y-3 mt-2">
            <div>
              <Label htmlFor="hero-layout">Layout Style</Label>
              <Select value={formData.landing_page_config.hero_layout} onValueChange={(value) => updateLandingConfig('hero_layout', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal (Title & Image Stacked)</SelectItem>
                  <SelectItem value="side-by-side">Side-by-Side (Title & Image Side by Side)</SelectItem>
                  <SelectItem value="form-beside-content">Form Beside Content (Form + Text, Image Below)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.landing_page_config.hero_layout === 'side-by-side' && (
              <div>
                <Label htmlFor="hero-layout-side">Content Position</Label>
                <Select value={formData.landing_page_config.hero_layout_side} onValueChange={(value) => updateLandingConfig('hero_layout_side', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Content on Left, Image on Right</SelectItem>
                    <SelectItem value="right">Content on Right, Image on Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="images" className="space-y-4">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Hero Image</Label>
            <div className="mt-2">
              <Input
                type="url"
                value={formData.landing_page_config.hero_image_url || ''}
                onChange={(e) => updateLandingConfig('hero_image_url', e.target.value)}
                placeholder="https://example.com/hero-image.jpg"
              />
              <p className="text-sm text-gray-600 mt-1">Main hero image for your landing page</p>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">Gallery Images</Label>
            <div className="mt-2 space-y-2">
              {formData.landing_page_config.gallery_images.map((image: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="url"
                    value={image}
                    onChange={(e) => {
                      const newImages = [...formData.landing_page_config.gallery_images];
                      newImages[index] = e.target.value;
                      updateLandingConfig('gallery_images', newImages);
                    }}
                    placeholder="https://example.com/gallery-image.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newImages = formData.landing_page_config.gallery_images.filter((_, i) => i !== index);
                      updateLandingConfig('gallery_images', newImages);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newImages = [...formData.landing_page_config.gallery_images, ''];
                  updateLandingConfig('gallery_images', newImages);
                }}
              >
                Add Gallery Image
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Additional images for your landing page gallery</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                type="url"
                value={formData.landing_page_config.logo_url || ''}
                onChange={(e) => updateLandingConfig('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <Label htmlFor="favicon-url">Favicon URL</Label>
              <Input
                id="favicon-url"
                type="url"
                value={formData.landing_page_config.favicon_url || ''}
                onChange={(e) => updateLandingConfig('favicon_url', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="form" className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Form Type</Label>
          <Select value={formData.landing_page_config.form_type} onValueChange={(value) => updateLandingConfig('form_type', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="signup">User Registration (creates account)</SelectItem>
              <SelectItem value="lead_capture">Lead Capture (just collects info)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-semibold">Form Fields</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['email', 'full_name', 'company', 'phone', 'website', 'message'].map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={field}
                  checked={formData.landing_page_config.form_config.fields.includes(field)}
                  onChange={(e) => {
                    const currentFields = formData.landing_page_config.form_config?.fields || [];
                    const newFields = e.target.checked
                      ? [...currentFields, field]
                      : currentFields.filter(f => f !== field);
                    updateLandingConfig('form_config.fields', newFields);
                  }}
                  className="rounded"
                />
                <Label htmlFor={field} className="capitalize cursor-pointer">
                  {field.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="require-verification"
            checked={formData.landing_page_config.form_config.require_verification}
            onCheckedChange={(checked) => updateLandingConfig('form_config.require_verification', checked)}
          />
          <Label htmlFor="require-verification">Require email verification for signups</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-form-on-click"
            checked={formData.landing_page_config.form_config.show_form_on_click}
            onCheckedChange={(checked) => updateLandingConfig('form_config.show_form_on_click', checked)}
          />
          <Label htmlFor="show-form-on-click">Show form only after clicking CTA button</Label>
        </div>

        <div>
          <Label htmlFor="success-message">Success Message</Label>
          <Input
            id="success-message"
            value={formData.landing_page_config.form_config.success_message}
            onChange={(e) => updateLandingConfig('form_config.success_message', e.target.value)}
            placeholder="Thank you for signing up!"
          />
        </div>
      </TabsContent>

      <TabsContent value="thankyou" className="space-y-4">
        <div>
          <Label htmlFor="thankyou-title">Thank You Page Title</Label>
          <Input
            id="thankyou-title"
            value={formData.landing_page_config.thank_you_page.title}
            onChange={(e) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, title: e.target.value })}
            placeholder="Welcome to the Team!"
          />
        </div>

        <div>
          <Label htmlFor="thankyou-subtitle">Thank You Page Subtitle</Label>
          <Input
            id="thankyou-subtitle"
            value={formData.landing_page_config.thank_you_page.subtitle}
            onChange={(e) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, subtitle: e.target.value })}
            placeholder="Your referral link has been generated"
          />
        </div>

        <div>
          <Label htmlFor="thankyou-description">Thank You Page Description</Label>
          <Textarea
            id="thankyou-description"
            value={formData.landing_page_config.thank_you_page.description}
            onChange={(e) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, description: e.target.value })}
            placeholder="Share this link to start earning rewards..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-referral-link"
              checked={formData.landing_page_config.thank_you_page.show_referral_link}
              onCheckedChange={(checked) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, show_referral_link: checked })}
            />
            <Label htmlFor="show-referral-link">Show generated referral link</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-points-info"
              checked={formData.landing_page_config.thank_you_page.show_points_info}
              onCheckedChange={(checked) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, show_points_info: checked })}
            />
            <Label htmlFor="show-points-info">Show points and rewards information</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="redirect-delay">Redirect Delay (ms)</Label>
            <Input
              id="redirect-delay"
              type="number"
              value={formData.landing_page_config.thank_you_page.redirect_delay}
              onChange={(e) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, redirect_delay: parseInt(e.target.value) || 3000 })}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="redirect-url">Redirect URL (Optional)</Label>
            <Input
              id="redirect-url"
              type="url"
              value={formData.landing_page_config.thank_you_page.redirect_url || ''}
              onChange={(e) => updateLandingConfig('thank_you_page', { ...formData.landing_page_config.thank_you_page, redirect_url: e.target.value })}
              placeholder="https://example.com/dashboard"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <div>
          <Label htmlFor="meta-title">Meta Title</Label>
          <Input
            id="meta-title"
            value={formData.landing_page_config.seo_config.meta_title}
            onChange={(e) => updateLandingConfig('seo_config', { ...formData.landing_page_config.seo_config, meta_title: e.target.value })}
            placeholder="Join OstrichAi - AI Tools for Creators"
          />
        </div>

        <div>
          <Label htmlFor="meta-description">Meta Description</Label>
          <Textarea
            id="meta-description"
            value={formData.landing_page_config.seo_config.meta_description}
            onChange={(e) => updateLandingConfig('seo_config', { ...formData.landing_page_config.seo_config, meta_description: e.target.value })}
            placeholder="Create stunning content with AI-powered tools..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="og-image">Open Graph Image URL</Label>
          <Input
            id="og-image"
            type="url"
            value={formData.landing_page_config.seo_config.og_image || ''}
            onChange={(e) => updateLandingConfig('seo_config', { ...formData.landing_page_config.seo_config, og_image: e.target.value })}
            placeholder="https://example.com/og-image.jpg"
          />
        </div>

        <div>
          <Label htmlFor="twitter-card">Twitter Card Type</Label>
          <Select value={formData.landing_page_config.seo_config.twitter_card} onValueChange={(value) => updateLandingConfig('seo_config', { ...formData.landing_page_config.seo_config, twitter_card: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="player">Player</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="sharing" className="space-y-4">
        <div>
          <Label htmlFor="default-message">Default Sharing Message</Label>
          <Textarea
            id="default-message"
            value={formData.sharing_config.default_message}
            onChange={(e) => updateSharingConfig('default_message', e.target.value)}
            placeholder="Enter your default sharing message..."
            rows={3}
          />
        </div>

        <div>
          <Label className="text-base font-semibold">Enabled Platforms</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['email', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram'].map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={platform}
                  checked={formData.sharing_config.platforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="rounded"
                />
                <Label htmlFor={platform} className="capitalize cursor-pointer">
                  {platform}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="custom-tracking"
            checked={formData.sharing_config.custom_tracking}
            onCheckedChange={(checked) => updateSharingConfig('custom_tracking', checked)}
          />
          <Label htmlFor="custom-tracking">Enable custom tracking parameters</Label>
        </div>
      </TabsContent>

      <div className="flex justify-end pt-4">
        <Button onClick={onSubmit} className="w-full">
          {submitLabel}
        </Button>
      </div>
    </Tabs>
  );
};

export default CampaignManagement;

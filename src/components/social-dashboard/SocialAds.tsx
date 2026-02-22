import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Target,
    TrendingUp,
    DollarSign,
    Eye,
    MousePointer,
    Plus,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
    id: string;
    campaign_name: string;
    campaign_id?: string;
    status: string;
    objective?: string;
    spend?: number;
    impressions?: number;
    clicks?: number;
    reach?: number;
    created_at: string;
    updated_at?: string;
}

const SocialAds: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        if (user) {
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('facebook_campaigns')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'active') return 'bg-green-500/10 text-green-500';
        if (statusLower === 'paused') return 'bg-yellow-500/10 text-yellow-500';
        if (statusLower === 'completed') return 'bg-blue-500/10 text-blue-500';
        return 'bg-gray-500/10 text-gray-500';
    };

    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number = 0) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Campaign Stats Summary */}
            {campaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Total Campaigns
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{campaigns.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {campaigns.filter(c => c.status?.toLowerCase() === 'active').length} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Total Spend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {formatCurrency(campaigns.reduce((sum, c) => sum + (c.spend || 0), 0))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">All campaigns</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Total Impressions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {formatNumber(campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total views</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MousePointer className="h-4 w-4" />
                                Total Clicks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {formatNumber(campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total engagements</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Campaign Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Ad Campaigns</h2>
                    <p className="text-muted-foreground">Manage your Facebook ad campaigns</p>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/ads-creative')}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                </Button>
            </div>

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first ad campaign to start reaching your audience
                        </p>
                        <Button onClick={() => navigate('/ads-creative')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Campaign
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                                            <Badge className={getStatusColor(campaign.status)}>
                                                {campaign.status || 'Unknown'}
                                            </Badge>
                                        </div>
                                        {campaign.objective && (
                                            <p className="text-sm text-muted-foreground capitalize">
                                                Objective: {campaign.objective.replace('OUTCOME_', '').toLowerCase()}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {campaign.campaign_id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${campaign.campaign_id}`, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Spend</p>
                                        <p className="text-lg font-semibold">{formatCurrency(campaign.spend || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                                        <p className="text-lg font-semibold">{formatNumber(campaign.impressions || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                                        <p className="text-lg font-semibold">{formatNumber(campaign.clicks || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Reach</p>
                                        <p className="text-lg font-semibold">{formatNumber(campaign.reach || 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SocialAds;

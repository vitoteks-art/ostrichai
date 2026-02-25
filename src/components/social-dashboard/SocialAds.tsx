import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Target,
    DollarSign,
    Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api';

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
            const data = await apiClient.getCampaigns(0, 50);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {campaigns.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Ad Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No campaigns found yet.</p>
                        <div className="mt-4">
                            <Button onClick={() => navigate('/social-dashboard')}>Go to Dashboard</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Campaign Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Campaign List */}
                    <div className="space-y-4">
                        {campaigns.map((c) => (
                            <Card key={c.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-base">{c.campaign_name}</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Created {formatDistanceToNow(new Date(c.created_at))} ago
                                        </p>
                                    </div>
                                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <div className="text-xs">Spend</div>
                                            <div className="text-foreground font-medium">{formatCurrency(c.spend || 0)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs">Impressions</div>
                                            <div className="text-foreground font-medium">{(c.impressions || 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs">Clicks</div>
                                            <div className="text-foreground font-medium">{(c.clicks || 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs">Objective</div>
                                            <div className="text-foreground font-medium">{c.objective || '-'}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SocialAds;

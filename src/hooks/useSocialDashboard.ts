import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { getConnectedAccounts, SocialMediaAccount } from '@/services/socialMediaOAuthService';

export interface DashboardMetrics {
    totalPosts: number;
    scheduledPosts: number;
    activeCampaigns: number;
    connectedPlatforms: number;
    totalReach: number;
    totalEngagement: number;
}

export interface RecentActivity {
    id: string;
    type: 'post' | 'campaign';
    title: string;
    platform: string;
    status: string;
    timestamp: string;
}

export interface CampaignSummary {
    id: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    campaign_id?: string;
}

// Module-level cache to persist data across navigation
let dashboardCache: {
    metrics: DashboardMetrics;
    connectedAccounts: SocialMediaAccount[];
    recentActivity: RecentActivity[];
    campaigns: CampaignSummary[];
    userId: string;
    timestamp: number;
} | null = null;

export const useSocialDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalPosts: 0,
        scheduledPosts: 0,
        activeCampaigns: 0,
        connectedPlatforms: 0,
        totalReach: 0,
        totalEngagement: 0,
    });
    const [connectedAccounts, setConnectedAccounts] = useState<SocialMediaAccount[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);


    const fetchConnectedAccounts = useCallback(async () => {
        if (!user) return [];

        try {
            const result = await getConnectedAccounts(user.id);
            if (result.success && result.data) {
                setConnectedAccounts(result.data);
                setMetrics(prev => ({ ...prev, connectedPlatforms: result.data!.length }));
                return result.data;
            }
        } catch (error) {
            console.error('Error fetching connected accounts:', error);
        }
        return [];
    }, [user]);

    const fetchPostMetrics = useCallback(async () => {
        if (!user) return { totalPosts: 0, scheduledPosts: 0, reach: 0, engagement: 0 };

        try {
            const posts = await apiClient.getSocialPosts(0, 1000); // Get a batch to count

            const totalCount = posts.length;
            const scheduledCount = posts.filter((p: any) => p.status === 'scheduled').length;

            let reach = 0;
            let engagement = 0;

            if (posts && Array.isArray(posts)) {
                posts.forEach((post: any) => {
                    reach += Number(post.impressions_count) || 0;
                    engagement += (Number(post.likes_count) || 0) +
                        (Number(post.comments_count) || 0) +
                        (Number(post.shares_count) || 0);
                });
            }

            setMetrics(prev => ({
                ...prev,
                totalPosts: totalCount,
                scheduledPosts: scheduledCount,
            }));

            return {
                totalPosts: totalCount,
                scheduledPosts: scheduledCount,
                reach,
                engagement
            };
        } catch (error) {
            console.error('Error fetching post metrics:', error);
            return { totalPosts: 0, scheduledPosts: 0, reach: 0, engagement: 0 };
        }
    }, [user]);

    const fetchCampaigns = useCallback(async () => {
        if (!user) return [];

        try {
            const data = await apiClient.getCampaigns(0, 10);

            if (data) {
                const campaignSummaries: CampaignSummary[] = data.map((campaign: any) => ({
                    id: campaign.id,
                    name: campaign.campaign_name,
                    status: campaign.status || 'unknown',
                    spend: Number(campaign.spend) || 0,
                    impressions: campaign.impressions || 0,
                    clicks: campaign.clicks || 0,
                    campaign_id: campaign.campaign_id,
                }));

                setCampaigns(campaignSummaries);

                // Count active campaigns
                const activeCount = campaignSummaries.filter(
                    c => c.status === 'ACTIVE' || c.status === 'active'
                ).length;

                setMetrics(prev => ({ ...prev, activeCampaigns: activeCount }));
                return campaignSummaries;
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
        return [];
    }, [user]);

    const fetchRecentActivity = useCallback(async () => {
        if (!user) return [];

        try {
            // Fetch recent posts and campaigns from backend
            const [posts, campaigns] = await Promise.all([
                apiClient.getSocialPosts(0, 5),
                apiClient.getCampaigns(0, 5)
            ]);

            const activities: RecentActivity[] = [];

            // Add posts to activities
            if (posts) {
                posts.forEach((post: any) => {
                    activities.push({
                        id: post.id,
                        type: 'post',
                        title: post.post_text?.substring(0, 50) + (post.post_text?.length > 50 ? '...' : '') || 'Social Post',
                        platform: post.platform,
                        status: post.status,
                        timestamp: post.posted_at || post.created_at,
                    });
                });
            }

            // Add campaigns to activities
            if (campaigns) {
                campaigns.forEach((campaign: any) => {
                    activities.push({
                        id: campaign.id,
                        type: 'campaign',
                        title: campaign.campaign_name,
                        platform: 'facebook',
                        status: campaign.status,
                        timestamp: campaign.created_at,
                    });
                });
            }

            // Sort by timestamp and limit to 10 most recent
            activities.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            const finalActivities = activities.slice(0, 10);
            setRecentActivity(finalActivities);
            return finalActivities;
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }, [user]);

    const refreshData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        const [accounts, postMetrics, campaignData, activityData] = await Promise.all([
            fetchConnectedAccounts(),
            fetchPostMetrics(),
            fetchCampaigns(),
            fetchRecentActivity(),
        ]);

        // Access the LATEST state state for active campaigns count or recalculate it
        // Since setMetrics is async, we recalculate derived metrics for the cache
        const activeCampaignsCount = (campaignData as CampaignSummary[] || []).filter(
            c => c.status === 'ACTIVE' || c.status === 'active'
        ).length;

        const newMetrics: DashboardMetrics = {
            totalPosts: (postMetrics as any).totalPosts || 0,
            scheduledPosts: (postMetrics as any).scheduledPosts || 0,
            activeCampaigns: activeCampaignsCount,
            connectedPlatforms: (accounts as any[]).length || 0,
            totalReach: ((postMetrics as any).reach || 0) +
                (campaignData as CampaignSummary[] || []).reduce((acc, c) => acc + (c.impressions || 0), 0),
            totalEngagement: ((postMetrics as any).engagement || 0) +
                (campaignData as CampaignSummary[] || []).reduce((acc, c) => acc + (c.clicks || 0), 0),
        };

        // Update cache
        dashboardCache = {
            metrics: newMetrics,
            connectedAccounts: (accounts as SocialMediaAccount[]) || [],
            recentActivity: (activityData as RecentActivity[]) || [],
            campaigns: (campaignData as CampaignSummary[]) || [],
            userId: user.id,
            timestamp: Date.now()
        };

        // Ensure local state matches (redundant if setters worked, but good for consistency)
        setMetrics(newMetrics);

        setLoading(false);
    }, [user, fetchConnectedAccounts, fetchPostMetrics, fetchCampaigns, fetchRecentActivity]);

    useEffect(() => {
        if (user) {
            // Check if we have valid cached data for this user
            if (dashboardCache && dashboardCache.userId === user.id) {
                setMetrics(dashboardCache.metrics);
                setConnectedAccounts(dashboardCache.connectedAccounts);
                setRecentActivity(dashboardCache.recentActivity);
                setCampaigns(dashboardCache.campaigns);
                setLoading(false);
            } else {
                // No cache or different user, fetch fresh
                refreshData();
            }
        }
    }, [user, refreshData]);

    return {
        loading,
        metrics,
        connectedAccounts,
        recentActivity,
        campaigns,
        refreshData,
    };
};

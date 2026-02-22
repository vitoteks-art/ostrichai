import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Play,
    Plus,
    TrendingUp,
    Users,
    Calendar,
    Activity,
    MessageSquare,
    Target,
    Loader2,
} from 'lucide-react';
import { DashboardMetrics, RecentActivity, CampaignSummary } from '@/hooks/useSocialDashboard';
import { SocialMediaAccount } from '@/services/socialMediaOAuthService';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SocialOverviewProps {
    metrics: DashboardMetrics;
    connectedAccounts: SocialMediaAccount[];
    recentActivity: RecentActivity[];
    campaigns: CampaignSummary[];
    loading: boolean;
    onRefresh: () => void;
}

const SocialOverview: React.FC<SocialOverviewProps> = ({
    metrics,
    connectedAccounts,
    recentActivity,
    campaigns,
    loading,
    onRefresh,
}) => {
    const navigate = useNavigate();

    const platformIcons: Record<string, React.ElementType> = {
        facebook: Facebook,
        instagram: Instagram,
        twitter: Twitter,
        linkedin: Linkedin,
        tiktok: Play,
    };

    const platformColors: Record<string, string> = {
        facebook: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
        twitter: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        linkedin: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
        tiktok: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'active' || statusLower === 'posted' || statusLower === 'completed') {
            return 'bg-green-500/10 text-green-500';
        }
        if (statusLower === 'scheduled' || statusLower === 'pending') {
            return 'bg-yellow-500/10 text-yellow-500';
        }
        if (statusLower === 'failed' || statusLower === 'error') {
            return 'bg-red-500/10 text-red-500';
        }
        return 'bg-gray-500/10 text-gray-500';
    };

    const getPlatformIcon = (platform: string) => {
        const Icon = platformIcons[platform.toLowerCase()] || MessageSquare;
        return Icon;
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Total Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalPosts}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time posts</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Scheduled Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.scheduledPosts}</div>
                        <p className="text-xs text-muted-foreground mt-1">Upcoming posts</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Active Campaigns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.activeCampaigns}</div>
                        <p className="text-xs text-muted-foreground mt-1">Running ads</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Connected Platforms
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.connectedPlatforms}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => navigate('/social-media-post')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/ads-creative')}
                        >
                            <Target className="mr-2 h-4 w-4" />
                            Create Campaign
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/settings/connected-accounts')}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Connect Platform
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Connected Platforms & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connected Platforms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Connected Platforms
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {connectedAccounts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="mb-3">No platforms connected yet</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/settings/connected-accounts')}
                                >
                                    Connect Your First Platform
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {connectedAccounts.slice(0, 5).map((account) => {
                                    const Icon = getPlatformIcon(account.platform);
                                    const colorClass = platformColors[account.platform.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

                                    return (
                                        <div
                                            key={account.id}
                                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg border ${colorClass}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {account.account_name || account.platform_username || account.platform}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {account.platform}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(account.account_status)}>
                                                {account.account_status}
                                            </Badge>
                                        </div>
                                    );
                                })}
                                {connectedAccounts.length > 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => navigate('/settings/connected-accounts')}
                                    >
                                        View All ({connectedAccounts.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="mb-3">No recent activity</p>
                                <p className="text-sm">Your posts and campaigns will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => {
                                    const Icon = getPlatformIcon(activity.platform);
                                    const colorClass = platformColors[activity.platform.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                                        >
                                            <div className={`p-2 rounded-lg border ${colorClass} mt-0.5`}>
                                                <Icon className="h-3 w-3" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{activity.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {activity.type}
                                                    </Badge>
                                                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                                                        {activity.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SocialOverview;

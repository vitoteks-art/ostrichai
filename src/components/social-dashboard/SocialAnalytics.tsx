import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    Heart,
    MessageCircle,
    Share2,
    Eye,
    Users,
    Activity,
    Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface PlatformStats {
    platform: string;
    posts: number;
    engagement: number;
    reach: number;
}

const SocialAnalytics: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
    const [totalEngagement, setTotalEngagement] = useState(0);
    const [totalReach, setTotalReach] = useState(0);
    const [totalLikes, setTotalLikes] = useState(0);
    const [totalComments, setTotalComments] = useState(0);
    const [totalShares, setTotalShares] = useState(0);

    useEffect(() => {
        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    const fetchAnalytics = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch posts grouped by platform via backend
            const posts = await apiClient.getSocialPosts(0, 1000);

            // Group posts by platform
            const statsMap = new Map<string, PlatformStats>();
            let likesSum = 0;
            let commentsSum = 0;
            let sharesSum = 0;

            posts?.forEach(post => {
                const platform = post.platform || 'unknown';
                const postLikes = Number(post.likes_count) || 0;
                const postComments = Number(post.comments_count) || 0;
                const postShares = Number(post.shares_count) || 0;
                const postImpressions = Number(post.impressions_count) || 0;
                const postEngagement = postLikes + postComments + postShares;

                likesSum += postLikes;
                commentsSum += postComments;
                sharesSum += postShares;

                const existing = statsMap.get(platform);
                if (existing) {
                    existing.posts += 1;
                    existing.engagement += postEngagement;
                    existing.reach += postImpressions;
                } else {
                    statsMap.set(platform, {
                        platform,
                        posts: 1,
                        engagement: postEngagement,
                        reach: postImpressions,
                    });
                }
            });

            const stats = Array.from(statsMap.values());
            setPlatformStats(stats);
            setTotalLikes(likesSum);
            setTotalComments(commentsSum);
            setTotalShares(sharesSum);

            // Calculate totals
            const totalEng = stats.reduce((sum, s) => sum + s.engagement, 0);
            const totalR = stats.reduce((sum, s) => sum + s.reach, 0);
            setTotalEngagement(totalEng);
            setTotalReach(totalR);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const platformColors: Record<string, string> = {
        facebook: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
        twitter: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        linkedin: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
        tiktok: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
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
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Total Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {platformStats.reduce((sum, s) => sum + s.posts, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Total Engagement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {totalEngagement.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Likes, comments, shares</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Total Reach
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {totalReach.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">People reached</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Avg Engagement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {platformStats.length > 0
                                ? Math.round(totalEngagement / platformStats.reduce((sum, s) => sum + s.posts, 0))
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Per post</p>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Platform Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {platformStats.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">No analytics data yet</p>
                            <p className="text-sm">Create and publish posts to see analytics</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {platformStats.map((stat) => {
                                const colorClass = platformColors[stat.platform.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
                                const totalPosts = platformStats.reduce((sum, s) => sum + s.posts, 0);
                                const percentage = Math.round((stat.posts / totalPosts) * 100);

                                return (
                                    <div key={stat.platform} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${colorClass} capitalize`}>
                                                    {stat.platform}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {stat.posts} posts
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium">{percentage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-primary transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 pl-2 pt-1">
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {stat.engagement} engagements
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {stat.reach.toLocaleString()} reach
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {Math.round(stat.engagement / stat.posts)} avg/post
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

            {/* Engagement Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            Likes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalLikes.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total likes received</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            Comments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalComments.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total comments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-green-500" />
                            Shares
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalShares.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total shares</p>
                    </CardContent>
                </Card>
            </div>

            {/* Info Note */}
            <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Analytics Data</p>
                            <p className="text-xs text-muted-foreground">
                                Analytics data is aggregated from your social media posts. For real-time metrics and detailed insights,
                                connect your platform accounts and grant analytics permissions. Some metrics shown are simulated for demonstration.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SocialAnalytics;

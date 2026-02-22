import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    MessageSquare,
    Target,
    BarChart3,
    Users,
    RefreshCw,
    Share2,
} from 'lucide-react';
import SocialOverview from '@/components/social-dashboard/SocialOverview';
import SocialContent from '@/components/social-dashboard/SocialContent';
import SocialAds from '@/components/social-dashboard/SocialAds';
import SocialAnalytics from '@/components/social-dashboard/SocialAnalytics';
import SocialConnections from '@/components/social-dashboard/SocialConnections';
import { useSocialDashboard } from '@/hooks/useSocialDashboard';

const SocialMediaDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const {
        loading,
        metrics,
        connectedAccounts,
        recentActivity,
        campaigns,
        refreshData,
    } = useSocialDashboard();

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                                <Share2 className="h-8 w-8 text-primary" />
                                Social Media Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Manage all your social media activities, ads, and analytics in one place
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshData}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Tabbed Interface */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-8 bg-card border border-border h-auto p-1">
                        <TabsTrigger
                            value="overview"
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden sm:inline">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="content"
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Content</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="ads"
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                        >
                            <Target className="h-4 w-4" />
                            <span className="hidden sm:inline">Ads</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Analytics</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="connections"
                            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
                        >
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Connections</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0">
                        <SocialOverview
                            metrics={metrics}
                            connectedAccounts={connectedAccounts}
                            recentActivity={recentActivity}
                            campaigns={campaigns}
                            loading={loading}
                            onRefresh={refreshData}
                        />
                    </TabsContent>

                    <TabsContent value="content" className="mt-0">
                        <SocialContent />
                    </TabsContent>

                    <TabsContent value="ads" className="mt-0">
                        <SocialAds />
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-0">
                        <SocialAnalytics />
                    </TabsContent>

                    <TabsContent value="connections" className="mt-0">
                        <SocialConnections />
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default SocialMediaDashboard;

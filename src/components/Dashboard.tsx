import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FeatureGate, SubscriptionStatus } from './FeatureGate';
import { SubscriptionFeatures, SubscriptionService } from '../services/subscriptionService';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  BarChart3,
  TrendingUp,
  Users,
  Video,
  Image,
  ImageIcon,
  Layout as LayoutIcon,
  Palette,
  Clock,
  Star,
  ArrowRight,
  Bell,
  Calendar,
  Download,
  Eye,
  Heart,
  Play,
  Plus,
  Zap,
  Home,
  ChevronRight,
  User,
  Settings,
  Loader2,
  Crown,
  Film,
  CreditCard,
  Share2
} from 'lucide-react';
import ReferralEarningsWidget from './ReferralEarningsWidget';

interface DashboardStats {
  totalProjects: number;
  videosCreated: number;
  logosGenerated: number;
  adsCreated: number;
  flyersCreated: number;
  socialPostsCreated: number;
  imagesEdited: number;
  storageUsed: number;
  storageLimit: number;
}

interface RecentProject {
  id: string;
  title: string;
  type: 'video' | 'logo' | 'ad' | 'flyer';
  status: 'completed' | 'processing' | 'draft';
  createdAt: string;
  thumbnail?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, activities, stats, loading: projectsLoading, getRecentProjects, getRecentActivities, activityStats, activityStatsLoading } = useProjects();
  const { subscription, plan, canAccess } = useSubscription();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState('');
  const [creditBalance, setCreditBalance] = useState<{
    balance: number;
    monthly_allocation: number;
    overage_rate_cents: number;
    credit_rollover_days: number;
  } | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchCreditBalance();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile for name (use metadata if available, fallback to email)
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }

      // Set notifications immediately (no need to wait)
      setNotifications([
        {
          id: '1',
          title: 'Video Processing Complete',
          message: 'Your product launch video is ready for download',
          type: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Storage Warning',
          message: 'You\'re using 65% of your storage limit',
          type: 'warning',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'New Feature Available',
          message: 'Check out our new AI-powered logo generator',
          type: 'info',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchCreditBalance = async () => {
    if (!user) return;

    setCreditLoading(true);
    try {
      const creditResult = await SubscriptionService.getCreditBalance(user.id);
      if (creditResult.success && creditResult.data) {
        setCreditBalance(creditResult.data);
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    } finally {
      setCreditLoading(false);
    }
  };

  // Get recent projects from the hook
  const recentProjects = getRecentProjects(4).map(project => ({
    id: project.id,
    title: project.title,
    type: project.type as 'video' | 'logo' | 'ad' | 'flyer',
    status: project.status as 'completed' | 'processing' | 'draft',
    createdAt: project.created_at,
    thumbnail: project.thumbnail_url
  }));

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'logo': return <Palette className="h-4 w-4" />;
      case 'ad': return <Image className="h-4 w-4" />;
      case 'flyer': return <Image className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Star className="h-4 w-4 text-green-500" />;
      case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Zap className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const quickActions = [
    {
      title: 'Create Video',
      description: 'Generate AI-powered videos',
      icon: <Video className="h-6 w-6" />,
      link: '/video-creation',
      color: 'bg-blue-500',
      feature: 'videoGeneration',
      premium: true
    },
    {
      title: 'Video UGC Creator',
      description: 'Advanced video generation with multiple modes',
      icon: <Film className="h-6 w-6" />,
      link: '/video-ugc',
      color: 'bg-purple-500',
      feature: 'videoGeneration',
      premium: true
    },
    {
      title: 'Design Logo',
      description: 'Create professional logos',
      icon: <Palette className="h-6 w-6" />,
      link: '/logo-creation',
      color: 'bg-purple-500',
      feature: 'logoDesign'
    },
    {
      title: 'Make Ad Creative',
      description: 'Design engaging advertisements',
      icon: <Image className="h-6 w-6" />,
      link: '/ads-creative',
      color: 'bg-green-500',
      feature: 'adCreation'
    },
    {
      title: 'Create Flyer',
      description: 'Design beautiful flyers',
      icon: <Image className="h-6 w-6" />,
      link: '/flyer-designer',
      color: 'bg-orange-500',
      feature: 'flyerDesign'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Dashboard</span>
      </div>

      {/* Quick Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-card/50 rounded-lg border">
        <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Link to="/subscription" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <Crown className="h-4 w-4" />
          <span>Subscription</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Link to="/settings/connected-accounts" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <Share2 className="h-4 w-4" />
          <span>Social Connect</span>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Link to="/video-creation" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <Video className="h-4 w-4" />
          <span>Create Video</span>
        </Link>
        <Link to="/logo-creation" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <Palette className="h-4 w-4" />
          <span>Design Logo</span>
        </Link>
        <Link to="/ads-creative" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <LayoutIcon className="h-4 w-4" />
          <span>Ad Creative</span>
        </Link>
        <Link to="/flyer-designer" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm">
          <Image className="h-4 w-4" />
          <span>Flyer Designer</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <SubscriptionStatus />
          <Link to="/subscription">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your creative projects today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/subscription">
              <Button variant="outline">
                <Crown className="h-4 w-4 mr-2" />
                Manage Plan
              </Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Upgrade Prompt */}
      {plan && plan.price === 0 && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Unlock Premium Features</h3>
                  <p className="text-muted-foreground">
                    Upgrade to Professional Plan for unlimited videos, priority support, and advanced features
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold">$5</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <Link to="/subscription">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Program Section */}
      <div className="mb-8">
        <ReferralEarningsWidget />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+12%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Created</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.videosCreated}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+8%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logos Generated</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.logosGenerated}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+15%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ads Created</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.adsCreated}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+5%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flyers Created</CardTitle>
            <LayoutIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.flyersCreated}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+3%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Posts</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.socialPostsCreated}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+7%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Edited</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.imagesEdited}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+10%</span> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.storageUsed}MB</div>
                <Progress
                  value={(stats.storageUsed / stats.storageLimit) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.storageLimit - stats.storageUsed}MB remaining
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {creditLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : creditBalance ? (
              <>
                <div className="text-2xl font-bold">{creditBalance.balance}</div>
                <p className="text-xs text-muted-foreground">
                  {creditBalance.monthly_allocation} monthly allocation
                </p>
                {creditBalance.balance <= 50 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Low balance - consider topping up
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No active subscription
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                  <CardDescription>Start creating something amazing</CardDescription>
                </div>
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const hasAccess = !action.feature || (action.feature && canAccess(action.feature as keyof SubscriptionFeatures));

                  return (
                    <div key={index} className="group">
                      {hasAccess ? (
                        <Link to={action.link}>
                          <Card className="p-4 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 group-hover:scale-[1.02]">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                                {action.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </Card>
                        </Link>
                      ) : (
                        <div>
                          <Card className="p-4 border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50/50 to-orange-50/50">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${action.color} text-white opacity-60`}>
                                {action.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-base text-muted-foreground">
                                  {action.title}
                                  <Crown className="inline h-4 w-4 ml-2 text-yellow-500" />
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1 font-medium">
                                  Upgrade to Professional Plan
                                </p>
                              </div>
                              <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                                <Zap className="h-4 w-4 mr-1" />
                                Upgrade
                              </Button>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional Navigation Links */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Link to="/two-image-editor">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Image className="h-3 w-3 mr-1" />
                      Image Editor
                    </Button>
                  </Link>
                  <Link to="/social-media-post">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Social Post
                    </Button>
                  </Link>
                  <Link to="/status">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Status
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest creative work</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-secondary/30 transition-all hover:shadow-sm group"
                  >
                    <div className="bg-secondary p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                      {getProjectIcon(project.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium group-hover:text-primary transition-colors">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                      <Badge variant="secondary" className="capitalize">
                        {project.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & State Monitoring */}
        <div className="space-y-6">
          {/* Activity Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Activity Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading activity stats...</span>
                </div>
              ) : activityStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{activityStats.currentState.totalProjects}</div>
                      <div className="text-sm text-gray-600">Total Projects</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{activityStats.currentState.completedProjects}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">{activityStats.currentState.activeProjects}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">{activityStats.currentState.failedProjects}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Most Active Product Type</h4>
                    <Badge variant="outline" className="capitalize">
                      {activityStats.mostActiveProduct !== 'none' ? activityStats.mostActiveProduct : 'No activity yet'}
                    </Badge>
                  </div>

                  {activityStats.lastActivity && (
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Last Activity</h4>
                      <p className="text-sm text-gray-600">{formatDate(activityStats.lastActivity)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
                <Badge variant="secondary">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getRecentActivities().length > 0 ? (
                <div className="space-y-4">
                  {getRecentActivities().map((activity: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

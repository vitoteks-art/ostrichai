import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import Layout from '../components/Layout';
import {
  Users,
  Shield,
  Activity,
  Settings,
  AlertTriangle,
  TrendingUp,
  Database,
  Workflow,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  ChevronRight,
  RefreshCw,
  Plus,
  Eye,
  Crown,
  UserCheck,
  BarChart3,
  Zap,
  Server,
  Bell,
  Mail,
  ArrowRight,
  Sparkles,
  Layout as LayoutIcon,
  Search,
  Filter,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { dashboardStats, loading, refreshStats, isSuperAdmin } = useAdmin();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
      setLastUpdated(new Date());
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleRefresh = () => {
    refreshStats();
    setLastUpdated(new Date());
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading command center...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: dashboardStats?.totalUsers || 0,
      icon: Users,
      trend: '+12%',
      trendColor: 'text-green-500',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Active Users',
      value: dashboardStats?.activeUsers || 0,
      icon: UserCheck,
      trend: '+8%',
      trendColor: 'text-green-500',
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Total Projects',
      value: dashboardStats?.totalProjects || 0,
      icon: BarChart3,
      trend: '+15%',
      trendColor: 'text-green-500',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'System Alerts',
      value: dashboardStats?.systemAlerts || 0,
      icon: Bell,
      trend: dashboardStats?.systemAlerts === 0 ? 'Healthy' : 'Action Req.',
      trendColor: dashboardStats?.systemAlerts === 0 ? 'text-green-500' : 'text-red-500',
      color: 'bg-amber-500/10 text-amber-500',
    }
  ];

  const quickActions = [
    {
      title: 'User Management',
      desc: 'Create, edit, and manage user accounts',
      icon: Users,
      link: '/admin/users',
      gradient: 'from-blue-500/20 to-blue-600/20 hover:border-blue-500/50',
      iconColor: 'bg-blue-500 shadow-blue-500/20',
    },
    {
      title: 'Subscription Flow',
      desc: 'Approve, reject, and manage subscriptions',
      icon: CreditCard,
      link: '/admin/subscriptions',
      gradient: 'from-emerald-500/20 to-emerald-600/20 hover:border-emerald-500/50',
      iconColor: 'bg-emerald-500 shadow-emerald-500/20',
    },
    {
      title: 'Email Campaigns',
      desc: 'Send promotional emails to clients',
      icon: Mail,
      link: '/admin/emails',
      gradient: 'from-purple-500/20 to-purple-600/20 hover:border-purple-500/50',
      iconColor: 'bg-purple-500 shadow-purple-500/20',
    },
    {
      title: 'Audit Logs',
      desc: 'Monitor system changes and security',
      icon: Eye,
      link: '/admin/audit',
      gradient: 'from-amber-500/20 to-amber-600/20 hover:border-amber-500/50',
      iconColor: 'bg-amber-500 shadow-amber-500/20',
    }
  ];

  return (
    <ProtectedAdminRoute requiredRole="admin">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-xl shadow-primary/5">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">Admin Console</h1>
                  {isSuperAdmin && (
                    <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border-none shadow-lg text-xs py-0.5">
                      <Crown className="h-3 w-3 mr-1" />
                      Super Admin
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live System Intelligence • Last synced: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-secondary/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Quick Action
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8 bg-card/30 backdrop-blur-sm w-fit px-4 py-1.5 rounded-full border border-border/40">
            <Link to="/" className="hover:text-primary transition-colors flex items-center">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Administration</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((stat, i) => (
              <Card key={i} className="bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-all duration-300 shadow-xl group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{formatNumber(stat.value)}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${stat.trendColor}`}>{stat.trend}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Performance</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Quick Navigation */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden border-2 border-white/5">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/40 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Command Center</CardTitle>
                      <CardDescription>Direct access to critical administrative systems</CardDescription>
                    </div>
                    <Sparkles className="h-5 w-5 text-primary opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, i) => (
                      <Link key={i} to={action.link}>
                        <div className={`p-5 rounded-2xl bg-gradient-to-br ${action.gradient} border border-border/40 transition-all duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${action.iconColor} text-white shadow-lg transition-transform group-hover:rotate-6`}>
                              <action.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{action.desc}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health Monitor */}
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl border-white/5 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Server className="h-5 w-5 text-emerald-500" />
                    </div>
                    <CardTitle className="text-lg">Infrastructure Health Monitor</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">Global API Latency</span>
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 px-2 py-0">12ms</Badge>
                        </div>
                        <Progress value={95} className="h-1.5 bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">PostgreSQL Efficiency</span>
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 px-2 py-0">99.9%</Badge>
                        </div>
                        <Progress value={87} className="h-1.5 bg-secondary/30" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">Object Storage Utilization</span>
                          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 px-2 py-0">78% Full</Badge>
                        </div>
                        <Progress value={78} className="h-1.5 bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">Operational Error Frequency</span>
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 px-2 py-0">0.02%</Badge>
                        </div>
                        <Progress value={12} className="h-1.5 bg-secondary/30" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Alerts & Tasks */}
            <div className="space-y-6">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="h-12 w-12" />
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Recent Activity
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] ml-1">LIVE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10 group hover:border-primary/30 transition-all cursor-default">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New registration detected</p>
                        <p className="text-xs text-muted-foreground mt-0.5">2 minutes ago • ID: user_492</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 group hover:border-purple-500/30 transition-all cursor-default">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Zap className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Subscription upgraded</p>
                        <p className="text-xs text-muted-foreground mt-0.5">5 minutes ago • Pro Plan</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 group hover:border-amber-500/30 transition-all cursor-default">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Database className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Auto-backup completed</p>
                        <p className="text-xs text-muted-foreground mt-0.5">1 hour ago • 45.2GB synced</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="link" className="w-full text-xs text-muted-foreground mt-4 h-auto py-0">
                    View Comprehensive Activity Feed
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl border-white/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Critical Tasks
                    <Badge variant="destructive" className="animate-bounce">
                      {dashboardStats?.systemAlerts || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-sm font-medium">KYC Document Reviews</span>
                      </div>
                      <Badge variant="outline" className="border-destructive/20 text-destructive">12</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">Pending Payouts</span>
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary">3</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Tools bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Security', icon: Shield, link: '/admin/roles' },
              { label: 'Users', icon: Users, link: '/admin/users' },
              { label: 'Finance', icon: CreditCard, link: '/admin/subscriptions' },
              { label: 'Automation', icon: Workflow, link: '/admin/workflows' },
              { label: 'Analytics', icon: BarChart3, link: '/admin/reports' },
              { label: 'Audits', icon: Eye, link: '/admin/audit' },
              { label: 'Directives', icon: Settings, link: '/admin/settings' }
            ].map((tool, i) => (
              <Link key={i} to={tool.link}>
                <div className="bg-card/30 backdrop-blur-md border border-border/50 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 group cursor-pointer shadow-lg shadow-black/5">
                  <div className="p-2.5 rounded-xl bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:-translate-y-1 transition-all">
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{tool.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Layout>
    </ProtectedAdminRoute>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <Activity className={className} />
);

const CreditCard = ({ className }: { className?: string }) => (
  <FileText className={className} />
);

export default AdminDashboard;

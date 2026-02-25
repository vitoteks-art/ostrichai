// Admin Subscription Management Page
// Allows admins to approve/reject pending subscriptions

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionService, UserSubscription, SubscriptionPlan } from '@/services/subscriptionService';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Activity,
  Trash2,
  Edit,
  UserX,
  Mail,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Activity as ActivityIcon,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserPlus,
  Calendar,
  Settings,
  CreditCard,
  Loader2,
  XCircle,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const AdminSubscriptionManagement = () => {
  const { user } = useAuth();
  const [pendingSubscriptions, setPendingSubscriptions] = useState<UserSubscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscription[]>([]);
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<UserSubscription[]>([]);
  const [allSubscriptionsLoading, setAllSubscriptionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState('');
  const [assignmentPlanId, setAssignmentPlanId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [extensionDays, setExtensionDays] = useState(30);
  const [extensionReason, setExtensionReason] = useState('');

  // Plans Management State
  const [adminPlans, setAdminPlans] = useState<SubscriptionPlan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    polar_product_price_id: '',
    polar_checkout_url: '',
    active: true
  });

  // New state for pagination and search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadSubscriptions();
    loadPlans();
  }, [currentPage, pageSize, activeTab]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialLoad) {
        setCurrentPage(0);
        loadSubscriptions();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSubscriptions = async () => {
    setLoading(true);
    setAllSubscriptionsLoading(true);
    try {
      // Load pending subscriptions
      if (activeTab === 'pending' || isInitialLoad) {
        const pendingResult = await SubscriptionService.getPendingSubscriptions();
        if (pendingResult.success && pendingResult.data) {
          setPendingSubscriptions(pendingResult.data);
        }
      }

      // Load expired subscriptions
      if (activeTab === 'expired' || isInitialLoad) {
        const expiredResult = await SubscriptionService.getExpiredSubscriptions();
        if (expiredResult.success && expiredResult.data) {
          setExpiredSubscriptions(expiredResult.data);
        }
      }

      // Load ALL subscriptions with pagination and search
      if (activeTab === 'overview' || isInitialLoad) {
        const result = await SubscriptionService.getAdminSubscriptions({
          skip: currentPage * pageSize,
          limit: pageSize,
          search: searchTerm
        });

        if (result.success && result.data) {
          setAllSubscriptions(result.data);
          // Note: totalCount might need to be returned from API or estimated
          setTotalCount(result.data.length);
        } else {
          toast.error(result.error || 'Failed to load all subscriptions');
        }
      }

      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
      setAllSubscriptionsLoading(false);
    }
  };

  const handleApprove = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);
    try {
      const result = await SubscriptionService.approveSubscription(subscriptionId, adminNotes);

      if (result.success) {
        toast.success('Subscription approved successfully');
        setAdminNotes('');
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to approve subscription');
      }
    } catch (error) {
      console.error('Error approving subscription:', error);
      toast.error('Failed to approve subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (subscriptionId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(subscriptionId);
    try {
      const result = await SubscriptionService.rejectSubscription(subscriptionId, rejectionReason);

      if (result.success) {
        toast.success('Subscription rejected');
        setRejectionReason('');
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to reject subscription');
      }
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      toast.error('Failed to reject subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const loadPlans = async () => {
    setIsPlansLoading(true);
    const plansResult = await SubscriptionService.getPlans();
    if (plansResult.success && plansResult.data) {
      setPlans(plansResult.data);
    }

    const adminPlansResult = await SubscriptionService.getAdminPlans();
    if (adminPlansResult.success && adminPlansResult.data) {
      setAdminPlans(adminPlansResult.data);
    }
    setIsPlansLoading(false);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    setActionLoading(`update-plan-${editingPlan.id}`);
    try {
      const result = await SubscriptionService.updatePlan(editingPlan.id, {
        polar_product_price_id: editPlanForm.polar_product_price_id,
        polar_checkout_url: editPlanForm.polar_checkout_url,
        active: editPlanForm.active
      });

      if (result.success) {
        toast.success(`Plan ${editingPlan.name} updated successfully`);
        setEditingPlan(null);
        await loadPlans();
      } else {
        toast.error(result.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedUserForAssignment || !assignmentPlanId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setActionLoading('assign-subscription');
    try {
      // Find user by email (FastAPI admin endpoint)
      const users = await apiClient.request('/admin/users?skip=0&limit=500');
      const userData = (users || []).find((u: any) => (u.email || '').toLowerCase() === selectedUserForAssignment.toLowerCase());

      if (!userData?.id) {
        toast.error('User not found');
        return;
      }

      const result = await SubscriptionService.assignSubscriptionToUser(
        userData.id,
        assignmentPlanId,
        user?.id || 'admin',
        { reason: assignmentReason }
      );

      if (result.success) {
        toast.success('Subscription assigned successfully');
        setSelectedUserForAssignment('');
        setAssignmentPlanId('');
        setAssignmentReason('');
        await loadSubscriptions();
      } else {
        // Check if it's a free plan upgrade scenario
        if (result.error?.includes('already has an active paid subscription')) {
          toast.error('User already has a paid subscription. Use extension instead.');
        } else {
          toast.error(result.error || 'Failed to assign subscription');
        }
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendSubscription = async (subscriptionId: string) => {
    if (extensionDays < 1) {
      toast.error('Please enter a valid number of days');
      return;
    }

    // Handle extension by user email (from assign tab)
    if (subscriptionId === 'selected-user') {
      if (!selectedUserForAssignment) {
        toast.error('Please enter a subscriber email address');
        return;
      }

      setActionLoading('extend-selected-user');
      try {
        // Find user by email (FastAPI admin endpoint)
        const users = await apiClient.request('/admin/users?skip=0&limit=500');
        const userData = (users || []).find((u: any) => (u.email || '').toLowerCase() === selectedUserForAssignment.toLowerCase());

        if (!userData?.id) {
          toast.error('User not found');
          return;
        }

        // Get the user's subscription
        const subscriptionResult = await SubscriptionService.getUserSubscription(userData.id);
        if (!subscriptionResult.success || !subscriptionResult.data) {
          toast.error('User has no active subscription');
          return;
        }

        const result = await SubscriptionService.extendSubscription(
          subscriptionResult.data.id,
          user?.id || 'admin',
          extensionDays,
          extensionReason
        );

        if (result.success) {
          toast.success(`Subscription extended by ${extensionDays} days for ${selectedUserForAssignment}`);
          setSelectedUserForAssignment('');
          setExtensionDays(30);
          setExtensionReason('');
          await loadSubscriptions();
        } else {
          toast.error(result.error || 'Failed to extend subscription');
        }
      } catch (error) {
        console.error('Error extending subscription:', error);
        toast.error('Failed to extend subscription');
      } finally {
        setActionLoading(null);
      }
      return;
    }

    // Handle extension by subscription ID (from overview tab)
    setActionLoading(`extend-${subscriptionId}`);
    try {
      const result = await SubscriptionService.extendSubscription(
        subscriptionId,
        user?.id || 'admin',
        extensionDays,
        extensionReason
      );

      if (result.success) {
        toast.success(`Subscription extended by ${extensionDays} days`);
        setExtensionDays(30);
        setExtensionReason('');
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to extend subscription');
      }
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error('Failed to extend subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessExpired = async () => {
    setActionLoading('process-expired');
    try {
      const result = await SubscriptionService.processExpiredSubscriptions();

      if (result.success) {
        toast.success(`Processed ${result.updatedCount || 0} expired subscriptions`);
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to process expired subscriptions');
      }
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
      toast.error('Failed to process expired subscriptions');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      pending_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      canceled: 'bg-red-500/20 text-red-400 border-red-500/50',
      past_due: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      incomplete: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      expired: 'bg-red-900/20 text-red-500 border-red-900/50',
    };

    return (
      <Badge className={`${variants[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'} border backdrop-blur-sm`}>
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background text-foreground p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground pb-20">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-background to-black/20 pb-8 pt-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Subscription Management
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Manage user subscriptions, approve payments, and track revenue.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-black/20 border-white/10 hover:bg-white/10"
                  onClick={loadSubscriptions}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                  onClick={() => setActiveTab('assign')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Subscription
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: 'Total Subscriptions',
                  value: totalCount || allSubscriptions.length,
                  icon: Users,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10'
                },
                {
                  title: 'Active Subscriptions',
                  value: allSubscriptions.filter(s => s.status === 'active').length,
                  icon: CheckCircle,
                  color: 'text-green-400',
                  bg: 'bg-green-500/10'
                },
                {
                  title: 'Pending Approval',
                  value: pendingSubscriptions.length,
                  icon: Clock,
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10'
                },
                {
                  title: 'Expired/Canceled',
                  value: expiredSubscriptions.length + allSubscriptions.filter(s => s.status === 'canceled').length,
                  icon: AlertTriangle,
                  color: 'text-red-400',
                  bg: 'bg-red-500/10'
                }
              ].map((stat, i) => (
                <Card key={i} className="backdrop-blur-xl bg-black/40 border-white/10 hover:bg-white/5 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated just now
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-2 rounded-xl backdrop-blur-md border border-white/5">
                <TabsList className="bg-transparent border-0 gap-2">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
                  >
                    Pending ({pendingSubscriptions.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                  >
                    All Subscriptions
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                  >
                    Expired ({expiredSubscriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="assign">
                    Assign & Extend
                  </TabsTrigger>
                  <TabsTrigger
                    value="plans"
                    className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400"
                  >
                    Manage Plans
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'overview' && (
                  <div className="flex items-center gap-2 px-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search subscriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-black/40 border-white/10 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Tab */}
              <TabsContent value="pending" className="space-y-4">
                {pendingSubscriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
                    <div className="p-4 rounded-full bg-green-500/10 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">All Caught Up!</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                      There are no pending subscriptions requiring approval at this time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingSubscriptions.map((sub) => (
                      <Card key={sub.id} className="backdrop-blur-xl bg-black/40 border-yellow-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            Pending Approval
                          </Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl text-white">{sub.plan?.name || 'Unknown Plan'}</CardTitle>
                          <CardDescription>{sub.customer_name || 'Unknown User'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div>
                              <dt className="text-muted-foreground">Amount</dt>
                              <dd className="font-medium text-white">${(sub.amount_cents / 100).toFixed(2)} {sub.currency}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Provider</dt>
                              <dd className="font-medium text-white capitalize">{sub.payment_provider}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Created</dt>
                              <dd className="font-medium text-white">{new Date(sub.created_at).toLocaleDateString()}</dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-muted-foreground">Subs. ID</dt>
                              <dd className="font-mono text-xs text-white/70 bg-black/50 p-1.5 rounded mt-1 truncate">
                                {sub.provider_subscription_id || 'N/A'}
                              </dd>
                            </div>
                          </dl>

                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="flex-1 bg-green-600/80 hover:bg-green-600 text-white">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Subscription</DialogTitle>
                                  <DialogDescription>
                                    Add optional notes for this approval.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <Textarea
                                    placeholder="Admin notes (optional)"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                  />
                                  <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(sub.id)}
                                    disabled={!!actionLoading}
                                  >
                                    {actionLoading === sub.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Approval'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Subscription</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this subscription.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <Textarea
                                    placeholder="Rejection reason (required)"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="border-red-500/30 focus:border-red-500"
                                  />
                                  <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleReject(sub.id)}
                                    disabled={!!actionLoading || !rejectionReason.trim()}
                                  >
                                    {actionLoading === sub.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Rejection'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Overview Tab (with pagination) */}
              <TabsContent value="overview">
                <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                  <div className="rounded-md border border-white/5 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-white/5">
                          <TableHead className="text-white font-semibold">User</TableHead>
                          <TableHead className="text-white font-semibold">Plan</TableHead>
                          <TableHead className="text-white font-semibold">Status</TableHead>
                          <TableHead className="text-white font-semibold">Amount</TableHead>
                          <TableHead className="text-white font-semibold">Created</TableHead>
                          <TableHead className="text-right text-white font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSubscriptionsLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="border-white/5">
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                          ))
                        ) : allSubscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colspan={6} className="h-24 text-center text-muted-foreground">
                              No subscriptions found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          allSubscriptions.map((sub) => (
                            <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {sub.customer_name}
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {sub.provider_customer_id}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">{sub.plan?.name}</TableCell>
                              <TableCell>{getStatusBadge(sub.status)}</TableCell>
                              <TableCell className="text-gray-300">
                                ${(sub.amount_cents / 100).toFixed(2)} <span className="text-xs">{sub.currency}</span>
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {new Date(sub.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedUserForAssignment(sub.customer_name || ''); // Try to set for extension
                                      // Ideally we'd set email but we might not have it here if not joined
                                      handleExtendSubscription(sub.id);
                                    }} className="cursor-pointer hover:bg-white/10">
                                      <Calendar className="mr-2 h-4 w-4" /> Extend
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem className="text-red-400 cursor-pointer hover:bg-white/10">
                                      <Trash2 className="mr-2 h-4 w-4" /> Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between p-4 border-t border-white/5">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(totalCount, allSubscriptions.length)} of {totalCount} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0 || loading}
                        className="bg-black/20 border-white/10 hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1 px-2 text-sm text-gray-400">
                        Page {currentPage + 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={allSubscriptions.length < pageSize || loading}
                        className="bg-black/20 border-white/10 hover:bg-white/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Expired Tab */}
              <TabsContent value="expired">
                {/* Reuse the pending card style for expired, or a table */}
                <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle>Expired Subscriptions</CardTitle>
                    <CardDescription>Review and manage expired accounts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing most recent expired subscriptions. Use "All Subscriptions" to search.
                    </div>

                    <div className="rounded-md border border-white/5 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/5">
                            <TableHead className="text-white">User</TableHead>
                            <TableHead className="text-white">Expired Date</TableHead>
                            <TableHead className="text-white">Plan</TableHead>
                            <TableHead className="text-right text-white">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expiredSubscriptions.map(sub => (
                            <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                              <TableCell className="font-medium text-white">{sub.customer_name}</TableCell>
                              <TableCell className="text-red-400">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell className="text-gray-300">{sub.plan?.name}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white/5 border-white/10 hover:bg-white/10"
                                  onClick={() => handleExtendSubscription(sub.id)}
                                >
                                  Reactivate / Extend
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {expiredSubscriptions.length === 0 && (
                            <TableRow>
                              <TableCell colspan={4} className="h-24 text-center text-muted-foreground">
                                No expired subscriptions found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assign Tab */}
              <TabsContent value="assign">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-indigo-400" />
                        Assign New Subscription
                      </CardTitle>
                      <CardDescription>Manually grant a subscription to a user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">User Email</Label>
                        <Input
                          placeholder="user@example.com"
                          value={selectedUserForAssignment}
                          onChange={(e) => setSelectedUserForAssignment(e.target.value)}
                          className="bg-black/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Plan</Label>
                        <Select value={assignmentPlanId} onValueChange={setAssignmentPlanId}>
                          <SelectTrigger className="bg-black/50 border-white/10">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Reason (Internal)</Label>
                        <Input
                          placeholder="e.g. VIP upgrade"
                          value={assignmentReason}
                          onChange={(e) => setAssignmentReason(e.target.value)}
                          className="bg-black/50 border-white/10"
                        />
                      </div>
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                        onClick={handleAssignSubscription}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'assign-subscription' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Subscription
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-emerald-400" />
                        Extend Subscription
                      </CardTitle>
                      <CardDescription>Grant extra days to a user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">User Email</Label>
                        <Input
                          placeholder="user@example.com"
                          value={selectedUserForAssignment}
                          onChange={(e) => setSelectedUserForAssignment(e.target.value)}
                          className="bg-black/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Days to Extend</Label>
                        <div className="flex gap-2">
                          {[7, 30, 90].map(days => (
                            <Button
                              key={days}
                              variant="outline"
                              size="sm"
                              className={`flex-1 ${extensionDays === days ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-black/20 border-white/10'}`}
                              onClick={() => setExtensionDays(days)}
                            >
                              +{days} Days
                            </Button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          value={extensionDays}
                          onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                          className="bg-black/50 border-white/10 mt-2"
                        />
                      </div>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                        onClick={() => handleExtendSubscription('selected-user')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'extend-selected-user' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Extend Period
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Plans Management Tab */}
              <TabsContent value="plans">
                <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Settings className="h-5 w-5 text-indigo-400" />
                      Plan Definitions (Polar Only)
                    </CardTitle>
                    <CardDescription>
                      Configure Polar Price IDs and direct checkout links for each plan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/5">
                            <TableHead className="text-white">Plan Name</TableHead>
                            <TableHead className="text-white">Price (USD)</TableHead>
                            <TableHead className="text-white">Polar Price ID</TableHead>
                            <TableHead className="text-white">Direct Checkout Link</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-right text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isPlansLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                              <TableRow key={i} className="border-white/5">
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                              </TableRow>
                            ))
                          ) : adminPlans.length === 0 ? (
                            <TableRow>
                              <TableCell colspan={6} className="h-24 text-center text-muted-foreground">
                                No plans found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            adminPlans.map((plan) => (
                              <TableRow key={plan.id} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-medium text-white">{plan.name}</TableCell>
                                <TableCell className="text-gray-300">${plan.price.toFixed(2)}</TableCell>
                                <TableCell className="font-mono text-[10px] text-gray-400">
                                  {plan.polar_product_price_id || 'Not Set'}
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate text-[10px] text-gray-400">
                                  {plan.polar_checkout_url || 'Not Set'}
                                </TableCell>
                                <TableCell>
                                  {plan.active ? (
                                    <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Active</Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-400 border-red-500/30">Inactive</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/5 border-white/10 hover:bg-indigo-500/20 hover:text-indigo-400"
                                        onClick={() => {
                                          setEditingPlan(plan);
                                          setEditPlanForm({
                                            polar_product_price_id: plan.polar_product_price_id || '',
                                            polar_checkout_url: plan.polar_checkout_url || '',
                                            active: plan.active
                                          });
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5 mr-1" />
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-black/95 border-white/10 text-white backdrop-blur-xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Plan: {plan.name}</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          Update Polar integration settings for this plan.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-6 py-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-gray-300">
                                            Polar Price ID (Product Price ID)
                                          </Label>
                                          <Input
                                            placeholder="e.g. c8b0fd70-ed3b-48b0-8552-2f1250b69d35"
                                            value={editPlanForm.polar_product_price_id}
                                            onChange={(e) => setEditPlanForm({ ...editPlanForm, polar_product_price_id: e.target.value })}
                                            className="bg-white/5 border-white/10 font-mono text-sm"
                                          />
                                          <p className="text-[10px] text-muted-foreground italic">
                                            Found in Polar Dashboard → Products → (Select Product) → (Select Price) → Copy ID.
                                          </p>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium text-gray-300">
                                            Direct Checkout URL (Override)
                                          </Label>
                                          <Input
                                            placeholder="https://buy.polar.sh/..."
                                            value={editPlanForm.polar_checkout_url}
                                            onChange={(e) => setEditPlanForm({ ...editPlanForm, polar_checkout_url: e.target.value })}
                                            className="bg-white/5 border-white/10 text-sm"
                                          />
                                          <p className="text-[10px] text-indigo-400/80 italic">
                                            If set, users will be redirected here directly. Bypasses dynamic API calls.
                                          </p>
                                        </div>

                                        <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg border border-white/5">
                                          <input
                                            type="checkbox"
                                            id={`active-${plan.id}`}
                                            checked={editPlanForm.active}
                                            onChange={(e) => setEditPlanForm({ ...editPlanForm, active: e.target.checked })}
                                            className="h-4 w-4 rounded border-white/10 bg-black text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <Label htmlFor={`active-${plan.id}`} className="text-sm font-medium cursor-pointer">
                                            Plan is Active (Visible to users)
                                          </Label>
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          onClick={handleUpdatePlan}
                                          disabled={!!actionLoading}
                                          className="bg-indigo-600 hover:bg-indigo-700 w-full"
                                        >
                                          {actionLoading === `update-plan-${plan.id}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          ) : null}
                                          Save Changes
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSubscriptionManagement;

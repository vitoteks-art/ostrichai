// Subscription Management Page

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { SubscriptionManager, PaymentModal, CreditPurchaseModal } from '@/components/PaymentModal';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionService, SubscriptionPlan, PaymentTransactionService, UserSubscription } from '@/services/subscriptionService';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Crown,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Settings,
  Loader2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

const Subscription = () => {
  const { user } = useAuth();
  const { subscription, plan, loading, refreshSubscription } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'flutterwave' | 'paystack' | 'polar'>('flutterwave');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [usageStats, setUsageStats] = useState<any>({
    videosUsed: 0,
    logosUsed: 0,
    adsUsed: 0,
    flyersUsed: 0,
    blogsUsed: 0,
    scriptsUsed: 0,
    youtubeResearchUsed: 0,
    socialPostsUsed: 0,
    imageEditsUsed: 0,
    titleGenUsed: 0,
    storageUsed: 0
  });

  // Admin functionality
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<string>('');
  const [assignmentPlanId, setAssignmentPlanId] = useState<string>('');
  const [extensionDays, setExtensionDays] = useState<number>(30);
  const [adminReason, setAdminReason] = useState<string>('');
  const [freePlanWarnings, setFreePlanWarnings] = useState<{
    daysLeft: number;
    expirationDate: string;
    isExpiringSoon: boolean;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadPlans();
      loadTransactions();
      loadUsageStats();
      loadFreePlanWarnings();
    }
  }, [user]);

  // Refresh usage stats when subscription changes
  useEffect(() => {
    if (user && subscription) {
      loadUsageStats();
      loadFreePlanWarnings();
    }
  }, [subscription, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    // Use user_metadata which is already populated from FastAPI profile
    setIsAdmin(user.user_metadata?.is_admin || user.user_metadata?.is_superuser || false);
  };

  // Check admin status when user changes
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user) return;

    try {
      const usageResult = await SubscriptionService.getUsageStats(user.id);
      if (usageResult.success && usageResult.data) {
        // Aggregate usage by feature type with proper mapping
        const stats = usageResult.data.reduce((acc, record) => {
          // Map feature_type to the correct field name
          let fieldName = '';
          switch (record.feature_type) {
            case 'video': fieldName = 'videosUsed'; break;
            case 'logo': fieldName = 'logosUsed'; break;
            case 'ad': fieldName = 'adsUsed'; break;
            case 'flyer': fieldName = 'flyersUsed'; break;
            case 'blog': fieldName = 'blogsUsed'; break;
            case 'script': fieldName = 'scriptsUsed'; break;
            case 'youtube_research': fieldName = 'youtubeResearchUsed'; break;
            case 'social_post': fieldName = 'socialPostsUsed'; break;
            case 'image_edit': fieldName = 'imageEditsUsed'; break;
            case 'title_gen': fieldName = 'titleGenUsed'; break;
            default: fieldName = `${record.feature_type}Used`;
          }
          acc[fieldName] = (acc[fieldName] || 0) + record.usage_count;
          return acc;
        }, {
          videosUsed: 0,
          logosUsed: 0,
          adsUsed: 0,
          flyersUsed: 0,
          blogsUsed: 0,
          scriptsUsed: 0,
          youtubeResearchUsed: 0,
          socialPostsUsed: 0,
          imageEditsUsed: 0,
          titleGenUsed: 0,
          storageUsed: 0
        });

        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const loadFreePlanWarnings = async () => {
    if (!user) return;

    try {
      // Check if user has free plan and calculate expiration
      const subscriptionResult = await SubscriptionService.getUserSubscription(user.id);
      if (subscriptionResult.success && subscriptionResult.data && subscriptionResult.data.plan?.price === 0) {
        const endDate = new Date(subscriptionResult.data.current_period_end || '');
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const warnings = {
          daysLeft: Math.max(0, daysLeft),
          expirationDate: endDate.toISOString(),
          isExpiringSoon: daysLeft <= 3 && daysLeft > 0,
          isExpired: daysLeft <= 0
        };

        setFreePlanWarnings(warnings);

        // Show toast notifications for expiration warnings
        if (warnings.isExpired) {
          toast.error('Your free trial has expired. Upgrade to continue using premium features.', {
            duration: 10000,
          });
        } else if (warnings.isExpiringSoon) {
          toast.warning(`Your free trial expires in ${warnings.daysLeft} day${warnings.daysLeft === 1 ? '' : 's'}. Upgrade now to avoid losing access.`, {
            duration: 8000,
          });
        } else if (warnings.daysLeft <= 3) {
          toast.info(`Your free trial expires in ${warnings.daysLeft} days.`, {
            duration: 5000,
          });
        }
      } else {
        setFreePlanWarnings(null);
      }
    } catch (error) {
      console.error('Error loading free plan warnings:', error);
    }
  };

  // Filter plans by billing interval
  const filteredPlans = plans.filter(p => p.interval === billingInterval);

  // Group plans by name to calculate savings
  const planSavings = plans.reduce((acc, plan) => {
    if (!acc[plan.name]) {
      acc[plan.name] = {};
    }
    acc[plan.name][plan.interval] = plan;
    return acc;
  }, {} as Record<string, Record<string, SubscriptionPlan>>);

  const getYearlySavings = (planName: string) => {
    const planData = planSavings[planName];
    if (planData?.month && planData?.year) {
      const monthlyYearly = planData.month.price * 12;
      const yearlyPrice = planData.year.price;
      const savings = monthlyYearly - yearlyPrice;
      const savingsPercent = Math.round((savings / monthlyYearly) * 100);
      return { amount: savings, percent: savingsPercent };
    }
    return null;
  };

  const loadPlans = async () => {
    const plansResult = await SubscriptionService.getPlans();
    if (plansResult.success && plansResult.data) {
      setPlans(plansResult.data);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    setTransactionsLoading(true);
    try {
      const transactionsResult = await PaymentTransactionService.getUserTransactions(user.id, 10);
      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    // Check if user is trying to get free plan again
    if (plan.price === 0 && user) {
      // Check if user has already used free plan
      SubscriptionService.hasUserHadFreePlan(user.id).then(hasHadFree => {
        if (hasHadFree) {
          toast.error('You have already used your free trial. Please upgrade to a paid plan.');
          return;
        }
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      });
    } else {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handleAssignSubscription = async () => {
    if (!user || !selectedUserForAssignment || !assignmentPlanId) return;

    setAdminActionLoading(true);
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', selectedUserForAssignment)
        .single();

      if (userError || !userData) {
        toast.error('User not found');
        return;
      }

      const result = await SubscriptionService.assignSubscriptionToUser(
        userData.id,
        assignmentPlanId,
        user.id,
        { reason: adminReason }
      );

      if (result.success) {
        toast.success('Subscription assigned successfully');
        setSelectedUserForAssignment('');
        setAssignmentPlanId('');
        setAdminReason('');
        refreshSubscription();
      } else {
        toast.error(result.error || 'Failed to assign subscription');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!user || !selectedUserForAssignment || extensionDays < 1) return;

    setAdminActionLoading(true);
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', selectedUserForAssignment)
        .single();

      if (userError || !userData) {
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
        user.id,
        extensionDays,
        adminReason
      );

      if (result.success) {
        toast.success(`Subscription extended by ${extensionDays} days for ${selectedUserForAssignment}`);
        setSelectedUserForAssignment('');
        setExtensionDays(30);
        setAdminReason('');
      } else {
        toast.error(result.error || 'Failed to extend subscription');
      }
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error('Failed to extend subscription');
    } finally {
      setAdminActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your credit-based subscription, track credit usage, and upgrade your plan
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="transactions">Payment History</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Free Plan Expiration Warning */}
            {freePlanWarnings && (freePlanWarnings.isExpired || freePlanWarnings.isExpiringSoon) && (
              <Card className={`border-2 ${freePlanWarnings.isExpired ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-6 w-6 ${freePlanWarnings.isExpired ? 'text-red-600' : 'text-orange-600'}`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${freePlanWarnings.isExpired ? 'text-red-800' : 'text-orange-800'}`}>
                        {freePlanWarnings.isExpired ? 'Free Trial Expired' : 'Free Trial Expiring Soon'}
                      </h3>
                      <p className={`text-sm ${freePlanWarnings.isExpired ? 'text-red-700' : 'text-orange-700'}`}>
                        {freePlanWarnings.isExpired
                          ? 'Your free trial has expired. Upgrade to a paid plan to continue using premium features.'
                          : `Your free trial expires in ${freePlanWarnings.daysLeft} day${freePlanWarnings.daysLeft === 1 ? '' : 's'}. Upgrade now to avoid losing access.`
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const plansTab = document.querySelector('[value="plans"]') as HTMLElement;
                        plansTab?.click();
                      }}
                      variant={freePlanWarnings.isExpired ? "default" : "outline"}
                      size="sm"
                    >
                      {freePlanWarnings.isExpired ? 'Upgrade Now' : 'View Plans'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Subscription Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your credit-based subscription and current balance</CardDescription>
              </CardHeader>
              <CardContent>
                {plan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{plan.name} Plan</h3>
                        <p className="text-muted-foreground">{plan.description}</p>
                        {freePlanWarnings && !freePlanWarnings.isExpired && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-orange-600">
                              {freePlanWarnings.daysLeft} day{freePlanWarnings.daysLeft === 1 ? '' : 's'} remaining
                            </span>
                          </div>
                        )}
                        {subscription?.status === 'pending_approval' && (
                          <Badge className="mt-2 bg-yellow-600 text-white">
                            Pending Admin Approval
                          </Badge>
                        )}
                        {subscription?.status === 'expired' && (
                          <Badge className="mt-2 bg-red-600 text-white">
                            Free Trial Expired
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {plan.price > 0 ? `$${plan.price}` : 'Free'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.price > 0 ? 'per month' : `Expires ${freePlanWarnings ? new Date(freePlanWarnings.expirationDate).toLocaleDateString() : 'soon'}`}
                        </div>
                      </div>
                    </div>

                    {/* Plan Features - Credit Based */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {plan.limits.monthlyCredits}
                        </div>
                        <div className="text-xs text-muted-foreground">Monthly Credits</div>
                      </div>
                      {plan.price > 0 && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            ${plan.limits.overageRateCents === 0 ? '0.00' : (plan.limits.overageRateCents / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Overage Rate</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {plan.limits.creditRolloverDays === -1 ? 'Never' :
                            plan.limits.creditRolloverDays === 0 ? 'No' :
                              `${plan.limits.creditRolloverDays} days`}
                        </div>
                        <div className="text-xs text-muted-foreground">Credit Rollover</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {plan.features.prioritySupport ? 'Priority' : 'Standard'}
                        </div>
                        <div className="text-xs text-muted-foreground">Support</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-4">
                      You're currently on the free plan with limited features
                    </p>
                    <Button onClick={() => {
                      const plansTab = document.querySelector('[value="plans"]') as HTMLElement;
                      plansTab?.click();
                    }}>
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subscription?.status === 'active' ? 'Active' :
                      subscription?.status === 'expired' ? 'Expired' :
                        subscription?.status === 'pending_approval' ? 'Pending Approval' :
                          'Inactive'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscription?.status === 'expired'
                      ? `Expired on ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}`
                      : subscription?.current_period_end
                        ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : 'No renewal date'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subscription ? (subscription.monthly_credits - (subscription.credit_balance || 0)) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usageStats.storageUsed ? `${usageStats.storageUsed}MB` : '0MB'}
                  </div>
                  <Progress
                    value={plan && plan.limits.storageLimit > 0 ? (usageStats.storageUsed / plan.limits.storageLimit) * 100 : 0}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan && plan.limits.storageLimit > 0
                      ? `${Math.max(0, plan.limits.storageLimit - usageStats.storageUsed)}MB remaining`
                      : '0MB remaining'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {/* Payment Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose your preferred payment provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-provider">Payment Provider</Label>
                    <Select value={selectedProvider} onValueChange={(value: 'flutterwave' | 'paystack' | 'polar') => setSelectedProvider(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flutterwave">Flutterwave - Global payments with local support</SelectItem>
                        <SelectItem value="paystack">Paystack - Nigerian payments specialist</SelectItem>
                        <SelectItem value="polar">Polar - Modern payment gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProvider === 'flutterwave' && 'Supports cards, mobile money, bank transfers, and more worldwide.'}
                    {selectedProvider === 'paystack' && 'Optimized for Nigerian payments with excellent local support.'}
                    {selectedProvider === 'polar' && 'Modern payment gateway with advanced features and global reach.'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${billingInterval === 'month'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`px-6 py-2 rounded-md font-medium transition-all relative ${billingInterval === 'year'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Yearly
                </button>
              </div>
              {billingInterval === 'year' && (
                <div className="ml-4">
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                    Save up to 20%
                  </span>
                </div>
              )}
            </div>

            {/* Available Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => {
                const isCurrentPlan = plan.id === subscription?.plan_id;
                return (
                  <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-green-500 border-2' : plan.popular ? 'border-primary border-2' : ''}`}>
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 text-white">Current Plan</Badge>
                      </div>
                    )}
                    {plan.popular && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">
                          {plan.price > 0 ? `$${plan.price}` : 'Free'}
                        </span>
                        <span className="text-muted-foreground">
                          {plan.price > 0 ? `/${billingInterval === 'year' ? 'year' : 'month'}` : ''}
                        </span>
                        {billingInterval === 'year' && plan.price > 0 && (
                          <div className="mt-2">
                            {(() => {
                              const savings = getYearlySavings(plan.name);
                              return savings ? (
                                <Badge className="bg-green-600 text-white">
                                  Save ${savings.amount} ({savings.percent}% off)
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Key Features - Credit Based */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Monthly Credits</span>
                          <span className="font-semibold text-primary">{plan.limits.monthlyCredits}</span>
                        </div>
                        {plan.price > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Overage Rate</span>
                            <span>${(plan.limits.overageRateCents / 100).toFixed(2)}/100 credits</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Credit Rollover</span>
                          <span>{plan.limits.creditRolloverDays === -1 ? 'Never expire' :
                            plan.limits.creditRolloverDays === 0 ? 'No rollover' :
                              `${plan.limits.creditRolloverDays} days`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Support</span>
                          <span>{plan.features.prioritySupport ? 'Priority' : 'Standard'}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
                        onClick={() => isCurrentPlan ? undefined : handleUpgrade(plan)}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.price > 0 ? 'Upgrade' : 'Start Free Trial'}
                      </Button>

                      {/* Feature List */}
                      <div className="space-y-2 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Features included:</div>
                        <div className="space-y-1">
                          {Object.entries(plan.features).slice(0, 4).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle className={`h-3 w-3 ${enabled ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Usage & Balance</CardTitle>
                <CardDescription>Monitor your credit balance, usage patterns, and overage settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Credit Balance Overview */}
                  {subscription && (
                    <div className={`grid grid-cols-1 ${subscription.amount_cents > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-6`}>
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {subscription.credit_balance || 0}
                            </div>
                            <div className="text-sm text-blue-700">Credits Remaining</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {subscription.monthly_credits || 0}
                            </div>
                            <div className="text-sm text-green-700">Monthly Allocation</div>
                          </div>
                        </CardContent>
                      </Card>

                      {subscription.amount_cents > 0 && (
                        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-orange-600 mb-2">
                                ${subscription.overage_rate_cents === 0 ? '0.00' : (subscription.overage_rate_cents / 100).toFixed(2)}
                              </div>
                              <div className="text-sm text-orange-700">Overage Rate</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Credit Usage Progress */}
                  {subscription && plan && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Credit Usage This Month</span>
                          <span>
                            {subscription.monthly_credits - (subscription.credit_balance || 0)} / {subscription.monthly_credits} credits used
                          </span>
                        </div>
                        <Progress
                          value={subscription.monthly_credits > 0 ? ((subscription.monthly_credits - (subscription.credit_balance || 0)) / subscription.monthly_credits) * 100 : 0}
                          className="h-3"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {subscription.credit_balance || 0} credits remaining this month
                        </div>
                      </div>

                      {/* Credit Rollover Info */}
                      {plan.limits.creditRolloverDays > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Credit Rollover</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Unused credits roll over for {plan.limits.creditRolloverDays} days. Your current balance will be available beyond this billing cycle.
                          </p>
                        </div>
                      )}

                      {/* Low Credit Warning */}
                      {subscription.credit_balance !== undefined && subscription.credit_balance <= 50 && subscription.credit_balance > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Low Credit Balance</span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            You have {subscription.credit_balance} credits remaining. Consider topping up or upgrading your plan to avoid service interruption.
                          </p>
                        </div>
                      )}

                      {/* Out of Credits Alert */}
                      {subscription.credit_balance !== undefined && subscription.credit_balance <= 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-800">Out of Credits</span>
                          </div>
                          <p className="text-sm text-red-700">
                            You've used all your credits for this month. Purchase additional credits or upgrade your plan to continue using features.
                          </p>
                          <Button
                            className="mt-2"
                            size="sm"
                            onClick={() => setShowCreditPurchaseModal(true)}
                          >
                            Purchase Credits
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Credit Transactions */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Credit Activity</h3>
                    <div className="text-sm text-muted-foreground">
                      Credit transaction history will be displayed here, showing allocations, usage, and purchases.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>Payment method and billing history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Payment Method</h3>
                  <p className="mb-4">Add a payment method to upgrade your subscription</p>
                  <Button>Manage Payment Methods</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>Your recent payment transactions and history</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading payment history...
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${transaction.status === 'success' ? 'bg-green-500' :
                                transaction.status === 'failed' ? 'bg-red-500' :
                                  transaction.status === 'cancelled' ? 'bg-gray-500' :
                                    'bg-yellow-500'
                              }`} />
                            <span className="font-medium">
                              {transaction.status === 'success' ? 'Payment Successful' :
                                transaction.status === 'failed' ? 'Payment Failed' :
                                  transaction.status === 'cancelled' ? 'Payment Cancelled' :
                                    'Payment Pending'}
                            </span>
                            <Badge variant={transaction.payment_provider === 'flutterwave' ? 'default' : 'secondary'}>
                              {transaction.payment_provider}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Amount: ${(transaction.amount_cents / 100).toFixed(2)} {transaction.currency}</div>
                            <div>Date: {new Date(transaction.created_at).toLocaleDateString()}</div>
                            {transaction.subscription?.plan?.name && (
                              <div>Plan: {transaction.subscription.plan.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {transaction.provider_reference}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                    <p>You haven't made any payments yet. Payment history will appear here after your first transaction.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab - Only visible to admins */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Admin Subscription Controls
                  </CardTitle>
                  <CardDescription>
                    Assign subscriptions to users and extend existing subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assign Subscription Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Assign Subscription to User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">User Email</label>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={selectedUserForAssignment}
                          onChange={(e) => setSelectedUserForAssignment(e.target.value)}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Plan</label>
                        <select
                          value={assignmentPlanId}
                          onChange={(e) => setAssignmentPlanId(e.target.value)}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        >
                          <option value="">Select Plan</option>
                          {filteredPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - ${plan.price}/{billingInterval}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Reason</label>
                        <input
                          type="text"
                          placeholder="Admin assignment reason"
                          value={adminReason}
                          onChange={(e) => setAdminReason(e.target.value)}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAssignSubscription}
                      disabled={adminActionLoading || !selectedUserForAssignment || !assignmentPlanId}
                      className="w-full md:w-auto"
                    >
                      {adminActionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Assign Subscription
                    </Button>
                  </div>

                  {/* Extend Subscription Section */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Extend Any Subscriber's Subscription</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Subscriber Email</label>
                        <input
                          type="email"
                          placeholder="subscriber@example.com"
                          value={selectedUserForAssignment}
                          onChange={(e) => setSelectedUserForAssignment(e.target.value)}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Extension Days</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={extensionDays}
                          onChange={(e) => setExtensionDays(Number(e.target.value))}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Reason</label>
                        <input
                          type="text"
                          placeholder="Extension reason"
                          value={adminReason}
                          onChange={(e) => setAdminReason(e.target.value)}
                          className="w-full p-2 border rounded-md text-foreground bg-background"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleExtendSubscription}
                      disabled={adminActionLoading || !selectedUserForAssignment || extensionDays < 1}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      {adminActionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="h-4 w-4 mr-2" />
                      )}
                      Extend Subscription ({extensionDays} days)
                    </Button>
                  </div>

                  {/* Admin Actions History */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Recent Admin Actions</h3>
                    <div className="text-sm text-muted-foreground">
                      Admin actions are logged in payment transactions for audit purposes.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            provider={selectedProvider}
            isOpen={showPaymentModal}
            onSuccess={(reference) => {
              console.log('Payment successful:', reference);
              setShowPaymentModal(false);
              refreshSubscription();
            }}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
          />
        )}

        {/* Credit Purchase Modal */}
        {showCreditPurchaseModal && (
          <CreditPurchaseModal
            provider={selectedProvider}
            isOpen={showCreditPurchaseModal}
            onSuccess={(reference) => {
              console.log('Credit purchase successful:', reference);
              setShowCreditPurchaseModal(false);
              refreshSubscription();
            }}
            onCancel={() => {
              setShowCreditPurchaseModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Subscription;

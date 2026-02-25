// Subscription Service for Creative AI Platform
// Migrated to FastAPI Backend
import { apiClient } from '../lib/api';

// Payment Transaction Service
export class PaymentTransactionService {
  /**
   * Record a payment transaction
   */
  static async recordTransaction(
    userId: string,
    subscriptionId: string | null,
    paymentData: {
      provider: 'flutterwave' | 'paystack' | 'polar' | 'admin';
      reference: string;
      amountCents: number;
      currency: string;
      status: 'pending' | 'success' | 'failed' | 'cancelled';
      paymentMethod?: string;
      providerResponse?: any;
      failureReason?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔄 Recording payment transaction via API:', paymentData);

      const payload = {
        provider: paymentData.provider,
        reference: paymentData.reference,
        amount_cents: paymentData.amountCents,
        currency: paymentData.currency,
        status: paymentData.status,
        subscription_id: subscriptionId,
        payment_method: paymentData.paymentMethod,
        provider_response: paymentData.providerResponse
      };

      const response = await apiClient.recordPaymentTransaction(payload);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('❌ Error in recordTransaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    reference: string,
    status: 'pending' | 'success' | 'failed' | 'cancelled',
    additionalData?: {
      verifiedAt?: string;
      failureReason?: string;
      providerResponse?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating transaction status via API:', reference, status);

      const updatePayload = {
        status,
        verified_at: additionalData?.verifiedAt,
        failure_reason: additionalData?.failureReason,
        provider_response: additionalData?.providerResponse
      };

      await apiClient.updatePaymentTransaction(reference, updatePayload);
      return { success: true };
    } catch (error: any) {
      console.error('Error in updateTransactionStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment transactions for a user
   */
  static async getUserTransactions(
    userId: string,
    limit: number = 10
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.request(`/payments/history?limit=${limit}`);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error in getUserTransactions:', error);
      return { success: false, error: error.message };
    }
  }
}

// Types for subscription system
export interface SubscriptionFeatures {
  videoGeneration: boolean;
  logoDesign: boolean;
  adCreation: boolean;
  flyerDesign: boolean;
  blogResearch: boolean;
  scriptGeneration: boolean;
  imageEditing: boolean;
  socialMediaPosts: boolean;
  titleGeneration: boolean;
  batchProcessing: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  analytics: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
}

export interface UsageLimits {
  monthlyCredits: number;
  creditRolloverDays: number;
  overageRateCents: number;
  videosPerMonth: number;
  logosPerMonth: number;
  adsPerMonth: number;
  flyersPerMonth: number;
  blogPostsPerMonth: number;
  scriptsPerMonth: number;
  imageEditsPerMonth: number;
  socialPostsPerMonth: number;
  youtubeResearchPerMonth: number;
  titleGenPerMonth: number;
  storageLimit: number;
  maxVideoDuration: number;
  maxImageResolution: string;
  exportQuality: 'standard' | 'hd' | 'premium';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval: 'month' | 'year' | 'week';
  features: SubscriptionFeatures;
  limits: UsageLimits;
  popular?: boolean;
  trialDays?: number;
  active: boolean;
  polar_product_price_id?: string;
  polar_checkout_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  payment_provider: 'flutterwave' | 'paystack' | 'polar' | 'admin';
  provider_subscription_id?: string;
  provider_customer_id?: string;
  amount_cents: number;
  currency: string;
  monthly_credits: number;
  credit_balance: number;
  overage_rate_cents: number;
  credit_rollover_days: number;
  overage_settings: {
    auto_reload: boolean;
    manual_topup: boolean;
    monthly_cap_cents: number | null;
  };
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'pending_approval' | 'expired';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  customer_name?: string;
  customer_phone?: string;
  billing_address?: Record<string, any>;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface UsageStats {
  feature_type: string;
  usage_count: number;
  usage_date: string;
  subscription_id: string;
}

export interface CreditBalance {
  balance: number;
  monthly_allocation: number;
  overage_rate_cents: number;
  credit_rollover_days: number;
  overage_settings: {
    auto_reload: boolean;
    manual_topup: boolean;
    monthly_cap_cents: number | null;
  };
}

export interface FeatureCreditCost {
  feature: string;
  credits: number;
  description: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  subscription_id: string;
  transaction_type: string;
  credits_before: number;
  credits_after: number;
  credits_changed: number;
  created_at: string;
  description?: string;
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  static async getPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    try {
      const data = await apiClient.getPlans();
      const plans: SubscriptionPlan[] = data.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price_cents / 100,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits,
        popular: plan.popular,
        trialDays: plan.trial_days,
        active: plan.active,
        polar_product_price_id: plan.polar_product_price_id,
        polar_checkout_url: plan.polar_checkout_url,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }));
      return { success: true, data: plans };
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      const data = await apiClient.getMySubscription();
      if (!data) return { success: true };

      const subscription: UserSubscription = {
        ...data,
        plan: data.plan ? {
          ...data.plan,
          price: data.plan.price_cents / 100,
          trialDays: data.plan.trial_days
        } : undefined
      };
      return { success: true, data: subscription };
    } catch (error: any) {
      console.error('Error fetching user subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has already had a trial/free plan
   */
  static async hasUserHadFreePlan(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.request('/subscriptions/has-trial');
      return response.has_had_trial;
    } catch (error) {
      console.error('Error checking trial status:', error);
      return false;
    }
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(
    userId: string,
    planId: string,
    paymentProvider: string,
    paymentData: any
  ): Promise<{ success: boolean; data?: UserSubscription; error?: string }> {
    try {
      const response = await apiClient.request('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          payment_provider: paymentProvider,
          payment_data: paymentData
        })
      });
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST' });
      return { success: true };
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set subscription to pending approval status
   */
  static async setSubscriptionPendingApproval(subscriptionId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/subscriptions/${subscriptionId}/set-pending`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error setting subscription pending:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Approve a pending subscription
   */
  static async approveSubscription(subscriptionId: string, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/subscriptions/${subscriptionId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: adminNotes })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error approving subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Reject a pending subscription
   */
  static async rejectSubscription(subscriptionId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/subscriptions/${subscriptionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Get all pending subscriptions
   */
  static async getPendingSubscriptions(): Promise<{ success: boolean; data?: UserSubscription[]; error?: string }> {
    try {
      const response = await apiClient.request('/admin/subscriptions?skip=0&limit=100&status=pending_approval');
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching pending subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Get expired subscriptions
   */
  static async getExpiredSubscriptions(): Promise<{ success: boolean; data?: UserSubscription[]; error?: string }> {
    try {
      const response = await apiClient.request('/admin/subscriptions?skip=0&limit=100&status=expired');
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching expired subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Get plans (admin view) — currently same as public plans
   */
  static async getAdminPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    return this.getPlans();
  }

  /**
   * Admin: Update a plan — backend endpoint not implemented yet
   */
  static async updatePlan(
    planId: string,
    updates: { polar_product_price_id?: string; polar_checkout_url?: string; active?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/admin/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating plan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Get all subscriptions with filtering
   */
  static async getAdminSubscriptions(params: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ success: boolean; data?: UserSubscription[]; error?: string }> {
    try {
      let url = '/admin/subscriptions?';
      if (params.skip !== undefined) url += `skip=${params.skip}&`;
      if (params.limit !== undefined) url += `limit=${params.limit}&`;
      if (params.search) url += `search=${encodeURIComponent(params.search)}&`;
      if (params.status) url += `status=${params.status}&`;

      const response = await apiClient.request(url);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching admin subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Process expired subscriptions
   */
  static async processExpiredSubscriptions(): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
    try {
      const response = await apiClient.request('/admin/subscriptions/process-expired', {
        method: 'POST'
      });
      return { success: true, updatedCount: response.updated_count };
    } catch (error: any) {
      console.error('Error processing expired subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get usage statistics for a user
   */
  static async getUsageStats(userId: string): Promise<{ success: boolean; data?: UsageStats[]; error?: string }> {
    try {
      console.log('📊 Fetching usage statistics for user:', userId);
      const response = await apiClient.request('/subscriptions/usage');
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching usage stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user can access a feature
   */
  static async canAccessFeature(userId: string, feature: keyof SubscriptionFeatures): Promise<{ success: boolean; canAccess: boolean; error?: string }> {
    try {
      const response = await apiClient.request(`/subscriptions/can-access/${feature}`);
      return { success: true, canAccess: response.can_access };
    } catch (error: any) {
      console.error('Error checking feature access:', error);
      return { success: false, canAccess: false, error: error.message };
    }
  }

  /**
   * Check usage limits for a feature
   */
  static async checkUsageLimit(userId: string, featureType: string): Promise<{ success: boolean; withinLimit: boolean; currentUsage: number; limit: number; error?: string }> {
    try {
      const response = await apiClient.request(`/subscriptions/check-limit/${featureType}`);
      return {
        success: true,
        withinLimit: response.within_limit,
        currentUsage: response.current_usage,
        limit: response.limit
      };
    } catch (error: any) {
      console.error('Error checking usage limit:', error);
      return { success: false, withinLimit: false, currentUsage: 0, limit: 0, error: error.message };
    }
  }

  /**
   * Admin: Assign a subscription to a user
   */
  static async assignSubscriptionToUser(
    userId: string,
    planId: string,
    adminId: string,
    options: { reason?: string } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request('/admin/subscriptions/assign', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          reason: options.reason
        })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error assigning subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Extend a subscription
   */
  static async extendSubscription(
    subscriptionId: string,
    adminId: string,
    days: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request(`/admin/subscriptions/${subscriptionId}/extend`, {
        method: 'POST',
        body: JSON.stringify({
          days,
          reason
        })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error extending subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Purchase / top-up credits
   */
  static async purchaseCredits(params: {
    creditsToPurchase: number;
    paymentProvider: 'flutterwave' | 'paystack' | 'polar';
    providerReference: string;
    amountCents: number;
    currency?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.request('/subscriptions/purchase-credits', {
        method: 'POST',
        body: JSON.stringify({
          credits_to_purchase: params.creditsToPurchase,
          payment_provider: params.paymentProvider,
          provider_reference: params.providerReference,
          amount_cents: params.amountCents,
          currency: params.currency || 'USD'
        })
      });
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track feature usage
   */
  static async trackUsage(userId: string, featureType: string, amount: number = 1): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.trackUsage(featureType, amount);
      return { success: true };
    } catch (error: any) {
      console.error('Error tracking usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's credit balance
   */
  static async getCreditBalance(userId: string): Promise<{ success: boolean; data?: CreditBalance; error?: string }> {
    try {
      const response = await apiClient.request('/subscriptions/credit-balance');
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching credit balance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get credit transactions
   */
  static async getCreditTransactions(userId: string, limit: number = 20): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.request(`/subscriptions/credit-transactions?limit=${limit}`);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error fetching credit transactions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct credits for a feature
   */
  static async useCredits(userId: string, featureType: string, creditsNeeded: number, featureCount: number = 1): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request('/subscriptions/use-credits', {
        method: 'POST',
        body: JSON.stringify({
          feature_type: featureType,
          credits_needed: creditsNeeded,
          feature_count: featureCount
        })
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error using credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update overage settings
   */
  static async updateOverageSettings(userId: string, settings: any): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.request('/subscriptions/overage-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating overage settings:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods for credit costs
  static getFeatureCreditCosts(): FeatureCreditCost[] {
    return [
      { feature: 'background_removal', credits: 1, description: 'Remove background from image' },
      { feature: 'google/nano-banana', credits: 2, description: 'Generate image with Base model (Fast)' },
      { feature: 'veo3_fast', credits: 20, description: 'Generate 8 seconds of video with Veo3 Fast' },
      { feature: 'veo3_quality', credits: 80, description: 'Generate 8 seconds of video with Veo3 Quality' },
      { feature: 'social_post', credits: 4, description: 'Generate social media post content' }
    ];
  }

  static getCreditCostForFeature(featureType: string): number {
    const costs = this.getFeatureCreditCosts();
    const cost = costs.find(c => c.feature === featureType);
    return cost ? cost.credits : 1;
  }

  static getCreditCostForLogo(model: string): number {
    switch (model) {
      case 'nano-banana-pro': return 6;
      case 'google/nano-banana-edit': return 2;
      case 'google/nano-banana': return 2;
      case 'z-image': return 1;
      default: return 2;
    }
  }

  static getCreditCostForImageEdit(model: string, resolution: string): number {
    let baseCost = 2; // Default for nexus/base
    if (model === 'nano-banana-pro') {
      baseCost = resolution === '4K' ? 8 : 6;
    }
    return baseCost;
  }
}

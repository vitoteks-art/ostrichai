// Subscription Context for managing user subscription state

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { SubscriptionService, SubscriptionPlan, UserSubscription, SubscriptionFeatures } from '../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  loading: boolean;
  canAccess: (feature: keyof SubscriptionFeatures) => boolean;
  canUse: (featureType: string, amount?: number) => Promise<boolean>;
  getRemainingUsage: (featureType: string) => Promise<number>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setPlan(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const subscriptionResult = await SubscriptionService.getUserSubscription(user.id);

      if (subscriptionResult.success && subscriptionResult.data) {
        setSubscription(subscriptionResult.data);

        // Load plan details if subscription exists
        if (subscriptionResult.data.plan_id) {
          const plansResult = await SubscriptionService.getPlans();
          if (plansResult.success && plansResult.data) {
            const userPlan = plansResult.data.find(p => p.id === subscriptionResult.data!.plan_id);
            setPlan(userPlan || null);
          }
        }
      } else {
        // No subscription found - user is on free plan
        const plansResult = await SubscriptionService.getPlans();
        if (plansResult.success && plansResult.data) {
          const freePlan = plansResult.data.find(p => p.price === 0);
          setPlan(freePlan || null);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const canAccess = (feature: keyof SubscriptionFeatures): boolean => {
    if (!plan) return false;
    return plan.features[feature];
  };

  const canUse = async (featureType: string, amount: number = 1): Promise<boolean> => {
    if (!plan) return false;

    // Check if feature is enabled in plan
    const featureKey = getFeatureKey(featureType);
    if (featureKey && !plan.features[featureKey]) {
      return false;
    }

    // Check usage limits
    const limit = getLimitForFeature(plan.limits, featureType);
    if (limit === 0) return false; // Feature not available
    if (limit === -1) return true; // Unlimited

    // Check current usage vs limit from database
    const currentUsage = await getCurrentUsage(featureType);
    const remainingUsage = limit - currentUsage;

    return remainingUsage >= amount;
  };

  const getCurrentUsage = async (featureType: string): Promise<number> => {
    if (!user || !plan) return 0;

    try {
      const usageResult = await SubscriptionService.getUsageStats(user.id);
      if (!usageResult.success || !usageResult.data) return 0;

      // Only count usage from the current month
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      const totalUsage = usageResult.data
        .filter((u: any) => {
          const createdAt = new Date(u.created_at || u.usage_date || u.createdAt || Date.now());
          return (
            u.feature_type === featureType &&
            createdAt.getFullYear() === year &&
            createdAt.getMonth() === month
          );
        })
        .reduce((sum: number, record: any) => sum + (record.usage_count || 0), 0);

      return totalUsage;
    } catch (error) {
      console.error('Error in getCurrentUsage:', error);
      return 0;
    }
  };

  const getRemainingUsage = async (featureType: string): Promise<number> => {
    if (!plan) return 0;

    const limit = getLimitForFeature(plan.limits, featureType);
    if (limit === -1) return -1; // Unlimited
    if (limit === 0) return 0; // Not available

    const currentUsage = await getCurrentUsage(featureType);
    return Math.max(0, limit - currentUsage);
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const getFeatureKey = (featureType: string): keyof SubscriptionFeatures | null => {
    switch (featureType) {
      case 'video': return 'videoGeneration';
      case 'logo': return 'logoDesign';
      case 'ad': return 'adCreation';
      case 'flyer': return 'flyerDesign';
      case 'blog': return 'blogResearch';
      case 'script': return 'scriptGeneration';
      case 'image_edit': return 'imageEditing';
      case 'social_post': return 'socialMediaPosts';
      case 'title_gen': return 'titleGeneration';
      default: return null;
    }
  };

  const getLimitForFeature = (limits: any, featureType: string): number => {
    switch (featureType) {
      case 'video': return limits.videosPerMonth;
      case 'logo': return limits.logosPerMonth;
      case 'ad': return limits.adsPerMonth;
      case 'flyer': return limits.flyersPerMonth;
      case 'blog': return limits.blogPostsPerMonth;
      case 'script': return limits.scriptsPerMonth;
      case 'image_edit': return limits.imageEditsPerMonth;
      case 'social_post': return limits.socialPostsPerMonth;
      case 'youtube_research': return limits.youtubeResearchPerMonth;
      case 'title_gen': return limits.titleGenPerMonth;
      default: return 0;
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    plan,
    loading,
    canAccess,
    canUse,
    getRemainingUsage,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

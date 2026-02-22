// Feature Gate Component for subscription-based access control

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionService, SubscriptionFeatures } from '../services/subscriptionService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Crown, Lock, Zap } from 'lucide-react';

interface FeatureGateProps {
  feature: keyof SubscriptionFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true
}) => {
  const { canAccess, plan } = useSubscription();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return <UpgradePrompt feature={feature} currentPlan={plan?.name} />;
};

interface UpgradePromptProps {
  feature: keyof SubscriptionFeatures;
  currentPlan?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, currentPlan }) => {
  const getFeatureName = (feature: keyof SubscriptionFeatures): string => {
    switch (feature) {
      case 'videoGeneration': return 'Video Generation';
      case 'logoDesign': return 'Logo Design';
      case 'adCreation': return 'Ad Creation';
      case 'flyerDesign': return 'Flyer Design';
      case 'blogResearch': return 'Blog Research';
      case 'scriptGeneration': return 'Script Generation';
      case 'imageEditing': return 'Image Editing';
      case 'socialMediaPosts': return 'Social Media Posts';
      case 'batchProcessing': return 'Batch Processing';
      case 'prioritySupport': return 'Priority Support';
      case 'customBranding': return 'Custom Branding';
      case 'analytics': return 'Analytics Dashboard';
      case 'apiAccess': return 'API Access';
      case 'whiteLabel': return 'White Label Solution';
      default: return 'Premium Feature';
    }
  };

  const getRecommendedPlan = (feature: keyof SubscriptionFeatures): string => {
    switch (feature) {
      case 'blogResearch':
      case 'scriptGeneration':
      case 'imageEditing':
      case 'socialMediaPosts':
      case 'batchProcessing':
      case 'analytics':
        return 'Professional';
      case 'customBranding':
      case 'apiAccess':
      case 'whiteLabel':
        return 'Enterprise';
      default:
        return 'Professional';
    }
  };

  const featureName = getFeatureName(feature);
  const recommendedPlan = getRecommendedPlan(feature);

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{featureName}</CardTitle>
        <CardDescription>
          This feature requires a {recommendedPlan} plan or higher
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {currentPlan && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Current Plan:</span>
            <Badge variant="outline">{currentPlan}</Badge>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span>Upgrade to {recommendedPlan} to unlock this feature</span>
        </div>

        <Button className="w-full" size="lg">
          <Zap className="mr-2 h-4 w-4" />
          Upgrade Now
        </Button>

        <p className="text-xs text-muted-foreground">
          Unlock {featureName} and many other premium features
        </p>
      </CardContent>
    </Card>
  );
};

// Usage tracking wrapper
interface TrackUsageProps {
  featureType: string;
  children: React.ReactNode;
  amount?: number;
}

export const TrackUsage: React.FC<TrackUsageProps> = ({
  featureType,
  children,
  amount = 1
}) => {
  const { user } = useAuth();

  const handleClick = async () => {
    if (user) {
      try {
        await SubscriptionService.trackUsage(user.id, featureType, amount);
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    }
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
};

// Subscription status indicator
export const SubscriptionStatus: React.FC = () => {
  const { subscription, plan, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        Loading subscription...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
        Free Plan
      </div>
    );
  }

  const isPaidPlan = plan.price > 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isPaidPlan ? 'bg-green-500' : 'bg-blue-500'}`} />
      <span className={isPaidPlan ? 'text-green-600 font-medium' : 'text-blue-600'}>
        {plan.name} Plan
      </span>
      {isPaidPlan && (
        <Badge variant="secondary" className="text-xs">
          ${plan.price}/month
        </Badge>
      )}
    </div>
  );
};

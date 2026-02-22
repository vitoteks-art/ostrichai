
import React, { useState } from 'react';
import {
  AppStep,
  AppState,
  ProductInput,
  MarketIntelligence,
  MessagingArchitecture,
  AdCreative as AdCreativeType,
  AudienceTargeting,
  OptimizationResult
} from '../types/adsEngine';
import * as AdsService from '../services/adsEngineService';
import { StepInput } from './ads/StepInput';
import { StepIntelligence } from './ads/StepIntelligence';
import { StepMessaging } from './ads/StepMessaging';
import { StepCreativesAndPrediction } from './ads/StepCreativesAndPrediction';
import { StepTargeting } from './ads/StepTargeting';
import { StepOptimization } from './ads/StepOptimization';
import { StepFinalReview } from './ads/StepFinalReview';
import { PostToAdAccountModal } from './ads/PostToAdAccountModal';
import { AdsLayout } from './ads/AdsLayout';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProjectService } from '../services/projectService';
import { SubscriptionService } from '../services/subscriptionService';
import * as FacebookAdsService from '../services/facebookAdsService';
import { getConnectedAccounts } from '../services/socialMediaOAuthService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface AdsCreativeProps {
  initialState?: any;
  projectId?: string;
  overrideLayout?: boolean;
}

const AdsCreative: React.FC<AdsCreativeProps> = ({ initialState, projectId: initialProjectId, overrideLayout }) => {
  const { user } = useAuth();

  const getStepFromMetadata = (data: any) => {
    if (!data) return AppStep.INPUT;
    if (data.currentStep === 'FINAL_REVIEW' || data.finalAd) return AppStep.FINAL_REVIEW;
    if (data.currentStep === 'OPTIMIZATION' || data.optimization) return AppStep.OPTIMIZATION;
    if (data.currentStep === 'TARGETING' || data.targeting) return AppStep.TARGETING;
    if (data.currentStep === 'PREDICTION' || data.predictions) return AppStep.PREDICTION;
    if (data.currentStep === 'CREATIVES' || (data.creatives && data.creatives.length > 0)) return AppStep.CREATIVES;
    if (data.currentStep === 'MESSAGING' || data.messaging) return AppStep.MESSAGING;
    if (data.currentStep === 'INTELLIGENCE' || data.intelligence) return AppStep.INTELLIGENCE;
    return AppStep.INPUT;
  };

  const [appState, setAppState] = useState<AppState>(() => {
    // 1. Try props first (Database state)
    if (initialState) {
      return {
        step: getStepFromMetadata(initialState),
        isLoading: false,
        product: initialState.product || {
          name: '', description: '', targetAudience: '', competitors: '', productUrl: '', competitorUrl: ''
        },
        intelligence: initialState.intelligence || null,
        messaging: initialState.messaging || null,
        creatives: initialState.creatives || [],
        predictions: initialState.predictions || {},
        targeting: initialState.targeting || null,
        optimization: initialState.optimization || null,
        finalAd: initialState.finalAd || null,
        finalConfig: initialState.finalConfig || null,
        projectId: initialProjectId
      };
    }

    // 2. Try localStorage (Draft state)
    const saved = localStorage.getItem('OstrichAi_ad_engine_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isLoading: false,
          projectId: initialProjectId || parsed.projectId
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }

    // 3. Fallback to default
    return {
      step: AppStep.INPUT,
      isLoading: false,
      product: {
        name: '',
        description: '',
        targetAudience: '',
        competitors: '',
        productUrl: '',
        competitorUrl: ''
      },
      intelligence: null,
      messaging: null,
      creatives: [],
      predictions: {},
      targeting: null,
      optimization: null,
      finalAd: null,
      finalConfig: null,
      projectId: initialProjectId
    };
  });

  // Track state changes to save to localStorage
  React.useEffect(() => {
    if (appState && !appState.isLoading) {
      localStorage.setItem('OstrichAi_ad_engine_state', JSON.stringify(appState));
    }
  }, [appState]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Fetch credit balance on mount
  React.useEffect(() => {
    const fetchCreditBalance = async () => {
      if (user?.id) {
        const result = await SubscriptionService.getCreditBalance(user.id);
        if (result.success && result.data) {
          setCreditBalance(result.data.balance);
        }
      }
    };
    fetchCreditBalance();
  }, [user?.id]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  /* --- Handlers --- */

  const handleInputSubmit = async (data: ProductInput, enableAdSpy: boolean) => {
    setAppState(prev => ({ ...prev, isLoading: true, product: data }));
    try {
      // Check credits (2 credits for Intelligence Analysis)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_intelligence', 2);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (creditBalance < 2) {
            errorMsg = `Insufficient credits for Intelligence Analysis. You need 2 credits but only have ${creditBalance}. Please upgrade your plan.`;
          }
          showNotification('error', errorMsg);
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        // Refresh credit balance
        const balanceResult = await SubscriptionService.getCreditBalance(user.id);
        if (balanceResult.success && balanceResult.data) {
          setCreditBalance(balanceResult.data.balance);
        }
      }

      // 1. Fetch live competitor ads if spy enabled
      let competitorAds: any[] = [];
      if (enableAdSpy) {
        try {
          competitorAds = await AdsService.fetchCompetitorAds(data);
        } catch (e) {
          console.warn("Spy failed, proceeding to analysis", e);
        }
      }

      // 2. Market Analysis (Step 1)
      const intelligence = await AdsService.analyzeMarket(data, competitorAds);

      let newProjectId = appState.projectId;
      if (user?.id) {
        try {
          if (!newProjectId) {
            // Create initial project
            const projectRes = await ProjectService.createProject(user.id, {
              title: `Ad Campaign: ${data.name.substring(0, 40)}`,
              type: 'ad',
              status: 'processing',
              project_metadata: {
                product: data,
                intelligence: intelligence,
                currentStep: 'INTELLIGENCE'
              }
            });
            if (projectRes.data) {
              newProjectId = projectRes.data.id;
              await ProjectService.logProductCreation(user.id, 'ad', `Started Campaign: ${data.name}`);
            }
          } else {
            // Update existing project if re-running
            await ProjectService.mergeProjectMetadata(newProjectId, {
              product: data,
              intelligence: intelligence,
              currentStep: 'INTELLIGENCE'
            });
          }
        } catch (e) {
          console.error("Failed to sync project", e);
        }
      }

      setAppState(prev => ({
        ...prev,
        intelligence,
        step: AppStep.INTELLIGENCE,
        projectId: newProjectId,
        isLoading: false
      }));
      showNotification('success', 'Market Intelligence Analysis Complete');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to analyze market. Please check API Key.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleIntelligenceNext = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check credits (1 credit for Messaging)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_messaging', 1);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (creditBalance < 1) {
            errorMsg = `Insufficient credits for Messaging Architecture. You need 1 credit but only have ${creditBalance}.`;
          }
          showNotification('error', errorMsg);
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      const messaging = await AdsService.buildMessaging(appState.product, appState.intelligence!);

      if (user?.id && appState.projectId) {
        await ProjectService.mergeProjectMetadata(appState.projectId, {
          messaging: messaging,
          currentStep: 'MESSAGING'
        });
      }

      setAppState(prev => ({
        ...prev,
        messaging,
        step: AppStep.MESSAGING,
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to build messaging architecture.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleMessagingNext = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check credits (1 credit for Creatives)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_creatives', 1);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (creditBalance < 1) {
            errorMsg = `Insufficient credits for Ad Creatives. You need 1 credit but only have ${creditBalance}.`;
          }
          showNotification('error', errorMsg);
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      const creatives = await AdsService.generateCreatives(appState.messaging!, appState.intelligence);

      if (user?.id && appState.projectId) {
        await ProjectService.mergeProjectMetadata(appState.projectId, {
          creatives: creatives,
          currentStep: 'CREATIVES'
        });
      }

      setAppState(prev => ({
        ...prev,
        creatives,
        step: AppStep.CREATIVES,
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to generate creatives.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRunPrediction = async () => {
    if (appState.creatives.length === 0) return;
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check credits (1 credit for Prediction)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_prediction', 1);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (creditBalance < 1) {
            errorMsg = `Insufficient credits for Prediction Analysis. You need 1 credit but only have ${creditBalance}.`;
          }
          showNotification('error', errorMsg);
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      const predictions = await AdsService.predictPerformance(appState.creatives, appState.product.targetAudience);

      if (user?.id && appState.projectId) {
        await ProjectService.mergeProjectMetadata(appState.projectId, {
          predictions: predictions,
          currentStep: 'PREDICTION'
        });
      }

      setAppState(prev => ({
        ...prev,
        predictions,
        isLoading: false
      }));
      showNotification('success', 'AI Prediction Scoring Complete');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to run prediction simulation.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCreativesNext = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check credits (1 credit for Targeting)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_targeting', 1);
        if (!creditCheck.success) {
          showNotification('error', 'Insufficient credits. Please upgrade your plan.');
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      const targeting = await AdsService.generateTargeting(appState.product, appState.intelligence!);

      if (user?.id && appState.projectId) {
        await ProjectService.mergeProjectMetadata(appState.projectId, {
          targeting: targeting,
          currentStep: 'TARGETING'
        });
      }

      setAppState(prev => ({
        ...prev,
        targeting,
        step: AppStep.TARGETING,
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to generate targeting strategy.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleTargetingNext = async () => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check credits (1 credit for Optimization)
      if (user?.id) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ads_optimization', 1);
        if (!creditCheck.success) {
          showNotification('error', 'Insufficient credits. Please upgrade your plan.');
          setAppState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      // Find winners or use all
      const winners = appState.creatives.filter(c =>
        appState.predictions[c.id]?.status === 'WINNER'
      );
      const creativesToOptimize = winners.length > 0 ? winners : appState.creatives;

      const optimization = await AdsService.generateOptimizationInsights(appState.targeting!, creativesToOptimize);

      if (user?.id && appState.projectId) {
        await ProjectService.mergeProjectMetadata(appState.projectId, {
          optimization: optimization,
          currentStep: 'OPTIMIZATION'
        });

        await ProjectService.logProductCompletion(user.id, 'ad', `Strategy Ready for Final Review`, appState.projectId);
      }

      setAppState(prev => ({
        ...prev,
        optimization,
        step: AppStep.OPTIMIZATION,
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to generate optimization loop.');
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOptimizationNext = async () => {
    setAppState(prev => ({ ...prev, step: AppStep.FINAL_REVIEW }));

    if (user?.id && appState.projectId) {
      await ProjectService.mergeProjectMetadata(appState.projectId, {
        currentStep: 'FINAL_REVIEW'
      });
    }
  };

  const handleLaunchCampaign = () => {
    setIsLaunchModalOpen(true);
  };

  const handleAdAccountLaunch = async (adAccountId: string) => {
    if (!user?.id) return;
    setIsLaunching(true);

    try {
      // 1. Get Facebook Access Token
      const accountsResult = await getConnectedAccounts(user.id);
      const fbAccount = accountsResult.data?.find(a => a.platform === 'facebook');

      if (!fbAccount) {
        toast.error("Please connect your Facebook account in the Social Dashboard first.");
        setIsLaunching(false);
        return;
      }

      // 2. Prepare Config & Creative
      const finalizedAd = appState.finalAd || appState.creatives.find(c => appState.predictions[c.id]?.status === 'WINNER') || appState.creatives[0];
      const finalizedConfig = appState.finalConfig;

      if (!finalizedAd || !finalizedConfig) {
        toast.error("Missing campaign configuration or creative.");
        setIsLaunching(false);
        return;
      }

      const adCreative: FacebookAdsService.AdCreative = {
        headline: finalizedAd.headline,
        body: finalizedAd.caption,
        imageUrl: finalizedAd.visualConcept,
        callToAction: (finalizedAd.cta as any) || 'LEARN_MORE',
        linkUrl: appState.product.productUrl || 'https://OstrichAi.ai'
      };

      // 3. Create Campaign using Detailed Service
      const result = await FacebookAdsService.createDetailedCampaign(
        adAccountId,
        finalizedConfig,
        adCreative,
        fbAccount.access_token,
        user.id,
        adAccountId, // Using adAccountId as the DB ID reference for now (assuming they match in this context or mapping exists)
        appState.projectId
      );

      if (result.success) {
        toast.success("Campaign launched successfully! It is currently paused for your review in Ads Manager.");

        if (appState.projectId) {
          await ProjectService.updateProject(appState.projectId, { status: 'completed' });
          await ProjectService.mergeProjectMetadata(appState.projectId, {
            currentStep: 'COMPLETED',
            finalConfig: finalizedConfig,
            finalAd: finalizedAd
          });
        }

        setIsLaunchModalOpen(false);
      } else {
        toast.error(result.error || "Failed to launch campaign.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during launch.");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to start over? This will clear all current progress.")) {
      localStorage.removeItem('OstrichAi_ad_engine_state');
      setAppState({
        step: AppStep.INPUT,
        isLoading: false,
        product: { name: '', description: '', targetAudience: '', competitors: '', productUrl: '', competitorUrl: '' },
        intelligence: null,
        messaging: null,
        creatives: [],
        predictions: {},
        targeting: null,
        optimization: null,
        finalAd: null,
        projectId: appState.projectId
      });
      toast.success("Progress cleared. Starting new campaign.");
    }
  };

  /* --- Render --- */

  // Track max step for navigation locking
  const getMaxStep = () => {
    if (appState.finalAd) return AppStep.FINAL_REVIEW;
    if (appState.optimization) return AppStep.OPTIMIZATION;
    if (appState.targeting) return AppStep.TARGETING;
    if (Object.keys(appState.predictions).length > 0) return AppStep.PREDICTION;
    if (appState.creatives.length > 0) return AppStep.CREATIVES;
    if (appState.messaging) return AppStep.MESSAGING;
    if (appState.intelligence) return AppStep.INTELLIGENCE;
    return AppStep.INPUT;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">

      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border flex items-center gap-3 shadow-2xl animate-in slide-in-from-right-10 ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      <AdsLayout
        currentStep={appState.step}
        maxStep={getMaxStep()}
        onStepChange={(step) => setAppState(prev => ({ ...prev, step }))}
        onReset={handleReset}
        className={overrideLayout ? "h-auto min-h-[600px] border rounded-xl border-slate-800" : ""}
      >
        {appState.step === AppStep.INPUT && (
          <StepInput
            onSubmit={handleInputSubmit}
            initialData={appState.product}
            isProcessing={appState.isLoading}
            creditBalance={creditBalance}
          />
        )}

        {appState.step === AppStep.INTELLIGENCE && appState.intelligence && (
          <StepIntelligence
            data={appState.intelligence}
            onNext={handleIntelligenceNext}
            creditBalance={creditBalance}
          />
        )}

        {appState.step === AppStep.MESSAGING && appState.messaging && (
          <StepMessaging
            data={appState.messaging}
            onNext={handleMessagingNext}
          />
        )}

        {appState.step === AppStep.CREATIVES && (
          <StepCreativesAndPrediction
            creatives={appState.creatives}
            predictions={appState.predictions}
            onRunPrediction={handleRunPrediction}
            onNext={handleCreativesNext}
            isPredicting={appState.isLoading}
            projectId={appState.projectId}
          />
        )}

        {appState.step === AppStep.TARGETING && appState.targeting && (
          <StepTargeting
            data={appState.targeting}
            onUpdate={(targetingUpdate) => setAppState(prev => ({
              ...prev,
              targeting: prev.targeting ? { ...prev.targeting, ...targetingUpdate } : null
            }))}
            onNext={handleTargetingNext}
          />
        )}

        {appState.step === AppStep.OPTIMIZATION && appState.optimization && (
          <StepOptimization
            data={appState.optimization}
            onReset={handleReset}
            onNext={handleOptimizationNext}
          />
        )}

        {appState.step === AppStep.FINAL_REVIEW && (
          <StepFinalReview
            appState={appState}
            onUpdate={(finalAd, finalConfig) => setAppState(prev => ({ ...prev, finalAd, finalConfig }))}
            onLaunch={handleLaunchCampaign}
          />
        )}

        <PostToAdAccountModal
          isOpen={isLaunchModalOpen}
          onClose={() => setIsLaunchModalOpen(false)}
          onLaunch={handleAdAccountLaunch}
          isLaunching={isLaunching}
        />

        {(appState.isLoading && appState.step !== AppStep.INPUT && appState.step !== AppStep.CREATIVES && appState.step !== AppStep.PREDICTION) && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-md p-6">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 animate-pulse">AI Engine Processing...</h3>
              <p className="text-slate-400 leading-relaxed">
                Analyzing billions of data points, synthesizing creative concepts, and predicting outcomes.
              </p>
            </div>
          </div>
        )}
      </AdsLayout>
    </div>
  );
};

export default AdsCreative;

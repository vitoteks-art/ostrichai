import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { EnhancedScriptResult } from "@/components/EnhancedScriptResult";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useProjects } from "../hooks/useProjects";
import { SubscriptionService } from "../services/subscriptionService";

export const EnhancedScriptGeneratorForm = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, updateProject, logActivity, logProductCreation, logProductCompletion, logProductError, isDemo } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [usageExceeded, setUsageExceeded] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    temporalFocus: "",
    targetAudience: "",
    specificAngle: "",
    controversyLevel: "",
    powerWords: "",
    duration: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    checkUsageLimits();
  }, [user]);

  // Add refresh trigger when component mounts or user changes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (user) {
        checkUsageLimits();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user]);

  const checkUsageLimits = async () => {
    if (!user) {
      setUsageExceeded(false);
      return;
    }

    try {
      const canUseFeature = await SubscriptionService.checkUsageLimit(user.id, 'enhanced_script');
      console.log('🔍 Enhanced script usage check:', {
        userId: user.id,
        withinLimit: canUseFeature.withinLimit,
        currentUsage: canUseFeature.currentUsage,
        limit: canUseFeature.limit,
        subscription: await SubscriptionService.getUserSubscription(user.id)
      });
      setUsageExceeded(!canUseFeature.withinLimit);
    } catch (error) {
      console.error('Error checking usage limits:', error);
      setUsageExceeded(false);
    }
  };

  const refreshUsageLimits = () => {
    checkUsageLimits();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic || !formData.temporalFocus || !formData.targetAudience || !formData.specificAngle || !formData.powerWords || !formData.duration) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (marked with *) before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate scripts.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits before allowing submission
    const canUseScriptGeneration = await SubscriptionService.canAccessFeature(user.id, 'scriptGeneration');
    if (!canUseScriptGeneration) {
      toast({
        title: "Feature Not Available",
        description: "Script generation feature is not available in your current plan",
        variant: "destructive",
      });
      return;
    }

    const canUseFeature = await SubscriptionService.checkUsageLimit(user.id, 'enhanced_script');
    if (!canUseFeature.withinLimit) {
      toast({
        title: "Monthly Enhanced Script Generation Limit Exceeded",
        description: `You've reached your monthly limit of ${canUseFeature.limit} enhanced script generations. Please upgrade your plan or contact support.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check credit balance before proceeding
      const creditsNeeded = 6; // Enhanced YouTube script costs 6 credits
      if (creditsNeeded > 0) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'enhanced_script', creditsNeeded);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (subscription && subscription.credit_balance < creditsNeeded) {
            errorMsg = `Insufficient credits for enhanced script generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
          }
          toast({
            title: "Credit Error",
            description: errorMsg,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Credits Deducted",
          description: `✅ ${creditsNeeded} credits deducted for enhanced script generation`,
        });
      }

      // Create project record first
      const projectTitle = `Enhanced YouTube Script: ${formData.topic}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'youtube',
        status: 'processing',
        project_metadata: {
          topic: formData.topic,
          temporalFocus: formData.temporalFocus,
          targetAudience: formData.targetAudience,
          specificAngle: formData.specificAngle,
          controversyLevel: formData.controversyLevel,
          powerWords: formData.powerWords,
          duration: formData.duration,
          submittedAt: new Date().toISOString(),
          scriptType: 'enhanced-youtube'
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      // Log activity for starting script generation
      await logProductCreation('script', projectTitle, {
        topic: formData.topic,
        temporalFocus: formData.temporalFocus,
        targetAudience: formData.targetAudience,
        specificAngle: formData.specificAngle,
        controversyLevel: formData.controversyLevel,
        powerWords: formData.powerWords,
        duration: formData.duration,
        scriptType: 'enhanced-youtube'
      });

      const response = await fetch("https://n8n.getostrichai.com/webhook/enhanced-youtube-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          enhanced: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Enhanced script API response:', result);

        // Handle the enhanced script response format
        let enhancedResult;

        if (Array.isArray(result)) {
          enhancedResult = result;
        } else if (result && typeof result === 'object') {
          // Handle single object response
          enhancedResult = [result];
        } else {
          // Handle unexpected response format
          console.warn('Unexpected API response format:', result);
          enhancedResult = [{
            output: {
              title: 'Error Processing Script',
              script: {
                error: 'Unable to process the script response. Please try again.'
              },
              visual_cues: []
            }
          }];
        }

        setScriptData(enhancedResult);

        // Update project status to completed and save script content
        if (currentProjectId || projectResult.data?.id) {
          const projectId = currentProjectId || projectResult.data!.id;

          // Prepare enhanced metadata with script content
          const enhancedMetadata = {
            ...projectResult.data?.metadata,
            scriptResult: enhancedResult,
            generatedAt: new Date().toISOString(),
            scriptVersion: 'enhanced-youtube-v1'
          };

          await updateProject(projectId, {
            status: 'completed',
            project_metadata: enhancedMetadata
          });
        }

        // Log successful completion
        await logProductCompletion('script', projectTitle, currentProjectId || projectResult.data?.id);

        // Credit tracking is now handled above with useCredits()

        toast({
          title: "Success! 🎉",
          description: "Your enhanced script has been generated successfully.",
        });

        // Reset form
        setFormData({
          topic: "",
          temporalFocus: "",
          targetAudience: "",
          specificAngle: "",
          controversyLevel: "",
          powerWords: "",
          duration: "",
        });
      } else {
        // Update project status to failed
        if (currentProjectId || projectResult.data?.id) {
          await updateProject(currentProjectId || projectResult.data!.id, {
            status: 'failed'
          });
        }
        throw new Error("Failed to submit");
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      // Log error activity
      if (user) {
        await logProductError('script', error instanceof Error ? error.message : 'Unknown error', currentProjectId, {
          topic: formData.topic,
          temporalFocus: formData.temporalFocus,
          targetAudience: formData.targetAudience,
          specificAngle: formData.specificAngle,
          controversyLevel: formData.controversyLevel,
          powerWords: formData.powerWords,
          duration: formData.duration,
          scriptType: 'enhanced-youtube'
        });
      }

      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (scriptData) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setScriptData(null)}
          variant="outline"
          className="mb-6"
        >
          Generate New Enhanced Script
        </Button>
        <EnhancedScriptResult data={scriptData} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields Section */}
        <div className="space-y-4 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full"></span>
            Required Fields
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-foreground text-base">
                Topic/Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="What the documentary is about (e.g., 'The CFA Franc system' or 'AI job displacement by 2040')"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temporalFocus" className="text-foreground text-base">
                Temporal Focus <span className="text-destructive">*</span>
              </Label>
              <select
                id="temporalFocus"
                value={formData.temporalFocus}
                onChange={(e) => setFormData({ ...formData, temporalFocus: e.target.value })}
                className="w-full bg-card border border-border text-foreground placeholder:text-muted-foreground h-12 rounded-md px-3"
              >
                <option value="">Select temporal focus...</option>
                <option value="past">Past (Historical)</option>
                <option value="present">Present (Current/Ongoing)</option>
                <option value="future">Future (Predictive)</option>
                <option value="cross-temporal">Cross-temporal (Pattern across time periods)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                This determines which script structure (Type A-E) to use
              </p>
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="space-y-4 p-6 bg-secondary/5 border border-secondary/20 rounded-lg">
          <h3 className="text-xl font-semibold text-secondary-foreground flex items-center gap-2">
            <span className="w-3 h-3 bg-secondary rounded-full"></span>
            Optional Fields (Recommended)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-foreground text-base">
                Target Audience
              </Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="General audience vs. specific demographic (helps tailor complexity and examples)"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="controversyLevel" className="text-foreground text-base">
                Controversy Level Preference
              </Label>
              <select
                id="controversyLevel"
                value={formData.controversyLevel}
                onChange={(e) => setFormData({ ...formData, controversyLevel: e.target.value })}
                className="w-full bg-card border border-border text-foreground placeholder:text-muted-foreground h-12 rounded-md px-3"
              >
                <option value="">Select controversy level...</option>
                <option value="low">Low (Neutral, factual approach)</option>
                <option value="medium">Medium (Balanced discussion of different views)</option>
                <option value="high">High (In-depth exploration of controversial aspects)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                How politically/socially sensitive the treatment should be (helps calibrate tone and balance)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specificAngle" className="text-foreground text-base">
              Specific Angle/Focus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="specificAngle"
              value={formData.specificAngle}
              onChange={(e) => setFormData({ ...formData, specificAngle: e.target.value })}
              placeholder="What aspect of the topic to emphasize (e.g., for 'AI' focus on 'economic impact' vs. 'ethics' vs. 'technical mechanics')"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-24 resize-none"
            />
          </div>
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="powerWords" className="text-foreground text-base">
              Power Words <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="powerWords"
              value={formData.powerWords}
              onChange={(e) => setFormData({ ...formData, powerWords: e.target.value })}
              placeholder="Key phrases to maximize engagement (comma-separated)"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-foreground text-base">
              Desired Length/Runtime <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Target: 16-20 minutes (affects depth of coverage)"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
            />
            <p className="text-xs text-muted-foreground">
              Standard YouTube documentary length: 16-20 minutes
            </p>
          </div>
        </div>

        {/* Credit Cost Display */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                <span className="text-violet-600 font-bold text-sm">💰</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                <p className="text-sm text-gray-600">Cost for enhanced YouTube script generation</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-violet-600">6 credits</div>
              <div className="text-sm text-gray-500">Advanced AI script generation</div>
            </div>
          </div>

          {subscription && (
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-600">
                Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
              </span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={isLoading || usageExceeded}
          className="w-full text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Generating Enhanced Script...
            </>
          ) : (
            <>
              <Sparkles />
              Generate Enhanced Script
            </>
          )}
        </Button>

        {usageExceeded && (
          <div className="text-center text-red-600 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <strong>Monthly Enhanced Script Generation Limit Exceeded</strong><br />
            You've reached your monthly limit. Please upgrade your plan or contact support for assistance.
            <br />
            <button
              onClick={() => {
                checkUsageLimits();
                toast({
                  title: "Checking subscription status...",
                  description: "Refreshing your usage limits.",
                });
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Check Subscription
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

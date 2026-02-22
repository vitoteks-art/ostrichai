import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { ScriptResult } from "@/components/ScriptResult";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useProjects } from "../hooks/useProjects";
import { SubscriptionService } from "../services/subscriptionService";

export const ScriptGeneratorForm = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, updateProject, logActivity, logProductCreation, logProductCompletion, logProductError, isDemo } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [usageExceeded, setUsageExceeded] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    temporalFocus: "",
    targetAudience: "",
    contentAngle: "",
    controversyLevel: "",
    powerWords: "",
    duration: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    checkUsageLimits();
  }, [user]);

  const checkUsageLimits = async () => {
    if (!user) {
      setUsageExceeded(false);
      return;
    }

    try {
      const canUseFeature = await SubscriptionService.checkUsageLimit(user.id, 'script');
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

    if (!formData.title || !formData.temporalFocus || !formData.targetAudience || !formData.contentAngle || !formData.powerWords || !formData.duration) {
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

    // Check credit balance before proceeding
    const creditsNeeded = 40; // YouTube script generation costs 40 credits
    if (creditsNeeded > 0) {
      const creditCheck = await SubscriptionService.useCredits(user.id, 'youtube_script', creditsNeeded);
      if (!creditCheck.success) {
        let errorMsg = creditCheck.error || 'Failed to process credit deduction';
        if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
          errorMsg = 'Credit system error. Please try again later.';
        } else if (subscription && subscription.credit_balance < creditsNeeded) {
          errorMsg = `Insufficient credits for script generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
        }
        toast({
          title: "Credit Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Credits Deducted",
        description: `✅ ${creditsNeeded} credits deducted for script generation`,
      });
    }

    setIsLoading(true);

    try {
      // Create project record first
      const projectTitle = `YouTube Script: ${formData.title}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'youtube',
        status: 'processing',
        project_metadata: {
          title: formData.title,
          temporalFocus: formData.temporalFocus,
          targetAudience: formData.targetAudience,
          contentAngle: formData.contentAngle,
          controversyLevel: formData.controversyLevel,
          powerWords: formData.powerWords,
          duration: formData.duration,
          submittedAt: new Date().toISOString(),
          scriptType: 'youtube'
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      // Log activity for starting script generation
      await logProductCreation('script', projectTitle, {
        title: formData.title,
        temporalFocus: formData.temporalFocus,
        targetAudience: formData.targetAudience,
        contentAngle: formData.contentAngle,
        controversyLevel: formData.controversyLevel,
        powerWords: formData.powerWords,
        duration: formData.duration,
        scriptType: 'youtube'
      });

      const response = await fetch("https://n8n.getostrichai.com/webhook/youtube-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Script API response:', result);

        // Handle the YouTube Script API response format
        let scriptResult;

        try {
          console.log('Processing API response structure...');
          console.log('Result type:', typeof result);
          console.log('Result isArray:', Array.isArray(result));
          console.log('Result[0]:', result?.[0]);

          // The API returns: [{ data: [{ output: { ... } }] }]
          if (result && Array.isArray(result) && result[0]?.data) {
            console.log('Found nested data structure');
            // Extract the actual script data from the nested structure
            const apiResponse = result[0];
            console.log('API response data:', apiResponse.data);

            if (Array.isArray(apiResponse.data)) {
              scriptResult = apiResponse.data;
              console.log('Using array data, length:', scriptResult.length);
            } else {
              scriptResult = [apiResponse.data];
              console.log('Using single data item');
            }
          } else if (Array.isArray(result)) {
            console.log('Using direct array result');
            scriptResult = result;
          } else if (result && typeof result === 'object') {
            console.log('Using single object result');
            scriptResult = [result];
          } else {
            console.log('Unexpected response structure:', result);
            throw new Error('Unexpected response structure');
          }

          console.log('Final scriptResult before validation:', scriptResult);

          // Validate that we have valid script data
          if (!scriptResult || scriptResult.length === 0) {
            throw new Error('No script data received');
          }

          // Ensure each script item has the expected structure
          scriptResult = scriptResult.map((item, index) => {
            console.log(`Processing script item ${index}:`, item);

            if (!item.output) {
              console.warn('Script item missing output property:', item);
              return {
                output: {
                  title: 'Error in Script Data',
                  script: [{
                    time: 'Error',
                    text: 'Script data is malformed. Please try generating again.',
                    imagePrompt: 'Error loading script content'
                  }]
                }
              };
            }

            // Ensure script is an array and has valid segments
            if (!Array.isArray(item.output.script)) {
              console.warn('Script is not an array:', item.output.script);
              item.output.script = [];
            }

            // Validate each script segment
            item.output.script = item.output.script.map((segment: any, segmentIndex: number) => {
              console.log(`Processing segment ${segmentIndex}:`, segment);

              if (!segment || typeof segment !== 'object') {
                console.warn(`Invalid segment at ${segmentIndex}:`, segment);
                return {
                  time: `Scene ${segmentIndex + 1}`,
                  text: 'Invalid segment data',
                  imagePrompt: 'No image prompt available',
                  videoPrompt: ''
                };
              }

              // Handle nested text objects
              let textContent = segment.text;
              if (segment.text && typeof segment.text === 'object') {
                textContent = (segment.text as any).text || (segment.text as any).content || JSON.stringify(segment.text);
              }

              return {
                time: segment.time || `Scene ${segmentIndex + 1}`,
                text: textContent || 'No script text available',
                imagePrompt: segment.imagePrompt || 'No image prompt available',
                videoPrompt: segment.videoPrompt || ''
              };
            });

            return item;
          });

          console.log('Final processed scriptResult:', scriptResult);

        } catch (error) {
          console.error('Error processing script response:', error);
          scriptResult = [{
            output: {
              title: 'Error Processing Script',
              script: [{
                time: 'Error',
                text: 'Unable to process the script response. Please try again.',
                imagePrompt: 'Error loading script content'
              }]
            }
          }];
        }

        setScriptData(scriptResult);

        // Update project status to completed and save script content
        if (currentProjectId || projectResult.data?.id) {
          const projectId = currentProjectId || projectResult.data!.id;
          const scriptResult = result[0]?.data || result;

          // Prepare enhanced metadata with script content
          const enhancedMetadata = {
            ...projectResult.data?.metadata,
            scriptResult: scriptResult,
            generatedAt: new Date().toISOString(),
            scriptVersion: 'youtube-v1'
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
          description: "Your script has been generated successfully.",
        });

        // Reset form
        setFormData({
          title: "",
          temporalFocus: "",
          targetAudience: "",
          contentAngle: "",
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
          title: formData.title,
          temporalFocus: formData.temporalFocus,
          targetAudience: formData.targetAudience,
          contentAngle: formData.contentAngle,
          controversyLevel: formData.controversyLevel,
          powerWords: formData.powerWords,
          duration: formData.duration,
          scriptType: 'youtube'
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
          Generate New Script
        </Button>
        <ScriptResult data={scriptData} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground text-base">
            Video Title
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter your YouTube video title"
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
            This determines which script structure to use
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-foreground text-base">
            Target Audience
          </Label>
          <Input
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="Who is this video for?"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contentAngle" className="text-foreground text-base">
            Content Angle
          </Label>
          <Textarea
            id="contentAngle"
            value={formData.contentAngle}
            onChange={(e) => setFormData({ ...formData, contentAngle: e.target.value })}
            placeholder="What's the unique angle or perspective of your video?"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-24 resize-none"
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

        <div className="space-y-2">
          <Label htmlFor="powerWords" className="text-foreground text-base">
            Power Words
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
            Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="Expected video duration in minutes"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
          />
        </div>

        {/* Credit Cost Display */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-slate-600 font-bold text-sm">💰</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                <p className="text-sm text-gray-600">Cost for YouTube script generation</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-600">40 credits</div>
              <div className="text-sm text-gray-500">Complete script package</div>
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
              Generating...
            </>
          ) : (
            <>
              <Sparkles />
              Generate Script
            </>
          )}
        </Button>

        {usageExceeded && (
          <div className="text-center text-red-600 text-sm mt-2">
            Monthly script generation limit exceeded. Please upgrade your plan.
          </div>
        )}
      </form>
    </div>
  );
};

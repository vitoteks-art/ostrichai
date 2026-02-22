import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Download, Copy, CopyCheck, Crown, AlertTriangle, Lock, Video, Search, ExternalLink, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { UsageService } from "../services/usageService";
import { useProjects } from "../hooks/useProjects";

interface ScriptSegment {
  time: string;
  text: string;
  imagePrompt: string;
  videoPrompt?: string;
}

interface ScriptOutput {
  title: string;
  script: ScriptSegment[];
}

interface ScriptResultProps {
  data: Array<{
    output: ScriptOutput;
  }>;
}

export const ScriptResult = ({ data }: ScriptResultProps) => {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatingVideos, setGeneratingVideos] = useState<Record<string, boolean>>({});
  const [videoGenerationResults, setVideoGenerationResults] = useState<Record<string, {
    taskId: string;
    recordId: string;
    status: string;
    message: string;
    resultUrl?: string;
  }>>({});
  const [checkingVideoStatus, setCheckingVideoStatus] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [imageGenerationCount, setImageGenerationCount] = useState(0);
  const [videoGenerationCount, setVideoGenerationCount] = useState(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [selectedImageModel, setSelectedImageModel] = useState<string>('google/nano-banana');

  // Debug: Log the data structure to understand the format
  useEffect(() => {
    console.log('=== ScriptResult Debug ===');
    console.log('ScriptResult received data:', data);
    console.log('Data type:', typeof data);
    console.log('Data isArray:', Array.isArray(data));

    if (data && data.length > 0) {
      console.log('First item:', data[0]);
      console.log('First item output:', data[0]?.output);

      if (data[0]?.output) {
        console.log('Script data:', data[0].output.script);
        console.log('Script type:', typeof data[0].output.script);
        console.log('Script isArray:', Array.isArray(data[0].output.script));

        if (data[0].output.script) {
          if (Array.isArray(data[0].output.script)) {
            console.log('Script is array with length:', data[0].output.script.length);
            data[0].output.script.forEach((segment, index) => {
              console.log(`Script segment[${index}]:`, {
                segment: segment,
                type: typeof segment,
                isObject: typeof segment === 'object',
                hasText: segment?.text,
                textType: typeof segment?.text
              });
            });
          } else {
            console.log('Script is not an array:', data[0].output.script);
          }
        }
      }
    }

    console.log('Video prompt exists:', !!data[0]?.output?.script?.[0]?.videoPrompt);
  }, [data]);

  const { toast } = useToast();
  const { user } = useAuth();
  const { plan } = useSubscription();
  const { createProject, updateProject, logActivity } = useProjects();

  // Load current usage stats on component mount
  useEffect(() => {
    if (user) {
      loadUsageStats();
    } else {
      setIsLoadingUsage(false);
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user) return;

    setIsLoadingUsage(true);
    try {
      // Load both image and video generation usage
      const [imageResult, videoResult] = await Promise.all([
        UsageService.getUserUsageStats(user.id, 'image_generation'),
        UsageService.getUserUsageStats(user.id, 'video_generation')
      ]);

      if (imageResult.success && imageResult.data) {
        const imageUsage = imageResult.data.featureBreakdown?.image_generation || 0;
        setImageGenerationCount(imageUsage);
      }

      if (videoResult.success && videoResult.data) {
        const videoUsage = videoResult.data.featureBreakdown?.video_generation || 0;
        setVideoGenerationCount(videoUsage);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  // Get image generation limits based on subscription
  const getImageGenerationLimit = () => {
    if (!plan) return 0;

    switch (plan.name.toLowerCase()) {
      case 'starter':
      case 'free':
        return 0; // Free users get 0 images
      case 'professional':
        return 10; // Professional gets 10 images
      case 'enterprise':
        return 20; // Enterprise gets 20 images
      default:
        return 0;
    }
  };

  const getRemainingImages = () => {
    const limit = getImageGenerationLimit();
    if (limit === 0) return 0; // Free users have 0 remaining
    return Math.max(0, limit - imageGenerationCount);
  };

  const canGenerateMoreImages = () => {
    const limit = getImageGenerationLimit();
    if (limit === 0) return false; // Free users cannot generate
    const remaining = getRemainingImages();
    return remaining > 0;
  };

  // Get video generation limits based on subscription
  const getVideoGenerationLimit = () => {
    if (!plan) return 0;

    switch (plan.name.toLowerCase()) {
      case 'starter':
      case 'free':
        return 0; // Free users get 0 videos
      case 'professional':
        return 2; // Professional gets 2 videos
      case 'enterprise':
        return 5; // Enterprise gets 5 videos
      default:
        return 0;
    }
  };

  const getRemainingVideos = () => {
    const limit = getVideoGenerationLimit();
    if (limit === 0) return 0; // Free users have 0 remaining
    return Math.max(0, limit - videoGenerationCount);
  };

  const canGenerateMoreVideos = () => {
    const limit = getVideoGenerationLimit();
    if (limit === 0) return false; // Free users cannot generate
    const remaining = getRemainingVideos();
    return remaining > 0;
  };

  const handleCopyScene = async (segment: ScriptSegment, segmentIndex: number, outputIndex: number) => {
    const key = `scene-${outputIndex}-${segmentIndex}`;
    const textToCopy = `[${segment.time}]\n${segment.text}\n\nImage Prompt: ${segment.imagePrompt}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "Scene copied to clipboard!",
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyEntireScript = async (output: ScriptOutput, outputIndex: number) => {
    const key = `script-${outputIndex}`;
    const scriptText = `${output.title}\n\n${output.script.map((segment, idx) => {
      // Ensure segment has required properties
      const safeSegment = {
        time: segment.time || `Scene ${idx + 1}`,
        text: segment.text || 'No script text available',
        imagePrompt: segment.imagePrompt || 'No image prompt available'
      };
      return `Scene ${idx + 1} [${safeSegment.time}]\n${safeSegment.text}\n\nImage Prompt: ${safeSegment.imagePrompt}`;
    }).join('\n\n---\n\n')}`;

    try {
      await navigator.clipboard.writeText(scriptText);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "Entire script copied to clipboard!",
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyAllScripts = async () => {
    const key = 'all-scripts';
    const allScriptsText = data.map((item) => {
      const output = item.output;
      return `${output.script.map((segment) => {
        // Ensure segment has required properties
        const safeSegment = {
          text: segment.text || 'No script text available'
        };
        return `${safeSegment.text}`;
      }).join('\n\n')}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(allScriptsText);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "All scripts combined and copied to clipboard!",
      });
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (prompt: string, segmentIndex: number, outputIndex: number, model: string = 'google/nano-banana') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate images.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has image generation access
    const limit = getImageGenerationLimit();
    if (limit === 0) {
      toast({
        title: "Upgrade Required",
        description: "Image generation requires a Professional or Enterprise subscription.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    if (!canGenerateMoreImages()) {
      toast({
        title: "Limit Reached",
        description: `You've reached your monthly limit of ${limit} images. Upgrade for more capacity.`,
        variant: "destructive",
      });
      return;
    }

    const key = `${outputIndex}-${segmentIndex}`;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));

    let currentProjectId = null;

    try {
      // Create project record first
      const projectTitle = `Script Image: Scene ${segmentIndex + 1}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'ad',
        status: 'processing',
        project_metadata: {
          prompt: prompt,
          segmentIndex: segmentIndex,
          outputIndex: outputIndex,
          generationType: 'script_image',
          model: model,
          submittedAt: new Date().toISOString()
        }
      });

      if (projectResult.success) {
        currentProjectId = projectResult.data?.id;
      }

      const response = await fetch("https://n8n.getostrichai.com/webhook/youtube-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          userId: user.id,
          model: model
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const result = await response.json();
      const imageUrl = Array.isArray(result) ? result[0]?.imageUrl : result.imageUrl;

      if (imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [key]: imageUrl
        }));

        // Update local count
        setImageGenerationCount(prev => prev + 1);

        // Track usage in database
        await UsageService.recordUsage(user.id, {
          featureType: 'image_generation',
          usageCount: 1
        });

        // Update project status to completed
        if (currentProjectId) {
          await updateProject(currentProjectId, {
            status: 'completed',
            project_metadata: {
              prompt: prompt,
              segmentIndex: segmentIndex,
              outputIndex: outputIndex,
              generationType: 'script_image',
              model: model,
              imageUrl: imageUrl,
              submittedAt: new Date().toISOString(),
              completedAt: new Date().toISOString()
            }
          });
        }

        // Log activity
        await logActivity({
          action: 'Script image generated',
          details: `Generated image for script scene ${segmentIndex + 1} using ${model} model with prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
          activity_metadata: {
            prompt,
            model,
            segmentIndex
          }
        });

        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Error generating image:", error);

      // Update project status to failed if it exists
      if (currentProjectId) {
        try {
          await updateProject(currentProjectId, {
            status: 'failed',
            project_metadata: {
              prompt: prompt,
              segmentIndex: segmentIndex,
              outputIndex: outputIndex,
              generationType: 'script_image',
              model: model,
              error: error instanceof Error ? error.message : 'Unknown error',
              submittedAt: new Date().toISOString()
            }
          });
        } catch (updateError) {
          console.error('Failed to update project status:', updateError);
        }
      }

      // Log error activity
      await logActivity({
        action: 'Script image generation failed',
        details: `Failed to generate image for script scene ${segmentIndex + 1} using ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        activity_metadata: {
          prompt,
          model,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateVideo = async (videoPrompt: string, segmentIndex: number, outputIndex: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate videos.",
        variant: "destructive",
      });
      return;
    }

    if (!videoPrompt) {
      toast({
        title: "Error",
        description: "No video prompt available for this segment.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has video generation access
    const limit = getVideoGenerationLimit();
    if (limit === 0) {
      toast({
        title: "Upgrade Required",
        description: "Video generation requires a Professional or Enterprise subscription.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    if (!canGenerateMoreVideos()) {
      toast({
        title: "Limit Reached",
        description: `You've reached your monthly limit of ${limit} videos. Upgrade for more capacity.`,
        variant: "destructive",
      });
      return;
    }

    const key = `video-${outputIndex}-${segmentIndex}`;
    setGeneratingVideos(prev => ({ ...prev, [key]: true }));

    let currentProjectId = null;

    try {
      console.log('Sending video generation request:', { videoPrompt });

      // Create project record first
      const projectTitle = `Script Video: Scene ${segmentIndex + 1}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'video',
        status: 'processing',
        project_metadata: {
          prompt: videoPrompt,
          segmentIndex: segmentIndex,
          outputIndex: outputIndex,
          generationType: 'script_video',
          submittedAt: new Date().toISOString()
        }
      });

      if (projectResult.success) {
        currentProjectId = projectResult.data?.id;
      }

      const response = await fetch("https://n8n.getostrichai.com/webhook/youtube-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoPrompt: videoPrompt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Video generation response:', result);

      // Handle the response format - it's an array with the actual data
      const responseArray = Array.isArray(result) ? result : [result];
      const responseData = responseArray[0];

      if (responseData && responseData.data) {
        const { taskId, recordId } = responseData.data;

        if (taskId) {
          // Update project with task ID
          if (currentProjectId) {
            await updateProject(currentProjectId, {
              project_metadata: {
                prompt: videoPrompt,
                segmentIndex: segmentIndex,
                outputIndex: outputIndex,
                generationType: 'script_video',
                taskId: taskId,
                submittedAt: new Date().toISOString()
              }
            });
          }

          // Store the generation result
          setVideoGenerationResults(prev => ({
            ...prev,
            [key]: {
              taskId,
              recordId: recordId || taskId,
              status: 'processing',
              message: 'Video generation started'
            }
          }));

          // Update local count
          setVideoGenerationCount(prev => prev + 1);

          // Track usage in database
          await UsageService.recordUsage(user.id, {
            featureType: 'video_generation',
            usageCount: 1
          });

          // Log activity
          await logActivity({
            action: 'Script video generation started',
            details: `Started generating video for script scene ${segmentIndex + 1} using prompt: "${videoPrompt.substring(0, 100)}${videoPrompt.length > 100 ? '...' : ''}" (Task ID: ${taskId})`,
            activity_metadata: {
              prompt: videoPrompt,
              taskId,
              segmentIndex
            }
          });

          toast({
            title: "Success",
            description: `Video generation started! Task ID: ${taskId}`,
          });
        } else {
          throw new Error('No task ID in response');
        }
      } else {
        console.error('Unexpected response format:', result);
        throw new Error('Invalid response format - expected array with data object');
      }

    } catch (error) {
      console.error("Error generating video:", error);

      // Update project status to failed if it exists
      if (currentProjectId) {
        try {
          await updateProject(currentProjectId, {
            status: 'failed',
            project_metadata: {
              prompt: videoPrompt,
              segmentIndex: segmentIndex,
              outputIndex: outputIndex,
              generationType: 'script_video',
              error: error instanceof Error ? error.message : 'Unknown error',
              submittedAt: new Date().toISOString()
            }
          });
        } catch (updateError) {
          console.error('Failed to update project status:', updateError);
        }
      }

      // Log error activity
      await logActivity({
        action: 'Script video generation failed',
        details: `Failed to generate video for script scene ${segmentIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        activity_metadata: {
          prompt: videoPrompt,
          error: error instanceof Error ? error.message : 'Unknown error',
          segmentIndex
        }
      });

      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingVideos(prev => ({ ...prev, [key]: false }));
    }
  };

  const checkVideoStatus = async (taskId: string, segmentIndex: number, outputIndex: number) => {
    const key = `video-${outputIndex}-${segmentIndex}`;
    setCheckingVideoStatus(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(
        `https://n8n.getostrichai.com/webhook/get-veo-results?task_id=${encodeURIComponent(taskId)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Task ID not found. Please check your task ID and try again.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server. Task may still be processing.");
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        if (jsonError instanceof SyntaxError) {
          throw new Error("Invalid response format from server. Please try again later.");
        }
        throw jsonError;
      }

      // Extract first item from array and clean URLs
      const rawResult = Array.isArray(data) ? data[0] : data;

      if (!rawResult) {
        throw new Error("No task data found. Task may still be processing.");
      }

      const videoResult = {
        taskId: rawResult.task_id || taskId,
        recordId: rawResult.recordId || rawResult.taskId || taskId,
        status: rawResult.status || 'completed',
        message: rawResult.msg || rawResult.message || 'Task completed',
        resultUrl: rawResult.result_url?.replace(/[`\s]/g, '')
      };

      // Update the stored result
      setVideoGenerationResults(prev => ({
        ...prev,
        [key]: videoResult
      }));

      // Update project status if video is completed
      if (videoResult.resultUrl) {
        // Find and update the project
        // Note: In a real implementation, you'd want to store the project ID in the videoGenerationResults state
        // For now, we'll log the activity
        await logActivity({
          action: 'Script video generation completed',
          details: `Video generation completed for script scene ${segmentIndex + 1} (Task ID: ${videoResult.taskId})`,
          activity_metadata: {
            taskId: videoResult.taskId,
            resultUrl: videoResult.resultUrl,
            segmentIndex
          }
        });

        toast({
          title: "Success",
          description: `Video ready! Status: ${videoResult.message}`,
        });
      } else {
        toast({
          title: "Info",
          description: `Status: ${videoResult.message}`,
        });
      }

    } catch (error) {
      console.error("Error checking video status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check video status.",
        variant: "destructive",
      });
    } finally {
      setCheckingVideoStatus(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDownloadVideo = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: `Downloading ${filename}...`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Usage Stats Header */}
      {user && plan && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="pt-6">
            {/* Image Model Selection */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Image Generation Model</h3>
              </div>
              <Select value={selectedImageModel} onValueChange={setSelectedImageModel}>
                <SelectTrigger className="w-full md:w-64 bg-card border-border">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nano-banana-pro">Titan - Premium Quality (6 credits)</SelectItem>
                  <SelectItem value="google/nano-banana-edit">Nexus - Medium Quality (2 credits)</SelectItem>
                  <SelectItem value="google/nano-banana">Base - Text Only (2 credits)</SelectItem>
                  <SelectItem value="z-image">Echo - Text Only (1 credit)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose the AI model for generating images from script prompts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Generation Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">Image Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.name} Plan • {getImageGenerationLimit() === 0 ? 'No access' : `${getImageGenerationLimit()} images/month`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {getImageGenerationLimit() === 0 ? 'Upgrade' : `${getRemainingImages()}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getImageGenerationLimit() === 0 ? 'required' : 'remaining'}
                    </div>
                  </div>
                </div>

                {/* Progress bar for users with limits */}
                {getImageGenerationLimit() > 0 && (
                  <div>
                    <div className="w-full bg-secondary/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (imageGenerationCount / getImageGenerationLimit()) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{imageGenerationCount} used</span>
                      <span>{getImageGenerationLimit()} limit</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Generation Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">Video Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.name} Plan • {getVideoGenerationLimit() === 0 ? 'No access' : `${getVideoGenerationLimit()} videos/month`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {getVideoGenerationLimit() === 0 ? 'Upgrade' : `${getRemainingVideos()}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getVideoGenerationLimit() === 0 ? 'required' : 'remaining'}
                    </div>
                  </div>
                </div>

                {/* Progress bar for users with limits */}
                {getVideoGenerationLimit() > 0 && (
                  <div>
                    <div className="w-full bg-secondary/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-accent to-accent/60 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (videoGenerationCount / getVideoGenerationLimit()) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{videoGenerationCount} used</span>
                      <span>{getVideoGenerationLimit()} limit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.map((item, outputIndex) => (
        <div key={outputIndex} className="space-y-6">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-sm px-4 py-1">
              Script #{outputIndex + 1}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              {item.output.title}
            </h2>
            <Button
              onClick={() => handleCopyEntireScript(item.output, outputIndex)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              {copiedItems[`script-${outputIndex}`] ? (
                <>
                  <CopyCheck className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Entire Script
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {(() => {
              console.log(`Processing script for output ${outputIndex}:`, item.output.script);

              return item.output.script.map((segment, segmentIndex) => {
                const key = `${outputIndex}-${segmentIndex}`;
                const isGenerating = generatingImages[key];
                const generatedImage = generatedImages[key];

                // Debug the raw segment
                console.log(`Raw segment ${segmentIndex}:`, segment, 'Type:', typeof segment);

                // Handle different possible data structures
                let actualSegment = segment;

                // If segment is a string, it's probably the text content
                if (typeof segment === 'string') {
                  actualSegment = {
                    time: `Scene ${segmentIndex + 1}`,
                    text: segment,
                    imagePrompt: 'No image prompt available',
                    videoPrompt: ''
                  };
                }
                // If segment is an object but text is also an object, try to extract
                else if (segment && typeof segment === 'object' && segment.text && typeof segment.text === 'object') {
                  console.log(`Nested text object found in segment ${segmentIndex}:`, segment.text);
                  actualSegment = {
                    time: segment.time || `Scene ${segmentIndex + 1}`,
                    text: (segment.text as any).text || (segment.text as any).content || JSON.stringify(segment.text),
                    imagePrompt: segment.imagePrompt || (segment.text as any).imagePrompt || 'No image prompt available',
                    videoPrompt: segment.videoPrompt || (segment.text as any).videoPrompt || ''
                  };
                }
                // If segment is an object but missing text property
                else if (segment && typeof segment === 'object' && !segment.text) {
                  console.log(`Segment ${segmentIndex} missing text property:`, segment);
                  actualSegment = {
                    time: segment.time || `Scene ${segmentIndex + 1}`,
                    text: (segment as any).content || (segment as any).description || JSON.stringify(segment),
                    imagePrompt: segment.imagePrompt || 'No image prompt available',
                    videoPrompt: segment.videoPrompt || ''
                  };
                }
                // Validate segment structure
                else if (!segment || typeof segment !== 'object') {
                  console.warn(`Invalid script segment at index ${segmentIndex}:`, segment);
                  actualSegment = {
                    time: `Scene ${segmentIndex + 1}`,
                    text: 'Invalid script segment data. Please regenerate the script.',
                    imagePrompt: 'No image prompt available',
                    videoPrompt: ''
                  };
                } else {
                  actualSegment = segment;
                }

                // Final fallback to ensure we have a text property
                if (!actualSegment.text || actualSegment.text === '[object Object]') {
                  console.log(`Final fallback for segment ${segmentIndex}:`, actualSegment);
                  actualSegment.text = 'No script text available or data corrupted. Please try regenerating the script.';
                }

                console.log(`Final segment ${segmentIndex}:`, {
                  time: actualSegment.time,
                  text: actualSegment.text,
                  textType: typeof actualSegment.text,
                  textLength: actualSegment.text?.length
                });

                return (
                  <Card
                    key={segmentIndex}
                    className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-3 text-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {actualSegment.time}
                          </Badge>
                          <span className="text-foreground/80">Scene {segmentIndex + 1}</span>
                        </div>
                        <Button
                          onClick={() => handleCopyScene(actualSegment, segmentIndex, outputIndex)}
                          variant="ghost"
                          size="sm"
                        >
                          {copiedItems[`scene-${outputIndex}-${segmentIndex}`] ? (
                            <CopyCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Script Text</h4>
                        <p className="text-foreground leading-relaxed">{actualSegment.text}</p>
                      </div>

                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                        {/* Image Prompt Section */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Image Prompt
                          </h4>
                          <p className="text-sm text-foreground/80 italic leading-relaxed">
                            {actualSegment.imagePrompt}
                          </p>
                        </div>

                        {/* Video Prompt Section */}
                        {actualSegment.videoPrompt && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Video Prompt
                            </h4>
                            <p className="text-sm text-foreground/80 italic leading-relaxed">
                              {actualSegment.videoPrompt}
                            </p>
                          </div>
                        )}

                        {/* Video Generation Results Section */}
                        {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`] && (
                          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold text-primary flex items-center gap-2">
                                  <Video className="w-4 h-4" />
                                  Video Generation Status
                                </h5>
                                <Badge
                                  variant={
                                    videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.status === 'completed'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.status || 'processing'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">Task ID:</span>
                                  <p className="font-mono text-xs break-all mt-1">
                                    {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.taskId}
                                  </p>
                                </div>
                                {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.message && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Status:</span>
                                    <p className="text-xs mt-1">
                                      {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.message}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => checkVideoStatus(
                                    videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.taskId || '',
                                    segmentIndex,
                                    outputIndex
                                  )}
                                  disabled={checkingVideoStatus[`video-${outputIndex}-${segmentIndex}`]}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  {checkingVideoStatus[`video-${outputIndex}-${segmentIndex}`] ? (
                                    <>
                                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <Search className="w-4 h-4 mr-2" />
                                      Check Status
                                    </>
                                  )}
                                </Button>

                                {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.resultUrl && (
                                  <>
                                    <Button
                                      onClick={() => window.open(
                                        videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.resultUrl,
                                        '_blank'
                                      )}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDownloadVideo(
                                        videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.resultUrl || '',
                                        `video-${outputIndex}-${segmentIndex}.mp4`
                                      )}
                                      size="sm"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>

                              {videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.resultUrl && (
                                <div className="mt-3">
                                  <video
                                    controls
                                    className="w-full rounded-md border border-border max-h-48"
                                    src={videoGenerationResults[`video-${outputIndex}-${segmentIndex}`]?.resultUrl}
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {generatedImage && (
                          <div className="mt-3">
                            <img
                              src={generatedImage}
                              alt={`Generated for ${actualSegment.time}`}
                              className="w-full rounded-md border border-border"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {/* Generate Video Button */}
                          {actualSegment.videoPrompt && (
                            <>
                              {getVideoGenerationLimit() === 0 ? (
                                // Free users - show upgrade prompt
                                <div className="w-full p-3 bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-lg">
                                  <div className="flex items-center gap-2 text-accent">
                                    <Lock className="w-4 h-4" />
                                    <span className="text-sm font-medium">Upgrade to Generate Videos</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Professional: 2 videos/month • Enterprise: 5 videos/month
                                  </p>
                                </div>
                              ) : (
                                // Paid users - show generate button
                                <Button
                                  onClick={() => handleGenerateVideo(actualSegment.videoPrompt!, segmentIndex, outputIndex)}
                                  disabled={generatingVideos[`video-${outputIndex}-${segmentIndex}`] || !canGenerateMoreVideos()}
                                  size="sm"
                                  variant={canGenerateMoreVideos() ? "outline" : "secondary"}
                                  className="flex-1"
                                >
                                  {generatingVideos[`video-${outputIndex}-${segmentIndex}`] ? (
                                    <>
                                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                      Generating Video...
                                    </>
                                  ) : !canGenerateMoreVideos() ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Limit Reached
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Generate Video
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}

                          {getImageGenerationLimit() === 0 ? (
                            // Free users - show upgrade prompt
                            <div className="w-full p-3 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg">
                              <div className="flex items-center gap-2 text-primary">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-medium">Upgrade to Generate Images</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Professional: 10 images/month • Enterprise: 20 images/month
                              </p>
                            </div>
                          ) : (
                            // Paid users - show generate button
                            <>
                              <Button
                                onClick={() => handleGenerateImage(actualSegment.imagePrompt, segmentIndex, outputIndex, selectedImageModel)}
                                disabled={isGenerating || !canGenerateMoreImages() || isLoadingUsage}
                                size="sm"
                                variant={canGenerateMoreImages() ? "gradient" : "secondary"}
                                className="flex-1"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                    Generating...
                                  </>
                                ) : !canGenerateMoreImages() ? (
                                  <>
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Limit Reached
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Image
                                  </>
                                )}
                              </Button>

                              {generatedImage && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <a href={generatedImage} download={`scene-${segmentIndex + 1}.png`}>
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Show remaining count for paid users */}
                        {getImageGenerationLimit() > 0 && (
                          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
                            {getRemainingImages()} images remaining this month
                          </div>
                        )}

                        {/* Show remaining video count for paid users */}
                        {getVideoGenerationLimit() > 0 && (
                          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
                            {getRemainingVideos()} videos remaining this month
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        </div>
      ))}

      {/* Combined Scripts Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="text-center space-y-4 mb-8">
          <Badge variant="outline" className="text-sm px-4 py-1 bg-primary/10 text-primary border-primary/20">
            Complete Script Collection
          </Badge>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            All Scripts Combined
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Here's all your generated scripts combined into one comprehensive document
          </p>
          <Button
            onClick={handleCopyAllScripts}
            variant="gradient"
            size="lg"
            className="mt-4"
          >
            {copiedItems['all-scripts'] ? (
              <>
                <CopyCheck className="w-5 h-5 mr-2" />
                All Scripts Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                Copy All Scripts Combined
              </>
            )}
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Complete Script Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.map((item, outputIndex) =>
                item.output.script.map((segment, segmentIndex) => {
                  // Handle different possible data structures for the combined view
                  let segmentText = 'No script text available';

                  if (typeof segment === 'string') {
                    segmentText = segment;
                  } else if (segment && typeof segment === 'object') {
                    if (segment.text && typeof segment.text === 'object') {
                      segmentText = (segment.text as any).text || (segment.text as any).content || JSON.stringify(segment.text);
                    } else if (segment.text) {
                      segmentText = segment.text;
                    } else if ((segment as any).content) {
                      segmentText = (segment as any).content;
                    } else if ((segment as any).description) {
                      segmentText = (segment as any).description;
                    } else {
                      segmentText = JSON.stringify(segment);
                    }
                  }

                  return (
                    <div key={`${outputIndex}-${segmentIndex}`} className="p-3 bg-muted/20 rounded-lg border border-border/30">
                      <p className="text-foreground leading-relaxed">{segmentText}</p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

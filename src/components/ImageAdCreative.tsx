import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BatchResultDisplay from "@/components/BatchResultDisplay";
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle,
  FileImage,
  Hash
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { SubscriptionService } from "../services/subscriptionService";
import { uploadToCloudinary } from "../services/cloudinaryService";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export const ImageAdCreative = () => {
  const { user } = useAuth();
  const { createProject, updateProject, updateProjectWithWebhookData, logActivity, logProductCreation, logProductCompletion, logProductError, isDemo } = useProjects();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState("");
  const [sceneCount, setSceneCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [usageExceeded, setUsageExceeded] = useState(false);

  useEffect(() => {
    checkUsageLimits();
  }, [user]);

  const checkUsageLimits = async () => {
    if (!user) {
      setUsageExceeded(false);
      return;
    }

    try {
      const canUseFeature = await SubscriptionService.checkUsageLimit(user.id, 'ad');
      setUsageExceeded(!canUseFeature.withinLimit);
    } catch (error) {
      console.error('Error checking usage limits:', error);
      setUsageExceeded(false);
    }
  };

  const refreshUsageLimits = () => {
    checkUsageLimits();
  };


  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
  const MAX_DESCRIPTION_LENGTH = 1000;
  const MIN_SCENES = 1;
  const MAX_SCENES = 10;
  const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif'];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Please upload only JPEG, PNG, or GIF images.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must not exceed 7MB.';
    }
    return null;
  };

  // Helper to convert File to data URL (CSP-compliant)
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const id = Math.random().toString(36).substr(2, 9);
      try {
        const preview = await fileToDataURL(file);
        newImages.push({ file, preview, id });
      } catch (err) {
        console.error('Error converting file to data URL:', err);
        errors.push(`${file.name}: Failed to load preview`);
      }
    }

    if (errors.length > 0) {
      toast.error(`Upload errors:\n${errors.join('\n')}`);
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded successfully!`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('Image removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    if (sceneCount < MIN_SCENES || sceneCount > MAX_SCENES) {
      toast.error(`Scene count must be between ${MIN_SCENES} and ${MAX_SCENES}`);
      return;
    }

    if (!user) {
      toast.error("Please log in to create image creatives");
      return;
    }

    // Check usage limits before allowing submission
    const canUseAdCreation = await SubscriptionService.canAccessFeature(user.id, 'adCreation');
    if (!canUseAdCreation) {
      toast.error("Ad creation feature is not available in your current plan");
      return;
    }

    const canUseFeature = await SubscriptionService.checkUsageLimit(user.id, 'ad');
    if (!canUseFeature.withinLimit) {
      toast.error(`You've reached your monthly limit of ${canUseFeature.limit} ad creations. Current usage: ${canUseFeature.currentUsage}`);
      return;
    }

    setIsLoading(true);
    setSubmissionResult(null);

    try {
      // Create project record first
      const projectTitle = `Image Creative: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'ad',
        status: 'processing',
        project_metadata: {
          description: description.trim(),
          sceneCount,
          imageCount: images.length,
          submittedAt: new Date().toISOString(),
          creativeType: 'image_ad'
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      // Log activity for starting image creative generation
      await logProductCreation('image_creative', projectTitle, {
        description: description.trim(),
        sceneCount,
        imageCount: images.length,
        creativeType: 'image_ad'
      });

      // Upload images to Cloudinary first
      const imageUrls: string[] = [];
      if (images.length > 0) {
        for (const img of images) {
          try {
            const url = await uploadToCloudinary(img.file);
            imageUrls.push(url);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            throw new Error(`Failed to upload image ${img.file.name} to Cloudinary`);
          }
        }
      }

      // Build JSON payload with Cloudinary URLs
      const payload = {
        description: description.trim(),
        sceneCount,
        imageUrls,
        imageCount: imageUrls.length
      };

      const response = await fetch('https://n8n.getostrichai.com/webhook-test/image-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 404) {
          throw new Error('Webhook endpoint not registered. Please activate the n8n workflow first.');
        } else if (response.status === 413) {
          throw new Error('File size too large. Please reduce image sizes.');
        } else if (response.status === 400) {
          throw new Error('Invalid request format.');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again later.');
        }

        throw new Error(errorData?.message || `Request failed with status ${response.status}`);
      }

      const result = await response.json();

      // Transform result to match expected format
      const finalResults = Array.isArray(result) ? result.map((item, index) => ({
        id: item.id,
        scene_number: item.scene_number,
        title: item.title,
        image_prompt: item.image_prompt,
        video_prompt: item.video_prompt,
        voice_over: item.voice_over,
        image_url: item.image_url,
        video_status: item.video_status,
        task_id: item.task_id
      })) : [{
        id: result.id,
        scene_number: result.scene_number,
        title: result.title,
        image_prompt: result.image_prompt,
        video_prompt: result.video_prompt,
        voice_over: result.voice_over,
        image_url: result.image_url,
        video_status: result.video_status,
        task_id: result.task_id
      }];

      // Update project status to completed and store final results
      if (currentProjectId || projectResult.data?.id) {
        await updateProject(currentProjectId || projectResult.data!.id, {
          status: 'completed',
          project_metadata: {
            description: description.trim(),
            sceneCount,
            imageCount: images.length,
            submittedAt: new Date().toISOString(),
            creativeType: 'image_ad',
            results: finalResults
          }
        });
      }

      // Log successful completion
      await logProductCompletion('image_creative', projectTitle, currentProjectId || projectResult.data?.id);

      // Track usage for ad creation (dynamic - happens when user actually uses feature)
      console.log('📊 Tracking ad creation usage for user:', user.id);
      await SubscriptionService.trackUsage(user.id, 'ad', 1);

      // Transform result to match BatchResultDisplay format
      const transformedResults = Array.isArray(result) ? result.map((item, index) => ({
        id: item.id,
        scene_number: item.scene_number,
        title: item.title,
        image_prompt: item.image_prompt,
        video_prompt: item.video_prompt,
        voice_over: item.voice_over,
        image_url: item.image_url,
        video_status: item.video_status,
        nano_image_url: item.nano_image_url,
        task_id: item.task_id,
        taskId: item.taskId || item.task_id || `task-${Date.now()}-${index}`,
        imageUrl: item.image_url || item.imageUrl || item.data?.resultJson || item.resultJson || item.url,
        success: item.image_url ? true : (item.success !== false && item.code !== 1),
        state: item.image_url ? 'success' : (item.state || item.data?.state || (item.success !== false ? 'success' : 'fail')),
        model: item.model || item.data?.model || 'image-generator',
        costTime: item.costTime || item.data?.costTime || 0,
        completeTime: item.completeTime || item.data?.completeTime || Date.now(),
        createTime: item.createTime || item.data?.createTime || Date.now(),
        data: item.data || item
      })) : [{
        id: result.id,
        scene_number: result.scene_number,
        title: result.title,
        image_prompt: result.image_prompt,
        video_prompt: result.video_prompt,
        voice_over: result.voice_over,
        image_url: result.image_url,
        video_status: result.video_status,
        nano_image_url: result.nano_image_url,
        task_id: result.task_id,
        taskId: result.taskId || result.task_id || `task-${Date.now()}`,
        imageUrl: result.image_url || result.imageUrl || result.data?.resultJson || result.resultJson || result.url,
        success: result.image_url ? true : (result.success !== false && result.code !== 1),
        state: result.image_url ? 'success' : (result.state || result.data?.state || (result.success !== false ? 'success' : 'fail')),
        model: result.model || result.data?.model || 'image-generator',
        costTime: result.costTime || result.data?.costTime || 0,
        completeTime: result.completeTime || result.data?.completeTime || Date.now(),
        createTime: result.createTime || result.data?.createTime || Date.now(),
        data: result.data || result
      }];

      setSubmissionResult(transformedResults);
      setIsSubmitted(true);
      toast.success('Creative submitted successfully!');

    } catch (error) {
      let errorMessage = 'Failed to submit creative';

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not registered')) {
          errorMessage = 'Webhook endpoint not available. Please ensure the n8n workflow is active and the webhook is registered.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('413')) {
          errorMessage = 'File size too large. Please reduce image sizes and try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request format. Please check your inputs and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      // Update project status to failed if it exists
      if (currentProjectId) {
        try {
          await updateProject(currentProjectId, {
            status: 'failed'
          });
        } catch (updateError) {
          console.error('Failed to update project status:', updateError);
        }
      }

      // Log error activity
      if (user) {
        await logProductError('image_creative', errorMessage, currentProjectId, {
          description: description.trim(),
          sceneCount,
          imageCount: images.length,
          creativeType: 'image_ad'
        });
      }

      toast.error(errorMessage);
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCreative = () => {
    setImages([]);
    setDescription('');
    setSceneCount(1);
    setIsSubmitted(false);
    setSubmissionResult(null);
    toast.success('Ready for new creative');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isSubmitted && submissionResult) {
    return (
      <div className="space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Creative Submitted Successfully!</h1>
            <p className="text-lg text-gray-600">Your image ad creative has been processed</p>
          </div>

          {/* Result Display */}
          <div className="space-y-6">
            <BatchResultDisplay results={submissionResult} />

            <Card className="p-6">
              <Button
                onClick={handleNewCreative}
                size="lg"
                className="w-full font-semibold py-4"
              >
                Create New Creative
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <ImageIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Image Ad Creative Studio</h1>
          <p className="text-lg text-gray-600">Create professional advertising content with AI assistance</p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FileImage className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Upload Images</h2>
                <Badge variant="secondary">Required</Badge>
              </div>

              <p className="text-gray-600">
                Upload your ad images (JPEG, PNG, GIF). Maximum file size: 7MB per image.
              </p>

              {/* Drag and Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                  ${isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragOver ? 'Drop images here' : 'Drag & drop images here'}
                    </p>
                    <p className="text-gray-500">or click to browse files</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                    <span>JPEG</span>
                    <span>•</span>
                    <span>PNG</span>
                    <span>•</span>
                    <span>GIF</span>
                    <span>•</span>
                    <span>Max 7MB</span>
                  </div>
                </div>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Uploaded Images ({images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={img.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="mt-2 text-xs text-gray-500 truncate">
                          <div>{img.file.name}</div>
                          <div>{formatFileSize(img.file.size)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Description Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Hash className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Creative Description</h2>
                <Badge variant="outline">Required</Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Describe your creative concept or provide specific prompts
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a detailed description of your ad creative concept, target audience, key messages, style preferences, and any specific requirements..."
                  className="min-h-32 text-base"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Provide clear, detailed instructions for best results</span>
                  <span>{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Scene Count Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <ImageIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Scene Configuration</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sceneCount" className="text-base font-medium">
                  Number of Scenes
                </Label>
                <Input
                  id="sceneCount"
                  type="number"
                  value={sceneCount}
                  onChange={(e) => setSceneCount(parseInt(e.target.value) || 1)}
                  min={MIN_SCENES}
                  max={MAX_SCENES}
                  className="w-32 text-base"
                />
                <p className="text-sm text-gray-500">
                  Choose between {MIN_SCENES} and {MAX_SCENES} scenes for your creative
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Card className="p-8">
            <div className="text-center space-y-4">
              <Button
                type="submit"
                disabled={isLoading || images.length === 0 || !description.trim() || usageExceeded}
                size="lg"
                className="w-full max-w-md font-semibold py-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Creative...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Creative
                  </>
                )}
              </Button>

              {(images.length === 0 || !description.trim()) && (
                <div className="flex items-center justify-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Please upload images and provide a description
                </div>
              )}
              {usageExceeded && (
                <div className="flex items-center justify-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Monthly usage limit exceeded. Please upgrade your plan.
                </div>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

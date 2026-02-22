import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageUpload } from "./ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, Download, Search, ExternalLink, Video, AlertCircle, CheckCircle, Clock, Copy, Youtube } from "lucide-react";
import { uploadToImgbb } from "../services/imgbbService";
import { YoutubeUploadModal } from "./YoutubeUploadModal";

import { createVideoTask, getTaskInfo, parseResultJson } from "../services/kieService";
import { toast } from "sonner";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../contexts/AuthContext";

interface TaskResult {
  task_id: string;
  status: string;
  message: string;
  created_at: string;
  result_url?: string;
  original_video_url?: string;
}

export const VideoGenForm = () => {
  const { user } = useAuth();
  const { createProject, updateProject, updateProjectWithWebhookData, logActivity, isDemo } = useProjects();

  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // YouTube Upload Modal State
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);

  // Get imgbbKey from environment
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || '';

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="h-5 w-5 text-yellow-500" />;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('complete')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (statusLower.includes('error') || statusLower.includes('fail')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('error') || statusLower.includes('fail')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const checkResult = async () => {
    if (!taskId.trim()) {
      toast.error("Please enter a Task ID");
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

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
      const taskResult: TaskResult = {
        task_id: rawResult.task_id || taskId,
        status: rawResult.status || 'completed',
        message: rawResult.msg || rawResult.message || 'Task completed',
        created_at: rawResult.created_at || new Date().toISOString(),
        result_url: rawResult.result_url?.replace(/[`\s]/g, ''),
        original_video_url: rawResult.origin_url?.replace(/[`\s]/g, '')
      };

      setResult(taskResult);

      // Update project and log activity if user is authenticated
      if (user) {
        const isCompleted = taskResult.result_url && taskResult.status.toLowerCase().includes('success');
        const projectStatus = isCompleted ? 'completed' :
          taskResult.status.toLowerCase().includes('error') || taskResult.status.toLowerCase().includes('fail') ? 'failed' : 'processing';

        // Try to find and update the project with webhook data
        if (currentProjectId) {
          // Convert the task result to webhook format for consistent processing
          const webhookData = [{
            extractedUrl: taskResult.result_url || '',
            success: isCompleted,
            debugInfo: {
              inputCount: 1,
              method1_structure: 'object',
              isDirect: true,
              extractionMethod: 'video_generation'
            },
            rawInput: {
              code: isCompleted ? 200 : (projectStatus === 'failed' ? 500 : 202),
              msg: taskResult.message,
              data: {
                taskId: taskResult.task_id,
                model: 'video-generation',
                state: taskResult.status,
                resultJson: JSON.stringify({
                  resultUrls: taskResult.result_url ? [taskResult.result_url] : [],
                  originalVideoUrl: taskResult.original_video_url
                }),
                completeTime: isCompleted ? Date.now() : null,
                createTime: new Date(taskResult.created_at).getTime()
              }
            }
          }];

          const originalMetadata = {
            description: description,
            taskId: taskResult.task_id,
            submittedAt: new Date(taskResult.created_at).toISOString()
          };

          await updateProjectWithWebhookData(currentProjectId, webhookData, originalMetadata);
        }

        // Log activity
        const activityAction = isCompleted ? 'Video generation completed' :
          projectStatus === 'failed' ? 'Video generation failed' : 'Checked video generation status';
        const activityDetails = isCompleted ?
          `Video generation completed successfully (Task ID: ${taskResult.task_id})` :
          `Video generation status: ${taskResult.message} (Task ID: ${taskResult.task_id})`;

        await logActivity({
          action: activityAction,
          details: activityDetails,
          activity_metadata: {
            taskId: taskResult.task_id,
            status: taskResult.status,
            projectStatus
          }
        });
      }

      if (taskResult.result_url) {
        const message = isDemo
          ? `Video ready (demo mode)! Status: ${taskResult.message}`
          : `Video ready! Status: ${taskResult.message}`;
        toast.success(message);
      } else {
        toast.error(`Status: ${taskResult.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to check result";
      setError(errorMessage);

      // Log error activity
      if (user) {
        await logActivity({
          action: 'Failed to check video status',
          details: `Failed to check video generation status for Task ID: ${taskId}. Error: ${errorMessage}`
        });
      }

      toast.error(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image || !description.trim()) {
      toast.error("Please upload an image and add a description");
      return;
    }

    if (!user) {
      toast.error("Please log in to generate videos");
      return;
    }

    setIsLoading(true);

    try {
      // Create project record first
      const projectTitle = `Video: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
      const projectResult = await createProject({
        title: projectTitle,
        type: 'video',
        status: 'processing',
        project_metadata: {
          description: description,
          originalImageName: image.name,
          imageSize: image.size,
          submittedAt: new Date().toISOString()
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      setCurrentProjectId(projectResult.data?.id || null);

      const formData = new FormData();
      formData.append("image", image);
      formData.append("description", description);
      formData.append("userId", user.id);



      const response = await fetch("https://n8n.getostrichai.com/webhook/video-gen", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Auto-populate taskId from response
        let receivedTaskId = '';
        if (data.taskId || data.task_id || data.id) {
          receivedTaskId = data.taskId || data.task_id || data.id;
          setTaskId(receivedTaskId);

          // Update project with task ID
          if (currentProjectId || projectResult.data?.id) {
            await updateProject(currentProjectId || projectResult.data!.id, {
              project_metadata: {
                description: description,
                originalImageName: image.name,
                imageSize: image.size,
                submittedAt: new Date().toISOString(),
                taskId: receivedTaskId
              }
            });
          }
        }

        // Log activity
        await logActivity({
          action: 'Started video generation',
          details: `Started generating video with description: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"${receivedTaskId ? ` (Task ID: ${receivedTaskId})` : ''}`,
          activity_metadata: {
            description: description,
            taskId: receivedTaskId
          }
        });

        const message = isDemo
          ? "Video generation started (demo mode)! Task ID has been set automatically."
          : "Video generation started! Task ID has been set automatically.";
        toast.success(message);
        setIsSubmitted(true);
        // Reset form
        setImage(null);
        setDescription("");
      } else {
        // Update project status to failed
        if (currentProjectId || projectResult.data?.id) {
          await updateProject(currentProjectId || projectResult.data!.id, {
            status: 'failed'
          });
        }
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      console.error("Error:", error);

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
        await logActivity({
          action: 'Video generation failed',
          details: `Failed to start video generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          activity_metadata: {
            description: description,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }

      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownload = async (url: string, filename: string) => {
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

      toast.success(`Downloading ${filename}...`);
    } catch (err) {
      toast.error("Failed to download the video. Please try again.");
    }
  };

  const handleNewVideo = () => {
    setImage(null);
    setDescription("");
    setIsSubmitted(false);
    setTaskId("");
    setCurrentProjectId(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <Card className="max-w-4xl mx-auto backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="space-y-3">
              <Label htmlFor="image-upload" className="text-lg font-semibold text-card-foreground">
                Upload Image
              </Label>
              <ImageUpload onImageSelect={setImage} selectedImage={image} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-lg font-semibold text-card-foreground">
                Video Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the video you want to generate... (e.g., 'A peaceful sunset with gentle waves crashing on the shore')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={isLoading || !image || !description.trim()}
              className="w-full font-semibold py-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Generate Video
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="p-10 space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-semibold text-green-800">Video Generation Started!</h3>
                <p className="text-green-700 mt-2">Your video is being generated. You can check the status using the Task ID below.</p>
              </div>
            </div>

            <div className="space-y-4">
              {taskId && (
                <div className="space-y-2">
                  <Label className="text-base font-medium text-card-foreground">
                    Your Task ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={taskId}
                      readOnly
                      className="font-mono bg-gray-50"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(taskId);
                        toast.success("Task ID copied to clipboard!");
                      }}
                      variant="outline"
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save this Task ID to check your video status later
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="taskIdInput" className="text-base font-medium text-card-foreground">
                  Check Status (Enter Task ID)
                </Label>
                <Input
                  id="taskIdInput"
                  placeholder="Enter Task ID to check status"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  disabled={isChecking}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={checkResult}
                  variant="gradient"
                  size="lg"
                  disabled={isChecking || !taskId.trim()}
                  className="flex-1 font-semibold py-3"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Result
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleNewVideo}
                  variant="outline"
                  size="lg"
                  className="font-semibold py-3"
                >
                  Generate New Video
                </Button>
              </div>

              <div className="text-center">
                <Link to="/task-status">
                  <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Go to Task Status Page
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced Result Display Section */}
      {result && (
        <Card className="max-w-4xl mx-auto backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl">
          <div className="p-10 space-y-6">
            {/* Task Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Task Information</h3>
                <Badge className={`${getStatusColor(result.status)} border`}>
                  {getStatusIcon(result.status)}
                  <span className="ml-2">{result.status}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Task ID:</span>
                  <p className="font-mono text-gray-900 break-all">{result.task_id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p className="text-gray-900">{formatDate(result.created_at)}</p>
                </div>
              </div>

              {result.message && (
                <div>
                  <span className="font-medium text-gray-600">Message:</span>
                  <p className="text-gray-900 mt-1">{result.message}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Video Section */}
            {result.result_url && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Generated Video
                </h4>

                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-auto"
                    src={result.result_url}
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleDownload(result.result_url!, `generated-video-${result.task_id}.mp4`)}
                    className="flex-1"
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedVideoForYoutube({
                        url: result.result_url!,
                        title: `Video: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
                      });
                      setYoutubeModalOpen(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    variant="default"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Upload to YouTube
                  </Button>

                  <Button
                    onClick={() => window.open(result.result_url, '_blank')}
                    className="flex-1"
                    variant="outline"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in New Tab
                  </Button>
                </div>
              </div>
            )}

            {/* Original Video Section */}
            {result.original_video_url && (
              <div className="space-y-4">
                <Separator />
                <h4 className="text-lg font-semibold flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Original Video
                </h4>

                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-auto"
                    src={result.original_video_url}
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleDownload(result.original_video_url!, `original-video-${result.task_id}.mp4`)}
                    className="flex-1"
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>

                  <Button
                    onClick={() => window.open(result.original_video_url, '_blank')}
                    className="flex-1"
                    variant="outline"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in New Tab
                  </Button>
                </div>
              </div>
            )}

            {/* Generate New Video Button */}
            <div className="pt-4">
              <Button
                onClick={handleNewVideo}
                variant="outline"
                size="lg"
                className="w-full font-semibold py-4"
              >
                Generate New Video
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="max-w-4xl mx-auto backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl">
          <div className="p-10 space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-destructive">Video Generation Failed</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>

            <Button
              onClick={handleNewVideo}
              variant="gradient"
              size="lg"
              className="w-full font-semibold py-4"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* YouTube Upload Modal */}
      {selectedVideoForYoutube && (
        <YoutubeUploadModal
          open={youtubeModalOpen}
          onClose={() => {
            setYoutubeModalOpen(false);
            setSelectedVideoForYoutube(null);
          }}
          videoUrl={selectedVideoForYoutube.url}
          defaultTitle={selectedVideoForYoutube.title}
          imgbbKey={imgbbKey}
        />
      )}
    </div>
  );
};

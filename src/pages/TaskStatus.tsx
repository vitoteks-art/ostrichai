import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, ExternalLink, Play, AlertCircle, CheckCircle, Clock, Video, ArrowLeft, Youtube } from "lucide-react";
import { YoutubeUploadModal } from "@/components/YoutubeUploadModal";
import { Link } from "react-router-dom";

interface TaskResult {
  task_id: string;
  status: string;
  message: string;
  created_at: string;
  result_url?: string;
  original_video_url?: string;
}

const TaskStatus = () => {
  const [taskId, setTaskId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // YouTube Upload Modal State
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || '';

  const validateTaskId = (id: string): boolean => {
    // Basic validation for task ID format
    const taskIdPattern = /^[a-zA-Z0-9_-]+$/;
    return id.length >= 3 && id.length <= 50 && taskIdPattern.test(id);
  };

  const handleCheckStatus = async () => {
    if (!taskId.trim()) {
      setError("Please enter a task ID");
      return;
    }

    if (!validateTaskId(taskId.trim())) {
      setError("Invalid task ID format. Please use only letters, numbers, hyphens, and underscores.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://n8n.getostrichai.com/webhook/get-veo-results?task_id=${encodeURIComponent(taskId.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
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

      if (!data) {
        throw new Error("No task data found. Task may still be processing.");
      }

      console.log('Webhook response data:', data);

      // Extract first item from array and clean URLs
      const rawResult = Array.isArray(data) ? data[0] : data;

      if (!rawResult) {
        throw new Error("No task data found. Task may still be processing.");
      }
      const taskResult: TaskResult = {
        task_id: rawResult.task_id,
        status: rawResult.status || 'completed',
        message: rawResult.msg || rawResult.message || 'Task completed',
        created_at: rawResult.created_at || new Date().toISOString(),
        result_url: rawResult.result_url?.replace(/[`\s]/g, ''),
        original_video_url: rawResult.origin_url?.replace(/[`\s]/g, '')
      };
      console.log('Processed task result:', taskResult);

      setResult(taskResult);
      toast({
        title: "Status Retrieved",
        description: "Task status has been successfully retrieved.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to retrieve task status. Please check your connection and try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-secondary opacity-50" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Generator
          </Link>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-card/90 backdrop-blur-sm rounded-2xl shadow-elegant">
              <Search className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Task Status Verification
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Enter your task ID to check the status of your video generation and access your results.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 bg-card/90 backdrop-blur-sm border-0 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Check Task Status
            </CardTitle>
            <CardDescription>
              Enter your task ID to retrieve the current status and results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskId">Task ID</Label>
              <Input
                id="taskId"
                placeholder="Enter your task ID (e.g., veo_task_abcdef123456)"
                value={taskId}
                onChange={(e) => {
                  setTaskId(e.target.value);
                  if (error) setError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckStatus();
                  }
                }}
                className="text-base"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCheckStatus}
              disabled={loading || !taskId.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Checking Status...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-card/90 backdrop-blur-sm border-0 shadow-elegant">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !loading && (
          <Card className="bg-card/90 backdrop-blur-sm border-0 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                Task Results
              </CardTitle>
              <CardDescription>
                Detailed information about your video generation task.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Task ID</Label>
                  <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{result.task_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm mt-1">{formatDate(result.created_at)}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Message</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{result.message}</p>
              </div>

              <Separator />

              {/* Video Section */}
              {result.result_url && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    <Label className="text-base font-medium">Generated Video</Label>
                  </div>

                  {/* Video Player */}
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-auto max-h-96"
                      poster="/placeholder.svg"
                    >
                      <source src={result.result_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Video Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownload(result.result_url!, `video_${result.task_id}.mp4`)}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Video
                    </Button>

                    {result.original_video_url && (
                      <Button
                        onClick={() => window.open(result.original_video_url, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        setSelectedVideoForYoutube({ url: result.result_url!, title: `Video: ${result.task_id}` });
                        setYoutubeModalOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg transition-all"
                    >
                      <Youtube className="h-4 w-4 mr-2" />
                      Upload to YouTube
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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

export default TaskStatus;

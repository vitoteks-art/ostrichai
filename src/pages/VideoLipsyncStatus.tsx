import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, ExternalLink, AlertCircle, CheckCircle, Clock, Video, ArrowLeft, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { YoutubeUploadModal } from "../components/YoutubeUploadModal";
import { toast } from "sonner";
import { getTaskInfo, parseResultJson } from "../services/kieService";
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

const VideoLipsyncStatus = () => {
    const { user } = useAuth();
    const { projects, updateProject, logActivity } = useProjects();

    const [taskId, setTaskId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TaskResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // YouTube Upload Modal State
    const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
    const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);
    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || '';

    const handleCheckStatus = async () => {
        if (!taskId.trim()) {
            setError("Please enter a task ID");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiKey = import.meta.env.VITE_KIE_API_KEY || "";
            if (!apiKey) {
                throw new Error("Kie AI API Key is missing. Please configure VITE_KIE_API_KEY.");
            }

            const data = await getTaskInfo(apiKey, taskId.trim());

            if (data.code !== 200) {
                throw new Error(data.message || "Failed to fetch task info");
            }

            const resultUrl = parseResultJson(data.data.resultJson);

            const taskResult: TaskResult = {
                task_id: data.data.taskId,
                status: data.data.state,
                message: data.data.failMsg || (data.data.state === 'success' ? 'Completed successfully' : 'Processing...'),
                created_at: new Date().toISOString(),
                result_url: resultUrl || undefined,
            };

            setResult(taskResult);
            toast.success("Status Retrieved");

            // Integrate with User Projects and Activities
            if (user) {
                // 1. Log Activity
                await logActivity({
                    action: 'Checked Lipsync Status',
                    details: `Checked status for Task ID: ${taskId}. Status: ${taskResult.status}`,
                    activity_metadata: {
                        taskId,
                        status: taskResult.status,
                        result_url: taskResult.result_url
                    }
                });

                // 2. Find and Update Project
                const project = projects.find(p => (p.project_metadata?.taskId || p.metadata?.taskId) === taskId);

                if (project) {
                    const isCompleted = taskResult.status.toLowerCase().includes('success');
                    const isFailed = taskResult.status.toLowerCase().includes('error') || taskResult.status.toLowerCase().includes('fail');

                    let newStatus: 'processing' | 'completed' | 'failed' = 'processing';
                    if (isCompleted) newStatus = 'completed';
                    if (isFailed) newStatus = 'failed';

                    // Only update if status changed or result URL is new
                    if (project.status !== newStatus || (isCompleted && !(project.project_metadata?.resultUrl || project.metadata?.resultUrl))) {
                        await updateProject(project.id, {
                            status: newStatus,
                            project_metadata: {
                                ...(project.project_metadata || project.metadata),
                                resultUrl: taskResult.result_url,
                                lastChecked: new Date().toISOString()
                            }
                        });
                        toast.success("Project updated with latest status");
                    }
                }
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to retrieve task status.";
            setError(errorMessage);
            toast.error(errorMessage);
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

            toast.success(`Downloading ${filename}...`);
        } catch (err) {
            toast.error("Failed to download the video.");
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
                        to="/video-lipsync"
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
                        Lipsync Status Check
                    </h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                        Enter your task ID to check the status of your video lipsync generation.
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
                                placeholder="Enter your task ID"
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
                                    <Label className="text-sm font-medium text-muted-foreground">Checked At</Label>
                                    <p className="text-sm mt-1">{new Date().toLocaleString()}</p>
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
                                            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23000'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23fff' font-size='16'%3ELoading video...%3C/text%3E%3C/svg%3E"
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

                                        <Button
                                            onClick={() => window.open(result.result_url, '_blank')}
                                            variant="outline"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View in New Tab
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                setSelectedVideoForYoutube({
                                                    url: result.result_url!,
                                                    title: `Lipsync: ${result.task_id}`
                                                });
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

export default VideoLipsyncStatus;

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Download, Search, ExternalLink, Video, AlertCircle, CheckCircle, Clock, Copy, CreditCard, Youtube } from "lucide-react";
import { YoutubeUploadModal } from "./YoutubeUploadModal";
import { toast } from "sonner";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { uploadToImgbb } from "../services/imgbbService";
import { uploadToCloudinary } from "../services/cloudinaryService";
import { createVideoTask, getTaskInfo, parseResultJson } from "../services/kieService";
import { SubscriptionService } from "../services/subscriptionService";

interface TaskResult {
    task_id: string;
    status: string;
    message: string;
    created_at: string;
    result_url?: string;
    original_video_url?: string;
}

export const VideoLipsyncForm = () => {
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const { createProject, updateProject, logActivity, isDemo } = useProjects();

    const [image, setImage] = useState<File | null>(null);
    const [audio, setAudio] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [resolution, setResolution] = useState("480p");
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
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

    // Get audio duration
    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';

            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };

            audio.onerror = () => {
                reject(new Error('Failed to load audio file'));
            };

            audio.src = URL.createObjectURL(file);
        });
    };

    // Calculate credits needed for video lipsync
    const calculateCreditsNeeded = (): number => {
        if (!audioDuration) return 0;
        return SubscriptionService.getCreditCostForVideoLipsync(audioDuration, resolution);
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
            const apiKey = import.meta.env.VITE_KIE_API_KEY || "";
            if (!apiKey) {
                throw new Error("Kie AI API Key is missing. Please configure VITE_KIE_API_KEY.");
            }

            const data = await getTaskInfo(apiKey, taskId);

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

            // Update project and log activity if user is authenticated
            if (user) {
                const isCompleted = taskResult.result_url && taskResult.status.toLowerCase().includes('success');
                const projectStatus = isCompleted ? 'completed' :
                    taskResult.status.toLowerCase().includes('error') || taskResult.status.toLowerCase().includes('fail') ? 'failed' : 'processing';

                // Update project status
                if (currentProjectId) {
                    await updateProject(currentProjectId, {
                        status: projectStatus,
                        project_metadata: {
                            taskId: taskResult.task_id,
                            resultUrl: taskResult.result_url
                        }
                    });
                }

                // Log activity
                const activityAction = isCompleted ? 'Video lipsync completed' :
                    projectStatus === 'failed' ? 'Video lipsync failed' : 'Checked video lipsync status';
                const activityDetails = isCompleted ?
                    `Video lipsync completed successfully (Task ID: ${taskResult.task_id})` :
                    `Video lipsync status: ${taskResult.message} (Task ID: ${taskResult.task_id})`;

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
                toast.info(`Status: ${taskResult.message}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to check result";
            setError(errorMessage);

            // Log error activity
            if (user) {
                await logActivity({
                    action: 'Failed to check video status',
                    details: `Failed to check video lipsync status for Task ID: ${taskId}. Error: ${errorMessage}`
                });
            }

            toast.error(errorMessage);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!image || !audio || !description.trim()) {
            toast.error("Please upload an image, audio, and add a description");
            return;
        }

        if (!user) {
            toast.error("Please log in to generate videos");
            return;
        }

        // Check credit balance before proceeding
        const creditsNeeded = calculateCreditsNeeded();
        if (creditsNeeded > 0) {
            const creditCheck = await SubscriptionService.useCredits(user.id, 'video_lipsync', creditsNeeded, 1);
            if (!creditCheck.success) {
                let errorMsg = creditCheck.error || 'Failed to process credit deduction';
                if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
                    errorMsg = 'Credit system error. Please try again later.';
                } else if (subscription && subscription.credit_balance < creditsNeeded) {
                    errorMsg = `Insufficient credits for video lipsync. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
                }
                toast.error(errorMsg);
                return;
            }

            toast.success(`✅ ${creditsNeeded} credits deducted for video lipsync`);
        }

        setIsLoading(true);

        try {
            // Create project record first
            const projectTitle = `Lipsync: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
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

            const apiKey = import.meta.env.VITE_KIE_API_KEY || "";
            if (!apiKey) {
                throw new Error("Kie AI API Key is missing. Please configure VITE_KIE_API_KEY.");
            }

            const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || "";
            if (!imgbbKey) {
                throw new Error("ImgBB API Key is missing. Please configure VITE_IMGBB_API_KEY.");
            }

            // Upload Image
            toast.info("Uploading image...");
            const imageUrl = await uploadToImgbb(image, imgbbKey);

            // Upload Audio
            toast.info("Uploading audio to Cloudinary...");
            const audioUrl = await uploadToCloudinary(audio);

            toast.info("Creating video lipsync task...");
            const newTaskId = await createVideoTask(apiKey, {
                image_url: imageUrl,
                audio_url: audioUrl,
                prompt: description,
                resolution: resolution
            });

            setTaskId(newTaskId);

            // Update project with task ID
            if (currentProjectId || projectResult.data?.id) {
                await updateProject(currentProjectId || projectResult.data!.id, {
                    project_metadata: {
                        description: description,
                        originalImageName: image.name,
                        imageSize: image.size,
                        submittedAt: new Date().toISOString(),
                        taskId: newTaskId
                    }
                });
            }

            // Log activity
            await logActivity({
                action: 'Started video lipsync',
                details: `Started generating video lipsync with prompt: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}" (Task ID: ${newTaskId})`,
                activity_metadata: {
                    description: description,
                    taskId: newTaskId
                }
            });

            const message = isDemo
                ? "Video lipsync started (demo mode)! Task ID has been set automatically."
                : "Video lipsync started! Task ID has been set automatically.";
            toast.success(message);
            setIsSubmitted(true);
            // Reset form
            setImage(null);
            setAudio(null);
            setDescription("");

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
                    action: 'Video lipsync failed',
                    details: `Failed to start video lipsync: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        setAudio(null);
        setDescription("");
        setResolution("480p");
        setIsSubmitted(false);
        setTaskId("");
        setCurrentProjectId(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="space-y-8">
            <Card className="max-w-4xl mx-auto backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl">
                {/* Credit Balance Display */}
                {subscription && (
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 max-w-2xl mx-auto m-6">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Credit Balance</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {subscription.credit_balance || 0} credits
                                        </p>
                                    </div>
                                </div>
                                {audioDuration && (
                                    <div className="text-right">
                                        <p className="text-xs text-blue-700">Video lipsync cost</p>
                                        <p className="text-sm font-semibold text-blue-800">
                                            {calculateCreditsNeeded()} credits ({audioDuration.toFixed(1)}s × {resolution === '720p' ? '4' : '1'} credit/s)
                                        </p>
                                    </div>
                                )}
                            </div>
                            {(subscription.credit_balance || 0) < calculateCreditsNeeded() && audioDuration && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-xs text-yellow-800 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Insufficient credits for video lipsync. You need {calculateCreditsNeeded()} credits but only have {subscription.credit_balance || 0}. Please upgrade your plan or purchase additional credits.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="space-y-3">
                            <Label htmlFor="image-upload" className="text-lg font-semibold text-card-foreground">
                                Upload Image
                            </Label>
                            <ImageUpload onImageSelect={setImage} selectedImage={image} />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="audio-upload" className="text-lg font-semibold text-card-foreground">
                                Upload Audio (MP3)
                            </Label>
                            <Input
                                id="audio-upload"
                                type="file"
                                accept="audio/*"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setAudio(file);

                                        // Get audio duration
                                        try {
                                            const duration = await getAudioDuration(file);
                                            setAudioDuration(duration);
                                            toast.success(`Audio loaded: ${duration.toFixed(1)} seconds`);
                                        } catch (error) {
                                            console.error('Failed to get audio duration:', error);
                                            toast.error('Failed to read audio file duration');
                                            setAudioDuration(null);
                                        }
                                    }
                                }}
                                className="cursor-pointer"
                            />
                            {audio && <p className="text-sm text-muted-foreground">Selected: {audio.name}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-lg font-semibold text-card-foreground">
                                Video Description / Prompt
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the video... (e.g., 'A young woman with long dark hair talking on a podcast.')"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[120px] resize-none"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="resolution" className="text-lg font-semibold text-card-foreground">
                                Video Resolution
                            </Label>
                            <Select value={resolution} onValueChange={setResolution} disabled={isLoading}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="480p">480p</SelectItem>
                                    <SelectItem value="720p">720p</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            disabled={isLoading || !image || !audio || !description.trim()}
                            className="w-full font-semibold py-4"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generating Lipsync Video...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Generate Lipsync Video
                                </>
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="p-10 space-y-6">
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <h3 className="text-xl font-semibold text-green-800">Video Lipsync Started!</h3>
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
                                <Link to="/video-lipsync-status">
                                    <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Go to Status Page
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
                                        onClick={() => window.open(result.result_url, '_blank')}
                                        className="flex-1"
                                        variant="outline"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View in New Tab
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            setSelectedVideoForYoutube({
                                                url: result.result_url!,
                                                title: `Lipsync: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
                                            });
                                            setYoutubeModalOpen(true);
                                        }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                                        variant="default"
                                    >
                                        <Youtube className="mr-2 h-4 w-4" />
                                        Upload to YouTube
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

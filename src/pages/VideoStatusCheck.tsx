
import React, { useState } from 'react';
import { ArrowLeft, Loader2, Search, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { getVeoResult } from '../services/kieVeoService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const VideoStatusCheck = () => {
    const navigate = useNavigate();
    const [taskId, setTaskId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ status: 'processing' | 'completed' | 'failed', url?: string } | null>(null);

    const handleCheckStatus = async () => {
        if (!taskId.trim()) {
            toast.error("Please enter a Task ID");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await getVeoResult(API_KEY, taskId.trim());

            if (response.status === 'completed' && response.resultUrl) {
                setResult({ status: 'completed', url: response.resultUrl });
                toast.success("Video found and ready!");
            } else if (response.status === 'failed') {
                setResult({ status: 'failed' });
                toast.error("Video generation failed.");
            } else {
                setResult({ status: 'processing' });
                toast.info("Video is still processing.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to check status. Invalid ID or network error.");
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-200">
            <div className="absolute top-6 left-6">
                <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-white hover:bg-slate-900 gap-2"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </Button>
            </div>

            <Card className="w-full max-w-5xl bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                        <Search className="text-indigo-500" /> Check Video Status
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter your Generation Task ID to retrieve your video.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter Task ID (e.g., veo_task_...)"
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 font-mono"
                        />
                        <Button
                            onClick={handleCheckStatus}
                            disabled={isLoading || !taskId.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 min-w-[100px]"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Check'}
                        </Button>
                    </div>

                    {result && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            {result.status === 'processing' && (
                                <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-6 flex flex-col items-center text-center gap-3">
                                    <Loader2 className="animate-spin text-blue-400" size={32} />
                                    <div>
                                        <h3 className="text-lg font-semibold text-blue-200">Still Processing</h3>
                                        <p className="text-sm text-blue-300/70 mt-1">Your video is being generated. Please check back in a few moments.</p>
                                    </div>
                                </div>
                            )}

                            {result.status === 'failed' && (
                                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6 flex flex-col items-center text-center gap-3">
                                    <AlertCircle className="text-red-500" size={32} />
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-200">Generation Failed</h3>
                                        <p className="text-sm text-red-300/70 mt-1">Something went wrong with this task. Please ensure the ID is correct.</p>
                                    </div>
                                </div>
                            )}

                            {result.status === 'completed' && result.url && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
                                        <CheckCircle2 size={16} /> Generation Complete
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-black shadow-lg">
                                        <video
                                            src={result.url}
                                            controls
                                            autoPlay
                                            className="w-full aspect-video object-cover"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            className="border-slate-700 hover:bg-slate-800 text-slate-300 gap-2"
                                            onClick={() => window.open(result.url, '_blank')}
                                        >
                                            <Play size={14} /> Open in New Tab
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-slate-950/50 border-t border-slate-800 p-4 text-xs text-slate-500 text-center justify-center">
                    Video generation typically takes 2-5 minutes depending on server load.
                </CardFooter>
            </Card>
        </div>
    );
};

export default VideoStatusCheck;

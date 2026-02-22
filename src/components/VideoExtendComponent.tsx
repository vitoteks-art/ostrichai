
import React, { useState, useEffect } from 'react';
import { FastForward, Link, Loader2, Sparkles, AlertCircle, Download, Video, Camera, Youtube } from 'lucide-react';
import { YoutubeUploadModal } from './YoutubeUploadModal';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProjects } from '../hooks/useProjects';
import { extendVeoVideo, getVeoResult } from '../services/kieVeoService';
import { SubscriptionService } from '../services/subscriptionService';
import { Card, CardContent } from '../components/ui/card';

interface VideoExtendComponentProps {
    apiKey: string;
    imgbbKey: string;
}

const VideoExtendComponent: React.FC<VideoExtendComponentProps> = ({ apiKey }) => {
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const { createProject, updateProject, logActivity } = useProjects();

    const [sourceTaskId, setSourceTaskId] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);

    // YouTube Upload Modal State
    const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
    const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);
    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY || '';

    // Poll for result
    useEffect(() => {
        if (!taskId || status !== 'processing') return;

        const interval = setInterval(async () => {
            try {
                const result = await getVeoResult(apiKey, taskId);
                if (result.status === 'completed' && result.resultUrl) {
                    setStatus('completed');
                    setResultUrl(result.resultUrl);
                    toast.success("Video Extension Completed!", {
                        description: "Your extended video is ready to download."
                    });
                    clearInterval(interval);
                } else if (result.status === 'failed') {
                    setStatus('failed');
                    setError('Generation failed via API.');
                    toast.error("Video Extension Failed");
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [taskId, status, apiKey]);

    const handleGenerate = async () => {
        if (!sourceTaskId.trim()) {
            toast.error('Please enter a Source Task ID');
            return;
        }
        if (!prompt.trim()) {
            toast.error('Please enter a prompt');
            return;
        }

        setIsGenerating(true);
        setStatus('processing');
        setError(null);
        setResultUrl(null);

        try {
            // 1. Credit Check (20 credits for extension)
            const creditsNeeded = 20;
            if (user) {
                const creditCheck = await SubscriptionService.useCredits(user.id, 'video_generation', creditsNeeded);
                if (!creditCheck.success) {
                    let errorMsg = creditCheck.error || 'Failed to process credit deduction';
                    if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
                        errorMsg = 'Credit system error. Please try again later.';
                    } else if (subscription && subscription.credit_balance < creditsNeeded) {
                        errorMsg = `Insufficient credits. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}.`;
                    }
                    throw new Error(errorMsg);
                }
                toast.success(`${creditsNeeded} credits deducted`);
            }

            // 2. Create Project
            const projectResult = await createProject({
                title: `Extend Video: ${prompt.substring(0, 30)}...`,
                type: 'video',
                status: 'processing',
                project_metadata: {
                    prompt,
                    generationType: 'EXTEND_VIDEO',
                    sourceTaskId,
                    model: 'veo3 (extended)',
                    submittedAt: new Date().toISOString()
                }
            });
            const projectId = projectResult.data?.id;

            // 3. Call API
            const newTaskId = await extendVeoVideo(apiKey, {
                taskId: sourceTaskId,
                prompt
            });

            setTaskId(newTaskId);

            // Update Project with Task ID
            if (projectId) {
                await updateProject(projectId, {
                    project_metadata: {
                        taskId: newTaskId,
                        prompt,
                        sourceTaskId,
                        status: 'processing'
                    }
                });
            }

            await logActivity({
                action: 'Started video extension',
                details: `Extending task ${sourceTaskId}`,
                activity_metadata: {
                    sourceTaskId,
                    taskId: newTaskId,
                    prompt
                }
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setStatus('failed');
            toast.error(err.message || 'Failed to start extension');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <FastForward size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Extend Video</h1>
                    <p className="text-slate-400 mt-1">
                        Continue any existing video by providing its Task ID and a new prompt.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 space-y-6">

                        {/* Source ID Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                                <Link size={16} /> Source Task ID
                            </label>
                            <input
                                type="text"
                                value={sourceTaskId}
                                onChange={(e) => setSourceTaskId(e.target.value)}
                                placeholder="e.g. 5aa1b176-..."
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder:text-slate-600"
                            />
                            <p className="text-xs text-slate-500">
                                Paste the Task ID of the video you want to extend from.
                            </p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                                <Sparkles size={16} /> Extension Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what happens next in the video..."
                                className="w-full h-32 px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all resize-none placeholder:text-slate-600 leading-relaxed"
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !sourceTaskId || !prompt}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FastForward size={20} />}
                            {isGenerating ? 'Processing...' : 'Generate Extension'}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Result / Preview */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center text-center">
                        {status === 'processing' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                                    <Loader2 size={48} className="text-indigo-400 animate-spin relative z-10" />
                                </div>
                                <p className="text-sm text-slate-400 animate-pulse">Generating your video...<br />This may take 2-4 minutes.</p>
                            </div>
                        )}

                        {status === 'completed' && resultUrl && (
                            <div className="w-full space-y-4 animate-in zoom-in duration-300">
                                <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden border border-white/10 w-full shadow-2xl">
                                    <video src={resultUrl} controls autoPlay loop className="w-full h-full object-cover" />
                                </div>
                                <a
                                    href={resultUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <Download size={16} /> Download
                                </a>

                                <button
                                    onClick={() => {
                                        setSelectedVideoForYoutube({
                                            url: resultUrl,
                                            title: `Extended: ${prompt.substring(0, 50)}...`
                                        });
                                        setYoutubeModalOpen(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm border-0"
                                >
                                    <Youtube size={16} /> Upload to YouTube
                                </button>
                            </div>
                        )}

                        {status === 'idle' && (
                            <div className="space-y-4 opacity-50">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                                    <Video size={32} className="text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">
                                    Your extended video will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
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

export default VideoExtendComponent;

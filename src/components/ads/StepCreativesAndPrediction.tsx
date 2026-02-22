
import React from 'react';
import { ArrowRight, Loader2, BrainCircuit, Swords, Trophy, XCircle, Sparkles, ImagePlus } from 'lucide-react';
import { AdCreative, PredictionResult } from '../../types/adsEngine';
import { VisualGenerationModal } from './VisualGenerationModal';
import { generateVisualAssets } from '../../services/adsEngineService';
import { getVeoResult } from '../../services/kieVeoService';
import { ProjectService } from '../../services/projectService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

// Get API Key from env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface StepCreativesAndPredictionProps {
    creatives: AdCreative[];
    predictions: Record<string, PredictionResult>;
    onRunPrediction: () => void;
    onNext: () => void;
    isPredicting: boolean;
    projectId?: string;
}

export const StepCreativesAndPrediction: React.FC<StepCreativesAndPredictionProps> = ({
    creatives,
    predictions,
    onRunPrediction,
    onNext,
    isPredicting,
    projectId
}) => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
    const [generationResults, setGenerationResults] = useState<Record<string, { url?: string, taskId: string, type: 'image' | 'video', status: 'processing' | 'completed' | 'failed', projectId?: string }>>({});
    const [manualTaskInputs, setManualTaskInputs] = useState<Record<string, string>>({});

    // Manual Status Check Logic
    const checkTaskStatus = async (creativeId: string, taskId: string) => {
        if (!taskId) return;

        const toastId = toast.loading("Checking task status...");

        try {
            const result = await getVeoResult(API_KEY, taskId);

            if (result.status === 'completed' && result.resultUrl) {
                // Determine if we need to update an existing project or create a new retrieval one
                const currentTask = generationResults[creativeId];

                if (user?.id) {
                    if (currentTask?.projectId || projectId) {
                        // PREFER PASSED PROJECT ID
                        const finalProjectId = projectId || currentTask?.projectId;

                        // Update existing project
                        if (finalProjectId) {
                            await ProjectService.mergeProjectMetadata(finalProjectId, {
                                taskId, result: result, lastAction: 'video_generation_complete'
                            });
                            // Update status and file_url (requires updateProject as these are top-level fields)
                            await ProjectService.updateProject(finalProjectId, {
                                status: 'completed',
                                file_url: result.resultUrl
                            });
                            await ProjectService.logProductCompletion(user.id, 'video', `Video Generation ${taskId}`, finalProjectId, undefined, { taskId });
                        }
                    } else {
                        // Log as new retrieval if no local project ID found (e.g. manual entry)
                        await ProjectService.createProject(user.id, {
                            title: `Retrieved Video ${taskId.substring(0, 8)}`,
                            type: 'video',
                            status: 'completed',
                            file_url: result.resultUrl,
                            project_metadata: { taskId, source: 'manual_check' }
                        });
                    }
                }

                setGenerationResults(prev => ({
                    ...prev,
                    [creativeId]: {
                        ...prev[creativeId],
                        status: 'completed',
                        url: result.resultUrl,
                        type: 'video' // Enforce video if checking veo result
                    }
                }));
                toast.success("Video is ready!", { id: toastId });
            } else if (result.status === 'failed') {
                if (user?.id && generationResults[creativeId]?.projectId) {
                    await ProjectService.updateProject(generationResults[creativeId].projectId!, { status: 'failed' });
                }
                setGenerationResults(prev => ({
                    ...prev,
                    [creativeId]: { ...prev[creativeId], status: 'failed' }
                }));
                toast.error("Generation failed", { id: toastId });
            } else {
                toast.info("Still processing...", { id: toastId, description: "Please check again later." });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to check status", { id: toastId });
        }
    };

    const handleOpenVisualModal = (creative: AdCreative) => {
        setSelectedCreative(creative);
        setIsModalOpen(true);
    };

    const handleVisualSubmit = async (payload: any) => {
        try {
            const result = await generateVisualAssets(payload);

            // Handle the specific array response format
            if (Array.isArray(result) && result.length > 0) {
                const data = result[0];

                if (payload.assetType === 'video') {
                    // --- VIDEO HANDLING ---
                    // Prioritize: data.data.taskId (User Confirmed Format)
                    const taskId = data.data?.taskId ||
                        data.rawInput?.data?.taskId ||
                        data.taskId ||
                        (typeof data.data === 'string' && data.data) ||
                        'Unknown';

                    if (taskId && taskId !== 'Unknown') {
                        let localProjectId: string | undefined;

                        // Create or Update Project Record
                        if (user?.id) {
                            if (projectId) {
                                // Update Main Campaign Project
                                await ProjectService.mergeProjectMetadata(projectId, {
                                    taskId,
                                    currentTask: 'video_generation',
                                    lastPrompt: payload.visualPrompt
                                });
                                await ProjectService.logActivity(user.id, {
                                    action: 'Video Generation Started',
                                    details: `Started Video Generation: ${payload.visualConcept?.substring(0, 20)}...`,
                                    activity_metadata: {
                                        project_id: projectId,
                                        action_type: 'video_generation',
                                        taskId
                                    }
                                });
                            } else {
                                const projectRes = await ProjectService.createProject(user.id, {
                                    title: `Video Ad: ${payload.visualConcept?.substring(0, 30) || 'New Video'}`,
                                    type: 'video',
                                    status: 'processing',
                                    project_metadata: {
                                        taskId,
                                        prompt: payload.visualPrompt,
                                        concept: payload.visualConcept
                                    }
                                });
                                if (projectRes.success && projectRes.data) {
                                    localProjectId = projectRes.data.id;
                                    await ProjectService.logProductCreation(user.id, 'video', `Started Video Ad: ${payload.visualConcept?.substring(0, 20)}...`);
                                }
                            }
                        }

                        // Success: Valid Token -> Start Polling
                        setGenerationResults(prev => ({
                            ...prev,
                            [payload.creativeId]: {
                                taskId: taskId,
                                type: 'video',
                                status: 'processing',
                                projectId: localProjectId || projectId
                            }
                        }));
                        toast.success("Video task started", { description: `Task ID: ${taskId}` });
                    } else {
                        // Failure: No Token -> Do NOT Poll
                        console.error("Video Generation Failed: Missing Task ID", data);
                        toast.error("Video generation failed", { description: "No Task ID received from backend." });
                    }

                } else {
                    // --- IMAGE HANDLING ---
                    const extractedUrl = data.extractedUrl || data.url || data.output;

                    if (extractedUrl) {
                        let localProjectId: string | undefined;
                        if (user?.id) {
                            if (projectId) {
                                // Update Main Project
                                await ProjectService.mergeProjectMetadata(projectId, {
                                    lastGeneratedImage: extractedUrl,
                                    currentStep: 'VISUALS_COMPLETE'
                                });
                                // Update file_url if desired (optional for main project if it's just one asset)
                                await ProjectService.updateProject(projectId, {
                                    file_url: extractedUrl
                                });
                                await ProjectService.logProductCompletion(user.id, 'ad', 'Generated Image Ad', projectId);
                            } else {
                                const projectRes = await ProjectService.createProject(user.id, {
                                    title: `Image Ad: ${payload.visualConcept?.substring(0, 30) || 'New Image'}`,
                                    type: 'ad',
                                    status: 'completed',
                                    file_url: extractedUrl,
                                    project_metadata: {
                                        prompt: payload.visualPrompt,
                                        concept: payload.visualConcept
                                    }
                                });
                                localProjectId = projectRes.data?.id;
                                await ProjectService.logProductCompletion(user.id, 'ad', 'Generated Image Ad', localProjectId);
                            }
                        }

                        setGenerationResults(prev => ({
                            ...prev,
                            [payload.creativeId]: {
                                url: extractedUrl,
                                taskId: data.taskId || 'Image Task',
                                type: 'image',
                                status: 'completed',
                                projectId: localProjectId || projectId
                            }
                        }));
                        toast.success("Visual generated successfully!");
                    } else {
                        toast.error("Image generation failed", { description: "No image URL received." });
                    }
                }
            } else {
                toast.warning("Request sent, but received empty response.");
            }
        } catch (error) {
            toast.error("Failed to start generation", {
                description: "Please check your inputs and try again."
            });
        }
    };

    const handleManualTrack = (creativeId: string) => {
        const inputId = manualTaskInputs[creativeId];
        if (!inputId || !inputId.trim()) {
            toast.error("Please enter a valid Task ID");
            return;
        }

        setGenerationResults(prev => ({
            ...prev,
            [creativeId]: {
                taskId: inputId.trim(),
                type: 'video', // Assume video for manual tracking usually
                status: 'processing'
            }
        }));
        setManualTaskInputs(prev => ({ ...prev, [creativeId]: '' }));
        toast.info("Started tracking task", { description: inputId });
    };

    const hasPredictions = Object.keys(predictions).length > 0;

    // Sort creatives if predictions exist: Winners first, then average, then losers
    const sortedCreatives = [...creatives].sort((a, b) => {
        if (!hasPredictions) return 0;
        const scoreA = predictions[a.id]?.score || 0;
        const scoreB = predictions[b.id]?.score || 0;
        return scoreB - scoreA;
    });

    // Get Best and Worst for A/B view
    const bestAd = sortedCreatives[0];
    const worstAd = sortedCreatives[sortedCreatives.length - 1];
    const bestPred = predictions[bestAd.id];
    const worstPred = predictions[worstAd.id];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur py-4 z-20 border-b border-slate-800/50">
                <div>
                    <h2 className="text-2xl font-bold text-white">Creative Lab & Predictions</h2>
                    <p className="text-slate-400 text-sm">AI-generated concepts {hasPredictions ? 'ranked by synthetic performance.' : 'ready for evaluation.'}</p>
                </div>
                <div className="flex gap-3">
                    {!hasPredictions ? (
                        <button
                            onClick={onRunPrediction}
                            disabled={isPredicting}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPredicting ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
                            {isPredicting ? 'Running Simulation...' : 'Run Synthetic A/B Test'}
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            disabled={isPredicting}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPredicting ? <Loader2 className="animate-spin" size={18} /> : null}
                            {isPredicting ? 'Targeting...' : <>View Targeting <ArrowRight size={18} /></>}
                        </button>
                    )}
                </div>
            </div>

            {/* Head-to-Head Comparison View */}
            {hasPredictions && bestPred && worstPred && (
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-700 mb-10">
                    <div className="flex items-center gap-3 mb-6 text-purple-400">
                        <Swords size={24} />
                        <h3 className="text-xl font-bold text-white">Synthetic A/B Test Results: Head-to-Head</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-stretch">
                        {/* Winner Card */}
                        <div className="flex-1 bg-gradient-to-b from-emerald-950/20 to-slate-950 border border-emerald-500/40 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <Trophy size={12} /> WINNER
                            </div>
                            <div className="mb-4">
                                <h4 className="text-sm text-emerald-400 font-mono mb-1">Concept #{bestAd.id}</h4>
                                <div className="text-3xl font-bold text-white mb-1">{bestPred.score}<span className="text-lg text-slate-500 font-normal">/100</span></div>
                            </div>
                            <p className="text-white font-medium italic mb-4">"{bestAd.headline}"</p>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Resonance</span>
                                        <span>{bestPred.resonance}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${bestPred.resonance}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Attention</span>
                                        <span>{bestPred.attention}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${bestPred.attention}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800/50">
                                <p className="text-xs text-slate-400 leading-relaxed"><span className="text-emerald-400 font-bold">Why it won:</span> {bestPred.reasoning}</p>
                            </div>
                        </div>

                        {/* Vs Badge */}
                        <div className="flex items-center justify-center">
                            <div className="bg-slate-800 rounded-full p-2 text-slate-400 font-bold text-xs border border-slate-700">VS</div>
                        </div>

                        {/* Loser Card */}
                        <div className="flex-1 bg-slate-950 border border-red-900/30 rounded-xl p-5 relative opacity-80">
                            <div className="absolute top-0 right-0 bg-red-900/50 text-red-300 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <XCircle size={12} /> ELIMINATED
                            </div>
                            <div className="mb-4">
                                <h4 className="text-sm text-red-400 font-mono mb-1">Concept #{worstAd.id}</h4>
                                <div className="text-3xl font-bold text-slate-400 mb-1">{worstPred.score}<span className="text-lg text-slate-600 font-normal">/100</span></div>
                            </div>
                            <p className="text-slate-300 font-medium italic mb-4">"{worstAd.headline}"</p>

                            <div className="space-y-3 opacity-60">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Resonance</span>
                                        <span>{worstPred.resonance}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-600" style={{ width: `${worstPred.resonance}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Attention</span>
                                        <span>{worstPred.attention}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-600" style={{ width: `${worstPred.attention}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800/50">
                                <p className="text-xs text-slate-500 leading-relaxed"><span className="text-red-400 font-bold">Why it failed:</span> {worstPred.reasoning}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid of all results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCreatives.map((ad) => {
                    const prediction = predictions[ad.id];
                    const isWinner = prediction?.status === 'WINNER';
                    const isLoser = prediction?.status === 'LOSER';

                    return (
                        <div
                            key={ad.id}
                            className={`
                relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col
                ${isWinner ? 'border-emerald-500/50 bg-emerald-950/10 shadow-emerald-900/20 shadow-xl scale-[1.02]' :
                                    isLoser ? 'border-red-900/30 bg-slate-950 opacity-60 grayscale-[0.5]' :
                                        'border-slate-800 bg-slate-900/40 hover:border-slate-700'}
              `}
                        >
                            {hasPredictions && prediction && (
                                <div className={`
                  absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide z-10 backdrop-blur-md
                  ${isWinner ? 'bg-emerald-500 text-white' : isLoser ? 'bg-red-500/80 text-white' : 'bg-slate-700 text-slate-300'}
                `}>
                                    {isWinner ? 'Winner' : isLoser ? 'Eliminated' : 'Average'} • {prediction.score}
                                </div>
                            )}

                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ad.format === 'VIDEO' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}>
                                        {ad.format}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="font-bold text-white leading-tight mb-2">"{ad.headline}"</h4>
                                    <p className="text-sm text-slate-400">{ad.caption}</p>
                                </div>

                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider font-bold block mb-1">Visual Concept</span>
                                    <p className="text-slate-300 italic">{ad.visualConcept}</p>

                                    {/* GENERATION RESULT DISPLAY */}
                                    {generationResults[ad.id] ? (
                                        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-black relative group min-h-[150px] flex items-center justify-center">
                                                {generationResults[ad.id].status === 'processing' ? (
                                                    <div className="flex flex-col items-center gap-3 p-4 text-center w-full">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Loader2 className="animate-spin text-purple-500 mb-1" size={24} />
                                                            <span className="text-xs text-slate-400">Processing...</span>
                                                        </div>

                                                        <div className="w-full bg-slate-900/80 p-2 rounded border border-slate-800">
                                                            <p className="text-[10px] text-slate-500 font-mono mb-2 break-all select-all">
                                                                ID: {generationResults[ad.id].taskId}
                                                            </p>
                                                            <button
                                                                onClick={() => checkTaskStatus(ad.id, generationResults[ad.id].taskId)}
                                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-1.5 rounded transition-colors font-semibold"
                                                            >
                                                                Check Status
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : generationResults[ad.id].status === 'failed' ? (
                                                    <div className="flex flex-col items-center gap-2 p-4 text-center text-red-400">
                                                        <XCircle size={24} />
                                                        <span className="text-xs">Generation Failed</span>
                                                        <button
                                                            onClick={() => checkTaskStatus(ad.id, generationResults[ad.id].taskId)}
                                                            className="text-[10px] underline hover:text-red-300"
                                                        >
                                                            Retry Check
                                                        </button>
                                                    </div>
                                                ) : generationResults[ad.id].type === 'video' ? (
                                                    <video
                                                        src={generationResults[ad.id].url}
                                                        controls
                                                        playsInline
                                                        className="w-full aspect-video object-cover"
                                                    />
                                                ) : (
                                                    <img
                                                        src={generationResults[ad.id].url}
                                                        alt="Generated Visual"
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-auto object-cover"
                                                    />
                                                )}

                                                {generationResults[ad.id].status === 'completed' && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">
                                                        {generationResults[ad.id].type === 'video' ? 'Video' : 'Image'} Result
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono bg-slate-900/50 p-1.5 rounded border border-slate-800">
                                                <span>Task ID:</span>
                                                <span className="text-indigo-400 select-all cursor-text">{generationResults[ad.id].taskId}</span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenVisualModal(ad)}
                                                className="w-full text-center text-[10px] text-slate-500 hover:text-white transition-colors py-1"
                                            >
                                                Regenerate
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleOpenVisualModal(ad)}
                                                className="mt-2 text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium w-full justify-center border border-emerald-500/30 rounded py-1.5 bg-emerald-950/20"
                                            >
                                                <ImagePlus size={14} /> Generate Visual
                                            </button>

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Task ID to track"
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded text-[10px] px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                                                    value={manualTaskInputs[ad.id] || ''}
                                                    onChange={(e) => setManualTaskInputs(prev => ({ ...prev, [ad.id]: e.target.value }))}
                                                />
                                                <button
                                                    onClick={() => handleManualTrack(ad.id)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700 transition-colors"
                                                >
                                                    Track
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* New Rich Context Section: Rationale & Angle */}
                                {(ad.rationale || ad.angle || ad.differentiation) && (
                                    <div className="bg-slate-950/30 p-3 rounded-lg border border-indigo-900/30 text-xs space-y-2">
                                        <span className="text-indigo-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                                            <Sparkles size={10} /> AI Strategy
                                        </span>
                                        {ad.angle && <p className="text-slate-300"><span className="text-slate-500">Angle:</span> {ad.angle}</p>}
                                        {ad.rationale && <p className="text-slate-400 italic">"{ad.rationale}"</p>}

                                        {ad.differentiation && (
                                            <div className="mt-2 pt-2 border-t border-slate-800/50">
                                                <span className="text-emerald-500 font-bold block mb-1">Vs Competitors:</span>
                                                <p className="text-slate-400">{ad.differentiation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {ad.script && (
                                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 text-xs">
                                        <span className="text-slate-500 uppercase tracking-wider font-bold block mb-1">Production Notes</span>
                                        <p className="text-slate-300 line-clamp-3">{ad.script}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-950 p-4 border-t border-slate-800 mt-auto">
                                <button className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                                    {ad.cta}
                                </button>
                            </div>

                            {/* Analysis Overlay if predicted */}
                            {hasPredictions && prediction && (
                                <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-xs space-y-2">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span>Resonance</span>
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${prediction.resonance}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span>Attention</span>
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500" style={{ width: `${prediction.attention}%` }}></div>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 mt-2 border-t border-slate-800 pt-2 italic line-clamp-2">
                                        "{prediction.reasoning}"
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <VisualGenerationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleVisualSubmit}
                initialData={{
                    visualConcept: selectedCreative?.visualConcept,
                    creativeId: selectedCreative?.id,
                    headline: selectedCreative?.headline
                }}
            />
        </div>
    );
};

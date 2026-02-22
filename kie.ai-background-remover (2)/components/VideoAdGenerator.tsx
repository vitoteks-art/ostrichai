
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Video, Sparkles, Clapperboard, Download, Loader2, AlertCircle, Plus, Upload, X, Image as LucideImage, Film, Search, Trash2, Clock, MonitorPlay, Ratio, FastForward, Link, Copy, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { uploadToImgbb } from '../services/imgbbService';
import { createVeoTask, getVeoResult, extendVeoVideo } from '../services/kieVeoService';
import { VeoGenerationType, VeoModel, VideoTask } from '../types';

interface VideoAdGeneratorProps {
  apiKey: string;
  imgbbKey: string;
}

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      onClick={handleCopy} 
      className={`hover:text-blue-500 transition-colors p-1 rounded-md hover:bg-slate-200 ${className}`} 
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
};

const VideoAdGenerator: React.FC<VideoAdGeneratorProps> = ({ apiKey, imgbbKey }) => {
  // Input States
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<VeoGenerationType>('TEXT_2_VIDEO');
  const [model, setModel] = useState<VeoModel>('veo3');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  
  // Extend Mode specific state
  const [sourceTaskId, setSourceTaskId] = useState('');
  
  // Image Upload States
  // Using IDs to track dynamic slots. Initial slots: 0, 1.
  const [refSlotIds, setRefSlotIds] = useState<number[]>([0, 1]); 
  const nextSlotIdRef = useRef(2);
  
  const [uploadedImages, setUploadedImages] = useState<Record<number, File | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // App States
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History & Tracking
  const [videoHistory, setVideoHistory] = useState<VideoTask[]>(() => {
    const saved = localStorage.getItem('kie_video_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [manualTaskId, setManualTaskId] = useState('');

  // Persist History
  useEffect(() => {
    localStorage.setItem('kie_video_history', JSON.stringify(videoHistory));
  }, [videoHistory]);

  // Constraint Enforcement
  useEffect(() => {
    if (genType === 'REFERENCE_2_VIDEO') {
      setModel('veo3_fast');
      setAspectRatio('16:9');
    }
  }, [genType]);

  // Background Polling
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const pendingTasks = videoHistory.filter(t => t.status === 'processing');
      if (pendingTasks.length === 0) return;

      const updatedHistory = [...videoHistory];
      let hasChanges = false;

      for (const task of pendingTasks) {
        try {
          const pollResult = await getVeoResult(apiKey, task.taskId);
          
          if (pollResult.status === 'completed' && pollResult.resultUrl) {
            const index = updatedHistory.findIndex(t => t.taskId === task.taskId);
            if (index !== -1) {
              updatedHistory[index] = { 
                  ...task, 
                  status: 'completed', 
                  resultUrl: pollResult.resultUrl,
                  // Update metadata if available (useful for manual tracking)
                  prompt: pollResult.metadata?.prompt || task.prompt,
                  model: pollResult.metadata?.model || task.model,
                  aspectRatio: pollResult.metadata?.aspectRatio || task.aspectRatio
              };
              hasChanges = true;
            }
          } else if (pollResult.status === 'failed') {
            const index = updatedHistory.findIndex(t => t.taskId === task.taskId);
            if (index !== -1) {
              updatedHistory[index] = { 
                  ...task, 
                  status: 'failed',
                  prompt: pollResult.metadata?.prompt || task.prompt,
              };
              hasChanges = true;
            }
          }
        } catch (e) {
          console.error(`Error polling task ${task.taskId}`, e);
        }
      }

      if (hasChanges) {
        setVideoHistory(updatedHistory);
      }
    }, 8000); // Poll every 8 seconds

    return () => clearInterval(pollInterval);
  }, [videoHistory, apiKey]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImages(prev => ({ ...prev, [index]: e.target.files![0] }));
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const addRefSlot = () => {
    setRefSlotIds(prev => [...prev, nextSlotIdRef.current]);
    nextSlotIdRef.current += 1;
  };

  const removeRefSlot = (idToRemove: number) => {
    setRefSlotIds(prev => prev.filter(id => id !== idToRemove));
    // Clean up data
    setUploadedImages(prev => {
        const next = { ...prev };
        delete next[idToRemove];
        return next;
    });
  };

  const enhancePrompt = async () => {
    if (!prompt.trim() || !process.env.API_KEY) return;
    setIsEnhancing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Rewrite the following video prompt to be more cinematic, detailed, and suitable for a high-quality AI video generator. Keep it under 50 words. Focus on lighting, camera angle, and movement. Prompt: "${prompt}"`,
      });
      
      if (response.text) {
        setPrompt(response.text.trim());
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleExtendClick = (taskId: string) => {
      setGenType('EXTEND_VIDEO');
      setSourceTaskId(taskId);
      setPrompt("Continue the video smoothly...");
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateVideo = async () => {
    if (!prompt.trim() && genType !== 'REFERENCE_2_VIDEO' && genType !== 'FIRST_AND_LAST_FRAMES_2_VIDEO') return;
    if (genType === 'EXTEND_VIDEO' && !sourceTaskId.trim()) {
        setError("Source Task ID is required for extension.");
        return;
    }

    if (!apiKey || !imgbbKey) {
        setError("API Keys missing. Please configure them in Settings.");
        return;
    }

    setError(null);
    setIsUploading(true);

    try {
      let taskId: string;

      if (genType === 'EXTEND_VIDEO') {
          // --- EXTEND FLOW ---
          taskId = await extendVeoVideo(apiKey, {
              taskId: sourceTaskId,
              prompt: prompt
          });
      } else {
          // --- CREATE FLOW ---
          // 1. Upload Images to ImgBB
          const imageUrls: string[] = [];
          
          let activeIndices: number[] = [];
          if (genType === 'REFERENCE_2_VIDEO') {
            activeIndices = refSlotIds;
          } else if (genType === 'FIRST_AND_LAST_FRAMES_2_VIDEO') {
            activeIndices = [0, 1]; 
          }

          const filledIndices = activeIndices.filter(idx => uploadedImages[idx]);

          // Validate Image Count
          if (genType === 'FIRST_AND_LAST_FRAMES_2_VIDEO') {
              if (!uploadedImages[0]) {
                 throw new Error("First/Last Frames mode requires at least the First Frame (Start).");
              }
          }
          if (genType === 'REFERENCE_2_VIDEO' && filledIndices.length === 0) {
              throw new Error("Reference mode requires at least one image.");
          }

          for (const idx of activeIndices) {
              const file = uploadedImages[idx];
              if (file) {
                  const url = await uploadToImgbb(file, imgbbKey);
                  imageUrls.push(url);
              }
          }

          // 2. Create Task
          taskId = await createVeoTask(apiKey, {
              prompt,
              model,
              aspectRatio,
              generationType: genType,
              imageUrls: imageUrls.length > 0 ? imageUrls : undefined
          });
      }

      // 3. Add to History
      const newTask: VideoTask = {
        taskId,
        prompt: prompt || `Video from ${genType}`,
        status: 'processing',
        resultUrl: null,
        createdAt: Date.now(),
        model: genType === 'EXTEND_VIDEO' ? 'veo3 (extended)' : model,
        aspectRatio: genType === 'EXTEND_VIDEO' ? 'same as original' : aspectRatio
      };

      setVideoHistory(prev => [newTask, ...prev]);
      
      // Reset inputs slightly
      if (genType === 'TEXT_2_VIDEO' || genType === 'EXTEND_VIDEO') setPrompt('');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start generation.");
    } finally {
      setIsUploading(false);
    }
  };

  const trackManualTask = () => {
    if (!manualTaskId.trim()) return;
    if (videoHistory.some(t => t.taskId === manualTaskId)) {
      setError("Task already being tracked.");
      return;
    }

    const newTask: VideoTask = {
      taskId: manualTaskId.trim(),
      prompt: "Manually Tracked Task (Waiting for details...)",
      status: 'processing',
      resultUrl: null,
      createdAt: Date.now(),
      model: 'veo3' // Assumption, will be updated by polling
    };

    setVideoHistory(prev => [newTask, ...prev]);
    setManualTaskId('');
  };

  const clearHistory = () => {
    if (confirm("Clear all video history?")) {
      setVideoHistory([]);
    }
  };

  const deleteItem = (taskId: string) => {
    setVideoHistory(prev => prev.filter(t => t.taskId !== taskId));
  };

  const renderImageUploader = (label: string, index: number) => {
    const file = uploadedImages[index];
    return (
        <div className="space-y-2 h-full">
            <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
            <div className="relative aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors flex flex-col items-center justify-center overflow-hidden">
                {file ? (
                    <>
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button 
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                            title="Clear Image"
                        >
                            <X size={12} />
                        </button>
                    </>
                ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-xs text-slate-400">Upload</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileChange(index, e)} 
                        />
                    </label>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
            <Video size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kie Veo Video Creator</h3>
            <p className="text-xs text-slate-500">Generate high-quality AI videos using Veo models</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Generation Type Selector */}
          <div className="grid grid-cols-4 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
            {[
                { id: 'TEXT_2_VIDEO', label: 'Text to Video', icon: <Video size={14} /> },
                { id: 'FIRST_AND_LAST_FRAMES_2_VIDEO', label: 'First/Last Frame', icon: <Film size={14} /> },
                { id: 'REFERENCE_2_VIDEO', label: 'Reference Image', icon: <LucideImage size={14} /> },
                { id: 'EXTEND_VIDEO', label: 'Extend Video', icon: <FastForward size={14} /> }
            ].map((type) => (
                <button
                    key={type.id}
                    onClick={() => setGenType(type.id as VeoGenerationType)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        genType === type.id 
                        ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {type.icon}
                    <span className="hidden sm:inline">{type.label}</span>
                </button>
            ))}
          </div>

          {/* Extend Video Specific Inputs */}
          {genType === 'EXTEND_VIDEO' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-2">
                      <Link size={14} />
                      Source Task ID (Original Video)
                  </label>
                  <input
                    type="text"
                    value={sourceTaskId}
                    onChange={(e) => setSourceTaskId(e.target.value)}
                    placeholder="Enter the Task ID of the video you want to extend..."
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-blue-600 mt-2 opacity-80">
                      Tip: You can easily autofill this by clicking the "Extend" button on any completed video in the history below.
                  </p>
              </div>
          )}

          {/* Common Prompt Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                {genType === 'EXTEND_VIDEO' ? 'Extension Prompt (What happens next?)' : 'Video Prompt'}
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={genType === 'EXTEND_VIDEO' ? "Describe how the video continues..." : (genType === 'TEXT_2_VIDEO' ? "Describe your video scene in detail..." : "Describe movement and lighting...")}
                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none text-sm leading-relaxed"
              />
              <button
                onClick={enhancePrompt}
                disabled={isEnhancing || !prompt}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Magic Enhance
              </button>
            </div>
          </div>

          {/* Dynamic Image Inputs (Hidden for Text & Extend) */}
          {(genType !== 'TEXT_2_VIDEO' && genType !== 'EXTEND_VIDEO') && (
              <div className="animate-in fade-in duration-300 space-y-4">
                {genType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && (
                    <div className="grid grid-cols-2 gap-4">
                        {renderImageUploader("First Frame (Start)", 0)}
                        {renderImageUploader("Last Frame (Optional)", 1)}
                    </div>
                )}
                
                {genType === 'REFERENCE_2_VIDEO' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {refSlotIds.map((slotId, index) => (
                                <div key={slotId} className="relative group">
                                    {renderImageUploader(`Reference Image ${index + 1}`, slotId)}
                                    {refSlotIds.length > 1 && (
                                        <button
                                            onClick={() => removeRefSlot(slotId)}
                                            className="absolute -top-1 -right-1 z-10 bg-white text-slate-400 hover:text-red-500 rounded-full p-1.5 shadow-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Slot"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addRefSlot}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-xl transition-colors border border-blue-200 border-dashed w-full justify-center"
                        >
                            <Plus size={16} />
                            Add Another Image
                        </button>
                    </div>
                )}
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
             {/* Model & Aspect Ratio Config */}
             <div className="space-y-4">
                {/* Disable Model/Ratio selection for Extend Mode as it inherits */}
                <div className={`space-y-4 ${genType === 'EXTEND_VIDEO' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Model Quality</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setModel('veo3')}
                                disabled={genType === 'REFERENCE_2_VIDEO'} 
                                className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                    model === 'veo3' 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                } ${genType === 'REFERENCE_2_VIDEO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Veo 3 (High)
                            </button>
                            <button
                                onClick={() => setModel('veo3_fast')}
                                className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                    model === 'veo3_fast' 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                Veo 3 Fast
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Aspect Ratio</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setAspectRatio('9:16')}
                                disabled={genType === 'REFERENCE_2_VIDEO'}
                                className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                    aspectRatio === '9:16' 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                } ${genType === 'REFERENCE_2_VIDEO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                9:16 (Portrait)
                            </button>
                            <button
                                onClick={() => setAspectRatio('16:9')}
                                className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                                    aspectRatio === '16:9' 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                16:9 (Landscape)
                            </button>
                        </div>
                    </div>
                </div>
                {genType === 'EXTEND_VIDEO' && (
                    <div className="text-xs text-slate-500 italic mt-2">
                        * Extension inherits settings from the original video.
                    </div>
                )}
             </div>
             
             <div className="flex flex-col justify-end space-y-3">
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                    onClick={generateVideo}
                    disabled={isUploading || (!prompt && genType === 'TEXT_2_VIDEO')}
                    className="w-full h-[50px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{genType === 'EXTEND_VIDEO' ? 'Extending Video...' : 'Processing Task...'}</span>
                        </>
                    ) : (
                        <>
                            {genType === 'EXTEND_VIDEO' ? <FastForward size={18} /> : <Clapperboard size={18} />}
                            <span>{genType === 'EXTEND_VIDEO' ? 'Extend Video' : 'Start Generation'}</span>
                        </>
                    )}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Manual Tracking */}
      <div className="flex gap-2">
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
             </div>
             <input
                type="text"
                placeholder="Track existing Task ID (e.g. veo_task_123...)"
                value={manualTaskId}
                onChange={(e) => setManualTaskId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
             />
          </div>
          <button 
             onClick={trackManualTask}
             disabled={!manualTaskId}
             className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50"
          >
             Track
          </button>
      </div>

      {/* History Section */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Clock size={20} className="text-purple-600"/> 
               Generation History
            </h3>
            {videoHistory.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                    <Trash2 size={12} /> Clear
                </button>
            )}
         </div>

         {videoHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Film size={48} className="mx-auto mb-3 opacity-20"/>
                <p>No video tasks yet.</p>
            </div>
         ) : (
            <div className="grid gap-4">
                {videoHistory.map((task) => (
                    <div key={task.taskId} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
                        {/* Delete Button */}
                        <button 
                            onClick={() => deleteItem(task.taskId)}
                            className="absolute top-3 right-3 text-slate-300 hover:text-red-500 z-10 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 pr-8">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    task.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700 animate-pulse'
                                }`}>
                                    {task.status.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">{new Date(task.createdAt).toLocaleTimeString()}</span>
                            </div>

                            <p className="text-sm text-slate-800 font-medium" title={task.prompt}>{task.prompt}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                    <MonitorPlay size={10} /> {task.model}
                                </span>
                                {task.aspectRatio && (
                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                        <Ratio size={10} /> {task.aspectRatio}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    <span className="select-all">ID: {task.taskId}</span>
                                    <CopyButton text={task.taskId} />
                                </div>
                            </div>
                            
                            {task.status === 'processing' && (
                                <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Rendering in cloud (may take 2-5 mins)...
                                </div>
                            )}
                        </div>

                        {task.status === 'completed' && task.resultUrl && (
                             <div className="w-full bg-slate-900 relative group border-t border-slate-100">
                                <video 
                                    src={task.resultUrl} 
                                    controls 
                                    className="w-full max-h-[500px] object-contain mx-auto"
                                />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={task.resultUrl} 
                                        download 
                                        className="p-2 bg-white/90 rounded-lg hover:bg-white text-slate-900 shadow-sm"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                </div>
                                {/* Contextual Extend Button */}
                                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleExtendClick(task.taskId)}
                                        className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm backdrop-blur-sm flex items-center gap-1.5"
                                        title="Create a new video that extends this one"
                                    >
                                        <FastForward size={14} /> Extend
                                    </button>
                                </div>
                             </div>
                        )}
                    </div>
                ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default VideoAdGenerator;

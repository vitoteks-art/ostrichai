import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Video, Sparkles, Clapperboard, Download, Loader2, AlertCircle, Plus, Upload, X, Image as LucideImage, Film, Search, Trash2, Clock, MonitorPlay, Ratio, FastForward, Link, CreditCard, ChevronDown, Package, Youtube } from 'lucide-react';
import { uploadToImgbb } from '../services/imgbbService';
import { createVeoTask, getVeoResult, extendVeoVideo } from '../services/kieVeoService';
import { VeoGenerationType, VeoModel, VideoTask } from '../types/kieVeo';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionService } from '../services/subscriptionService';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { useProjects } from '../hooks/useProjects';
import { YoutubeUploadModal } from './YoutubeUploadModal';

interface VideoUgcProps {
  apiKey: string;
  imgbbKey: string;
}

const VideoUgc: React.FC<VideoUgcProps> = ({ apiKey, imgbbKey }) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { createProject, updateProject, logActivity } = useProjects();

  // YouTube Upload Modal State
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedVideoForYoutube, setSelectedVideoForYoutube] = useState<{ url: string; title: string } | null>(null);
  // Scene Interface for Step 2
  interface Scene {
    id: string;
    prompt: string;
    model: VeoModel;
    aspectRatio: '16:9' | '9:16';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    taskId?: string;
    resultUrl?: string;
    sourceTaskId?: string; // For Extend Video chaining
  }

  // Steps: 1 = Concept/Inputs, 2 = Review/Generate
  const [step, setStep] = useState<1 | 2>(() => {
    const saved = localStorage.getItem('kie_ugc_step');
    return saved ? (parseInt(saved) as 1 | 2) : 1;
  });

  // Input States
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('kie_ugc_prompt') || '';
  });

  const [genType, setGenType] = useState<VeoGenerationType>(() => {
    return (localStorage.getItem('kie_ugc_genType') as VeoGenerationType) || 'TEXT_2_VIDEO';
  });

  // Global defaults for Step 1
  const [model, setModel] = useState<VeoModel>('veo3');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');

  // Multi-scene state
  const handleStartOver = () => {
    setScenes([]);
    setStep(1);
    setPrompt('');
    setProductName('');
    setContentFormat('Product Review'); // Reset to default
    setKeyFeatures('');
    setTargetAudience('');
    setVideoLength('16 seconds'); // Changed from 8 seconds in original
    setToneOfVoice('Professional'); // Reset to default
    setHook('');
    setNotes('');
    setSourceTaskId('');
    setRefSlotIds([0, 1]); // Reset to initial two slots
    setUploadedImages({});
    setImagePreviews({});
    // Clear localStorage
    localStorage.removeItem('kie_ugc_step');
    localStorage.removeItem('kie_ugc_scenes');
    localStorage.removeItem('kie_ugc_prompt');
    localStorage.removeItem('kie_ugc_genType');
  };
  const [scenes, setScenes] = useState<Scene[]>(() => {
    const saved = localStorage.getItem('kie_ugc_scenes');
    return saved ? JSON.parse(saved) : [];
  });

  // Content Details States
  const [productName, setProductName] = useState('');
  const [contentFormat, setContentFormat] = useState<string>('Product Review');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [videoLength, setVideoLength] = useState('8 seconds');
  const [toneOfVoice, setToneOfVoice] = useState<string>('Professional');
  const [hook, setHook] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Extend Mode specific state
  const [sourceTaskId, setSourceTaskId] = useState('');

  // Image Upload States
  // Using IDs to track dynamic slots. Initial slots: 0, 1.
  const [refSlotIds, setRefSlotIds] = useState<number[]>([0, 1]);
  const nextSlotIdRef = useRef(2);

  const [uploadedImages, setUploadedImages] = useState<Record<number, File | null>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Helper to convert File to data URL (CSP-compliant)
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

  // Sync Scenes with History (for polling updates)
  useEffect(() => {
    if (scenes.length === 0) return;

    let hasUpdates = false;
    const updatedScenes = scenes.map(scene => {
      if (scene.taskId) {
        const historyItem = videoHistory.find(h => h.taskId === scene.taskId);
        if (historyItem) {
          if (historyItem.status !== scene.status || historyItem.resultUrl !== scene.resultUrl) {
            hasUpdates = true;
            return {
              ...scene,
              status: historyItem.status as any,
              resultUrl: historyItem.resultUrl || undefined
            };
          }
        }
      }
      return scene;
    });

    if (hasUpdates) {
      setScenes(updatedScenes);
    }
  }, [videoHistory]);

  // Constraint Enforcement
  useEffect(() => {
    if (genType === 'REFERENCE_2_VIDEO') {
      setModel('veo3_fast');
      setAspectRatio('16:9');
    }
  }, [genType]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('kie_ugc_step', step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem('kie_ugc_prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem('kie_ugc_genType', genType);
  }, [genType]);

  useEffect(() => {
    localStorage.setItem('kie_ugc_scenes', JSON.stringify(scenes));
  }, [scenes]);

  // Background Polling
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const pendingTasks = videoHistory.filter(t => t.status === 'processing');
      if (pendingTasks.length === 0) return;

      const updatedHistory = [...videoHistory];
      let hasChanges = false;

      // Get project map from localStorage
      const projectMap = JSON.parse(localStorage.getItem('kie_video_project_map') || '{}');

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

              // Update project status and log activity
              const projectId = projectMap[task.taskId];
              if (projectId && user) {
                try {
                  await updateProject(projectId, {
                    status: 'completed',
                    project_metadata: {
                      prompt: task.prompt,
                      taskId: task.taskId,
                      resultUrl: pollResult.resultUrl,
                      completedAt: new Date().toISOString()
                    }
                  });

                  await logActivity({
                    action: 'Video generation completed',
                    details: `Video generation completed successfully (Task ID: ${task.taskId})`,
                    activity_metadata: {
                      taskId: task.taskId,
                      prompt: task.prompt,
                      resultUrl: pollResult.resultUrl
                    }
                  });
                } catch (updateError) {
                  console.error('Failed to update project:', updateError);
                }
              }
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

              // Update project status and log activity
              const projectId = projectMap[task.taskId];
              if (projectId && user) {
                try {
                  await updateProject(projectId, {
                    status: 'failed'
                  });

                  await logActivity({
                    action: 'Video generation failed',
                    details: `Video generation failed (Task ID: ${task.taskId})`
                  });
                } catch (updateError) {
                  console.error('Failed to update project:', updateError);
                }
              }
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
  }, [videoHistory, apiKey, user, updateProject, logActivity]);

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImages(prev => ({ ...prev, [index]: file }));
      // Convert to data URL for preview
      try {
        const dataUrl = await fileToDataURL(file);
        setImagePreviews(prev => ({ ...prev, [index]: dataUrl }));
      } catch (error) {
        console.error('Error converting file to data URL:', error);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setImagePreviews(prev => {
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
    setImagePreviews(prev => {
      const next = { ...prev };
      delete next[idToRemove];
      return next;
    });
  };

  const generateDetailedPrompt = async () => {
    // Collect all inputs
    const inputs = {
      productName,
      contentFormat,
      keyFeatures,
      targetAudience,
      videoLength,
      toneOfVoice,
      hook,
      notes,
      // Technical/Configuration fields
      genType,
      model,
      aspectRatio,
      sourceTaskId,
      currentPrompt: prompt // Send what's currently in the box as 'currentPrompt'
    };

    // Validation: Require at least Product Name or some details to generate something meaningful
    if (!productName && !keyFeatures && !prompt) {
      toast.error("Please fill in some content details (Product Name, Key Features) to generate a prompt.");
      return;
    }

    setIsEnhancing(true);

    try {
      // Deduct 2 credits for AI prompt generation
      const creditsNeeded = 2;
      if (user) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'ai_prompt_generation', creditsNeeded);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (subscription && subscription.credit_balance < creditsNeeded) {
            errorMsg = `Insufficient credits for AI prompt generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}.`;
          }
          throw new Error(errorMsg);
        }
        toast.success(`✅ ${creditsNeeded} credits deducted for AI prompt generation`);
      }

      /* 
       * Replaced direct Gemini call with n8n webhook as requested.
       * Webhook URL: https://n8n.getostrichai.com/webhook/ugc-prompt
       */
      const response = await fetch('https://n8n.getostrichai.com/webhook/ugc-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      const data = await response.json();

      let newScenes: Scene[] = [];

      // Check if data is array (Multi-scene response)
      if (Array.isArray(data)) {
        newScenes = data.map((item: any, index: number) => {
          // Extract data from requestBody if present (n8n structure), otherwise use direct properties
          const source = item.requestBody || item;

          return {
            id: `scene-${Date.now()}-${index}`,
            prompt: typeof source === 'string' ? source : (source.prompt || source.text || source.output || JSON.stringify(source)),
            model: (source.model as VeoModel) || 'veo3',
            aspectRatio: (source.aspectRatio as '16:9' | '9:16') || '9:16',
            status: 'pending'
          };
        });
      } else {
        // Single response
        let generatedPrompt = '';
        if (typeof data === 'string') {
          generatedPrompt = data;
        } else if (data.prompt) {
          generatedPrompt = data.prompt;
        } else if (data.text) {
          generatedPrompt = data.text;
        } else if (data.output) {
          generatedPrompt = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        } else {
          // Fallback: dump the object
          generatedPrompt = JSON.stringify(data);
        }

        if (generatedPrompt) {
          newScenes = [{
            id: `scene-${Date.now()}`,
            prompt: generatedPrompt.trim(),
            model: model, // Default to current state
            aspectRatio: aspectRatio, // Default to current state
            status: 'pending'
          }];
        }
      }

      if (newScenes.length > 0) {
        setScenes(newScenes);
        // setPrompt(newScenes[0].prompt); // REMOVED: Keep user's original input in Step 1
        setStep(2); // Auto-advance to step 2
        toast.success(`✨ Generated ${newScenes.length} scene(s)! Please review below.`);
      } else {
        toast.error("Received empty or invalid response from generation service.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate prompt: " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleExtendClick = (taskId: string) => {
    setGenType('EXTEND_VIDEO');
    setSourceTaskId(taskId);
    setPrompt("Continue the video smoothly...");
    // Create a single scene for extension
    setScenes([{
      id: `extend-${Date.now()}`,
      prompt: "Continue the video smoothly...",
      model: 'veo3',
      aspectRatio: '9:16', // Gets overridden anyway
      status: 'pending'
    }]);
    setStep(2); // Auto-advance to step 2
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSkip = () => {
    // When manually ignoring generation, create a scene from current inputs
    if (scenes.length === 0 || (scenes.length === 1 && scenes[0].prompt !== prompt)) {
      setScenes([{
        id: `manual-${Date.now()}`,
        prompt: prompt,
        model: model,
        aspectRatio: aspectRatio,
        status: 'pending'
      }]);
    }
    setStep(2);
  };

  const updateScene = (index: number, updates: Partial<Scene>) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], ...updates };
    setScenes(updated);
  };

  const generateVideo = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    // Determine effective Source Task ID for this scene
    // Priority: Scene-specific ID -> Global Source ID
    const effectiveSourceTaskId = scene.sourceTaskId || sourceTaskId;

    if (!scene.prompt.trim() && genType !== 'REFERENCE_2_VIDEO' && genType !== 'FIRST_AND_LAST_FRAMES_2_VIDEO') {
      toast.error('Please enter a prompt for this scene');
      return;
    }

    if (genType === 'EXTEND_VIDEO' && !effectiveSourceTaskId.trim()) {
      setError("Source Task ID is required for extension.");
      toast.error("Please enter the Source Task ID to extend the video");
      return;
    }

    if (!apiKey || !imgbbKey) {
      setError("API Keys missing. Please configure them in Settings.");
      toast.error("API Keys missing. Please configure them in Settings.");
      return;
    }

    setError(null);
    // Mark scene as processing locally first
    const updatedScenes = [...scenes];
    updatedScenes[sceneIndex].status = 'processing';
    setScenes(updatedScenes);

    // Global loading state (optional, maybe not needed if per-card)
    // setIsUploading(true); 

    let projectId: string | null = null;

    try {
      // Calculate credits needed based on model
      const creditsNeeded = genType === 'EXTEND_VIDEO' ? 20 :
        scene.model === 'veo3' ? 80 :
          scene.model === 'veo3_fast' ? 20 : 20;

      // Check credit balance and deduct credits for video generation
      if (user) {
        const creditCheck = await SubscriptionService.useCredits(user.id, 'video_generation', creditsNeeded);
        if (!creditCheck.success) {
          let errorMsg = creditCheck.error || 'Failed to process credit deduction';
          if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
            errorMsg = 'Credit system error. Please try again later.';
          } else if (subscription && subscription.credit_balance < creditsNeeded) {
            errorMsg = `Insufficient credits for video generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
          }
          setError(errorMsg);
          updatedScenes[sceneIndex].status = 'failed';
          setScenes([...updatedScenes]);
          return;
        }

        toast.success(`✅ ${creditsNeeded} credits deducted for video generation`);
      }

      // Create project record first
      const projectTitle = genType === 'EXTEND_VIDEO'
        ? `Video Extend: ${scene.prompt.substring(0, 50)}...`
        : `Video UGC: ${scene.prompt.substring(0, 50)}...`;

      const projectResult = await createProject({
        title: projectTitle,
        type: 'video',
        status: 'processing',
        project_metadata: {
          prompt: scene.prompt,
          generationType: genType,
          model: genType === 'EXTEND_VIDEO' ? 'veo3 (extended)' : scene.model,
          aspectRatio: genType === 'EXTEND_VIDEO' ? 'same as original' : scene.aspectRatio,
          sourceTaskId: genType === 'EXTEND_VIDEO' ? effectiveSourceTaskId : undefined,
          submittedAt: new Date().toISOString()
        }
      });

      if (!projectResult.success) {
        throw new Error('Failed to create project record');
      }

      projectId = projectResult.data?.id || null;

      let taskId: string;

      if (genType === 'EXTEND_VIDEO') {
        // --- EXTEND FLOW ---
        taskId = await extendVeoVideo(apiKey, {
          taskId: effectiveSourceTaskId,
          prompt: scene.prompt
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
          prompt: scene.prompt,
          model: scene.model,
          aspectRatio: scene.aspectRatio,
          generationType: genType,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        });
      }

      // Update project with task ID
      if (projectId) {
        await updateProject(projectId, {
          project_metadata: {
            prompt: scene.prompt,
            generationType: genType,
            model: genType === 'EXTEND_VIDEO' ? 'veo3 (extended)' : scene.model,
            aspectRatio: genType === 'EXTEND_VIDEO' ? 'same as original' : scene.aspectRatio,
            sourceTaskId: genType === 'EXTEND_VIDEO' ? effectiveSourceTaskId : undefined,
            submittedAt: new Date().toISOString(),
            taskId: taskId
          }
        });
      }

      // Log activity
      await logActivity({
        action: genType === 'EXTEND_VIDEO' ? 'Started video extension' : 'Started video UGC generation',
        details: `${genType === 'EXTEND_VIDEO' ? 'Extending video' : 'Generating video'} (Task ID: ${taskId})`,
        activity_metadata: {
          prompt: scene.prompt,
          taskId: taskId,
          generationType: genType
        }
      });

      // 3. Add to History
      const newTask: VideoTask = {
        taskId,
        prompt: scene.prompt || `Video from ${genType}`,
        status: 'processing',
        resultUrl: null,
        createdAt: Date.now(),
        model: genType === 'EXTEND_VIDEO' ? 'veo3 (extended)' : scene.model,
        aspectRatio: genType === 'EXTEND_VIDEO' ? 'same as original' : scene.aspectRatio
      };

      // Store project ID in a map for later use in polling
      if (projectId) {
        // Store in localStorage for persistence across reloads
        const projectMap = JSON.parse(localStorage.getItem('kie_video_project_map') || '{}');
        projectMap[taskId] = projectId;
        localStorage.setItem('kie_video_project_map', JSON.stringify(projectMap));
      }

      setVideoHistory(prev => [newTask, ...prev]);

      // Update Scene State with Task ID
      const newScenesWithTask = [...scenes];
      newScenesWithTask[sceneIndex] = {
        ...newScenesWithTask[sceneIndex],
        status: 'processing',
        taskId: taskId
      };
      setScenes(newScenesWithTask);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start generation.");

      // Update scene status to failed
      const failedScenes = [...scenes];
      failedScenes[sceneIndex].status = 'failed';
      setScenes(failedScenes);

      // Update project status to failed if it exists
      if (projectId) {
        try {
          await updateProject(projectId, {
            status: 'failed'
          });
        } catch (updateError) {
          console.error('Failed to update project status:', updateError);
        }
      }

      // Log error activity
      if (user) {
        await logActivity({
          action: genType === 'EXTEND_VIDEO' ? 'Video extension failed' : 'Video UGC generation failed',
          details: `Failed to ${genType === 'EXTEND_VIDEO' ? 'extend video' : 'generate video'}: ${err.message || 'Unknown error'}`
        });
      }
    } finally {
      // setIsUploading(false);
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
    const preview = imagePreviews[index] || '';
    return (
      <div className="space-y-3 h-full">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="relative aspect-video bg-secondary/30 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center overflow-hidden">
          {file ? (
            <>
              <img src={preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground p-2 rounded-full transition-colors shadow-lg"
                title="Clear Image"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4">
              <Upload size={24} className="text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground font-medium">Upload Image</span>
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl overflow-hidden">
        <div className="border-b border-border p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Video size={24} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Video UGC Creator</h3>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? 'Step 1: Define Concept & Concept' : 'Step 2: Review & Generate'}
            </p>
          </div>
        </div>

        {/* Credit Balance Display */}
        {subscription && (
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 max-w-2xl mx-auto mt-6">
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
                <div className="text-right">
                  <p className="text-xs text-blue-700">Video generation costs</p>
                  <p className="text-sm font-semibold text-blue-800">
                    {model === 'veo3' ? '80 credits' : model === 'veo3_fast' ? '20 credits' : '20 credits'}/8s
                  </p>
                </div>
              </div>
              {(subscription.credit_balance || 0) < 20 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient credits for video generation. You need at least 20 credits. Please upgrade your plan or purchase additional credits.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 1: CONCEPT & INPUTS */}
        {step === 1 && (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

            {/* Generation Type Selector MOVED TO STEP 2 */}

            {/* Content Details Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Package size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Content Details</h3>
              </div>

              {/* Product / Brand Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Product / Brand Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Lumina Skin Serum"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Content Format */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Content Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {['Product Review', 'Unboxing Video', 'How-to / Tutorial', 'Before & After', 'TikTok/Reels Trend'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setContentFormat(format)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${contentFormat === format
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-foreground hover:border-primary/50'
                        }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Features & Benefits */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Key Features & Benefits
                </label>
                <textarea
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="- Hydrates skin instantly&#10;- Contains Hyaluronic acid&#10;- Lightweight formula"
                  className="w-full h-24 p-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Busy moms"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Video Length */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Video Length
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['8 seconds', '16 seconds', '24 seconds'].map((length) => (
                    <button
                      key={length}
                      onClick={() => setVideoLength(length)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${videoLength === length
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-foreground hover:border-primary/50'
                        }`}
                    >
                      {length}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone of Voice */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Tone of Voice
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['Casual & Friendly', 'Professional', 'High Energy'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setToneOfVoice(tone)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${toneOfVoice === tone
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-foreground hover:border-primary/50'
                        }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Advanced Options (Hook, Notes)</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAdvancedOptions && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Hook
                      </label>
                      <input
                        type="text"
                        value={hook}
                        onChange={(e) => setHook(e.target.value)}
                        placeholder="Opening line or hook..."
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes or requirements..."
                        className="w-full h-20 p-4 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Inputs MOVED TO STEP 2 */}

            {/* Common Prompt Input (Step 1) */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-lg font-semibold text-foreground">
                {genType === 'EXTEND_VIDEO' ? 'Extension Prompt (What happens next?)' : 'Video Prompt / Description'}
              </label>
              <p className="text-sm text-muted-foreground mb-2">
                Describe the video you want to generate. You can use the form above to help structure it, or write freely here.
              </p>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={genType === 'EXTEND_VIDEO' ? "Describe how the video continues..." : (genType === 'TEXT_2_VIDEO' ? "Describe your video scene in detail..." : "Describe movement and lighting...")}
                  className="w-full h-32 p-6 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Actions Step 1 */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleManualSkip}
                className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                Skip to Review
                <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={generateDetailedPrompt}
                disabled={isEnhancing}
                className="flex-[2] w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isEnhancing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Generate Prompt
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & GENERATE (MULTI-SCENE) */}
        {step === 2 && (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Review & Generate Scenes</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  &larr; Back to Inputs
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Generation Type Selector (Moved from Step 1) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-1 bg-secondary/30 rounded-xl border border-border">
              {[
                { id: 'TEXT_2_VIDEO', label: 'Text to Video', icon: <Video size={16} /> },
                { id: 'FIRST_AND_LAST_FRAMES_2_VIDEO', label: 'First/Last Frame', icon: <Film size={16} /> },
                { id: 'REFERENCE_2_VIDEO', label: 'Reference Image', icon: <LucideImage size={16} /> },
                { id: 'EXTEND_VIDEO', label: 'Extend Video', icon: <FastForward size={16} /> }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setGenType(type.id as VeoGenerationType);
                    // If switching to EXTEND_VIDEO and no scenes exist, create one
                    if (type.id === 'EXTEND_VIDEO' && scenes.length === 0) {
                      setScenes([{
                        id: `extend-${Date.now()}`,
                        prompt: "Continue the video smoothly...",
                        model: 'veo3',
                        aspectRatio: '9:16',
                        status: 'pending'
                      }]);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${genType === type.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Image Inputs (Moved from Step 1) */}
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

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

            <div className="space-y-6">
              {scenes.map((scene, index) => (
                <div key={scene.id} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                        Scene {index + 1}
                      </span>
                      {scene.status === 'completed' && <span className="text-xs text-green-500 flex items-center gap-1"><Sparkles size={12} /> Completed</span>}
                      {scene.status === 'failed' && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Failed</span>}
                      {scene.status === 'processing' && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Processing...</span>}
                    </div>

                    <textarea
                      value={scene.prompt}
                      onChange={(e) => updateScene(index, { prompt: e.target.value })}
                      className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                      placeholder="Scene description..."
                    />

                    {/* Scene-specific Extension Input */}
                    {genType === 'EXTEND_VIDEO' && (
                      <div className="mt-3 bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <label className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Link size={12} />
                          Source Task ID for this Scene
                        </label>
                        <input
                          type="text"
                          value={scene.sourceTaskId !== undefined ? scene.sourceTaskId : (index > 0 && scenes[index - 1].taskId ? scenes[index - 1].taskId : sourceTaskId)}
                          onChange={(e) => updateScene(index, { sourceTaskId: e.target.value })}
                          placeholder={index > 0 ? "Previous scene ID (Auto)" : "Global Source ID"}
                          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {index > 0 ? "Defaults to previous scene's Task ID if available, otherwise uses global." : "Defaults to Global Source ID."}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-white/5">
                      {/* Config Controls */}
                      <div className={`flex gap-4 ${genType === 'EXTEND_VIDEO' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Model</label>
                          <div className="flex bg-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateScene(index, { model: 'veo3' })}
                              disabled={genType === 'REFERENCE_2_VIDEO'}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${scene.model === 'veo3' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                              Veo 3
                            </button>
                            <button
                              onClick={() => updateScene(index, { model: 'veo3_fast' })}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${scene.model === 'veo3_fast' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                              Fast
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Ratio</label>
                          <div className="flex bg-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateScene(index, { aspectRatio: '9:16' })}
                              disabled={genType === 'REFERENCE_2_VIDEO'}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${scene.aspectRatio === '9:16' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                              9:16
                            </button>
                            <button
                              onClick={() => updateScene(index, { aspectRatio: '16:9' })}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${scene.aspectRatio === '16:9' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                              16:9
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-3">
                        {scene.resultUrl ? (
                          <div className="flex gap-2">
                            <a href={scene.resultUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors">
                              <Download size={16} /> Download
                            </a>
                            {/* Re-generate button could go here if needed */}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => generateVideo(index)}
                              disabled={
                                scene.status === 'processing' ||
                                !scene.prompt ||
                                (index > 0 && genType !== 'EXTEND_VIDEO') // Disable scenes 2+ unless in Extend Video mode
                              }
                              className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                              title={index > 0 && genType !== 'EXTEND_VIDEO' ? 'Switch to Extend Video mode to generate subsequent scenes' : ''}
                            >
                              {scene.status === 'processing' ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
                              {scene.status === 'processing' ? 'Generating...' : 'Generate Scene'}
                            </button>
                            {index > 0 && genType !== 'EXTEND_VIDEO' && (
                              <p className="text-xs text-yellow-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Switch to Extend Video mode
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Result Preview (Optional - Placeholder for now if we don't have a better player component ready) */}
                  {scene.resultUrl && (
                    <div className="bg-black/50 p-4 border-t border-white/5">
                      <video
                        src={scene.resultUrl}
                        controls
                        className="w-full max-h-[300px] rounded-lg object-contain bg-black"
                        poster="/poster-placeholder.png"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Tracking */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Track existing Task ID (e.g. veo_task_123...)"
            value={manualTaskId}
            onChange={(e) => setManualTaskId(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-colors"
          />
        </div>
        <button
          onClick={trackManualTask}
          disabled={!manualTaskId}
          className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Track
        </button>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
            <Clock size={24} className="text-primary" />
            Generation History
          </h3>
          {videoHistory.length > 0 && (
            <button onClick={clearHistory} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {videoHistory.length === 0 ? (
          <div className="text-center py-16 bg-card/30 rounded-2xl border border-dashed border-border">
            <Film size={64} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg">No video tasks yet.</p>
            <p className="text-muted-foreground/70 text-sm mt-2">Start creating your first UGC video above</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {videoHistory.map((task) => (
              <div key={task.taskId} className="backdrop-blur-lg bg-card/98 border-0 shadow-card rounded-2xl overflow-hidden flex flex-col relative">
                {/* Delete Button */}
                <button
                  onClick={() => deleteItem(task.taskId)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive z-10 p-2 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 pr-12">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      task.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 animate-pulse'
                      }`}>
                      {task.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground font-mono">{new Date(task.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-foreground font-medium leading-relaxed" title={task.prompt}>{task.prompt}</p>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-3">
                    <span className="bg-secondary/50 px-3 py-1 rounded-lg border border-border flex items-center gap-2">
                      <MonitorPlay size={12} /> {task.model}
                    </span>
                    {task.aspectRatio && (
                      <span className="bg-secondary/50 px-3 py-1 rounded-lg border border-border flex items-center gap-2">
                        <Ratio size={12} /> {task.aspectRatio}
                      </span>
                    )}
                    <span className="select-all font-mono text-xs bg-secondary/30 px-2 py-1 rounded">ID: {task.taskId}</span>
                  </div>

                  {task.status === 'processing' && (
                    <div className="flex items-center gap-3 text-sm text-primary mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Rendering in cloud (may take 2-5 mins)...</span>
                    </div>
                  )}
                </div>

                {task.status === 'completed' && task.resultUrl && (
                  <div className="w-full bg-black/90 relative group border-t border-border rounded-b-2xl overflow-hidden">
                    <video
                      src={task.resultUrl}
                      controls
                      className="w-full max-h-[500px] object-contain mx-auto"
                    />
                    <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={task.resultUrl}
                        download
                        className="p-3 bg-white/90 hover:bg-white text-foreground rounded-xl shadow-lg backdrop-blur-sm transition-colors"
                        title="Download Video"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        onClick={() => {
                          setSelectedVideoForYoutube({ url: task.resultUrl!, title: task.prompt });
                          setYoutubeModalOpen(true);
                        }}
                        className="p-3 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-lg backdrop-blur-sm transition-colors"
                        title="Upload to YouTube"
                      >
                        <Youtube size={18} />
                      </button>
                    </div>
                    {/* Contextual Extend Button */}
                    <div className="absolute top-4 left-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExtendClick(task.taskId)}
                        className="px-4 py-2 bg-primary/90 hover:bg-primary text-primary-foreground text-sm font-medium rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2 transition-colors"
                        title="Create a new video that extends this one"
                      >
                        <FastForward size={16} /> Extend Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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

export default VideoUgc;

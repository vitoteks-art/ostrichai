import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft,
  ArrowRight, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Send,
  Download,
  Copy,
  Pencil,
  Settings2,
  Hash
} from 'lucide-react';
import { 
  AppState, 
  Platform, 
  AppStage 
} from './types';
import { 
  PLATFORMS, 
  STAGE_LABELS, 
  STAGE_PROGRESS,
  IMAGE_MODELS,
  ASPECT_RATIOS,
  RESOLUTIONS,
  IMAGE_FORMATS
} from './constants';
import { api } from './services/api';
import { Button, Card, LoadingSpinner, ProgressBar, FeedbackModal } from './components/ui';

// Utility for creating a simple UUID-like string
const generateUserId = () => 'user_' + Math.random().toString(36).substr(2, 9);

// Utility to strip markdown formatting
const cleanMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **
    .replace(/__(.*?)__/g, '$1')     // Bold __
    .replace(/\*(.*?)\*/g, '$1')     // Italic *
    .replace(/_(.*?)_/g, '$1')       // Italic _
    .replace(/^#+\s/gm, '')          // Headers (## Title)
    .replace(/`/g, '')               // Code blocks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url) -> text
    .trim();
};

const App = () => {
  // --- State Management ---
  const [state, setState] = useState<AppState>({
    stage: 'topic_input',
    isLoading: false,
    error: null,
    userId: '', // Will be set on mount
    platform: 'twitter',
    topic: '',
    generatedTitles: [],
    selectedTitle: '',
    generatedContent: '',
    generatedImagePrompt: '',
    generatedImageUrl: '',
    generatedTags: [],
    finalPost: null,
    isRegenerating: false,
    feedbackText: '',
    imageSettings: {
        model: 'google/nano-banana', // Default to Base
        aspectRatio: '1:1',
        resolution: '1K',
        format: 'image/png'
    }
  });

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Initialize User ID on mount
  useEffect(() => {
    setState(prev => ({ ...prev, userId: generateUserId() }));
  }, []);

  // --- Helpers ---
  const navigateTo = (targetStage: AppStage) => {
    setState(prev => ({ ...prev, stage: targetStage }));
  };

  // --- Handlers ---

  const handleError = (error: any) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      error: error.message || "An unexpected error occurred." 
    }));
  };

  const handleStart = async () => {
    if (!state.topic.trim()) {
      setState(prev => ({ ...prev, error: "Please enter a topic to begin." }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.generateTitles({
        stage: 'generate_titles',
        platform: state.platform,
        topic: state.topic,
        user_id: state.userId
      });
      
      // Clean titles immediately
      const cleanedTitles = response.titles.map(cleanMarkdown);

      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'titles',
        generatedTitles: cleanedTitles,
        selectedTitle: cleanedTitles[0] // Select first by default
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleRegenerateTitles = async (feedback: string) => {
    setFeedbackModalOpen(false);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.regenerateTitles({
        stage: 'regenerate_titles',
        platform: state.platform,
        topic: state.topic,
        user_id: state.userId,
        feedback: feedback,
        rejected_titles: state.generatedTitles
      });

      // Clean titles immediately
      const cleanedTitles = response.titles.map(cleanMarkdown);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        generatedTitles: cleanedTitles,
        selectedTitle: cleanedTitles[0]
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleSelectTitle = (title: string) => {
    setState(prev => ({ ...prev, selectedTitle: title }));
  };

  const handleTitleChange = (index: number, newValue: string) => {
    const newTitles = [...state.generatedTitles];
    newTitles[index] = newValue;
    setState(prev => ({
      ...prev,
      generatedTitles: newTitles,
      selectedTitle: newValue
    }));
  };

  const handleApproveTitle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.generateContent({
        stage: 'generate_content',
        platform: state.platform,
        topic: state.topic,
        approved_title: state.selectedTitle,
        user_id: state.userId
      });
      
      // Clean content immediately
      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'content',
        generatedContent: cleanMarkdown(response.content)
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleRegenerateContent = async (feedback: string) => {
    setFeedbackModalOpen(false);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.regenerateContent({
        stage: 'regenerate_content',
        platform: state.platform,
        topic: state.topic,
        approved_title: state.selectedTitle,
        user_id: state.userId,
        feedback: feedback,
        previous_content: state.generatedContent
      });
      
      // Clean content immediately
      setState(prev => ({
        ...prev,
        isLoading: false,
        generatedContent: cleanMarkdown(response.content)
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleApproveContent = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.generateImagePrompt({
        stage: 'generate_image_prompt',
        platform: state.platform,
        topic: state.topic,
        approved_title: state.selectedTitle,
        approved_content: state.generatedContent,
        user_id: state.userId
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'image_prompt',
        generatedImagePrompt: response.image_prompt
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleRegenerateImagePrompt = async (feedback: string) => {
    setFeedbackModalOpen(false);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.regenerateImagePrompt({
        stage: 'regenerate_image_prompt',
        platform: state.platform,
        user_id: state.userId,
        approved_content: state.generatedContent,
        feedback: feedback,
        previous_prompt: state.generatedImagePrompt
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        generatedImagePrompt: response.image_prompt
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleGenerateImage = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.generateImage({
        stage: 'generate_image',
        platform: state.platform,
        approved_image_prompt: state.generatedImagePrompt,
        user_id: state.userId,
        // Pass selected image settings
        model: state.imageSettings.model,
        aspect_ratio: state.imageSettings.aspectRatio,
        resolution: state.imageSettings.resolution,
        format: state.imageSettings.format
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'image_generation',
        generatedImageUrl: response.image_url
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleGenerateTags = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.generateTags({
        stage: 'generate_tags',
        platform: state.platform,
        topic: state.topic,
        approved_title: state.selectedTitle,
        approved_content: state.generatedContent,
        user_id: state.userId
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'tags',
        generatedTags: response.tags
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleRegenerateTags = async (feedback: string) => {
    setFeedbackModalOpen(false);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.regenerateTags({
        stage: 'regenerate_tags',
        platform: state.platform,
        topic: state.topic,
        approved_title: state.selectedTitle,
        approved_content: state.generatedContent,
        user_id: state.userId,
        feedback: feedback,
        previous_tags: state.generatedTags
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        generatedTags: response.tags
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleFinalize = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.finalizePost({
        stage: 'finalize_post',
        platform: state.platform,
        approved_title: state.selectedTitle,
        approved_content: state.generatedContent,
        approved_image_url: state.generatedImageUrl,
        approved_tags: state.generatedTags,
        user_id: state.userId
      });
      
      // Clean final post content immediately
      const cleanedFinalPost = {
          ...response.final_post,
          title: cleanMarkdown(response.final_post.title),
          content: cleanMarkdown(response.final_post.content)
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'final',
        finalPost: cleanedFinalPost
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      stage: 'topic_input',
      topic: '',
      generatedTitles: [],
      generatedContent: '',
      generatedImagePrompt: '',
      generatedImageUrl: '',
      generatedTags: [],
      finalPost: null,
      error: null
    }));
  };

  const handleImageSettingChange = (key: keyof AppState['imageSettings'], value: string) => {
      setState(prev => ({
          ...prev,
          imageSettings: {
              ...prev.imageSettings,
              [key]: value
          }
      }));
  };

  // --- Render Helpers ---

  const renderHeader = () => {
    const activePlatform = PLATFORMS.find(p => p.id === state.platform);
    const PlatformIcon = activePlatform?.icon || Wand2;

    return (
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${activePlatform?.color || 'bg-primary-600 text-white'}`}>
                <PlatformIcon size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">SocialFlow AI</h1>
                <p className="text-xs text-slate-500 font-medium">{STAGE_LABELS[state.stage]}</p>
              </div>
            </div>
            {state.stage !== 'topic_input' && (
              <button onClick={handleReset} className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100">
                Start Over
              </button>
            )}
          </div>
          <ProgressBar progress={STAGE_PROGRESS[state.stage]} />
        </div>
      </div>
    );
  };

  const renderInputStage = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Choose Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setState(prev => ({ ...prev, platform: p.id }))}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                state.platform === p.id 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${p.id === state.platform ? p.color : 'bg-slate-100 text-slate-500'}`}>
                <p.icon size={24} />
              </div>
              <span className={`font-medium ${state.platform === p.id ? 'text-slate-900' : 'text-slate-500'}`}>{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">What's your post about?</h2>
        <Card className="p-0 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
          <textarea
            value={state.topic}
            onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value, error: null }))}
            placeholder="e.g., Announcing our new eco-friendly coffee cups made from recycled bamboo..."
            className="w-full h-40 p-6 text-lg text-slate-900 placeholder:text-slate-400 resize-none outline-none bg-transparent"
          />
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Be specific for better results</span>
                {state.generatedTitles.length > 0 && (
                    <Button variant="outline" onClick={() => navigateTo('titles')} className="text-xs px-3 py-1.5 h-auto">
                        Forward <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                )}
            </div>
            <Button onClick={handleStart} icon={Wand2} disabled={!state.topic.trim()}>
              Generate Ideas
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );

  const renderTitlesStage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Select a Hook</h2>
        <Button variant="outline" icon={RefreshCw} onClick={() => setFeedbackModalOpen(true)}>
          Regenerate
        </Button>
      </div>
      <div className="space-y-3">
        {state.generatedTitles.map((title, idx) => {
          const isSelected = state.selectedTitle === title;
          return (
          <Card 
            key={idx} 
            selected={isSelected} 
            onClick={() => handleSelectTitle(title)}
            className="cursor-pointer group hover:scale-[1.01]"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-300'}`}>
                {isSelected && <CheckCircle2 size={12} className="text-white" />}
              </div>
              
              {isSelected ? (
                 <div className="w-full">
                    <textarea
                        value={title}
                        onChange={(e) => handleTitleChange(idx, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                        className="w-full bg-transparent border-none outline-none text-lg font-medium text-slate-900 resize-none p-0 focus:ring-0 leading-relaxed font-sans"
                        rows={2}
                        autoFocus
                    />
                    <p className="text-xs text-primary-600 mt-2 flex items-center font-medium opacity-80">
                        <Pencil size={12} className="mr-1" /> Edit to refine
                    </p>
                 </div>
              ) : (
                <p className="text-lg leading-relaxed text-slate-600 font-medium">
                    {title}
                </p>
              )}
            </div>
          </Card>
        )})}
      </div>
      <div className="sticky bottom-6 flex justify-between items-center pt-4">
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigateTo('topic_input')} className="shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {!!state.generatedContent && (
                <Button variant="outline" onClick={() => navigateTo('content')} className="shadow-sm">
                    Forward <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            )}
        </div>
        <Button onClick={handleApproveTitle} className="shadow-xl">
           Next: Generate Content <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
        </Button>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleRegenerateTitles}
        title="Refine Titles"
        placeholder="Why didn't you like these titles? e.g., 'Make them more professional' or 'Too clickbaity'"
      />
    </div>
  );

  const renderContentStage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Review Content</h2>
        <div className="flex gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => setFeedbackModalOpen(true)}>
             Rewrite
            </Button>
        </div>
      </div>
      
      <Card className="p-0 overflow-hidden ring-1 ring-slate-200">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Draft Editor</p>
        </div>
        <textarea
          value={state.generatedContent}
          onChange={(e) => setState(prev => ({ ...prev, generatedContent: e.target.value }))}
          className="w-full h-80 p-6 text-slate-900 leading-relaxed outline-none resize-y font-sans bg-transparent"
        />
      </Card>

      <div className="sticky bottom-6 flex justify-between items-center pt-4">
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigateTo('titles')} className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {!!state.generatedImagePrompt && (
                <Button variant="outline" onClick={() => navigateTo('image_prompt')} className="shadow-sm">
                    Forward <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            )}
         </div>
         <Button onClick={handleApproveContent} className="shadow-xl">
           Next: Create Image <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
         </Button>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleRegenerateContent}
        title="Refine Content"
        placeholder="What should be changed? e.g., 'Make it shorter', 'Add more emojis', 'Focus on the benefits'"
      />
    </div>
  );

  const renderImagePromptStage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
        <Wand2 className="text-blue-500 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900">AI Image Prompt</h3>
          <p className="text-sm text-blue-700">We've crafted a prompt for the image generator based on your content. You can tweak it below.</p>
        </div>
      </div>

      <Card>
        <label className="block text-sm font-medium text-slate-700 mb-2">Image Prompt</label>
        <textarea
          value={state.generatedImagePrompt}
          onChange={(e) => setState(prev => ({ ...prev, generatedImagePrompt: e.target.value }))}
          className="w-full h-32 p-4 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none resize-none bg-white mb-6"
        />
        
        <div className="border-t border-slate-100 pt-5">
            <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                <Settings2 className="w-4 h-4 mr-2" /> Image Settings
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
                    <select 
                        value={state.imageSettings.model}
                        onChange={(e) => handleImageSettingChange('model', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        {IMAGE_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Aspect Ratio</label>
                    <select 
                        value={state.imageSettings.aspectRatio}
                        onChange={(e) => handleImageSettingChange('aspectRatio', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        {ASPECT_RATIOS.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Resolution</label>
                    <select 
                        value={state.imageSettings.resolution}
                        onChange={(e) => handleImageSettingChange('resolution', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        {RESOLUTIONS.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Format</label>
                    <select 
                        value={state.imageSettings.format}
                        onChange={(e) => handleImageSettingChange('format', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        {IMAGE_FORMATS.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="flex justify-end mt-4">
            <button 
                onClick={() => setFeedbackModalOpen(true)}
                className="text-sm text-slate-500 hover:text-primary-600 flex items-center"
            >
                <RefreshCw size={14} className="mr-1"/> Ask AI to refine prompt
            </button>
        </div>
      </Card>

      <div className="sticky bottom-6 flex justify-between items-center pt-4">
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigateTo('content')} className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {!!state.generatedImageUrl && (
                <Button variant="outline" onClick={() => navigateTo('image_generation')} className="shadow-sm">
                    Forward <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            )}
         </div>
         <Button onClick={handleGenerateImage} className="shadow-xl">
           Generate Image <Wand2 className="w-4 h-4 ml-2" />
         </Button>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleRegenerateImagePrompt}
        title="Refine Image Prompt"
        placeholder="How should the image look differently? e.g., 'Use a minimalist style', 'Make it brighter'"
      />
    </div>
  );

  const renderImageGenStage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
       <h2 className="text-xl font-bold text-slate-800">Visual Result</h2>
       
       <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200">
         <img 
            src={state.generatedImageUrl} 
            alt="Generated Social Media Visual" 
            className="w-full h-auto object-cover"
         />
         {/* Simple gradient overlay for text readability if we were overlaying text, mostly aesthetic here */}
         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
       </div>

       <div className="flex justify-between items-center">
         <div className="flex gap-2">
             <Button variant="outline" onClick={() => navigateTo('image_prompt')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Prompt
             </Button>
             {state.generatedTags.length > 0 && (
                 <Button variant="outline" onClick={() => navigateTo('tags')} className="shadow-sm">
                    Forward <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
             )}
         </div>
         <Button onClick={handleGenerateTags} className="shadow-xl">
            Next: Generate Tags <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
         </Button>
       </div>
    </div>
  );

  const renderTagsStage = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Hash className="w-6 h-6 mr-2 text-primary-500" /> Optimized Hashtags
        </h2>
        <Button variant="outline" icon={RefreshCw} onClick={() => setFeedbackModalOpen(true)}>
          Regenerate
        </Button>
      </div>

      <Card>
         <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
             {state.generatedTags.length > 0 ? (
                 state.generatedTags.map((tag, idx) => (
                    <div key={idx} className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium border border-primary-100 flex items-center group">
                        {tag}
                    </div>
                 ))
             ) : (
                 <p className="text-slate-400 italic">No tags generated yet.</p>
             )}
         </div>
      </Card>

      <div className="sticky bottom-6 flex justify-between items-center pt-4">
         <div className="flex gap-2">
             <Button variant="outline" onClick={() => navigateTo('image_generation')} className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>
             {!!state.finalPost && (
                 <Button variant="outline" onClick={() => navigateTo('final')} className="shadow-sm">
                    Forward <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
             )}
         </div>
         <Button onClick={handleFinalize} className="shadow-xl">
           Finalize Post <CheckCircle2 className="w-4 h-4 ml-2" />
         </Button>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleRegenerateTags}
        title="Refine Hashtags"
        placeholder="How should the tags be different? e.g., 'More niche tags', 'Fewer tags', 'Related to technology'"
      />
    </div>
  );

  const renderFinalStage = () => {
    if (!state.finalPost) return null;

    const isInstagram = state.platform === 'instagram';

    const copyToClipboard = () => {
        const parts = [];
        if (state.finalPost?.title) parts.push(state.finalPost.title);
        if (state.finalPost?.content) parts.push(state.finalPost.content);
        if (state.finalPost?.tags?.length) parts.push(state.finalPost.tags.join(' '));
        
        const text = parts.join('\n\n');
        
        navigator.clipboard.writeText(text).then(() => {
             alert('Post text copied to clipboard!');
        }).catch(() => {
             alert('Failed to copy to clipboard');
        });
    };

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
         <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Your Post is Ready!</h2>
            <p className="text-slate-500">Optimized for {PLATFORMS.find(p => p.id === state.platform)?.name}</p>
         </div>

         <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
                 {/* Post Preview Card */}
                 <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
                    {/* Mock Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                         <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full"></div>
                         <div>
                             <div className="w-32 h-4 bg-slate-200 rounded mb-1"></div>
                             <div className="w-20 h-3 bg-slate-100 rounded"></div>
                         </div>
                    </div>

                    {/* Content Body - Order depends on platform */}
                    <div className="flex flex-col">
                        {isInstagram ? (
                            <>
                                {/* Instagram: Image First */}
                                {state.finalPost.image_url && (
                                    <div className="w-full bg-slate-100 border-b border-slate-50">
                                        <img src={state.finalPost.image_url} alt="Post Visual" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                                {/* Then Content */}
                                <div className="p-5 space-y-4">
                                     {state.finalPost.title && <h3 className="font-bold text-lg text-slate-900 leading-tight">{state.finalPost.title}</h3>}
                                     <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{state.finalPost.content}</p>
                                     <div className="pt-2 text-primary-600 font-medium text-sm leading-relaxed">
                                        {state.finalPost.tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                                     </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Others: Text First */}
                                <div className="p-5 space-y-4">
                                     {state.finalPost.title && <h3 className="font-bold text-lg text-slate-900 leading-tight">{state.finalPost.title}</h3>}
                                     <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{state.finalPost.content}</p>
                                     <div className="pt-2 text-primary-600 font-medium text-sm leading-relaxed">
                                        {state.finalPost.tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                                     </div>
                                </div>
                                {/* Then Image */}
                                {state.finalPost.image_url && (
                                    <div className="w-full bg-slate-100 border-t border-slate-50">
                                        <img src={state.finalPost.image_url} alt="Post Visual" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mock Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-slate-400">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 bg-slate-200 rounded"></div>
                            <div className="w-6 h-6 bg-slate-200 rounded"></div>
                            <div className="w-6 h-6 bg-slate-200 rounded"></div>
                        </div>
                         <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    </div>
                 </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <Card className="bg-slate-900 text-white border-slate-800 sticky top-24">
                    <h3 className="font-semibold mb-4 flex items-center text-lg"><Send className="w-5 h-5 mr-2" /> Publish Actions</h3>
                    <div className="grid gap-3">
                        <Button variant="secondary" className="w-full justify-start bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3" onClick={copyToClipboard} icon={Copy}>
                            Copy Text & Tags
                        </Button>
                        <a 
                            href={state.finalPost.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full block"
                        >
                            <Button variant="secondary" className="w-full justify-start bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3" icon={Download}>
                                Download Image
                            </Button>
                        </a>
                    </div>
                     <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                         <Button variant="primary" onClick={handleReset} className="w-full bg-primary-600 hover:bg-primary-500 border-none">
                            Start New Post
                        </Button>
                         <Button variant="secondary" onClick={() => setState(prev => ({ ...prev, stage: 'tags' }))} className="w-full bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Editing
                        </Button>
                     </div>
                </Card>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {renderHeader()}

      <main className="max-w-3xl mx-auto px-4 py-8">
        {state.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{state.error}</p>
            </div>
        )}

        {state.isLoading ? (
            <LoadingSpinner />
        ) : (
            <>
                {state.stage === 'topic_input' && renderInputStage()}
                {state.stage === 'titles' && renderTitlesStage()}
                {state.stage === 'content' && renderContentStage()}
                {state.stage === 'image_prompt' && renderImagePromptStage()}
                {state.stage === 'image_generation' && renderImageGenStage()}
                {state.stage === 'tags' && renderTagsStage()}
                {state.stage === 'final' && renderFinalStage()}
            </>
        )}
      </main>
    </div>
  );
};

export default App;
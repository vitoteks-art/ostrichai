
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Image as ImageIcon, Wand2, Settings, History, Plus, Link as LinkIcon, Upload as UploadIcon, X, Video, Clapperboard, Palette, Share2 } from 'lucide-react';
import ApiKeyModal from './components/ApiKeyModal';
import ResultCard from './components/ResultCard';
import VideoAdGenerator from './components/VideoAdGenerator';
import FlyerDesigner from './components/FlyerDesigner';
import ImageEditor from './components/ImageEditor';
import SocialPostGenerator from './components/SocialPostGenerator';
import { createTask, getTaskInfo, parseResultJson } from './services/kieService';
import { uploadToImgbb } from './services/imgbbService';
import { ProcessedImage } from './types';

// Provided Default Keys
const DEFAULT_KIE_KEY = '4dc65f0b5343b2c3d150eb416096540c';
const DEFAULT_IMGBB_KEY = 'd21835049a4272cc4712a273a58f85bc';
const DEFAULT_CLOUDINARY_CLOUD_NAME = 'desoiffdf';
const DEFAULT_CLOUDINARY_PRESET = 'vitoleads';

// Sample images for quick testing
const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=2072&auto=format&fit=crop"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'flyer' | 'editor' | 'social'>('image');
  
  // API Keys State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('kie_api_key') || DEFAULT_KIE_KEY);
  const [imgbbKey, setImgbbKey] = useState<string>(() => localStorage.getItem('imgbb_api_key') || DEFAULT_IMGBB_KEY);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string>(() => localStorage.getItem('cloudinary_cloud_name') || DEFAULT_CLOUDINARY_CLOUD_NAME);
  const [cloudinaryPreset, setCloudinaryPreset] = useState<string>(() => localStorage.getItem('cloudinary_preset') || DEFAULT_CLOUDINARY_PRESET);

  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist API Keys
  useEffect(() => { localStorage.setItem('kie_api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('imgbb_api_key', imgbbKey); }, [imgbbKey]);
  useEffect(() => { localStorage.setItem('cloudinary_cloud_name', cloudinaryCloudName); }, [cloudinaryCloudName]);
  useEffect(() => { localStorage.setItem('cloudinary_preset', cloudinaryPreset); }, [cloudinaryPreset]);

  // Open modal if keys are missing (though they have defaults now)
  useEffect(() => {
    if (!apiKey || !imgbbKey) {
        // Only open if we don't have the essentials
        // setKeyModalOpen(true); 
    }
  }, [apiKey, imgbbKey]);

  const pollTask = useCallback(async (taskId: string, historyId: string) => {
    const MAX_ATTEMPTS = 30; // 30 * 2s = 60s max
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await getTaskInfo(apiKey, taskId);
        const { state, resultJson, failMsg } = response.data;

        if (state === 'success') {
          clearInterval(interval);
          const processedUrl = parseResultJson(resultJson);
          
          setHistory(prev => prev.map(item => 
            item.id === historyId 
              ? { ...item, status: 'completed', processedUrl } 
              : item
          ));
        } else if (state === 'failed') {
          clearInterval(interval);
          setHistory(prev => prev.map(item => 
            item.id === historyId 
              ? { ...item, status: 'failed', error: failMsg || 'Processing failed' } 
              : item
          ));
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          setHistory(prev => prev.map(item => 
            item.id === historyId 
              ? { ...item, status: 'failed', error: 'Operation timed out' } 
              : item
          ));
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    }, 2000);
  }, [apiKey]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!apiKey || !imgbbKey) {
      setKeyModalOpen(true);
      return;
    }

    let imageUrlToProcess = '';
    const newId = Date.now().toString();

    // Validation
    if (inputMode === 'url') {
      if (!urlInput.trim()) return;
      imageUrlToProcess = urlInput;
    } else {
      if (!selectedFile) return;
    }

    setIsSubmitting(true);

    const initialStatus = inputMode === 'upload' ? 'uploading' : 'pending';
    const displayUrl = inputMode === 'url' ? urlInput : URL.createObjectURL(selectedFile!);

    const newEntry: ProcessedImage = {
      id: newId,
      originalUrl: displayUrl,
      processedUrl: null,
      status: initialStatus,
      timestamp: Date.now()
    };

    setHistory(prev => [newEntry, ...prev]);
    
    // Reset Inputs
    setUrlInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      // 1. Upload if needed
      if (inputMode === 'upload' && selectedFile) {
        imageUrlToProcess = await uploadToImgbb(selectedFile, imgbbKey);
      }

      // 2. Create Task
      setHistory(prev => prev.map(item => item.id === newId ? { ...item, status: 'processing' } : item));
      
      const taskId = await createTask(apiKey, imageUrlToProcess);
      
      // 3. Start Polling
      pollTask(taskId, newId);

    } catch (error: any) {
      setHistory(prev => prev.map(item => 
        item.id === newId 
          ? { ...item, status: 'failed', error: error.message } 
          : item
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = (url: string) => {
    setInputMode('url');
    setUrlInput(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ApiKeyModal 
        apiKey={apiKey} 
        setApiKey={setApiKey} 
        imgbbKey={imgbbKey}
        setImgbbKey={setImgbbKey}
        cloudinaryCloudName={cloudinaryCloudName}
        setCloudinaryCloudName={setCloudinaryCloudName}
        cloudinaryPreset={cloudinaryPreset}
        setCloudinaryPreset={setCloudinaryPreset}
        isOpen={isKeyModalOpen} 
        onClose={() => setKeyModalOpen(false)} 
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg shadow-lg ${
                activeTab === 'image' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/20' : 
                activeTab === 'video' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-600/20' :
                activeTab === 'flyer' ? 'bg-gradient-to-br from-pink-600 to-rose-600 shadow-pink-600/20' :
                activeTab === 'editor' ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-600/20' :
                'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-600/20'
            }`}>
              <Layers size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              Kie<span className={
                activeTab === 'image' ? 'text-blue-600' : 
                activeTab === 'video' ? 'text-purple-600' :
                activeTab === 'flyer' ? 'text-pink-600' :
                activeTab === 'editor' ? 'text-emerald-600' :
                'text-indigo-600'
              }>Studio</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setKeyModalOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Service API Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 mt-8 w-full">
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 inline-flex overflow-x-auto max-w-full">
            <button
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'image' 
                    ? 'bg-slate-100 text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <ImageIcon size={16} />
                BG Remover
            </button>
            <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'video' 
                    ? 'bg-purple-50 text-purple-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Clapperboard size={16} />
                Video Ads
            </button>
            <button
                onClick={() => setActiveTab('flyer')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'flyer' 
                    ? 'bg-pink-50 text-pink-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Palette size={16} />
                Flyer Designer
            </button>
            <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'editor' 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Wand2 size={16} />
                Image Editor
            </button>
            <button
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'social' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <Share2 size={16} />
                Social Post
            </button>
         </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
        
        {/* VIDEO GENERATOR TAB */}
        {activeTab === 'video' && (
          <VideoAdGenerator apiKey={apiKey} imgbbKey={imgbbKey} />
        )}

        {/* FLYER DESIGNER TAB */}
        {activeTab === 'flyer' && (
          <FlyerDesigner 
            apiKey={apiKey} 
            cloudName={cloudinaryCloudName} 
            uploadPreset={cloudinaryPreset} 
          />
        )}

        {/* IMAGE EDITOR TAB */}
        {activeTab === 'editor' && (
          <ImageEditor
            apiKey={apiKey}
            cloudName={cloudinaryCloudName}
            uploadPreset={cloudinaryPreset}
          />
        )}

        {/* SOCIAL POST TAB */}
        {activeTab === 'social' && (
          <SocialPostGenerator apiKey={apiKey} />
        )}

        {/* IMAGE REMOVER TAB */}
        {activeTab === 'image' && (
        <>
            {/* Input Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto overflow-hidden">
            
            {/* Input Type Tabs */}
            <div className="flex border-b border-slate-100">
                <button 
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    inputMode === 'upload' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'
                }`}
                >
                <UploadIcon size={16} /> Upload Image
                </button>
                <button 
                onClick={() => setInputMode('url')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    inputMode === 'url' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'
                }`}
                >
                <LinkIcon size={16} /> Image URL
                </button>
            </div>

            <div className="p-4">
                {inputMode === 'upload' ? (
                <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    selectedFile ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                >
                    <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    />
                    
                    {selectedFile ? (
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <img 
                            src={URL.createObjectURL(selectedFile)} 
                            alt="Preview" 
                            className="h-32 object-contain rounded-lg shadow-sm bg-white" 
                            />
                            <button 
                            onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-white text-slate-500 hover:text-red-500 rounded-full p-1 shadow-md border border-slate-200"
                            >
                            <X size={14} />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    ) : (
                    <div className="cursor-pointer py-4" onClick={() => fileInputRef.current?.click()}>
                        <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3">
                        <UploadIcon size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>
                    </div>
                    )}
                </div>
                ) : (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon size={18} />
                    </div>
                    <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    />
                </div>
                )}

                <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting || (inputMode === 'url' && !urlInput.trim()) || (inputMode === 'upload' && !selectedFile)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                {isSubmitting ? (
                    <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{inputMode === 'upload' && !history[0]?.processedUrl ? 'Uploading...' : 'Processing...'}</span>
                    </div>
                ) : (
                    <>
                    <Wand2 size={18} />
                    <span>Remove Background</span>
                    </>
                )}
                </button>
            </div>

            {/* Demo Images */}
            <div className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or try demo</span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                {DEMO_IMAGES.map((url, idx) => (
                    <button
                    key={idx}
                    onClick={() => handleDemoClick(url)}
                    className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <img src={url} alt={`Demo ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Plus className="text-white drop-shadow-md" size={24} />
                    </div>
                    </button>
                ))}
                </div>
            </div>
            </section>

            {/* Results Section */}
            <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <History size={18} className="text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800">Recent Tasks</h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {history.length}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No images processed yet.</p>
                    <p className="text-sm">Upload an image or paste a URL to get started.</p>
                </div>
                ) : (
                history.map(item => (
                    <ResultCard key={item.id} item={item} />
                ))
                )}
            </div>
            </section>
        </>
        )}

      </main>
    </div>
  );
};

export default App;

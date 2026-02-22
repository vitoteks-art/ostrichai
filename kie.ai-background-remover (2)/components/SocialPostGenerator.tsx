
import React, { useState, useEffect } from 'react';
import { 
  Share2, Send, RefreshCw, Image as ImageIcon, CheckCircle2, 
  Copy, Check, Lightbulb, Hash, Facebook, Twitter, Instagram, 
  Linkedin, Youtube, Video, Loader2, MessageSquare, Download
} from 'lucide-react';
import { generateSocialPost } from '../services/socialPostService';
import { SocialPlatform, SocialPostOutput, SocialAction, SocialPostPayload } from '../types';

interface SocialPostGeneratorProps {
  apiKey: string;
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
      className={`hover:text-blue-500 transition-colors p-1.5 rounded-md hover:bg-slate-100 ${className}`} 
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({ apiKey }) => {
  // Session State
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [userId] = useState(() => {
    let uid = localStorage.getItem('social_user_id');
    if (!uid) {
      uid = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('social_user_id', uid);
    }
    return uid;
  });

  // Form State
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('facebook');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<SocialAction | null>(null);
  
  // Image Config State
  const [imageModel, setImageModel] = useState('nano-banana-pro');
  const [imageResolution, setImageResolution] = useState('1K');
  
  // Output State
  const [output, setOutput] = useState<SocialPostOutput | null>(null);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [approved, setApproved] = useState(false);

  // Platform Config
  const platforms: { id: SocialPlatform; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'facebook', label: 'Facebook', icon: <Facebook size={18} />, color: 'bg-blue-600' },
    { id: 'twitter', label: 'Twitter / X', icon: <Twitter size={18} />, color: 'bg-black' },
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} />, color: 'bg-pink-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} />, color: 'bg-blue-700' },
    { id: 'tiktok', label: 'TikTok', icon: <Video size={18} />, color: 'bg-slate-900' },
    { id: 'youtube', label: 'YouTube', icon: <Youtube size={18} />, color: 'bg-red-600' },
  ];

  const handleAction = async (action: SocialAction, customQuery?: string) => {
    if (!apiKey) {
      alert("API Key is required. Please check settings.");
      return;
    }

    const effectiveQuery = customQuery || query;
    if (!effectiveQuery && action === 'generate') return;

    setLoading(true);
    setActionLoading(action);
    setApproved(false);

    try {
      const payload: SocialPostPayload = {
        query: effectiveQuery,
        platform,
        sessionId,
        action,
        userId,
        timestamp: new Date().toISOString()
      };

      // When rewriting, include the original post caption so the AI knows what to rewrite
      if (action === 'rewrite' && output?.post) {
        payload.originalPost = output.post;
      }

      // When generating image, include model and resolution
      if (action === 'generate_image') {
          payload.model = imageModel;
          payload.resolution = imageResolution;
      }

      const response = await generateSocialPost(apiKey, payload);

      if (response && response.output) {
        let outputData: any = response.output;

        // Handle stringified JSON response (common in generate_image webhook where text follows JSON)
        if (typeof outputData === 'string') {
            try {
                // 1. Try extracting JSON object boundaries
                const firstOpen = outputData.indexOf('{');
                const lastClose = outputData.lastIndexOf('}');
                
                if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                    const potentialJson = outputData.substring(firstOpen, lastClose + 1);
                    outputData = JSON.parse(potentialJson);
                } else {
                    // 2. Fallback: Try parsing the whole string
                    outputData = JSON.parse(outputData);
                }
            } catch (e) {
                console.warn("Failed to parse output string as JSON:", e);
                // If parsing fails, proceed (outputData remains string). Next check will handle it.
            }
        }

        // Merge output for non-destructive updates
        setOutput(prev => {
             // Ensure we have a valid object to merge
             if (typeof outputData !== 'object' || outputData === null) {
                return prev;
             }

            if (action === 'generate_image') {
                return { ...prev, ...outputData };
            }
            // For generate/rewrite, usually we replace, but preserving previous fields (like image if unrelated rewrite) is safer
            return { ...prev, ...outputData };
        });

        if (action === 'approve') {
            setApproved(true);
        }
      }
    } catch (error) {
      console.error("Social Post Error:", error);
      alert("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
      setActionLoading(null);
      if (action === 'rewrite') setRewritePrompt('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header & Input Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <Share2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Social Media Post Generator</h2>
            <p className="text-sm text-slate-500">Create engaging content optimized for any platform</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selector */}
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-3">Select Platform</label>
             <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {platforms.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            platform === p.id 
                            ? `${p.color} text-white shadow-md border-transparent transform scale-105` 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {p.icon}
                        <span className="text-xs font-medium">{p.label}</span>
                    </button>
                ))}
             </div>
          </div>

          {/* Query Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Topic or Idea</label>
            <div className="relative">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`What would you like to post on ${platforms.find(p => p.id === platform)?.label}?`}
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
                />
                <button
                    onClick={() => handleAction('generate')}
                    disabled={loading || !query.trim()}
                    className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading && actionLoading === 'generate' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Generate Post
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {output && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Result Header */}
             <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-medium">
                    {platforms.find(p => p.id === platform)?.icon}
                    <span>Generated Content for {platforms.find(p => p.id === platform)?.label}</span>
                </div>
                {approved && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Approved
                    </span>
                )}
             </div>

             <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Post Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Post Text */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <MessageSquare size={16} className="text-slate-400" /> Post Caption
                            </h3>
                            {output.post && <CopyButton text={output.post} />}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {output.post || "No content generated."}
                        </div>
                    </div>

                    {/* Hashtags */}
                    {output.hashtags && output.hashtags.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <Hash size={16} className="text-slate-400" /> Hashtags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {output.hashtags.map((tag, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                ))}
                                <CopyButton text={output.hashtags.join(' ')} className="ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Rewrite Action */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Refine Content</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={rewritePrompt} 
                                onChange={(e) => setRewritePrompt(e.target.value)}
                                placeholder="e.g. Make it shorter, Add emojis, Use a professional tone..."
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button 
                                onClick={() => handleAction('rewrite', rewritePrompt)}
                                disabled={loading || !rewritePrompt.trim()}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading && actionLoading === 'rewrite' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Rewrite
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visuals */}
                <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-6">
                    
                    {/* Visual Idea */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <Lightbulb size={16} className="text-amber-500" /> Visual Concept
                        </h3>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-900 text-xs leading-relaxed">
                            {output.visual_idea || "No visual concept provided."}
                        </div>
                    </div>

                    {/* Image Prompt */}
                    {output.image_prompt && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                    <ImageIcon size={16} className="text-purple-500" /> Image Prompt
                                </h3>
                                <CopyButton text={output.image_prompt} />
                            </div>
                            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-900 text-xs leading-relaxed font-mono">
                                {output.image_prompt}
                            </div>
                            
                            {/* Image Generation Configuration */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <select 
                                    value={imageModel} 
                                    onChange={(e) => setImageModel(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500"
                                >
                                    <option value="nano-banana-pro">Titan (Premium)</option>
                                    <option value="google/nano-banana-edit">Nexus (Medium)</option>
                                    <option value="google/nano-banana">Base (Fast)</option>
                                </select>
                                <select 
                                    value={imageResolution} 
                                    onChange={(e) => setImageResolution(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500"
                                >
                                    <option value="1K">1K Res</option>
                                    <option value="2K">2K Res</option>
                                    <option value="4K">4K Res</option>
                                </select>
                            </div>

                            <button 
                                onClick={() => handleAction('generate_image', output.image_prompt)}
                                disabled={loading}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                            >
                                {loading && actionLoading === 'generate_image' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                Generate Image
                            </button>
                        </div>
                    )}

                    {/* Generated Image Result */}
                    {(output.image_url || output.imageUrl) && (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Generated Image</h3>
                             <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                <img 
                                    src={output.image_url || output.imageUrl} 
                                    alt="Generated Social Media Visual" 
                                    className="w-full h-auto object-cover"
                                />
                             </div>
                             <div className="flex gap-2">
                                <a 
                                    href={output.image_url || output.imageUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 py-2 text-center text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                >
                                    Open Full Size
                                </a>
                                <a 
                                    href={output.image_url || output.imageUrl} 
                                    download={`social-post-${platform}-${Date.now()}.png`}
                                    className="flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                                >
                                    <Download size={14} /> Download
                                </a>
                             </div>
                        </div>
                    )}

                    {/* Approval */}
                    <div className="pt-4 mt-auto">
                        <button 
                            onClick={() => handleAction('approve')}
                            disabled={loading || approved}
                            className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                                approved 
                                ? 'bg-green-100 text-green-700 cursor-default' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                            }`}
                        >
                            {loading && actionLoading === 'approve' ? (
                                <Loader2 size={16} className="animate-spin" /> 
                            ) : approved ? (
                                <> <CheckCircle2 size={18} /> Approved </>
                            ) : (
                                <> <Check size={18} /> Approve Post </>
                            )}
                        </button>
                    </div>

                </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default SocialPostGenerator;

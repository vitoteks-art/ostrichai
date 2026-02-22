
import React, { useState, useRef } from 'react';
import { Wand2, Upload, X, Loader2, Send, CheckCircle2, AlertCircle, ImageIcon, ExternalLink, Download, Copy, Check, Settings } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { submitImageEditorTask } from '../services/imageEditorService';
import { FlyerWebhookResponseItem } from '../types';

interface ImageEditorProps {
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
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
      className={`hover:text-emerald-500 transition-colors p-1 rounded-md hover:bg-slate-100 ${className}`} 
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
};

const ImageEditor: React.FC<ImageEditorProps> = ({ apiKey, cloudName, uploadPreset }) => {
  const [images, setImages] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  
  // Output Configuration State
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('nano-banana-pro');
  const [resolution, setResolution] = useState('1K');
  const [outputFormat, setOutputFormat] = useState('png');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FlyerWebhookResponseItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setResult(null);
    setImages([]);
    setPrompt('');
    setAspectRatio('1:1');
    setModel('nano-banana-pro');
    setResolution('1K');
    setOutputFormat('png');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!apiKey) {
        setError("API Key is missing. Please configure it in Settings.");
        return;
    }
    if (!cloudName || !uploadPreset) {
        setError("Cloudinary settings missing. Please configure them in Settings.");
        return;
    }
    if (images.length === 0) {
        setError("Please upload at least one image.");
        return;
    }
    if (!prompt.trim()) {
        setError("Please provide editing instructions.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
        // 1. Upload images
        const imageUrls: string[] = [];
        for (const file of images) {
            const url = await uploadToCloudinary(file, cloudName, uploadPreset);
            imageUrls.push(url);
        }

        // 2. Submit task
        const response = await submitImageEditorTask(apiKey, {
            prompt,
            imageUrls,
            aspectRatio,
            model,
            resolution,
            outputFormat
        });

        // 3. Robust Response Parsing
        let resultItem: FlyerWebhookResponseItem | null = null;

        if (Array.isArray(response) && response.length > 0) {
            // Case A: Array Response (e.g. [{ extractedUrl: ... }])
            resultItem = response[0];
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
             // Case B: Single Object Response (e.g. { extractedUrl: ... })
             // Cast to any to check properties safely
             const respObj = response as any;
             
             if (respObj.extractedUrl) {
                 resultItem = respObj;
             } else if (respObj.data && respObj.data.resultJson) {
                 // Case C: Raw Kie Format fallback
                 try {
                     const json = JSON.parse(respObj.data.resultJson);
                     resultItem = {
                         extractedUrl: json.resultUrls?.[0] || '',
                         success: true,
                         rawInput: { code: 200, msg: "success", data: respObj.data }
                     };
                 } catch(e) {
                     console.warn("Failed to parse resultJson from raw data", e);
                 }
             }
        }

        if (resultItem && resultItem.extractedUrl) {
            setResult(resultItem);
        } else {
            console.error("Unexpected response format:", response);
            throw new Error("Received empty or invalid response from server. Check console for details.");
        }

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to edit image.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (result) {
    const rawData = result.rawInput?.data;
    const createdDate = rawData?.createTime ? new Date(rawData.createTime).toLocaleString() : '-';

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex items-center gap-3">
                 <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-800">Image Edited Successfully!</h2>
                    <p className="text-sm text-slate-600">Your result is ready.</p>
                 </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Display */}
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                        {result.extractedUrl ? (
                            <img 
                                src={result.extractedUrl} 
                                alt="Edited Result" 
                                className="w-full h-auto object-contain"
                            />
                        ) : (
                            <div className="aspect-square flex items-center justify-center text-slate-400">
                                <ImageIcon size={48} />
                                <span className="ml-2">No Result URL Found</span>
                            </div>
                        )}
                        {result.extractedUrl && (
                             <a 
                                href={result.extractedUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                             >
                                <div className="bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <ExternalLink size={16} /> Open Full Size
                                </div>
                             </a>
                        )}
                    </div>
                </div>

                {/* Details & Actions */}
                <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                                Task Details
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Task ID</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-600 truncate max-w-[150px]" title={rawData?.taskId}>
                                            {rawData?.taskId || '-'}
                                        </span>
                                        {rawData?.taskId && <CopyButton text={rawData.taskId} />}
                                    </div>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase text-xs tracking-wide">
                                        {rawData?.state || 'Success'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Processing Time</span>
                                    <span className="text-slate-700">{rawData?.costTime ? `${rawData.costTime}s` : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {result.extractedUrl && (
                             <a 
                                href={result.extractedUrl} 
                                download={`edited-image-${rawData?.taskId || Date.now()}.png`}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                             >
                                <Download size={18} /> Download Image
                             </a>
                        )}
                        
                        <button 
                            onClick={handleReset}
                            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3.5 rounded-xl border border-slate-200 transition-colors"
                        >
                            <Wand2 size={18} /> Edit Another Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <Wand2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Image Editor</h2>
            <p className="text-sm text-slate-500">Upload images and describe how you want to transform them.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
            {/* Instructions */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Editing Instructions</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want to edit the images (e.g., 'Make it look like a pencil sketch', 'Change the background to a beach', 'Remove the object on the left')..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                />
            </div>

            {/* Output Configuration */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Settings size={16} className="text-slate-400" />
                    Output Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Aspect Ratio</label>
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm"
                        >
                            <option value="auto">Auto</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="2:3">2:3</option>
                            <option value="3:2">3:2</option>
                            <option value="3:4">3:4</option>
                            <option value="4:3">4:3</option>
                            <option value="4:5">4:5</option>
                            <option value="5:4">5:4</option>
                            <option value="9:16">9:16 (Story)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="21:9">21:9 (Ultrawide)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                        <select 
                            value={model} 
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm"
                        >
                            <option value="nano-banana-pro">Titan - Premium with vision</option>
                            <option value="google/nano-banana-edit">Nexus - Medium with vision</option>
                            <option value="google/nano-banana">Base - Medium text-only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Resolution</label>
                        <select 
                            value={resolution} 
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm"
                        >
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Output Format</label>
                        <select 
                            value={outputFormat} 
                            onChange={(e) => setOutputFormat(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm uppercase"
                        >
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Reference Images</label>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {images.map((file, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group bg-white">
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={`upload-${index}`} 
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        
                        <label className="cursor-pointer aspect-square rounded-lg border-2 border-slate-200 border-dashed hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500">
                            <Upload size={24} className="mb-2" />
                            <span className="text-xs font-medium">Add Image</span>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                        Upload one or more images to edit.
                    </p>
                </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}
                
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !prompt || images.length === 0}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Processing Image...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            Submit Job
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;

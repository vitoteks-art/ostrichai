
import React, { useState, useRef } from 'react';
import { Palette, Calendar, MapPin, Phone, Type, Upload, X, Loader2, CheckCircle2, Image as ImageIcon, Send, Settings, AlertCircle, Clock, FileText, Download, ExternalLink, ChevronRight, Copy, Check, Mic, Plus, Trash2 } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { submitFlyerTask } from '../services/flyerService';
import { FlyerFormData, FlyerWebhookResponseItem, Speaker } from '../types';

interface FlyerDesignerProps {
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
      className={`hover:text-pink-500 transition-colors p-1 rounded-md hover:bg-slate-100 ${className}`} 
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
};

const FlyerDesigner: React.FC<FlyerDesignerProps> = ({ apiKey, cloudName, uploadPreset }) => {
  const [formData, setFormData] = useState<FlyerFormData>({
    headline: '',
    subheadline: '',
    details: '',
    date: '',
    time: '',
    venue: '',
    contactInfo: '',
    cta: '',
    theme: 'Modern',
    additionalInfo: '',
    imageUrls: [],
    speakers: [{ id: Date.now().toString(), name: '', role: '' }],
    // Defaults for new fields
    aspectRatio: '9:16',
    model: 'google/nano-banana',
    resolution: '1K',
    outputFormat: 'png'
  });

  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FlyerWebhookResponseItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 8;
  
  const isTextOnlyModel = formData.model === 'google/nano-banana';

  // Calculate today's date for min attribute
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpeakerChange = (id: string, field: keyof Speaker, value: string) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { id: Date.now().toString(), name: '', role: '' }]
    }));
  };

  const removeSpeaker = (id: string) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter(s => s.id !== id)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;
      
      if (totalImages > maxImages) {
        setError(`You can only upload a maximum of ${maxImages} images.`);
        return;
      }
      
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
    setFormData(prev => ({
        headline: '',
        subheadline: '',
        details: '',
        date: '',
        time: '',
        venue: '',
        contactInfo: '',
        cta: '',
        theme: 'Modern',
        additionalInfo: '',
        imageUrls: [],
        speakers: [{ id: Date.now().toString(), name: '', role: '' }],
        // Keep config settings
        aspectRatio: prev.aspectRatio,
        model: prev.model,
        resolution: prev.resolution,
        outputFormat: prev.outputFormat
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError("Kie.ai API Key is missing. Please configure it in Settings.");
      return;
    }

    if (!isTextOnlyModel && images.length > 0 && (!cloudName || !uploadPreset)) {
        setError("Cloudinary settings missing. Please configure Cloud Name and Upload Preset in Settings to upload images.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // 1. Upload images to Cloudinary (only if not text-only model)
      const uploadedUrls: string[] = [];
      
      if (!isTextOnlyModel && images.length > 0) {
        for (const file of images) {
          const url = await uploadToCloudinary(file, cloudName, uploadPreset);
          uploadedUrls.push(url);
        }
      }

      // 2. Prepare Payload
      // Filter out empty speakers if desired, but sending all for now so backend receives correct structure
      const payload: FlyerFormData = {
        ...formData,
        imageUrls: isTextOnlyModel ? [] : uploadedUrls,
      };

      // 3. Submit to Webhook
      const response = await submitFlyerTask(apiKey, payload);
      
      if (Array.isArray(response) && response.length > 0) {
        setResult(response[0]);
      } else {
        throw new Error("Received empty response from server.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit flyer design.");
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
            <div className="bg-green-50 border-b border-green-100 p-6 flex items-center gap-3">
                 <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-800">Flyer Generated Successfully!</h2>
                    <p className="text-sm text-slate-600">Your design is ready for download.</p>
                 </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Display */}
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                        {result.extractedUrl ? (
                            <img 
                                src={result.extractedUrl} 
                                alt="Generated Flyer" 
                                className="w-full h-auto object-contain"
                            />
                        ) : (
                            <div className="aspect-[9/16] flex items-center justify-center text-slate-400">
                                <ImageIcon size={48} />
                                <span className="ml-2">No Image URL Found</span>
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
                                <Settings size={14} /> Task Details
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase text-xs tracking-wide">
                                        {rawData?.state || 'Success'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Model</span>
                                    <span className="font-mono text-slate-700">{rawData?.model || formData.model}</span>
                                </div>
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
                                    <span className="text-slate-500">Created At</span>
                                    <span className="text-slate-700 text-xs">{createdDate}</span>
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
                                download={`flyer-${rawData?.taskId || Date.now()}.png`}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                             >
                                <Download size={18} /> Download Image
                             </a>
                        )}
                        
                        <button 
                            onClick={handleReset}
                            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3.5 rounded-xl border border-slate-200 transition-colors"
                        >
                            <Palette size={18} /> Create Another Flyer
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
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-4">
          <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Flyer Designer</h2>
            <p className="text-sm text-slate-500">Provide details to generate a stunning professional flyer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Basic Information */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Type size={16} className="text-slate-400" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title / Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                  placeholder="e.g., Grand Opening Sale!"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{formData.headline.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subheadline / Tagline
                </label>
                <input
                  type="text"
                  name="subheadline"
                  value={formData.subheadline}
                  onChange={handleInputChange}
                  maxLength={100}
                  placeholder="e.g., Best deals in town"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{formData.subheadline.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event / Offer Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  maxLength={500}
                  required
                  rows={4}
                  placeholder="Describe what the event or offer is about..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{formData.details.length}/500</span>
                </div>
              </div>
            </div>
          </section>

          {/* Date, Time & Location */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar size={16} className="text-slate-400" />
              Date, Time & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Calendar size={18} />
                    </div>
                    <input
                      type="date"
                      name="date"
                      min={minDate}
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all [color-scheme:light]"
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Clock size={18} />
                    </div>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all [color-scheme:light]"
                    />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Venue / Platform <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  placeholder="Location or platform name"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Speakers */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Mic size={16} className="text-slate-400" />
                Speakers / Guests <span className="text-xs text-slate-400 normal-case ml-1">(Optional)</span>
            </h3>
            
            <div className="space-y-3">
                {formData.speakers.map((speaker, index) => (
                    <div key={speaker.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Speaker Name"
                                value={speaker.name}
                                onChange={(e) => handleSpeakerChange(speaker.id, 'name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Role / Topic (Optional)"
                                value={speaker.role}
                                onChange={(e) => handleSpeakerChange(speaker.id, 'role', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeSpeaker(speaker.id)}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-0.5"
                            title="Remove Speaker"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                
                <button
                    type="button"
                    onClick={addSpeaker}
                    className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-2 px-2 py-1 mt-2"
                >
                    <Plus size={16} /> Add Another Speaker
                </button>
            </div>
          </section>

          {/* Contact & CTA */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Phone size={16} className="text-slate-400" />
              Contact & Call to Action
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Information <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  required
                  placeholder="Email, phone, or website"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Call to Action (CTA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cta"
                  value={formData.cta}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Register Now"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Design Preferences */}
          <section className="space-y-6">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
               <Palette size={16} className="text-slate-400" />
               Design Preferences
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Style / Theme</label>
                   <select 
                      name="theme" 
                      value={formData.theme} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                   >
                      <option value="Modern">Modern & Clean</option>
                      <option value="Bold">Bold & Vibrant</option>
                      <option value="Minimalist">Minimalist</option>
                      <option value="Corporate">Corporate / Professional</option>
                      <option value="Elegant">Elegant / Luxury</option>
                      <option value="Playful">Playful / Fun</option>
                   </select>
                </div>
             </div>
          </section>

          {/* Additional Instructions */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText size={16} className="text-slate-400" />
              Additional Instructions
            </h3>
            
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">
                 Custom Prompt / Special Requirements
               </label>
               <p className="text-xs text-slate-500 mb-2">
                 Optional: Provide any additional design guidance
               </p>
               <textarea
                 name="additionalInfo"
                 value={formData.additionalInfo}
                 onChange={handleInputChange}
                 rows={4}
                 placeholder="Any specific design requirements, layout preferences, or additional instructions... You can add the speaker name and info also."
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all resize-none"
               />
            </div>
          </section>

          {/* Output Configuration */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Settings size={16} className="text-slate-400" />
              Output Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Aspect Ratio</label>
                   <select 
                      name="aspectRatio" 
                      value={formData.aspectRatio} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono text-sm"
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
                      name="model" 
                      value={formData.model} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono text-sm"
                   >
                      <option value="nano-banana-pro">Titan - Premium with vision</option>
                      <option value="google/nano-banana-edit">Nexus - Medium with vision</option>
                      <option value="google/nano-banana">Base - Medium text-only</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Resolution</label>
                   <select 
                      name="resolution" 
                      value={formData.resolution} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono text-sm"
                   >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Output Format</label>
                   <select 
                      name="outputFormat" 
                      value={formData.outputFormat} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono text-sm uppercase"
                   >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                   </select>
                </div>
            </div>
          </section>

          {/* Images */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ImageIcon size={16} className="text-slate-400" />
              Logos & Images
            </h3>
            
            {isTextOnlyModel ? (
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center opacity-75">
                  <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Image uploads are disabled for the "Base" model.</p>
                  <p className="text-xs text-slate-400 mt-1">Please select "Titan" or "Nexus" to upload reference images.</p>
               </div>
            ) : (
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
                    
                    {images.length < maxImages && (
                    <label className="cursor-pointer aspect-square rounded-lg border-2 border-slate-200 border-dashed hover:border-pink-400 hover:bg-pink-50 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-pink-500">
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
                    )}
                </div>
                <p className="text-xs text-slate-500 text-center">
                    Upload logos, product photos, or inspiration (Max {maxImages} images).
                </p>
                </div>
            )}
          </section>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-100">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <div className="shrink-0"><X size={16} /></div>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating Flyer... (This may take a minute)
                </>
              ) : (
                <>
                  <Send size={20} />
                  Generate Flyer Design
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlyerDesigner;

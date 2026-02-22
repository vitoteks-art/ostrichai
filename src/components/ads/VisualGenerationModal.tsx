import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Video, Loader2, Palette, Monitor, Smartphone, Layout, Cpu, Sparkles, Film, FastForward, Image as LucideImage, Plus, Trash2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface VisualGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: {
        visualConcept?: string;
        creativeId?: string;
        headline?: string;
    };
}

export const VisualGenerationModal: React.FC<VisualGenerationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assetType, setAssetType] = useState<'image' | 'video'>('image');
    const [videoGenType, setVideoGenType] = useState<'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO'>('TEXT_2_VIDEO');
    const [visualPrompt, setVisualPrompt] = useState(initialData?.visualConcept || '');

    useEffect(() => {
        if (initialData?.visualConcept) {
            setVisualPrompt(initialData.visualConcept);
        }
    }, [initialData?.visualConcept]);

    // Form State
    const [productImage, setProductImage] = useState<File | null>(null);
    const [logo, setLogo] = useState<File | null>(null);

    // Video Specific Files
    const [firstFrame, setFirstFrame] = useState<File | null>(null);
    const [lastFrame, setLastFrame] = useState<File | null>(null);

    // Dynamic Reference Images
    const [refSlotIds, setRefSlotIds] = useState<number[]>([0, 1]); // Start with 2 slots
    const nextSlotIdRef = useRef(2);
    const [referenceImages, setReferenceImages] = useState<Record<number, File | null>>({});

    // Preview data URLs for CSP compliance
    const [productImagePreview, setProductImagePreview] = useState<string>('');
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [firstFramePreview, setFirstFramePreview] = useState<string>('');
    const [lastFramePreview, setLastFramePreview] = useState<string>('');
    const [refImagePreviews, setRefImagePreviews] = useState<Record<number, string>>({});

    // Helper to convert File to data URL (CSP-compliant)
    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const [primaryColor, setPrimaryColor] = useState('#3B82F6');
    const [secondaryColor, setSecondaryColor] = useState('#10B981');
    const [stylePreference, setStylePreference] = useState('');
    const [platform, setPlatform] = useState('Facebook');
    const [resolution, setResolution] = useState('1K');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [model, setModel] = useState('nano-banana-pro');

    const productImageInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const firstFrameInputRef = useRef<HTMLInputElement>(null);
    const lastFrameInputRef = useRef<HTMLInputElement>(null);

    // Enforce constraints
    useEffect(() => {
        if (assetType === 'video') {
            if (videoGenType === 'REFERENCE_2_VIDEO') {
                setModel('veo3_fast');
                setAspectRatio('16:9');
            } else {
                if (model !== 'veo3' && model !== 'veo3_fast') setModel('veo3');
            }
        }
    }, [assetType, videoGenType, model]);


    if (!isOpen) return null;

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: (f: File | null) => void,
        setPreview?: (preview: string) => void
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error("File size must be less than 10MB");
                return;
            }
            setFile(file);
            // Convert to data URL for preview
            if (setPreview) {
                try {
                    const dataUrl = await fileToDataURL(file);
                    setPreview(dataUrl);
                } catch (error) {
                    console.error('Error converting file to data URL:', error);
                }
            }
        }
    };

    const handleRefImageChange = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB");
                return;
            }
            setReferenceImages(prev => ({ ...prev, [id]: file }));
            // Convert to data URL for preview
            try {
                const dataUrl = await fileToDataURL(file);
                setRefImagePreviews(prev => ({ ...prev, [id]: dataUrl }));
            } catch (error) {
                console.error('Error converting file to data URL:', error);
            }
        }
    };

    const removeRefImage = (id: number) => {
        setReferenceImages(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
        setRefImagePreviews(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
    };

    const addRefSlot = () => {
        setRefSlotIds(prev => [...prev, nextSlotIdRef.current]);
        nextSlotIdRef.current += 1;
    };

    const removeRefSlot = (idToRemove: number) => {
        setRefSlotIds(prev => prev.filter(id => id !== idToRemove));
        setReferenceImages(prev => {
            const next = { ...prev };
            delete next[idToRemove];
            return next;
        });
        setRefImagePreviews(prev => {
            const next = { ...prev };
            delete next[idToRemove];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        // Product image is no longer compulsory
        // if (assetType === 'image' && !productImage) { ... }

        if (assetType === 'video') {
            if (videoGenType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && !firstFrame) {
                toast.error("First frame is required for Cinema Mode");
                return;
            }
            if (videoGenType === 'REFERENCE_2_VIDEO') {
                // Check if at least one reference image is uploaded
                const hasRefs = refSlotIds.some(id => referenceImages[id]);
                if (!hasRefs) {
                    toast.error("At least one reference image is required");
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            const uploadFile = async (file: File | null, label: string) => {
                if (!file) return '';
                try {
                    return await uploadToCloudinary(file);
                } catch (err) {
                    console.error(`${label} upload failed`, err);
                    toast.error(`Failed to upload ${label}`);
                    throw err;
                }
            };

            // 1. Static Uploads
            const [
                productImageUrl,
                logoImageUrl,
                firstFrameUrl,
                lastFrameUrl
            ] = await Promise.all([
                uploadFile(productImage, 'Product Image'),
                // Only upload logo for Image mode or Cinema Mode (First/Last Frame)
                (assetType === 'image' || (assetType === 'video' && videoGenType === 'FIRST_AND_LAST_FRAMES_2_VIDEO'))
                    ? uploadFile(logo, 'Logo')
                    : Promise.resolve(''),
                uploadFile(firstFrame, 'First Frame'),
                uploadFile(lastFrame, 'Last Frame'),
            ]);

            // 2. Dynamic Reference Uploads
            const referenceImageUrls: string[] = [];
            if (assetType === 'video' && videoGenType === 'REFERENCE_2_VIDEO') {
                for (const id of refSlotIds) {
                    const file = referenceImages[id];
                    if (file) {
                        const url = await uploadToCloudinary(file);
                        referenceImageUrls.push(url);
                    }
                }
            }

            // 3. Prepare Payload
            const payload = {
                creativeId: initialData?.creativeId || '',
                visualConcept: visualPrompt,
                headline: initialData?.headline || '',
                assetType,
                videoGenerationType: assetType === 'video' ? videoGenType : undefined,
                primaryColor,
                secondaryColor,
                stylePreference,
                platform,
                resolution,
                aspectRatio,
                model,
                productImageUrl,
                logoImageUrl,
                firstFrameUrl,
                lastFrameUrl,
                referenceImageUrls, // Send array of URLs
                // Backward compatibility if needed:
                referenceImageUrl: referenceImageUrls[0] || ''
            };

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error("Submission error", error);
            // toast handled in upload function or parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFileUploader = (
        label: string,
        file: File | null,
        setFile: (f: File | null) => void,
        ref: React.RefObject<HTMLInputElement>,
        icon: React.ReactNode,
        required: boolean = false,
        preview: string = '',
        setPreview?: (preview: string) => void
    ) => (
        <div className="space-y-2">
            <Label className="text-slate-300">{label} {required && <span className="text-rose-500">*</span>}</Label>
            <div
                onClick={() => ref.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-slate-800/50 ${file ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-700 bg-slate-950'
                    }`}
            >
                <input
                    type="file"
                    ref={ref}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setFile, setPreview)}
                />
                {file ? (
                    <div className="flex flex-col items-center">
                        <img src={preview} alt="Preview" className="h-20 object-contain mb-2 rounded shadow-sm" />
                        <p className="text-xs text-emerald-400 truncate w-full px-2">{file.name}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-500">
                        {icon}
                        <span className="text-xs mt-2">Click to upload</span>
                    </div>
                )}
            </div>
        </div>
    );

    const renderRefImageUploader = (index: number, id: number) => {
        const file = referenceImages[id];
        const preview = refImagePreviews[id] || '';
        return (
            <div className="space-y-2 relative group" key={id}>
                <Label className="text-slate-300">Reference Image {index + 1}</Label>
                {refSlotIds.length > 2 && ( // Only allow delete if more than default 2
                    <button
                        type="button"
                        onClick={() => removeRefSlot(id)}
                        className="absolute top-0 right-0 z-10 text-slate-500 hover:text-rose-500 p-1 rounded-full bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Slot"
                    >
                        <Trash2 size={12} />
                    </button>
                )}

                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all hover:bg-slate-800/50 relative overflow-hidden ${file ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-700 bg-slate-950'}`}>
                    {file ? (
                        <>
                            <div className="flex flex-col items-center pointer-events-none">
                                <img src={preview} alt="preview" className="h-24 w-full object-cover rounded-lg mb-2" />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRefImage(id)}
                                className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                            <LucideImage size={24} className="mb-2 opacity-50 text-slate-500" />
                            <span className="text-xs text-slate-500">Upload Ref</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleRefImageChange(id, e)}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="text-blue-500" /> Visual Generator Studio
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Configure AI parameters for your ad creative</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* Validated Prompt Section - Applies to ALL modes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
                                <Sparkles size={18} className="text-amber-500" /> Visual Concept Prompt
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">AI Prompt (Editable)</Label>
                                <Textarea
                                    value={visualPrompt}
                                    onChange={(e) => setVisualPrompt(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-slate-200 min-h-[100px] font-medium"
                                    placeholder={assetType === 'video' ? "Describe camera movement, lighting, and action..." : "Describe the visual scene..."}
                                />
                            </div>
                        </div>

                        {/* Asset Type */}
                        <div className="grid grid-cols-2 gap-4 p-1 bg-slate-950 rounded-lg border border-slate-800">
                            <button
                                type="button"
                                onClick={() => { setAssetType('image'); setModel('nano-banana-pro'); }}
                                className={`flex items-center justify-center gap-2 py-3 rounded-md transition-all font-medium ${assetType === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <ImageIcon size={18} /> Generate Image
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAssetType('video'); setModel('veo3'); }}
                                className={`flex items-center justify-center gap-2 py-3 rounded-md transition-all font-medium ${assetType === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Video size={18} /> Generate Video
                            </button>
                        </div>

                        {/* Video Generation Mode Selector */}
                        {assetType === 'video' && (
                            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                                {[
                                    { id: 'TEXT_2_VIDEO', label: 'Text to Video', icon: <Video size={14} /> },
                                    { id: 'FIRST_AND_LAST_FRAMES_2_VIDEO', label: 'Cinema Mode', icon: <Film size={14} /> },
                                    { id: 'REFERENCE_2_VIDEO', label: 'Reference Mode', icon: <LucideImage size={14} /> },
                                ].map((type) => (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => setVideoGenType(type.id as any)}
                                        className={`flex flex-col md:flex-row items-center justify-center gap-2 py-2 px-2 rounded-md text-xs font-medium transition-all ${videoGenType === type.id
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                            }`}
                                    >
                                        {type.icon}
                                        <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}


                        {/* Uploads Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
                                <Upload size={18} className="text-emerald-500" /> Assets Upload
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* IMAGE MODE UPLOADS */}
                                {assetType === 'image' && !['google/nano-banana', 'z-image'].includes(model) && (
                                    renderFileUploader("Product Image", productImage, setProductImage, productImageInputRef, <Upload size={24} className="mb-2 opacity-50" />, false, productImagePreview, setProductImagePreview)
                                )}

                                {/* VIDEO CINEMA MODE UPLOADS */}
                                {assetType === 'video' && videoGenType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && (
                                    <>
                                        {renderFileUploader("First Frame (Start)", firstFrame, setFirstFrame, firstFrameInputRef, <Film size={24} className="mb-2 opacity-50" />, true, firstFramePreview, setFirstFramePreview)}
                                        {renderFileUploader("Last Frame (End - Optional)", lastFrame, setLastFrame, lastFrameInputRef, <Film size={24} className="mb-2 opacity-50" />, false, lastFramePreview, setLastFramePreview)}
                                    </>
                                )}

                                {/* Logo Valid for Image mode (unless text-only models) OR Cinema Video Mode */}
                                {((assetType === 'image' && !['google/nano-banana', 'z-image'].includes(model)) || (assetType === 'video' && videoGenType === 'FIRST_AND_LAST_FRAMES_2_VIDEO')) && (
                                    renderFileUploader("Logo (Optional)", logo, setLogo, logoInputRef, <Upload size={24} className="mb-2 opacity-50" />, false, logoPreview, setLogoPreview)
                                )}
                            </div>

                            {/* VIDEO REFERENCE MODE - Custom Dynamic Layout */}
                            {assetType === 'video' && videoGenType === 'REFERENCE_2_VIDEO' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {refSlotIds.map((id, index) => renderRefImageUploader(index, id))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addRefSlot}
                                        className="w-full bg-slate-900 border-dashed border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white"
                                    >
                                        <Plus size={16} className="mr-2" /> Add Another Reference Image
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Configuration Grid */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
                                <WrapperIcon type="settings" /> Configuration
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Colors */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Primary Brand Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded border border-slate-700 shrink-0" style={{ backgroundColor: primaryColor }} />
                                        <Input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="font-mono bg-slate-950 border-slate-800 text-slate-200"
                                        />
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-10 p-0 overflow-hidden border-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Secondary Brand Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded border border-slate-700 shrink-0" style={{ backgroundColor: secondaryColor }} />
                                        <Input
                                            type="text"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="font-mono bg-slate-950 border-slate-800 text-slate-200"
                                        />
                                        <Input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="w-10 p-0 overflow-hidden border-0"
                                        />
                                    </div>
                                </div>

                                {/* Style */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Visual Style</Label>
                                    <Select value={stylePreference} onValueChange={setStylePreference}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectValue placeholder="Select a style..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            <SelectItem value="Modern Minimalist">Modern Minimalist</SelectItem>
                                            <SelectItem value="High-Fashion Luxury">High-Fashion Luxury</SelectItem>
                                            <SelectItem value="Cyberpunk Neon">Cyberpunk Neon</SelectItem>
                                            <SelectItem value="Corporate Professional">Corporate Professional</SelectItem>
                                            <SelectItem value="Vibrant Pop">Vibrant Pop</SelectItem>
                                            <SelectItem value="Soft & Organic">Soft & Organic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Platform */}
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Platform</Label>
                                    <Select value={platform} onValueChange={setPlatform}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            <SelectItem value="Facebook">Facebook (Feed)</SelectItem>
                                            <SelectItem value="Instagram">Instagram (Post/Story)</SelectItem>
                                            <SelectItem value="TikTok">TikTok (Vertical)</SelectItem>
                                            <SelectItem value="YouTube">YouTube (Thumbnail/Shorts)</SelectItem>
                                            <SelectItem value="LinkedIn">LinkedIn (Professional)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Tech Specs */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
                                <Cpu size={18} className="text-purple-500" /> Technical Specs & Model
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Resolution</Label>
                                    <Select value={resolution} onValueChange={setResolution}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            <SelectItem value="1K">1K (Standard)</SelectItem>
                                            <SelectItem value="2K">2K (High Res)</SelectItem>
                                            <SelectItem value="4K">4K (Ultra)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Aspect Ratio</Label>
                                    <Select
                                        value={aspectRatio}
                                        onValueChange={setAspectRatio}
                                        disabled={assetType === 'video' && videoGenType === 'REFERENCE_2_VIDEO'}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                            <SelectItem value="9:16">9:16 (Story/Reel)</SelectItem>
                                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                            <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">AI Model</Label>
                                    <Select
                                        value={model}
                                        onValueChange={setModel}
                                        disabled={assetType === 'video' && videoGenType === 'REFERENCE_2_VIDEO'}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            {assetType === 'image' ? (
                                                <>
                                                    <SelectItem value="nano-banana-pro">Titan - Premium</SelectItem>
                                                    <SelectItem value="google/nano-banana-edit">Nexus - Medium</SelectItem>
                                                    <SelectItem value="google/nano-banana">Base - Text Only</SelectItem>
                                                    <SelectItem value="z-image">Echo - Budget</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="veo3">Veo 3 (High Quality)</SelectItem>
                                                    <SelectItem value="veo3_fast">Veo 3 Fast</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || (assetType === 'video' && videoGenType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && !firstFrame) || (assetType === 'video' && videoGenType === 'REFERENCE_2_VIDEO' && Object.keys(referenceImages).length === 0)}
                                className={`flex-1 font-bold shadow-xl ${assetType === 'image' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <> <Loader2 className="animate-spin mr-2" size={18} /> Processing... </>
                                ) : (
                                    <> <Monitor className="mr-2" size={18} /> Generate {assetType === 'image' ? 'Visual' : 'Video'} </>
                                )}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};


const WrapperIcon = ({ type }: { type: string }) => {
    if (type === 'settings') return <Palette size={18} className="text-indigo-500" />;
    return null;
}

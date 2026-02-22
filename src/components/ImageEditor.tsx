import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Upload, X, Loader2, Send, CheckCircle2, AlertCircle, ImageIcon, ExternalLink, Download, Copy, Check, Settings, Sparkles, CreditCard } from 'lucide-react';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { submitImageEditorTask, ImageEditorPayload } from '@/services/imageEditorService';
import { FlyerWebhookResponseItem } from '@/services/flyerService';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProjects } from '@/hooks/useProjects';
import { SubscriptionService } from '@/services/subscriptionService';
import { toast } from 'sonner';

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
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

export const ImageEditor: React.FC = () => {
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const { createProject, updateProject, logProductCreation, logProductCompletion, logProductError } = useProjects();

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');

    // Helper to convert File to data URL (CSP-compliant)
    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Output Configuration State
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [model, setModel] = useState('nano-banana-pro');
    const [resolution, setResolution] = useState('1K');
    const [outputFormat, setOutputFormat] = useState('png');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<FlyerWebhookResponseItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get API key from environment
    const apiKey = import.meta.env.VITE_KIE_API_KEY || '';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);

            // Convert files to data URLs for previews
            for (const file of newFiles) {
                try {
                    const dataUrl = await fileToDataURL(file);
                    setImagePreviews(prev => [...prev, dataUrl]);
                } catch (error) {
                    console.error('Error converting file to data URL:', error);
                }
            }

            setError(null);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleReset = () => {
        setResult(null);
        setImages([]);
        setImagePreviews([]);
        setPrompt('');
        setAspectRatio('1:1');
        setModel('nano-banana-pro');
        setResolution('1K');
        setOutputFormat('png');
        setCurrentProjectId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!apiKey) {
            setError("API Key is missing. Please configure VITE_KIE_API_KEY in your environment.");
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
        if (!user) {
            toast.error("Please log in to edit images");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setResult(null);

        try {
            // Check credit balance and deduct credits for image editing
            const creditCost = SubscriptionService.getCreditCostForImageEdit(model, resolution);
            console.log(`Image editing with ${model} at ${resolution} costs ${creditCost} credits`);

            if (creditCost > 0) {
                // Check if user has enough credits
                const creditCheck = await SubscriptionService.useCredits(user.id, 'image_edit', creditCost);
                if (!creditCheck.success) {
                    let errorMsg = creditCheck.error || 'Failed to process credit deduction';
                    if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
                        errorMsg = 'Credit system error. Please try again later.';
                    } else if (subscription && subscription.credit_balance < creditCost) {
                        errorMsg = `Insufficient credits for image editing. You need ${creditCost} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
                    }
                    setError(errorMsg);
                    setIsSubmitting(false);
                    return;
                }

                toast.success(`✅ ${creditCost} credits deducted for image editing`);
            }
            // Create project record first
            const projectTitle = `Image Edit: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`;
            const projectResult = await createProject({
                title: projectTitle,
                type: 'ad',
                status: 'processing',
                project_metadata: {
                    description: prompt.trim(),
                    imageCount: images.length,
                    submittedAt: new Date().toISOString(),
                    editType: 'image_edit',
                    aspectRatio,
                    model,
                    resolution,
                    outputFormat
                }
            });

            if (!projectResult.success) {
                throw new Error('Failed to create project record');
            }

            const projectId = projectResult.data?.id || null;
            setCurrentProjectId(projectId);

            // Log activity for starting image editing
            await logProductCreation('image_edit', projectTitle, {
                description: prompt.trim(),
                imageCount: images.length,
                editType: 'image_edit'
            });

            // 1. Upload images to Cloudinary
            const imageUrls: string[] = [];
            for (const file of images) {
                const url = await uploadToCloudinary(file);
                imageUrls.push(url);
            }

            // 2. Submit task
            const payload: ImageEditorPayload = {
                prompt,
                imageUrls,
                aspectRatio,
                model,
                resolution,
                outputFormat
            };

            const response = await submitImageEditorTask(apiKey, payload);

            // 3. Robust Response Parsing
            let resultItem: FlyerWebhookResponseItem | null = null;

            if (Array.isArray(response) && response.length > 0) {
                // Case A: Array Response (e.g. [{ extractedUrl: ... }])
                resultItem = response[0];
            } else if (response && typeof response === 'object' && !Array.isArray(response)) {
                // Case B: Single Object Response (e.g. { extractedUrl: ... })
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
                    } catch (e) {
                        console.warn("Failed to parse resultJson from raw data", e);
                    }
                }
            }

            if (resultItem && resultItem.extractedUrl) {
                setResult(resultItem);

                // Update project status to completed
                if (projectId) {
                    await updateProject(projectId, {
                        status: 'completed',
                        project_metadata: {
                            description: prompt.trim(),
                            imageCount: images.length,
                            submittedAt: new Date().toISOString(),
                            editType: 'image_edit',
                            aspectRatio,
                            model,
                            resolution,
                            outputFormat,
                            resultUrl: resultItem.extractedUrl
                        }
                    });
                }

                // Log successful completion
                await logProductCompletion('image_edit', projectTitle, projectId);
                toast.success('Image edited successfully!');
            } else {
                console.error("Unexpected response format:", response);
                throw new Error("Received empty or invalid response from server. Check console for details.");
            }

        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || "Failed to edit image.";
            setError(errorMessage);
            toast.error(errorMessage);

            // Update project status to failed
            if (currentProjectId) {
                try {
                    await updateProject(currentProjectId, { status: 'failed' });
                } catch (updateError) {
                    console.error('Failed to update project status:', updateError);
                }
            }

            // Log error activity
            await logProductError('image_edit', errorMessage, currentProjectId, {
                description: prompt.trim(),
                imageCount: images.length,
                editType: 'image_edit'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result) {
        const rawData = result.rawInput?.data;

        return (
            <div className="space-y-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Image Edited Successfully!</h1>
                        <p className="text-lg text-gray-600">Your result is ready for download</p>
                    </div>

                    {/* Result Card */}
                    <Card className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Image Display */}
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden bg-gray-100 border group">
                                    {result.extractedUrl ? (
                                        <img
                                            src={result.extractedUrl}
                                            alt="Edited Result"
                                            className="w-full h-auto object-contain"
                                        />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center text-gray-400">
                                            <ImageIcon className="h-12 w-12 mr-2" />
                                            <span>No Image URL Found</span>
                                        </div>
                                    )}
                                    {result.extractedUrl && (
                                        <a
                                            href={result.extractedUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2">
                                                <ExternalLink className="h-4 w-4" /> Open Full Size
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Details & Actions */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-emerald-600" /> Task Details
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <Label className="text-gray-500">Status</Label>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {rawData?.state || 'Success'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">Model</Label>
                                            <p className="font-mono text-sm mt-1">{rawData?.model || model}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">Task ID</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xs truncate max-w-[120px]" title={rawData?.taskId}>
                                                    {rawData?.taskId || '-'}
                                                </span>
                                                {rawData?.taskId && <CopyButton text={rawData.taskId} />}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">Processing Time</Label>
                                            <p className="mt-1">{rawData?.costTime ? `${rawData.costTime}s` : '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    {result.extractedUrl && (
                                        <Button asChild className="w-full" size="lg">
                                            <a href={result.extractedUrl} download={`edited-image-${rawData?.taskId || Date.now()}.png`}>
                                                <Download className="h-4 w-4 mr-2" /> Download Image
                                            </a>
                                        </Button>
                                    )}

                                    <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
                                        <Wand2 className="h-4 w-4 mr-2" /> Edit Another Image
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                        <Wand2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                        <Sparkles className="h-4 w-4" />
                        <span>AI-Powered Image Editing</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">AI Image Editor</h1>
                    <p className="text-lg text-gray-600">Upload images and describe how you want to transform them</p>
                </div>

                {/* Credit Balance Display */}
                {subscription && (
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
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
                                    <p className="text-xs text-blue-700">Image editing costs</p>
                                    <p className="text-sm font-semibold text-blue-800">
                                        {SubscriptionService.getCreditCostForImageEdit(model, resolution)} credits
                                    </p>
                                </div>
                            </div>
                            {(subscription.credit_balance || 0) < SubscriptionService.getCreditCostForImageEdit(model, resolution) && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-xs text-yellow-800 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Insufficient credits for selected model and resolution. Please upgrade your plan or purchase additional credits.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Editing Instructions */}
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <Wand2 className="h-6 w-6 text-emerald-600" />
                            <h2 className="text-xl font-semibold">Editing Instructions</h2>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prompt">Describe Your Edit <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe how you want to edit the images (e.g., 'Make it look like a pencil sketch', 'Change the background to a beach', 'Remove the object on the left')..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-sm text-gray-500">Be specific about the changes you want to make</p>
                        </div>
                    </div>
                </Card>

                {/* Output Configuration */}
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <Settings className="h-6 w-6 text-emerald-600" />
                            <h2 className="text-xl font-semibold">Output Configuration</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label>Aspect Ratio</Label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto</SelectItem>
                                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                        <SelectItem value="2:3">2:3</SelectItem>
                                        <SelectItem value="3:2">3:2</SelectItem>
                                        <SelectItem value="3:4">3:4</SelectItem>
                                        <SelectItem value="4:3">4:3</SelectItem>
                                        <SelectItem value="4:5">4:5</SelectItem>
                                        <SelectItem value="5:4">5:4</SelectItem>
                                        <SelectItem value="9:16">9:16 (Story)</SelectItem>
                                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                        <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Model</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nano-banana-pro">Titan - Premium ({resolution === '4K' ? '8' : '6'} credits)</SelectItem>
                                        <SelectItem value="google/nano-banana-edit">Nexus - Medium (2 credits)</SelectItem>
                                        <SelectItem value="google/nano-banana">Base - Text Only (2 credits)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Resolution</Label>
                                <Select value={resolution} onValueChange={setResolution}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1K">1K</SelectItem>
                                        <SelectItem value="2K">2K</SelectItem>
                                        <SelectItem value="4K">4K</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Output Format</Label>
                                <Select value={outputFormat} onValueChange={setOutputFormat}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="jpg">JPG</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Image Upload */}
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <ImageIcon className="h-6 w-6 text-emerald-600" />
                            <h2 className="text-xl font-semibold">Reference Images</h2>
                        </div>

                        <p className="text-gray-600">
                            Upload one or more images to edit. Supported formats: JPEG, PNG, GIF.
                        </p>

                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {images.map((file, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-white">
                                        <img
                                            src={imagePreviews[index] || ''}
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

                                <label className="cursor-pointer aspect-square rounded-lg border-2 border-gray-200 border-dashed hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500">
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
                            <p className="text-xs text-gray-500 text-center">
                                Click to upload or drag and drop images here
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Submit */}
                <Card className="p-8">
                    <div className="text-center space-y-4">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 justify-center">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !prompt || images.length === 0}
                            size="lg"
                            className="w-full max-w-md font-semibold py-4 text-lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing Image...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Generate Edited Image
                                </>
                            )}
                        </Button>

                        {(images.length === 0 || !prompt) && (
                            <div className="flex items-center justify-center text-amber-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {images.length === 0
                                    ? 'Please upload at least one image'
                                    : 'Please provide editing instructions'
                                }
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ImageEditor;

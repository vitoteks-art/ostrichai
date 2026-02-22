import React, { useState, useCallback, useRef } from 'react';
import { Layers, Image as ImageIcon, Wand2, History, Plus, Link as LinkIcon, Upload as UploadIcon, X, CreditCard, AlertCircle } from 'lucide-react';
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ResultCard from '../components/background-remover/ResultCard';
import { createTask, getTaskInfo, parseResultJson } from '../services/kieService';
import { uploadToImgbb } from '../services/imgbbService';
import { ProcessedImage } from '../types/backgroundRemover';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ProjectService } from '../services/projectService';
import { SubscriptionService } from '../services/subscriptionService';
import { toast } from 'sonner';

// Provided Default Keys
const KIE_KEY = (import.meta.env.VITE_KIE_API_KEY || '').trim();
const IMGBB_KEY = (import.meta.env.VITE_IMGBB_API_KEY || '').trim();

// Sample images for quick testing
const DEMO_IMAGES = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=2072&auto=format&fit=crop"
];

const BackgroundRemover = () => {
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const [inputMode, setInputMode] = useState<'url' | 'upload'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string>('')  // Store data URL for preview

    const [history, setHistory] = useState<ProcessedImage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper function to convert File to data URL (CSP-compliant)
    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const pollTask = useCallback(async (taskId: string, historyId: string, projectId?: string) => {
        const MAX_ATTEMPTS = 30; // 30 * 2s = 60s max
        let attempts = 0;
        const startTime = Date.now();

        const interval = setInterval(async () => {
            attempts++;
            try {
                const response = await getTaskInfo(KIE_KEY, taskId);
                const { state, resultJson, failMsg } = response.data;

                if (state === 'success') {
                    clearInterval(interval);
                    const processedUrl = parseResultJson(resultJson);

                    setHistory(prev => prev.map(item =>
                        item.id === historyId
                            ? { ...item, status: 'completed', processedUrl }
                            : item
                    ));

                    // Update project and log completion
                    if (user && projectId) {
                        await ProjectService.updateProject(projectId, {
                            status: 'completed',
                            file_url: processedUrl || undefined,
                            project_metadata: {
                                processedUrl,
                                taskId,
                                processingTime: Date.now() - startTime
                            }
                        });
                        await ProjectService.logProductCompletion(
                            user.id,
                            'Background Removal',
                            'Image Background Removed',
                            projectId,
                            Date.now() - startTime
                        );
                    }

                } else if (state === 'failed') {
                    clearInterval(interval);
                    const errorMsg = failMsg || 'Processing failed';
                    setHistory(prev => prev.map(item =>
                        item.id === historyId
                            ? { ...item, status: 'failed', error: errorMsg }
                            : item
                    ));

                    // Update project and log error
                    if (user && projectId) {
                        await ProjectService.updateProject(projectId, {
                            status: 'failed',
                            project_metadata: { error: errorMsg, taskId }
                        });
                        await ProjectService.logProductError(
                            user.id,
                            'Background Removal',
                            errorMsg,
                            projectId
                        );
                    }

                } else if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(interval);
                    const errorMsg = 'Operation timed out';
                    setHistory(prev => prev.map(item =>
                        item.id === historyId
                            ? { ...item, status: 'failed', error: errorMsg }
                            : item
                    ));

                    // Update project and log timeout
                    if (user && projectId) {
                        await ProjectService.updateProject(projectId, {
                            status: 'failed',
                            project_metadata: { error: errorMsg, taskId }
                        });
                        await ProjectService.logProductError(
                            user.id,
                            'Background Removal',
                            errorMsg,
                            projectId
                        );
                    }
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        }, 2000);
    }, [user]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Convert to data URL for CSP-compliant preview
            try {
                const dataUrl = await fileToDataURL(file);
                setPreviewDataUrl(dataUrl);
            } catch (error) {
                console.error('Error converting file to data URL:', error);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            // Convert to data URL for CSP-compliant preview
            try {
                const dataUrl = await fileToDataURL(file);
                setPreviewDataUrl(dataUrl);
            } catch (error) {
                console.error('Error converting file to data URL:', error);
            }
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!KIE_KEY || !IMGBB_KEY) {
            alert("API Keys are missing in configuration.");
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
        // Use data URL instead of blob URL for CSP compliance
        const displayUrl = inputMode === 'url' ? urlInput : previewDataUrl;

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
        setPreviewDataUrl('');  // Clear preview data URL
        if (fileInputRef.current) fileInputRef.current.value = '';

        let projectId: string | undefined;

        try {
            // Check credit balance and deduct credits for background removal
            if (user) {
                const creditCheck = await SubscriptionService.useCredits(user.id, 'background_removal', 1);
                if (!creditCheck.success) {
                    let errorMsg = creditCheck.error || 'Failed to process credit deduction';
                    if (errorMsg.includes('404') || errorMsg.includes('Unexpected token')) {
                        errorMsg = 'Credit system error. Please try again later.';
                    } else if (subscription && subscription.credit_balance < 1) {
                        errorMsg = 'Insufficient credits for background removal. Please upgrade your plan or purchase additional credits.';
                    }

                    setHistory(prev => prev.map(item =>
                        item.id === newId
                            ? { ...item, status: 'failed', error: errorMsg }
                            : item
                    ));
                    toast.error(errorMsg);
                    setIsSubmitting(false);
                    return;
                }

                toast.success('✅ 1 credit deducted for background removal');
            }

            // Create Project Entry
            if (user) {
                const projectRes = await ProjectService.createProject(user.id, {
                    title: `Background Removal ${new Date().toLocaleString()}`,
                    type: 'image_edit',
                    status: 'processing',
                    thumbnail_url: displayUrl, // Use original image as thumbnail initially
                    project_metadata: {
                        originalUrl: displayUrl,
                        inputMode
                    }
                });
                if (projectRes.success && projectRes.data) {
                    projectId = projectRes.data.id;
                    await ProjectService.logProductCreation(
                        user.id,
                        'Background Removal',
                        `Removing background from image`
                    );
                }
            }

            // 1. Upload if needed
            if (inputMode === 'upload' && selectedFile) {
                imageUrlToProcess = await uploadToImgbb(selectedFile, IMGBB_KEY);
            }

            // 2. Create Task
            setHistory(prev => prev.map(item => item.id === newId ? { ...item, status: 'processing' } : item));

            console.log("Calling createTask with URL:", imageUrlToProcess);
            const taskId = await createTask(KIE_KEY, imageUrlToProcess);

            // 3. Start Polling
            pollTask(taskId, newId, projectId);

        } catch (error: any) {
            setHistory(prev => prev.map(item =>
                item.id === newId
                    ? { ...item, status: 'failed', error: error.message }
                    : item
            ));

            // Log error if project was created
            if (user && projectId) {
                await ProjectService.updateProject(projectId, {
                    status: 'failed',
                    project_metadata: { error: error.message }
                });
                await ProjectService.logProductError(
                    user.id,
                    'Background Removal',
                    error.message,
                    projectId
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDemoClick = (url: string) => {
        setInputMode('url');
        setUrlInput(url);
    };

    return (
        <Layout>
            <SEO
                title="AI Background Remover | Remove Image Backgrounds Instantly"
                description="Remove backgrounds from your images with AI precision. Get clean, professional results for your products, portraits, and marketing materials in seconds."
            />
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Background Remover</h1>
                        <p className="text-muted-foreground">
                            Remove backgrounds from images instantly using AI
                        </p>
                    </div>
                </div>

                {/* Credit Balance Display */}
                {subscription && (
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 max-w-2xl mx-auto">
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
                                    <p className="text-xs text-blue-700">Background removal costs</p>
                                    <p className="text-sm font-semibold text-blue-800">1 credit</p>
                                </div>
                            </div>
                            {(subscription.credit_balance || 0) < 1 && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-xs text-yellow-800 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Insufficient credits for background removal. Please upgrade your plan or purchase additional credits.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Input Section */}
                <Card className="max-w-2xl mx-auto overflow-hidden">
                    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'upload')} className="w-full">
                        <div className="border-b border-border bg-muted/30 px-4 pt-2">
                            <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
                                <TabsTrigger
                                    value="upload"
                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
                                >
                                    <UploadIcon size={16} className="mr-2" /> Upload Image
                                </TabsTrigger>
                                <TabsTrigger
                                    value="url"
                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
                                >
                                    <LinkIcon size={16} className="mr-2" /> Image URL
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <CardContent className="p-6">
                            <TabsContent value="upload" className="mt-0">
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/30'
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
                                                    src={previewDataUrl}
                                                    alt="Preview"
                                                    className="h-32 object-contain rounded-lg shadow-sm bg-background"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        setPreviewDataUrl('');  // Clear preview data URL
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-background text-muted-foreground hover:text-destructive rounded-full p-1 shadow-md border border-border"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="cursor-pointer py-4" onClick={() => fileInputRef.current?.click()}>
                                            <div className="bg-background p-4 rounded-full shadow-sm inline-block mb-3 border border-border">
                                                <UploadIcon size={24} className="text-primary" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                                            <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="mt-0">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <ImageIcon size={18} />
                                    </div>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        className="pl-10 py-6"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <Button
                                onClick={() => handleSubmit()}
                                disabled={isSubmitting || (inputMode === 'url' && !urlInput.trim()) || (inputMode === 'upload' && !selectedFile)}
                                className="w-full mt-6 h-12 text-lg"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        <span>{inputMode === 'upload' && !history[0]?.processedUrl ? 'Uploading...' : 'Processing...'}</span>
                                    </div>
                                ) : (
                                    <>
                                        <Wand2 size={18} className="mr-2" />
                                        <span>Remove Background</span>
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Tabs>

                    {/* Demo Images */}
                    <div className="px-6 pb-6 pt-0">
                        <div className="flex items-center gap-4 my-4">
                            <div className="h-px bg-border flex-1"></div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or try demo</span>
                            <div className="h-px bg-border flex-1"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {DEMO_IMAGES.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleDemoClick(url)}
                                    className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <img src={url} alt={`Demo ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Plus className="text-white drop-shadow-md" size={24} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Results Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <History size={18} className="text-muted-foreground" />
                        <h2 className="text-lg font-semibold text-foreground">Recent Tasks</h2>
                        <Badge variant="secondary" className="rounded-full px-2 py-0.5">
                            {history.length}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
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
            </div>
        </Layout>
    );
};

export default BackgroundRemover;

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Share2, Send, RefreshCw, Image as ImageIcon, CheckCircle2,
    Copy, Check, Lightbulb, Hash, Facebook, Twitter, Instagram,
    Linkedin, Youtube, Video, Loader2, MessageSquare, Download, Sparkles,
    ExternalLink, AlertCircle, Upload, X
} from 'lucide-react';
import { generateSocialPost } from '@/services/socialPostService';
import { SocialPlatform, SocialPostOutput, SocialAction, SocialPostPayload } from '@/services/socialPostTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { SubscriptionService } from '@/services/subscriptionService';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import PostToAccountsModal from '@/components/PostToAccountsModal';
import { uploadToCloudinary } from '@/services/cloudinaryService';


// Function to strip markdown formatting from text
const formatPostContent = (text: string): string => {
    if (!text) return '';

    return text
        // Remove headers (##, ###, etc.)
        .replace(/^#{1,6}\s+/gm, '')
        // Remove bold (**text** or __text__)
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        // Remove italic (*text* or _text_)
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
        .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
        // Remove strikethrough (~~text~~)
        .replace(/~~(.+?)~~/g, '$1')
        // Remove inline code (`code`)
        .replace(/`(.+?)`/g, '$1')
        // Remove code blocks (```code```)
        .replace(/```[\s\S]*?```/g, '')
        // Remove links [text](url) -> text
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        // Remove images ![alt](url)
        .replace(/!\[.*?\]\(.+?\)/g, '')
        // Remove blockquotes
        .replace(/^>\s+/gm, '')
        // Remove horizontal rules
        .replace(/^[-*_]{3,}$/gm, '')
        // Remove bullet points
        .replace(/^[\*\-\+]\s+/gm, '• ')
        // Remove numbered lists formatting (keep the content)
        .replace(/^\d+\.\s+/gm, '')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
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

// Share buttons component
interface ShareButtonsProps {
    postText: string;
    hashtags: string[];
    imageUrl?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ postText, hashtags, imageUrl }) => {
    const hashtagsText = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    const fullText = postText + (hashtagsText ? '\n\n' + hashtagsText : '');
    const encodedText = encodeURIComponent(fullText);
    const encodedImageUrl = imageUrl ? encodeURIComponent(imageUrl) : '';
    const pageUrl = encodeURIComponent(window.location.href);

    const shareLinks = [
        {
            name: 'Facebook',
            icon: <Facebook size={18} />,
            color: 'bg-blue-600 hover:bg-blue-700',
            url: `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}${encodedImageUrl ? `&u=${encodedImageUrl}` : ''}`
        },
        {
            name: 'Twitter/X',
            icon: <Twitter size={18} />,
            color: 'bg-black hover:bg-gray-800',
            url: `https://twitter.com/intent/tweet?text=${encodedText}${encodedImageUrl ? `&url=${encodedImageUrl}` : ''}`
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin size={18} />,
            color: 'bg-blue-700 hover:bg-blue-800',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedImageUrl || pageUrl}&summary=${encodedText}`
        },
        {
            name: 'WhatsApp',
            icon: <MessageSquare size={18} />,
            color: 'bg-green-500 hover:bg-green-600',
            url: `https://wa.me/?text=${encodedText}${encodedImageUrl ? `%0A%0A${encodedImageUrl}` : ''}`
        },
        {
            name: 'Telegram',
            icon: <Send size={18} />,
            color: 'bg-sky-500 hover:bg-sky-600',
            url: `https://t.me/share/url?url=${encodedImageUrl || pageUrl}&text=${encodedText}`
        },
    ];

    const handleShare = (url: string, name: string) => {
        window.open(url, `share-${name}`, 'width=600,height=400,scrollbars=yes,resizable=yes');
        toast.success(`Opening ${name} to share`);
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
                <Share2 size={16} />
                Share on Social Media
            </Label>
            <div className="flex flex-wrap gap-2">
                {shareLinks.map((link) => (
                    <Button
                        key={link.name}
                        onClick={() => handleShare(link.url, link.name)}
                        className={`${link.color} text-white`}
                        size="sm"
                    >
                        {link.icon}
                        <span className="ml-2">{link.name}</span>
                    </Button>
                ))}
            </div>
            <p className="text-xs text-gray-500">
                Click any button to share your post with the generated content and image
            </p>
        </div>
    );
};


const SocialPostGenerator: React.FC = () => {
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const { createProject, updateProject, logActivity } = useProjects();

    // Persistent State Key
    const STORAGE_KEY = 'social_post_generator_state';

    // Session State
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

    // Helper to get initial state from localStorage
    function getInitialState<T>(key: string, defaultValue: T): T {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[key] !== undefined ? parsed[key] : defaultValue;
            }
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
        return defaultValue;
    }

    // Form State
    const [query, setQuery] = useState(() => getInitialState('query', ''));
    const [platform, setPlatform] = useState<SocialPlatform>(() => getInitialState('platform', 'facebook' as SocialPlatform));
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<SocialAction | null>(null);

    // Image Config State
    const [imageModel, setImageModel] = useState(() => getInitialState('imageModel', 'nano-banana-pro'));
    const [imageResolution, setImageResolution] = useState(() => getInitialState('imageResolution', '1K'));
    const [aspectRatio, setAspectRatio] = useState(() => getInitialState('aspectRatio', '1:1'));
    const [referenceImages, setReferenceImages] = useState<File[]>([]);

    // Output State
    const [output, setOutput] = useState<SocialPostOutput | null>(() => getInitialState('output', null));
    const [editablePost, setEditablePost] = useState(() => getInitialState('editablePost', ''));
    const [editableImagePrompt, setEditableImagePrompt] = useState(() => getInitialState('editableImagePrompt', ''));
    const [rewritePrompt, setRewritePrompt] = useState('');
    const [approved, setApproved] = useState(() => getInitialState('approved', false));
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => getInitialState('currentProjectId', null));
    const [showPostModal, setShowPostModal] = useState(false);
    const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(() => getInitialState('customMediaUrl', null));
    const [customMediaType, setCustomMediaType] = useState<'image' | 'video' | null>(() => getInitialState('customMediaType', null));
    const [customMediaLoading, setCustomMediaLoading] = useState(false);

    // Persist state to localStorage
    React.useEffect(() => {
        const stateToSave = {
            query,
            platform,
            imageModel,
            imageResolution,
            aspectRatio,
            output,
            editablePost,
            editableImagePrompt,
            approved,
            currentProjectId,
            customMediaUrl,
            customMediaType
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [query, platform, imageModel, imageResolution, output, editablePost, editableImagePrompt, approved, currentProjectId, customMediaUrl, customMediaType]);


    // Platform Config
    const platforms: { id: SocialPlatform; label: string; icon: React.ReactNode; color: string; comingSoon?: boolean }[] = [
        { id: 'facebook', label: 'Facebook', icon: <Facebook size={18} />, color: 'bg-blue-600' },
        { id: 'twitter', label: 'Twitter / X', icon: <Twitter size={18} />, color: 'bg-black', comingSoon: true },
        { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} />, color: 'bg-pink-600' },
        { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} />, color: 'bg-blue-700' },
        { id: 'tiktok', label: 'TikTok', icon: <Video size={18} />, color: 'bg-slate-900', comingSoon: true },
        { id: 'youtube', label: 'YouTube', icon: <Youtube size={18} />, color: 'bg-red-600' },
    ];

    const apiKey = import.meta.env.VITE_KIE_API_KEY || '';

    // Format the post content
    const formattedPost = useMemo(() => {
        const formatted = output?.post ? formatPostContent(output.post) : '';
        setEditablePost(formatted);
        return formatted;
    }, [output?.post]);

    // Sync editable image prompt with output
    React.useEffect(() => {
        if (output?.image_prompt) {
            setEditableImagePrompt(output.image_prompt);
        }
    }, [output?.image_prompt]);

    const handleCustomMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCustomMediaLoading(true);
        try {
            const uploadedUrl = await uploadToCloudinary(file);
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
            setCustomMediaUrl(uploadedUrl);
            setCustomMediaType(mediaType);
            toast.success(`Custom ${mediaType} uploaded successfully`);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload media');
        } finally {
            setCustomMediaLoading(false);
            event.target.value = '';
        }
    };

    const handleClearCustomMedia = () => {
        setCustomMediaUrl(null);
        setCustomMediaType(null);
    };

    const handleRemoveGeneratedImage = () => {
        if (customMediaType === 'image') {
            handleClearCustomMedia();
            return;
        }
        setOutput(prev => {
            if (!prev) return prev;
            const { image_url, imageUrl, ...rest } = prev;
            return rest as SocialPostOutput;
        });
    };

    const handleAction = async (action: SocialAction, customQuery?: string) => {
        if (!user) {
            toast.error('Please log in to generate social media posts');
            return;
        }

        const effectiveQuery = customQuery || query;
        if (!effectiveQuery && action === 'generate') {
            toast.error('Please enter a topic or idea');
            return;
        }

        const effectiveImageUrl = customMediaType === 'image'
            ? customMediaUrl
            : (output?.image_url || output?.imageUrl);
        const effectiveVideoUrl = customMediaType === 'video'
            ? customMediaUrl
            : (output?.video_url || output?.videoUrl);

        if (action === 'approve') {
            if (platform === 'instagram' && !effectiveImageUrl && !effectiveVideoUrl) {
                toast.error('Instagram posts require an image or video. Please generate or upload media.');
                return;
            }

            if (platform === 'youtube' && !effectiveVideoUrl) {
                toast.error('YouTube posts require a video. Please generate or upload a video.');
                return;
            }
        }

        setLoading(true);
        setActionLoading(action);
        setApproved(false);

        try {
            let activeProjectId = currentProjectId;

            // Create project record for generate action
            if (action === 'generate') {
                // Check credit balance before proceeding
                const creditsNeeded = SubscriptionService.getCreditCostForFeature('social_post');
                if (creditsNeeded > 0) {
                    const creditCheck = await SubscriptionService.useCredits(user.id, 'social_post', creditsNeeded);
                    if (!creditCheck.success) {
                        let errorMsg = creditCheck.error || 'Failed to process credit deduction';

                        // If it's a generic failure but we know the balance is sufficient, don't say insufficient
                        if (errorMsg.includes('Unexpected token') || errorMsg.includes('404')) {
                            errorMsg = `Credit system error. Please try again later. (Error: ${errorMsg})`;
                        } else if (subscription && subscription.credit_balance < creditsNeeded) {
                            errorMsg = `Insufficient credits for social media post generation. You need ${creditsNeeded} credits but only have ${subscription.credit_balance}. Please upgrade your plan or purchase additional credits.`;
                        } else {
                            errorMsg = creditCheck.error || 'Credit deduction failed. Please check your connection and try again.';
                        }

                        toast.error(errorMsg);
                        setLoading(false);
                        setActionLoading(null);
                        return;
                    }

                    toast.success(`✅ ${creditsNeeded} credits deducted for social media post generation`);
                }

                const projectTitle = `Social Post: ${platform} - ${effectiveQuery.substring(0, 30)}${effectiveQuery.length > 30 ? '...' : ''}`;
                const projectResult = await createProject({
                    title: projectTitle,
                    type: 'social_post',
                    status: 'processing',
                    project_metadata: {
                        query: effectiveQuery,
                        platform,
                        submittedAt: new Date().toISOString()
                    }
                });
                if (projectResult.success && projectResult.data?.id) {
                    activeProjectId = projectResult.data.id;
                    setCurrentProjectId(activeProjectId);
                }
            }

            const payload: SocialPostPayload = {
                query: effectiveQuery,
                platform,
                sessionId,
                action,
                userId: user.id,
                timestamp: new Date().toISOString()
            };

            // When rewriting, include the original post caption
            if (action === 'rewrite' && output?.post) {
                payload.originalPost = output.post;
            }

            // When generating image, include model and resolution
            if (action === 'generate_image') {
                payload.model = imageModel;
                payload.resolution = imageResolution;

                // Add aspect ratio or image size based on the model
                if (imageModel === 'nano-banana-pro') {
                    payload.aspect_ratio = aspectRatio;
                } else if (imageModel === 'google/nano-banana' || imageModel === 'google/nano-banana-edit') {
                    payload.image_size = aspectRatio;
                }

                // Upload reference images to Cloudinary first (for Titan/Nexus)
                if (referenceImages.length > 0 && (imageModel === 'nano-banana-pro' || imageModel === 'google/nano-banana-edit')) {
                    try {
                        toast.info(`Uploading ${referenceImages.length} reference image(s) to Cloudinary...`);

                        const uploadPromises = referenceImages.map(async (file) => {
                            const url = await uploadToCloudinary(file);
                            return url;
                        });

                        const imageUrls = await Promise.all(uploadPromises);
                        payload.referenceImageUrls = imageUrls;

                        toast.success(`✅ ${referenceImages.length} image(s) uploaded to Cloudinary`);
                    } catch (error) {
                        console.error('Cloudinary upload error:', error);
                        toast.error('Failed to upload images to Cloudinary. Please try again.');
                        setLoading(false);
                        setActionLoading(null);
                        return;
                    }
                }

                // Check credit balance before proceeding
                const creditsNeeded = SubscriptionService.getCreditCostForFeature(imageModel);
                if (creditsNeeded > 0) {
                    const creditCheck = await SubscriptionService.useCredits(user.id, imageModel, creditsNeeded);
                    if (!creditCheck.success) {
                        const errorMsg = `Insufficient credits for image generation. You need ${creditsNeeded} credits but only have ${subscription?.credit_balance || 0}. Please upgrade your plan or purchase additional credits.`;
                        toast.error(errorMsg);
                        setLoading(false);
                        setActionLoading(null);
                        return;
                    }

                    toast.success(`✅ ${creditsNeeded} credits deducted for image generation`);
                }
            }

            const response = await generateSocialPost(apiKey, payload);
            console.log('Social Post Response:', response);

            if (response && response.output) {
                let outputData: any = response.output;

                // Handle stringified JSON response
                if (typeof outputData === 'string') {
                    const firstOpen = outputData.indexOf('{');
                    const lastClose = outputData.lastIndexOf('}');

                    try {
                        if (firstOpen !== -1 && lastClose !== -1 && lastClose >= firstOpen) {
                            const potentialJson = outputData.substring(firstOpen, lastClose + 1);
                            outputData = JSON.parse(potentialJson);
                        } else if (outputData.trim().startsWith('{') || outputData.trim().startsWith('[')) {
                            outputData = JSON.parse(outputData);
                        }
                    } catch (e) {
                        console.warn("Failed to parse output string as JSON:", e);
                        // If parsing fails, we'll keep outputData as a string
                    }

                    // If it's still a string after potential parsing, convert it to a message object
                    // so it can be merged into the output state correctly
                    if (typeof outputData === 'string') {
                        outputData = { message: outputData };
                    }
                }

                // Merge output for non-destructive updates
                setOutput(prev => {
                    if (typeof outputData !== 'object' || outputData === null) {
                        return prev;
                    }
                    return { ...prev, ...outputData };
                });

                if (action === 'approve') {
                    setApproved(true);
                    toast.success('Post approved successfully!');
                } else if (action === 'generate') {
                    toast.success('Post generated successfully!');
                } else if (action === 'rewrite') {
                    toast.success('Post rewritten successfully!');
                } else if (action === 'generate_image') {
                    toast.success('Image generated successfully!');
                }

                // Update project on completion
                if (activeProjectId && (action === 'generate' || action === 'approve' || action === 'generate_image')) {
                    // Prepare updates
                    const updates: any = {
                        status: (action === 'approve' || action === 'generate' || action === 'generate_image') ? 'completed' : 'processing',
                        project_metadata: {
                            // We need to ensure we're saving the accumulated output, not just the latest response chunk
                            // The 'output' state variable might not be updated yet in this closure, so we merge manually
                            output: { ...(output || {}), ...outputData },
                            updatedAt: new Date().toISOString()
                        }
                    };

                    // If we have an image URL, save it to the top-level file_url for easy access
                    const imageUrl = outputData.image_url || outputData.imageUrl;
                    if (imageUrl) {
                        updates.file_url = imageUrl;
                        updates.thumbnail_url = imageUrl;
                    }

                    await updateProject(activeProjectId, updates);
                }

                // Log activity
                await logActivity({
                    action: `Social Post ${action}`,
                    details: `${action === 'generate' ? 'Generated' : action === 'rewrite' ? 'Rewrote' : action === 'approve' ? 'Approved' : 'Generated image for'} ${platform} post`
                });
            }
        } catch (error) {
            console.error("Social Post Error:", error);
            toast.error('Failed to process request. Please try again.');
        } finally {
            setLoading(false);
            setActionLoading(null);
            if (action === 'rewrite') setRewritePrompt('');
        }
    };

    const handleReset = () => {
        setQuery('');
        setOutput(null);
        setEditablePost('');
        setEditableImagePrompt('');
        setApproved(false);
        setRewritePrompt('');
        setCurrentProjectId(null);
        setReferenceImages([]);
        setCustomMediaUrl(null);
        setCustomMediaType(null);
        localStorage.removeItem(STORAGE_KEY);
        toast.success('Ready for new post');
    };

    // Handle reference image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const validFiles = Array.from(files).filter(file => {
            if (file.type.startsWith('image/')) {
                return true;
            }
            toast.error(`${file.name} is not a valid image file`);
            return false;
        });

        setReferenceImages(prev => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} image(s) uploaded`);

        // Reset input
        e.target.value = '';
    };

    // Remove reference image
    const handleRemoveImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
        toast.success('Image removed');
    };


    return (
        <div className="space-y-8">
            {console.log('SocialPostGenerator Render - Output:', output)}
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                        <Share2 className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                        <Sparkles className="h-4 w-4" />
                        <span>AI-Powered Social Content</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Social Media Post Generator</h1>
                    <p className="text-lg text-gray-600">Create engaging content optimized for any platform</p>
                </div>

                {/* Platform Selection */}
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <Share2 className="h-6 w-6 text-indigo-600" />
                            <h2 className="text-xl font-semibold">Select Platform</h2>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {platforms.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => !p.comingSoon && setPlatform(p.id)}
                                    disabled={p.comingSoon}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${platform === p.id
                                        ? `${p.color} text-white shadow-md border-transparent transform scale-105`
                                        : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50'
                                        } ${p.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {p.icon}
                                    <span className="text-xs font-medium">{p.label}</span>
                                    {p.comingSoon && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Soon</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Topic Input */}
                <Card className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="h-6 w-6 text-indigo-600" />
                            <h2 className="text-xl font-semibold">Topic or Idea</h2>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="query">What would you like to post about? <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="query"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`What would you like to post on ${platforms.find(p => p.id === platform)?.label}?`}
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* Credit Cost Display */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm">💰</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                                        <p className="text-sm text-gray-600">Cost for social media post generation</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">4 credits</div>
                                    <div className="text-sm text-gray-500">AI-powered content generation</div>
                                </div>
                            </div>

                            {subscription && (
                                <div className="mt-3 text-center">
                                    <span className="text-sm text-gray-600">
                                        Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => handleAction('generate')}
                            disabled={loading || !query.trim()}
                            size="lg"
                            className="w-full font-semibold py-4"
                        >
                            {loading && actionLoading === 'generate' ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generating Post...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Generate Post
                                </>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Result Section */}
                {output && (
                    <div className="space-y-6">
                        {/* Post Content */}
                        <Card className="p-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <MessageSquare className="h-6 w-6 text-indigo-600" />
                                        <h2 className="text-xl font-semibold">Generated Post</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {approved && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Approved
                                            </span>
                                        )}
                                        {editablePost && <CopyButton text={editablePost} />}
                                    </div>
                                </div>

                                <Textarea
                                    value={editablePost}
                                    onChange={(e) => setEditablePost(e.target.value)}
                                    placeholder="No content generated."
                                    rows={8}
                                    className="bg-secondary/50 border-border text-foreground leading-relaxed resize-none"
                                />

                                {/* Hashtags */}
                                {output.hashtags && output.hashtags.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-gray-400" />
                                            <Label>Hashtags</Label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {output.hashtags.map((tag, idx) => (
                                                <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium border border-primary/20">
                                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                                </span>
                                            ))}
                                            <CopyButton text={output.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')} className="ml-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Share Buttons */}
                                <div className="pt-4 border-t">
                                    <ShareButtons
                                        postText={editablePost}
                                        hashtags={output.hashtags || []}
                                        imageUrl={customMediaType === 'image' ? customMediaUrl || undefined : (output.image_url || output.imageUrl)}
                                    />
                                </div>

                                {/* Rewrite Section */}
                                <div className="pt-4 border-t">
                                    <Label className="text-sm mb-2 block">Refine Content</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={rewritePrompt}
                                            onChange={(e) => setRewritePrompt(e.target.value)}
                                            placeholder="e.g. Make it shorter, Add emojis, Use a professional tone..."
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => handleAction('rewrite', rewritePrompt)}
                                            disabled={loading || !rewritePrompt.trim()}
                                            variant="secondary"
                                        >
                                            {loading && actionLoading === 'rewrite' ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                                            Rewrite
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Visual Concept & Image Generation */}
                        <Card className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Visual Idea */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Lightbulb className="h-6 w-6 text-amber-500" />
                                        <h2 className="text-xl font-semibold">Visual Concept</h2>
                                    </div>
                                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm leading-relaxed">
                                        {output.visual_idea ? formatPostContent(output.visual_idea) : "No visual concept provided."}
                                    </div>
                                </div>

                                {/* Video Input for YouTube */}
                                {platform === 'youtube' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Video className="h-6 w-6 text-red-500" />
                                                <h2 className="text-xl font-semibold">Video Source</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="video-url">Video URL (Direct link to .mp4, etc.)</Label>
                                            <Input
                                                id="video-url"
                                                placeholder="https://example.com/video.mp4"
                                                value={output?.video_url || output?.videoUrl || ''}
                                                onChange={(e) => setOutput({ ...output, video_url: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Provide a direct link to a video file for upload.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Custom Media Upload */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Upload size={16} />
                                            Replace Media (Image or Video)
                                        </Label>
                                        {customMediaUrl && (
                                            <Button variant="ghost" size="sm" onClick={handleClearCustomMedia}>
                                                <X size={14} className="mr-1" /> Remove
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Upload your own media to replace the generated image/video for posting.
                                    </p>
                                    <Input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleCustomMediaUpload}
                                        disabled={customMediaLoading}
                                    />
                                    {customMediaLoading && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            Uploading media...
                                        </div>
                                    )}
                                    {customMediaUrl && customMediaType === 'image' && (
                                        <div className="rounded-lg overflow-hidden border border-border bg-secondary/30">
                                            <img
                                                src={customMediaUrl}
                                                alt="Custom upload"
                                                referrerPolicy="no-referrer"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    )}
                                    {customMediaUrl && customMediaType === 'video' && (
                                        <div className="rounded-lg overflow-hidden border border-border bg-secondary/30">
                                            <video
                                                src={customMediaUrl}
                                                className="w-full h-auto"
                                                controls
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Image Prompt & Generation */}
                                {output.image_prompt && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <ImageIcon className="h-6 w-6 text-purple-500" />
                                                <h2 className="text-xl font-semibold">Image Prompt</h2>
                                            </div>
                                            <CopyButton text={output.image_prompt} />
                                        </div>
                                        <Textarea
                                            value={editableImagePrompt}
                                            onChange={(e) => setEditableImagePrompt(e.target.value)}
                                            placeholder="Image prompt will appear here..."
                                            rows={4}
                                            className="bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm leading-relaxed font-mono resize-none"
                                        />

                                        {/* Credit Cost Display */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold text-sm">💰</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">Credit Cost</h4>
                                                        <p className="text-sm text-gray-600">Cost for image generation</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {(() => {
                                                            if (imageModel === 'nano-banana-pro') {
                                                                return imageResolution === '4K' ? '8 credits' : '6 credits';
                                                            } else if (imageModel === 'z-image') {
                                                                return '1 credit';
                                                            } else {
                                                                return '2 credits';
                                                            }
                                                        })()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {imageModel === 'nano-banana-pro'
                                                            ? `Titan • ${imageResolution} resolution`
                                                            : imageModel === 'google/nano-banana-edit'
                                                                ? 'Nexus • Medium quality'
                                                                : imageModel === 'z-image'
                                                                    ? 'Echo • Text-only generation'
                                                                    : 'Base • Fast generation'
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {subscription && (
                                                <div className="mt-3 text-center">
                                                    <span className="text-sm text-gray-600">
                                                        Your balance: <span className="font-semibold text-green-600">{subscription.credit_balance} credits</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Image Generation Config */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select value={imageModel} onValueChange={setImageModel}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="nano-banana-pro">Titan (Premium)</SelectItem>
                                                    <SelectItem value="google/nano-banana-edit">Nexus (Medium)</SelectItem>
                                                    <SelectItem value="google/nano-banana">Base (Fast)</SelectItem>
                                                    <SelectItem value="z-image">Echo (Text-only)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={imageResolution} onValueChange={setImageResolution}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1K">1K Resolution</SelectItem>
                                                    <SelectItem value="2K">2K Resolution</SelectItem>
                                                    <SelectItem value="4K">4K Resolution</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Aspect Ratio / Image Size Selector */}
                                        {imageModel !== 'z-image' && (
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    {imageModel === 'nano-banana-pro' ? 'Aspect Ratio' : 'Image Size'}
                                                </Label>
                                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                                        <SelectItem value="2:3">2:3 (Portrait)</SelectItem>
                                                        <SelectItem value="3:2">3:2 (Landscape)</SelectItem>
                                                        <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                                                        <SelectItem value="4:3">4:3 (Landscape)</SelectItem>
                                                        <SelectItem value="4:5">4:5 (Instagram Portrait)</SelectItem>
                                                        <SelectItem value="5:4">5:4 (Landscape)</SelectItem>
                                                        <SelectItem value="9:16">9:16 (Story/Reel)</SelectItem>
                                                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                                                        <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                                                        <SelectItem value="auto">Auto</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Reference Images Upload (only for Titan and Nexus) */}
                                        {(imageModel === 'nano-banana-pro' || imageModel === 'google/nano-banana-edit') && (
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold flex items-center gap-2">
                                                    <Upload size={16} />
                                                    Reference Images (Optional)
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Upload 1 or more images to guide the AI generation
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="reference-images"
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById('reference-images')?.click()}
                                                        className="w-full"
                                                    >
                                                        <Upload size={16} className="mr-2" />
                                                        Upload Images
                                                    </Button>
                                                </div>

                                                {/* Image Previews */}
                                                {referenceImages.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {referenceImages.map((file, index) => (
                                                            <div key={index} className="relative group">
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Reference ${index + 1}`}
                                                                    referrerPolicy="no-referrer"
                                                                    className="w-full h-24 object-cover rounded-lg border border-border"
                                                                />
                                                                <button
                                                                    onClick={() => handleRemoveImage(index)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove image"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                                                                    {file.name}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                        <Button
                                            onClick={() => handleAction('generate_image', editableImagePrompt)}
                                            disabled={loading || !editableImagePrompt.trim()}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            {loading && actionLoading === 'generate_image' ? <Loader2 size={16} className="animate-spin mr-2" /> : <ImageIcon size={16} className="mr-2" />}
                                            Generate Image
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Generated Image Result */}
                            {(customMediaType === 'image' ? customMediaUrl : (output.image_url || output.imageUrl)) && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-lg font-semibold">
                                            {customMediaType === 'image' ? 'Custom Image' : 'Generated Image'}
                                        </Label>
                                        <Button variant="ghost" size="sm" onClick={handleRemoveGeneratedImage}>
                                            <X size={14} className="mr-1" /> Remove
                                        </Button>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-border bg-secondary/30">
                                        <img
                                            src={customMediaType === 'image' ? customMediaUrl || '' : (output.image_url || output.imageUrl)}
                                            alt="Generated Social Media Visual"
                                            referrerPolicy="no-referrer"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" className="flex-1">
                                            <a href={customMediaType === 'image' ? customMediaUrl || '' : (output.image_url || output.imageUrl)} target="_blank" rel="noreferrer">
                                                <ExternalLink size={16} className="mr-2" /> Open Full Size
                                            </a>
                                        </Button>
                                        <Button asChild className="flex-1">
                                            <a href={customMediaType === 'image' ? customMediaUrl || '' : (output.image_url || output.imageUrl)} download={`social-post-${platform}-${Date.now()}.png`}>
                                                <Download size={16} className="mr-2" /> Download
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Approval Section */}
                        <Card className="p-8">
                            <div className="space-y-4">
                                {/* Post to Accounts Button */}
                                <Button
                                    onClick={() => setShowPostModal(true)}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                                >
                                    <Share2 size={18} className="mr-2" />
                                    Post to Connected Accounts
                                </Button>

                                {/* Approval and Reset Buttons */}
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => handleAction('approve')}
                                        disabled={loading || approved}
                                        size="lg"
                                        variant="outline"
                                        className={`flex-1 ${approved ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`}
                                    >
                                        {loading && actionLoading === 'approve' ? (
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                        ) : approved ? (
                                            <><CheckCircle2 size={18} className="mr-2" /> Approved</>
                                        ) : (
                                            <><Check size={18} className="mr-2" /> Approve Post</>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        size="lg"
                                        className="flex-1"
                                    >
                                        <RefreshCw size={18} className="mr-2" /> New Post
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Post to Accounts Modal */}
                        <PostToAccountsModal
                            open={showPostModal}
                            onOpenChange={setShowPostModal}
                            content={{
                                text: editablePost,
                                imageUrls: (customMediaType === 'image' && customMediaUrl)
                                    ? [customMediaUrl]
                                    : (output.image_url ? [output.image_url] : (output.imageUrl ? [output.imageUrl] : [])),
                                videoUrl: (customMediaType === 'video' && customMediaUrl)
                                    ? customMediaUrl
                                    : (output.video_url || output.videoUrl),
                                hashtags: output.hashtags || []
                            }}
                            projectId={currentProjectId || undefined}
                            onSuccess={() => {
                                toast.success('Successfully posted to social media!');
                            }}
                        />
                    </div>

                )}
            </div>
        </div>
    );
};

export default SocialPostGenerator;

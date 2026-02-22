import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Youtube, Upload, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getConnectedAccounts, ConnectedAccount } from '@/services/socialMediaOAuthService';
import { postToSocialMedia } from '@/services/socialMediaPostingService';
import { uploadToImgbb } from '@/services/imgbbService';

interface YoutubeUploadModalProps {
    open: boolean;
    onClose: () => void;
    videoUrl: string;
    defaultTitle: string;
    imgbbKey: string;
}

const YOUTUBE_CATEGORIES = [
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '19', name: 'Travel & Events' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' }
];

export const YoutubeUploadModal: React.FC<YoutubeUploadModalProps> = ({
    open,
    onClose,
    videoUrl,
    defaultTitle,
    imgbbKey
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [youtubeAccounts, setYoutubeAccounts] = useState<ConnectedAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Form state
    const [title, setTitle] = useState(defaultTitle.substring(0, 100));
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [category, setCategory] = useState('22'); // People & Blogs
    const [privacy, setPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');

    // Thumbnail state
    const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'custom'>('auto');
    const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Advanced options
    const [madeForKids, setMadeForKids] = useState(false);
    const [allowComments, setAllowComments] = useState(true);
    const [embeddable, setEmbeddable] = useState(true);

    // Load YouTube accounts
    useEffect(() => {
        if (open && user) {
            loadYoutubeAccounts();
        }
    }, [open, user]);

    // Reset title when defaultTitle changes
    useEffect(() => {
        setTitle(defaultTitle.substring(0, 100));
    }, [defaultTitle]);

    const loadYoutubeAccounts = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const accounts = await getConnectedAccounts(user.id, 'google');
            setYoutubeAccounts(accounts);
            if (accounts.length > 0) {
                setSelectedAccountId(accounts[0].id);
            }
        } catch (error) {
            console.error('Failed to load YouTube accounts:', error);
            toast.error('Failed to load YouTube accounts');
        } finally {
            setLoading(false);
        }
    };

    const generateThumbnailFromVideo = async (): Promise<File> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';

            video.onloadedmetadata = () => {
                video.currentTime = video.duration / 2; // Get middle frame
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1280;
                canvas.height = 720;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(video, 0, 0, 1280, 720);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to generate thumbnail'));
                        return;
                    }
                    const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                    resolve(file);
                }, 'image/jpeg', 0.95);
            };

            video.onerror = () => {
                reject(new Error('Failed to load video'));
            };
        });
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid format. Use JPG, PNG, BMP, or GIF');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Thumbnail must be under 2MB');
            return;
        }

        // Validate dimensions
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => { img.onload = resolve; });

        if (img.width < 640 || img.height < 360) {
            toast.error('Minimum dimensions: 640x360');
            URL.revokeObjectURL(img.src);
            return;
        }

        setCustomThumbnail(file);
        setThumbnailPreview(img.src);
    };

    const removeThumbnail = () => {
        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }
        setCustomThumbnail(null);
        setThumbnailPreview(null);
    };

    const handleUpload = async () => {
        if (!user) {
            toast.error('Please log in to upload');
            return;
        }

        if (!selectedAccountId) {
            toast.error('Please select a YouTube account');
            return;
        }

        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setUploading(true);

        try {
            // 1. Handle thumbnail
            let thumbnailUrl: string | null = null;
            let thumbnailFile: File | null = null;

            if (thumbnailMode === 'auto') {
                toast.info('Generating thumbnail from video...');
                thumbnailFile = await generateThumbnailFromVideo();
            } else if (customThumbnail) {
                thumbnailFile = customThumbnail;
            }

            // 2. Upload thumbnail to ImgBB if exists
            if (thumbnailFile) {
                toast.info('Uploading thumbnail...');
                thumbnailUrl = await uploadToImgbb(thumbnailFile, imgbbKey);
            }

            // 3. Upload to YouTube
            toast.info('Uploading video to YouTube...');
            const result = await postToSocialMedia({
                accountId: selectedAccountId,
                platform: 'youtube',
                content: {
                    videoUrl: videoUrl,
                    title: title.trim(),
                    text: description.trim(),
                    tags: tags.split(',').map(t => t.trim()).filter(t => t),
                    category: category,
                    privacy: privacy,
                    thumbnailUrl: thumbnailUrl,
                    // Advanced options
                    madeForKids: madeForKids,
                    allowComments: allowComments,
                    embeddable: embeddable
                }
            });

            if (result.success) {
                toast.success('✅ Video uploaded to YouTube successfully!');
                onClose();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            toast.error(`Upload failed: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (uploading) return; // Prevent closing while uploading
        onClose();
    };

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (youtubeAccounts.length === 0) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            Connect YouTube Account
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                        <p className="text-muted-foreground">
                            You need to connect a YouTube account before you can upload videos.
                        </p>
                        <Button onClick={() => window.location.href = '/connected-accounts'} className="w-full">
                            Go to Connected Accounts
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-600" />
                        Upload Video to YouTube
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* YouTube Account Selection */}
                    {youtubeAccounts.length > 1 && (
                        <div className="space-y-2">
                            <Label>YouTube Account</Label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {youtubeAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.account_name || account.platform_username || 'YouTube Account'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.substring(0, 100))}
                            placeholder="Enter video title"
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value.substring(0, 5000))}
                            placeholder="Enter video description"
                            rows={4}
                            maxLength={5000}
                        />
                        <p className="text-xs text-muted-foreground">{description.length}/5000 characters</p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value.substring(0, 500))}
                            placeholder="tag1, tag2, tag3"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                    </div>

                    {/* Category and Privacy */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {YOUTUBE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Privacy</Label>
                            <Select value={privacy} onValueChange={(val) => setPrivacy(val as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Thumbnail Section */}
                    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                        <Label>Thumbnail</Label>
                        <RadioGroup value={thumbnailMode} onValueChange={(val) => setThumbnailMode(val as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="auto" id="auto" />
                                <Label htmlFor="auto" className="font-normal cursor-pointer">
                                    Auto-generate from video
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom" className="font-normal cursor-pointer">
                                    Upload custom thumbnail
                                </Label>
                            </div>
                        </RadioGroup>

                        {thumbnailMode === 'custom' && (
                            <div className="space-y-3 mt-3">
                                {thumbnailPreview ? (
                                    <div className="relative">
                                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full rounded-lg" />
                                        <Button
                                            onClick={removeThumbnail}
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <Label htmlFor="thumbnail-upload" className="cursor-pointer text-sm text-muted-foreground">
                                            Click to upload thumbnail
                                            <p className="text-xs mt-1">JPG, PNG, GIF, BMP (max 2MB, min 640x360)</p>
                                        </Label>
                                        <Input
                                            id="thumbnail-upload"
                                            type="file"
                                            accept="image/jpeg,image/png,image/bmp,image/gif"
                                            onChange={handleThumbnailUpload}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Advanced Options */}
                    <div className="border rounded-lg">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <span className="font-medium">Advanced Options</span>
                            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {showAdvanced && (
                            <div className="p-4 space-y-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="kids" className="font-normal">Made for Kids</Label>
                                    <input
                                        id="kids"
                                        type="checkbox"
                                        checked={madeForKids}
                                        onChange={(e) => setMadeForKids(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="comments" className="font-normal">Allow Comments</Label>
                                    <input
                                        id="comments"
                                        type="checkbox"
                                        checked={allowComments}
                                        onChange={(e) => setAllowComments(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="embed" className="font-normal">Allow Embedding</Label>
                                    <input
                                        id="embed"
                                        type="checkbox"
                                        checked={embeddable}
                                        onChange={(e) => setEmbeddable(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleClose} variant="outline" disabled={uploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || !title.trim()}>
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Youtube className="mr-2 h-4 w-4" />
                                Upload to YouTube
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

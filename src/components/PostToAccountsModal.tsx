import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Loader2,
    CheckCircle2,
    XCircle,
    ExternalLink,
    AlertCircle,
    Youtube
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getConnectedAccounts,
    SocialMediaAccount
} from '@/services/socialMediaOAuthService';
import {
    postToMultipleAccounts,
    schedulePost,
    PostContent
} from '@/services/socialMediaPostingService';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock } from 'lucide-react';

interface PostToAccountsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: PostContent;
    projectId?: string;
    onSuccess?: () => void;
}

const PostToAccountsModal: React.FC<PostToAccountsModalProps> = ({
    open,
    onOpenChange,
    content,
    projectId,
    onSuccess
}) => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [postResults, setPostResults] = useState<{ accountId: string; success: boolean; error?: string; warning?: string }[]>([]);

    // Scheduling State
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<string>('');

    // Editable Content State
    const [postText, setPostText] = useState(content.text);

    // Sync state with props when modal opens
    useEffect(() => {
        if (open) {
            setPostText(content.text);
        }
    }, [open, content.text]);

    // Platform icons
    const platformIcons: Record<string, React.FC<any>> = {
        facebook: Facebook,
        instagram: Instagram,
        twitter: Twitter,
        linkedin: Linkedin,
        youtube: Youtube
    };

    // Platform colors
    const platformColors: Record<string, string> = {
        facebook: 'bg-blue-600',
        instagram: 'bg-pink-600',
        twitter: 'bg-black',
        linkedin: 'bg-blue-700',
        youtube: 'bg-red-600'
    };

    // Load connected accounts
    useEffect(() => {
        if (open && user?.id) {
            loadAccounts();
        }
    }, [open, user?.id]);

    const loadAccounts = async () => {
        if (!user?.id) return;

        setLoading(true);
        const result = await getConnectedAccounts(user.id);

        if (result.success && result.data) {
            // Filter only active accounts
            const activeAccounts = result.data.filter(acc => acc.account_status === 'active');
            setAccounts(activeAccounts);

            // Pre-select all active accounts
            setSelectedAccounts(new Set(activeAccounts.map(acc => acc.id)));
        } else {
            toast.error('Failed to load connected accounts');
        }

        setLoading(false);
    };

    const toggleAccount = (accountId: string) => {
        const newSelected = new Set(selectedAccounts);
        if (newSelected.has(accountId)) {
            newSelected.delete(accountId);
        } else {
            newSelected.add(accountId);
        }
        setSelectedAccounts(newSelected);
    };

    const getProfilePictureUrl = (account: SocialMediaAccount) => {
        if (account.platform === 'facebook' && account.platform_user_id) {
            return `https://graph.facebook.com/${account.platform_user_id}/picture?type=large`;
        }
        return account.profile_picture_url;
    };

    const handlePost = async () => {
        if (selectedAccounts.size === 0) {
            toast.error('Please select at least one account');
            return;
        }

        const accountsToPost = accounts.filter(acc => selectedAccounts.has(acc.id));
        const contentToPost = { ...content, text: postText };

        // Handle Scheduling
        if (isScheduling) {
            if (!scheduledDate) {
                toast.error('Please select a date and time for scheduling');
                return;
            }

            const scheduleTime = new Date(scheduledDate);
            if (scheduleTime <= new Date()) {
                toast.error('Scheduled time must be in the future');
                return;
            }

            setPosting(true);
            try {
                const result = await schedulePost(accountsToPost, contentToPost, scheduleTime, projectId);

                if (result.success) {
                    toast.success(`Successfully scheduled post for ${scheduleTime.toLocaleString()}`);
                    if (onSuccess) onSuccess();
                    setTimeout(() => onOpenChange(false), 2000);
                } else {
                    toast.error(result.error || 'Failed to schedule post');
                }
            } catch (error: any) {
                toast.error(error.message || 'Failed to schedule post');
            } finally {
                setPosting(false);
            }
            return;
        }

        // Handle Immediate Posting
        setPosting(true);
        setPostResults([]);

        try {
            const results = await postToMultipleAccounts(accountsToPost, contentToPost, projectId);

            setPostResults(results.map(r => ({
                accountId: r.accountId,
                success: r.result.success,
                error: r.result.error,
                warning: r.result.warning
            })));

            const successCount = results.filter(r => r.result.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`Posted to ${successCount} account${successCount > 1 ? 's' : ''} successfully!`);
            }

            if (failCount > 0) {
                toast.error(`Failed to post to ${failCount} account${failCount > 1 ? 's' : ''}`);
            }

            const warnings = results.filter(r => r.result.warning);
            if (warnings.length > 0) {
                warnings.forEach(w => {
                    const account = accounts.find(a => a.id === w.accountId);
                    toast.warning(`${account?.account_name || account?.platform || 'Account'}: ${w.result.warning}`);
                });
            }

            if (successCount > 0 && onSuccess) {
                onSuccess();
            }

            // Close modal after 3 seconds if all posts succeeded
            if (failCount === 0) {
                setTimeout(() => {
                    onOpenChange(false);
                }, 3000);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to post to accounts');
        } finally {
            setPosting(false);
        }
    };

    const getAccountResult = (accountId: string) => {
        return postResults.find(r => r.accountId === accountId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Post to Social Media Accounts</DialogTitle>
                    <DialogDescription>
                        Select the accounts you want to post this content to
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Content Preview */}
                    <Card className="p-4 bg-secondary/50">
                        <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-semibold block">Post Content</Label>
                            {Array.from(selectedAccounts).some(id => accounts.find(a => a.id === id)?.platform === 'twitter') && (
                                <span className={`text-xs ${postText.length > 280 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                    {postText.length} / 280 (Twitter Limit)
                                </span>
                            )}
                        </div>
                        <Textarea
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            className="min-h-[100px] mb-2 bg-background"
                            placeholder="Enter post content..."
                        />

                        {content.hashtags && content.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {content.hashtags.map((tag, idx) => (
                                    <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                ))}
                            </div>
                        )}

                        {content.imageUrls && content.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {content.imageUrls.slice(0, 4).map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Preview ${idx + 1}`}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-32 object-cover rounded"
                                    />
                                ))}
                            </div>
                        )}
                        {content.videoUrl && (
                            <div className="mt-2">
                                <Label className="text-sm font-semibold mb-1 block">Video Attachment</Label>
                                <div className="border rounded bg-muted flex items-center justify-center p-4">
                                    <video src={content.videoUrl} controls className="max-h-48 w-full rounded" />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Scheduling Option */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div className="space-y-0.5">
                            <Label className="text-base">Schedule for Later</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically post at a specific time
                            </p>
                        </div>
                        <Switch
                            checked={isScheduling}
                            onCheckedChange={setIsScheduling}
                        />
                    </div>

                    {isScheduling && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Select Date & Time</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="datetime-local"
                                    className="pl-9"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Account Selection */}
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No connected accounts found. Please connect your social media accounts first.
                                <Button
                                    variant="link"
                                    className="ml-2 p-0 h-auto"
                                    onClick={() => {
                                        onOpenChange(false);
                                        window.location.href = '/settings/connected-accounts';
                                    }}
                                >
                                    Connect Accounts
                                </Button>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Select Accounts</Label>

                            {accounts.map((account) => {
                                const PlatformIcon = platformIcons[account.platform] || Facebook;
                                const platformColor = platformColors[account.platform] || 'bg-gray-600';
                                const result = getAccountResult(account.id);
                                const isSelected = selectedAccounts.has(account.id);

                                return (
                                    <div
                                        key={account.id}
                                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border'
                                            } ${posting ? 'opacity-60' : 'cursor-pointer hover:bg-secondary/50'}`}
                                        onClick={() => !posting && toggleAccount(account.id)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => !posting && toggleAccount(account.id)}
                                            disabled={posting}
                                        />

                                        <div className={`${platformColor} text-white p-2 rounded`}>
                                            <PlatformIcon size={20} />
                                        </div>

                                        {getProfilePictureUrl(account) && (
                                            <img
                                                src={getProfilePictureUrl(account)!}
                                                alt="Profile"
                                                referrerPolicy="no-referrer"
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                                {account.account_name || account.platform_username}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {account.platform}
                                                {account.account_type && ` • ${account.account_type}`}
                                                {account.platform_username && ` • @${account.platform_username}`}
                                            </p>
                                        </div>

                                        {result && (
                                            <div>
                                                {result.success ? (
                                                    <CheckCircle2 size={20} className="text-green-500" />
                                                ) : (
                                                    <XCircle size={20} className="text-red-500" />
                                                )}
                                            </div>
                                        )}

                                        {posting && isSelected && !result && (
                                            <Loader2 size={20} className="animate-spin text-primary" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Error Messages */}
                    {postResults.some(r => !r.success) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-1">Some posts failed:</p>
                                <ul className="text-sm space-y-1">
                                    {postResults
                                        .filter(r => !r.success)
                                        .map((r, idx) => {
                                            const account = accounts.find(a => a.id === r.accountId);
                                            return (
                                                <li key={idx}>
                                                    • {account?.account_name || account?.platform || 'Unknown'}: {r.error}
                                                </li>
                                            );
                                        })}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {postResults.some(r => r.warning) && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-1">Some posts were sent without media:</p>
                                <ul className="text-sm space-y-1">
                                    {postResults
                                        .filter(r => r.warning)
                                        .map((r, idx) => {
                                            const account = accounts.find(a => a.id === r.accountId);
                                            return (
                                                <li key={idx}>
                                                    {account?.account_name || account?.platform || 'Unknown'}: {r.warning}
                                                </li>
                                            );
                                        })}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Messages */}
                    {postResults.some(r => r.success) && postResults.length === selectedAccounts.size && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Successfully posted to all selected accounts!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={posting}
                            className="flex-1"
                        >
                            {postResults.length > 0 ? 'Close' : 'Cancel'}
                        </Button>

                        {postResults.length === 0 && (
                            <Button
                                onClick={handlePost}
                                disabled={posting || selectedAccounts.size === 0 || accounts.length === 0}
                                className="flex-1"
                            >
                                {posting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        {isScheduling ? 'Scheduling...' : 'Posting...'}
                                    </>
                                ) : (
                                    <>
                                        {isScheduling ? <Clock size={16} className="mr-2" /> : <ExternalLink size={16} className="mr-2" />}
                                        {isScheduling
                                            ? 'Schedule Post'
                                            : `Post to ${selectedAccounts.size} Account${selectedAccounts.size !== 1 ? 's' : ''}`
                                        }
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PostToAccountsModal;

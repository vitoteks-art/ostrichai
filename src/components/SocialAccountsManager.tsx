import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Video,
    Youtube, // Added Youtube icon
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Trash2,
    RefreshCw,
    Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAuthorizationUrl,
    getConnectedAccounts,
    disconnectAccount,
    SocialMediaAccount
} from '@/services/socialMediaOAuthService';
import { FacebookAdAccountSelectorModal } from './ads/FacebookAdAccountSelectorModal';
import { toast } from 'sonner';

const SocialAccountsManager: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isAdSelectorOpen, setIsAdSelectorOpen] = useState(false);
    const [selectedFbAccount, setSelectedFbAccount] = useState<{ id: string, token: string } | null>(null);

    // Platform configuration
    const platforms = [
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600',
            description: 'Post to Facebook pages and personal profile'
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'bg-pink-600',
            description: 'Post to Instagram business accounts (via Facebook)'
        },
        {
            id: 'twitter',
            name: 'Twitter / X',
            icon: Twitter,
            color: 'bg-black',
            description: 'Post tweets and threads (coming soon)',
            disabled: true
        },
        {
            id: 'google',
            name: 'Google / YouTube',
            icon: Youtube,
            color: 'bg-red-600',
            description: 'Post videos to YouTube',
            setupGuide: 'GOOGLE_YOUTUBE_SETUP.md'
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'bg-blue-700',
            description: 'Share professional content'
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: Video,
            color: 'bg-slate-900',
            description: 'Post videos (coming soon)',
            disabled: true
        }
    ];

    // Load connected accounts
    useEffect(() => {
        if (user?.id) {
            loadAccounts();
        }
    }, [user?.id]);

    const loadAccounts = async () => {
        if (!user?.id) return;

        setLoading(true);
        const result = await getConnectedAccounts(user.id);

        if (result.success && result.data) {
            console.log('Successfully loaded social media accounts:', result.data);
            setAccounts(result.data);
        } else {
            console.error('Failed to load connected accounts:', result.error);
            toast.error('Failed to load connected accounts');
        }

        setLoading(false);
    };

    const handleConnect = (platform: string) => {
        setActionLoading(platform);

        try {
            const authUrl = getAuthorizationUrl(platform);

            if (!authUrl) {
                toast.error(`${platform} connection is not configured yet`);
                setActionLoading(null);
                return;
            }

            // Save current state to return to after OAuth
            sessionStorage.setItem('oauth_return_url', window.location.pathname);

            // Redirect to OAuth
            window.location.href = authUrl;
        } catch (error: any) {
            toast.error(error.message || 'Failed to start connection');
            setActionLoading(null);
        }
    };

    const handleDisconnect = async (accountId: string, platform: string) => {
        if (!user?.id) return;

        if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
            return;
        }

        setActionLoading(accountId);

        const result = await disconnectAccount(accountId, user.id);

        if (result.success) {
            toast.success(`${platform} account disconnected`);
            setAccounts(accounts.filter(a => a.id !== accountId));
        } else {
            toast.error(result.error || 'Failed to disconnect account');
        }

        setActionLoading(null);
    };

    const getProfilePictureUrl = (account: SocialMediaAccount) => {
        if (account.platform === 'facebook' && account.platform_user_id) {
            return `https://graph.facebook.com/${account.platform_user_id}/picture?type=large`;
        }
        return account.profile_picture_url;
    };

    const getAccountsForPlatform = (platformId: string): SocialMediaAccount[] => {
        return accounts.filter(acc => acc.platform === platformId && acc.account_status === 'active');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500"><CheckCircle2 size={12} className="mr-1" /> Connected</Badge>;
            case 'expired':
                return <Badge variant="secondary"><XCircle size={12} className="mr-1" /> Expired</Badge>;
            case 'revoked':
                return <Badge variant="destructive"><XCircle size={12} className="mr-1" /> Revoked</Badge>;
            case 'error':
                return <Badge variant="destructive"><XCircle size={12} className="mr-1" /> Error</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Connected Social Media Accounts</h2>
                <p className="text-muted-foreground">
                    Connect your social media accounts to post content directly from the platform
                </p>
            </div>

            {/* Benefits Alert */}
            <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                    Connected accounts allow you to post AI-generated content and ads directly to your social media platforms with one click.
                </AlertDescription>
            </Alert>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => {
                    const PlatformIcon = platform.icon;
                    const platformAccounts = getAccountsForPlatform(platform.id);
                    const isConnected = platformAccounts.length > 0;
                    const isLoading = actionLoading === platform.id || platformAccounts.some(acc => actionLoading === acc.id);

                    return (
                        <Card key={platform.id} className={isConnected ? 'border-green-500/50 shadow-sm' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`${platform.color} text-white p-2.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform`}>
                                            <PlatformIcon size={20} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {platform.name}
                                                {isConnected && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-500/10 text-green-500 border-green-500/20">
                                                        {platformAccounts.length} {platformAccounts.length === 1 ? 'Account' : 'Accounts'}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs line-clamp-1">
                                                {platform.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {isConnected ? (
                                    <div className="space-y-3">
                                        {/* Account List */}
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {platformAccounts.map((connectedAccount) => (
                                                <div key={connectedAccount.id} className="flex flex-col p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                                                    <div className="flex items-center space-x-3">
                                                        {getProfilePictureUrl(connectedAccount) ? (
                                                            <img
                                                                src={getProfilePictureUrl(connectedAccount)!}
                                                                alt="Profile"
                                                                referrerPolicy="no-referrer"
                                                                className="w-10 h-10 rounded-full border border-border"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {(connectedAccount.account_name || connectedAccount.platform_username || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-semibold text-foreground truncate text-sm">
                                                                    {connectedAccount.account_name || connectedAccount.platform_username}
                                                                </p>
                                                                {getStatusBadge(connectedAccount.account_status)}
                                                            </div>
                                                            {connectedAccount.platform_username && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    @{connectedAccount.platform_username}
                                                                </p>
                                                            )}
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                {connectedAccount.posts_count || 0} posts published
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Row-based Action Buttons per Account */}
                                                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDisconnect(connectedAccount.id, platform.name);
                                                            }}
                                                            disabled={actionLoading === connectedAccount.id}
                                                            className="h-8 text-xs text-destructive hover:bg-destructive/10 flex-1"
                                                        >
                                                            {actionLoading === connectedAccount.id ? (
                                                                <Loader2 size={12} className="animate-spin mr-1.5" />
                                                            ) : (
                                                                <Trash2 size={12} className="mr-1.5" />
                                                            )}
                                                            Remove
                                                        </Button>

                                                        {connectedAccount.account_status === 'expired' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleConnect(platform.id)}
                                                                disabled={actionLoading === connectedAccount.id}
                                                                className="h-8 text-xs flex-1"
                                                            >
                                                                <RefreshCw size={12} className="mr-1.5" />
                                                                Refresh
                                                            </Button>
                                                        )}

                                                        {platform.id === 'facebook' && connectedAccount.account_type === 'personal' && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedFbAccount({
                                                                        id: connectedAccount.id,
                                                                        token: connectedAccount.access_token
                                                                    });
                                                                    setIsAdSelectorOpen(true);
                                                                }}
                                                                className="h-8 text-xs flex-1 bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20"
                                                            >
                                                                <Target size={12} className="mr-1.5" />
                                                                Ads
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add New Account Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleConnect(platform.id)}
                                            disabled={isLoading}
                                            className="w-full text-xs h-9 border-dashed"
                                        >
                                            <ExternalLink size={12} className="mr-2" />
                                            Link Another {platform.name} Account/Page
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Connect your {platform.name} account to start posting.
                                        </p>
                                        <Button
                                            onClick={() => handleConnect(platform.id)}
                                            disabled={isLoading || platform.disabled}
                                            className={`w-full ${platform.color} text-white hover:opacity-90`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-2" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink size={16} className="mr-2" />
                                                    Connect {platform.name}
                                                </>
                                            )}
                                        </Button>

                                        {/* Setup Guide Link */}
                                        {platform.setupGuide && (
                                            <a
                                                href={`/${platform.setupGuide}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mt-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M12 16v-4" />
                                                    <path d="M12 8h.01" />
                                                </svg>
                                                View Setup Guide
                                            </a>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Help Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                        <p>• After clicking "Connect", you'll be redirected to the platform to authorize access</p>
                        <p>• You can disconnect accounts at any time</p>
                        <p>• Some platforms require business accounts for posting capabilities</p>
                        <p>• Instagram posting requires a connected Facebook page with linked Instagram business account</p>
                    </div>

                    <div className="p-3 bg-primary/5 rounded border border-primary/10">
                        <p className="text-secondary-foreground font-semibold flex items-center gap-2 mb-1">
                            <Target size={14} /> Instagram Connection Requirements:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Must be an Instagram <b>Business</b> or <b>Creator</b> account</li>
                            <li>Must be <b>linked</b> to a Facebook Page you manage</li>
                            <li>Ensure all <b>permissions</b> are granted during the Facebook login flow</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {selectedFbAccount && (
                <FacebookAdAccountSelectorModal
                    isOpen={isAdSelectorOpen}
                    onClose={() => setIsAdSelectorOpen(false)}
                    accessToken={selectedFbAccount.token}
                    socialAccountId={selectedFbAccount.id}
                />
            )}
        </div>
    );
};

export default SocialAccountsManager;

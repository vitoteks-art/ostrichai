import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '../lib/api';
import {
    exchangeCodeForToken,
    getPlatformUserInfo,
    saveConnectedAccount
} from '@/services/socialMediaOAuthService';
import { toast } from 'sonner';

const OAuthCallback: React.FC = () => {
    const { platform: routePlatform } = useParams<{ platform: string }>();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Initializing connection...');
    const hasRun = useRef(false);

    // Determined platform, preferring state over route param
    const [platform, setPlatform] = useState<string>(routePlatform || '');

    useEffect(() => {
        if (loading) return;
        if (hasRun.current) return;

        // Check if we expect a user (have a token) but it's not in context yet
        const token = localStorage.getItem('auth_token');
        if (token && !user) {
            // Context hasn't caught up yet. Wait for next re-render where 'user' is set.
            return;
        }

        // If no token and no user, we might want to wait a few renders just in case 
        // localstorage reading is slightly behind or AuthProvider is initializing.
        // But usually loading=false is sufficient.

        hasRun.current = true;
        handleOAuthCallback();
    }, [loading, user]);

    const handleOAuthCallback = async () => {
        try {
            // 1. Get code and other params
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            if (error) {
                throw new Error(errorDescription || error);
            }

            if (!code) {
                throw new Error('No authorization code received');
            }

            // 2. Detect platform
            const stateParam = urlParams.get('state');
            let effectivePlatform = routePlatform;

            if (stateParam) {
                try {
                    const decoded = atob(stateParam);
                    const state = JSON.parse(decoded);
                    if (state.platform) {
                        effectivePlatform = state.platform;
                    }
                } catch (e) {
                    // ignore parsing errors
                }
            }

            if (!effectivePlatform) {
                throw new Error('Platform not specified');
            }

            setPlatform(effectivePlatform);
            setMessage(`Processing ${effectivePlatform} connection...`);

            // 3. Special handling for Google Auth (Login)
            if (effectivePlatform === 'google' && !user) {
                setMessage('Logging you in with Google...');
                // We use the same redirect URI as the backend expects
                const redirectUri = `${window.location.origin}/oauth/callback/google`;
                const result = await apiClient.exchangeGoogleCode(code, redirectUri);

                if (result.access_token) {
                    setStatus('success');
                    setMessage('Logged in successfully! Redirecting...');
                    toast.success('Signed in with Google');

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                    return;
                }
            }

            // 4. Standard Social Media Connection Flow (requires login)
            if (!user?.id) {
                throw new Error('You must be logged in to connect social accounts');
            }

            setMessage('Exchanging authorization code for access token...');

            // Exchange code for access token
            const tokenData = await exchangeCodeForToken(effectivePlatform, code);

            setMessage('Processing your profile information...');

            // Use user info from token data if available, otherwise fetch it separately (fallback)
            const userInfo = tokenData.user_info || await getPlatformUserInfo(effectivePlatform, tokenData.access_token);

            setMessage('Saving your connected account(s)...');

            // Handle multiple accounts (e.g. LinkedIn Personal + Pages, Facebook + Instagram)
            if (tokenData.accounts && tokenData.accounts.length > 0) {
                let successCount = 0;
                const platformCounts: Record<string, number> = {};
                for (const account of tokenData.accounts) {
                    const platformToSave = account.platform || effectivePlatform;

                    const result = await saveConnectedAccount(
                        user.id,
                        platformToSave,
                        account.platform_user_id || account.id,
                        account.name,
                        account.name,
                        account.profile_picture || userInfo.profile_picture,
                        account.access_token || tokenData.access_token,
                        tokenData.refresh_token,
                        tokenData.expires_in,
                        account.type || 'personal'
                    );
                    if (result.success) {
                        successCount++;
                        platformCounts[platformToSave] = (platformCounts[platformToSave] || 0) + 1;
                    } else {
                        console.error(`Failed to save ${platformToSave} account:`, result.error);
                    }
                }

                if (successCount === 0) {
                    const d = (tokenData as any).diagnostics;
                    let diagMsg = '';
                    if (d) {
                        const pageList = d.found_page_names?.length > 0
                            ? ` [${d.found_page_names.join(', ')}]`
                            : '';
                        diagMsg = ` (Found ${d.pages_found} pages${pageList}, ${d.pages_with_ig_link} linked IG accounts)`;
                    }

                    const errorMsg = effectivePlatform === 'instagram'
                        ? `No linked Instagram Business account found${diagMsg}. Please ensure your Instagram is linked to a Facebook Page.`
                        : `No ${effectivePlatform} accounts were found${diagMsg}.`;
                    throw new Error(errorMsg);
                }

                const platformsFoundList = Object.entries(platformCounts)
                    .map(([p, count]) => `${count} ${p} account${count > 1 ? 's' : ''}`);

                const platformsFoundText = platformsFoundList.length > 1
                    ? platformsFoundList.slice(0, -1).join(', ') + ' and ' + platformsFoundList.slice(-1)
                    : platformsFoundList[0];

                const diag = (tokenData as any).diagnostics;
                const hasIgPublish = diag?.permissions?.includes('instagram_content_publish');
                const permissionWarning = (effectivePlatform === 'instagram' && !hasIgPublish)
                    ? '\n\n⚠️ Warning: Posting permission (instagram_content_publish) was not granted. Direct posting will fail.'
                    : '';

                const diagMsg = diag ? ` (Found ${diag.pages_found} pages, ${diag.pages_with_ig_link} IG)` : '';

                setStatus('success');
                setMessage(`Successfully connected ${platformsFoundText}!${diagMsg}${permissionWarning}`);

                if (permissionWarning) {
                    toast.warning(`Connected ${platformsFoundText}, but posting permissions are missing.`, { duration: 10000 });
                } else {
                    toast.success(`Connected ${platformsFoundText}${diagMsg}`);
                }

                if (effectivePlatform === 'instagram' && !platformCounts['instagram']) {
                    toast.warning('Instagram account not found. Only Facebook was connected. Ensure your Instagram is a Business account linked to a Page.', { duration: 10000 });
                }

            } else {
                // Legacy / Single account flow
                const result = await saveConnectedAccount(
                    user.id,
                    effectivePlatform,
                    userInfo.id,
                    userInfo.username,
                    userInfo.name,
                    userInfo.profile_picture,
                    tokenData.access_token,
                    tokenData.refresh_token,
                    tokenData.expires_in,
                    'personal'
                );

                if (!result.success) {
                    throw new Error(result.error || 'Failed to save account');
                }

                setStatus('success');
                setMessage(`Successfully connected your ${effectivePlatform} account!`);
                toast.success(`${effectivePlatform} account connected successfully`);
            }

            // Redirect back to where we came from
            setTimeout(() => {
                const returnUrl = sessionStorage.getItem('oauth_return_url') || '/settings/connected-accounts';
                sessionStorage.removeItem('oauth_return_url');
                navigate(returnUrl);
            }, 2000);

        } catch (error: any) {
            console.error('OAuth callback error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to connect account');
            toast.error(error.message || 'Failed to connect account');

            setTimeout(() => {
                const returnUrl = sessionStorage.getItem('oauth_return_url') || '/settings/connected-accounts';
                sessionStorage.removeItem('oauth_return_url');
                navigate(returnUrl);
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        {status === 'processing' && (
                            <>
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <h2 className="text-2xl font-bold text-foreground">Processing...</h2>
                                <p className="text-muted-foreground text-center">{message}</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="rounded-full bg-green-100 p-4">
                                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Success!</h2>
                                <p className="text-muted-foreground text-center">{message}</p>
                                <p className="text-sm text-muted-foreground">Redirecting...</p>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="rounded-full bg-red-100 p-4">
                                    <XCircle className="h-16 w-16 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Error</h2>
                                <p className="text-muted-foreground text-center">{message}</p>
                                <p className="text-sm text-muted-foreground">Redirecting...</p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OAuthCallback;

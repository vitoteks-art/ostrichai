import { apiClient } from '@/lib/api';

// Types
export interface SocialMediaAccount {
    id: string;
    user_id: string;
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
    platform_user_id: string;
    platform_username?: string;
    account_name?: string;
    profile_picture_url?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: string;
    account_type: 'personal' | 'business' | 'page';
    permissions: string[];
    account_status: 'active' | 'expired' | 'revoked' | 'error';
    posts_count: number;
    last_posted_at?: string;
    connected_at: string;
}

export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}

// Platform OAuth configurations
const getOAuthConfig = (platform: string): OAuthConfig => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    const configs: Record<string, OAuthConfig> = {
        facebook: {
            clientId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
            clientSecret: import.meta.env.FACEBOOK_APP_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/facebook`,
            scopes: ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']
        },
        instagram: {
            clientId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
            clientSecret: import.meta.env.FACEBOOK_APP_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/facebook`, // Reuse FB callback to match allowlist
            scopes: ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']
        },
        twitter: {
            clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
            clientSecret: import.meta.env.TWITTER_CLIENT_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/twitter`,
            scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
        },
        linkedin: {
            clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
            clientSecret: import.meta.env.LINKEDIN_CLIENT_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/linkedin`,
            scopes: ['openid', 'profile', 'email', 'w_member_social', 'w_organization_social', 'rw_organization_admin', 'r_organization_social']
        },
        tiktok: {
            clientId: import.meta.env.VITE_TIKTOK_CLIENT_KEY || '',
            clientSecret: import.meta.env.TIKTOK_CLIENT_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/tiktok`,
            scopes: ['user.info.basic', 'video.publish']
        },
        google: {
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || '',
            redirectUri: `${appUrl}/oauth/callback/google`,
            scopes: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube.readonly'
            ]
        }
    };

    return configs[platform];
};

// Generate OAuth authorization URL
export const getAuthorizationUrl = (platform: string): string => {
    const config = getOAuthConfig(platform);
    if (!config) return ''; // Safely handle missing config

    const state = btoa(JSON.stringify({ platform, timestamp: Date.now() }));

    const authUrls: Record<string, string> = {
        facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(',')}&state=${encodeURIComponent(state)}&response_type=code`,
        instagram: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(',')}&state=${encodeURIComponent(state)}&response_type=code`,
        twitter: `https://twitter.com/i/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join('%20')}&state=${encodeURIComponent(state)}&response_type=code&code_challenge=challenge&code_challenge_method=plain`,
        linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join('%20')}&state=${encodeURIComponent(state)}&response_type=code`,
        tiktok: `https://www.tiktok.com/v2/auth/authorize?client_key=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(',')}&state=${encodeURIComponent(state)}&response_type=code`,
        google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(' ')}&state=${encodeURIComponent(state)}&response_type=code&access_type=offline&prompt=consent`
    };

    return authUrls[platform] || '';
};

// Exchange authorization code for access token via Supabase Edge Function
export const exchangeCodeForToken = async (
    platform: string,
    code: string
): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user_info?: { id: string; username?: string; name?: string; profile_picture?: string };
    accounts?: Array<{
        id: string;
        name: string;
        profile_picture?: string;
        type: 'personal' | 'page' | 'business';
        platform_user_id: string;
        platform?: string;
        access_token?: string;
    }>;
}> => {
    const config = getOAuthConfig(platform);

    try {
        // Map instagram to facebook for backend processing
        const platformToSend = platform === 'instagram' ? 'facebook' : platform;

        // Call backend to securely exchange code for token
        const data = await apiClient.socialOAuthExchange(platformToSend, code, config.redirectUri);

        return data;
    } catch (error: any) {
        console.error(`Error exchanging code for ${platform}:`, error);
        throw error;
    }
};

// Get user profile information from platform
export const getPlatformUserInfo = async (
    platform: string,
    accessToken: string
): Promise<{ id: string; username?: string; name?: string; profile_picture?: string }> => {
    try {
        if (platform === 'facebook' || platform === 'instagram') {
            const response = await fetch(
                `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
            );
            const data = await response.json();

            return {
                id: data.id,
                name: data.name,
                profile_picture: data.picture?.data?.url
            };
        }

        if (platform === 'twitter') {
            const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const data = await response.json();

            return {
                id: data.data.id,
                username: data.data.username,
                name: data.data.name,
                profile_picture: data.data.profile_image_url
            };
        }

        if (platform === 'linkedin') {
            // LinkedIn API has strict CORS and usually shouldn't be called from browser
            // If we have an accessToken but no userInfo, it might fail here due to CORS
            const response = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const data = await response.json();

            return {
                id: data.sub,
                name: data.name,
                profile_picture: data.picture
            };
        }

        if (platform === 'google') {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const data = await response.json();

            return {
                id: data.sub,
                name: data.name,
                profile_picture: data.picture,
                username: data.email
            };
        }

        throw new Error(`Platform ${platform} not implemented`);
    } catch (error) {
        console.error(`Error getting user info from ${platform}:`, error);
        throw error;
    }
};

// Save connected account to database
export const saveConnectedAccount = async (
    userId: string,
    platform: string,
    platformUserId: string,
    platformUsername: string | undefined,
    accountName: string | undefined,
    profilePictureUrl: string | undefined,
    accessToken: string,
    refreshToken: string | undefined,
    expiresIn: number | undefined,
    accountType: 'personal' | 'business' | 'page' = 'personal'
): Promise<{ success: boolean; data?: SocialMediaAccount; error?: string }> => {
    try {
        const tokenExpiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : undefined;

        const accountData = {
            platform: platform.toLowerCase().trim(),
            platform_user_id: String(platformUserId).trim(),
            platform_username: platformUsername,
            account_name: accountName,
            profile_picture_url: profilePictureUrl,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: tokenExpiresAt,
            account_type: accountType,
            permissions: getOAuthConfig(platform.toLowerCase().trim())?.scopes || []
        };

        const result = await apiClient.createSocialAccount(accountData);
        return { success: true, data: result as SocialMediaAccount };
    } catch (error: any) {
        console.error(`Save failed for ${platform}:`, error);
        return { success: false, error: error.message };
    }
};

// Get all connected accounts for a user
export const getConnectedAccounts = async (
    userId: string
): Promise<{ success: boolean; data?: SocialMediaAccount[]; error?: string }> => {
    try {
        const data = await apiClient.getSocialAccounts();
        return { success: true, data: data as SocialMediaAccount[] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// Disconnect (delete) an account
export const disconnectAccount = async (
    accountId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        await apiClient.deleteSocialAccount(accountId);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// Refresh access token (for platforms that support it)
export const refreshAccessToken = async (
    accountId: string,
    platform: string,
    refreshToken: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const config = getOAuthConfig(platform);

        if (platform === 'twitter') {
            const response = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error_description || 'Failed to refresh token');
            }

            const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

            // Update the account with new tokens via API
            await apiClient.request(`/social/accounts/${accountId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    token_expires_at: tokenExpiresAt,
                    account_status: 'active'
                })
            });

            return { success: true };
        }

        return { success: false, error: `Token refresh not implemented for ${platform}` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// Check if token is expired or about to expire (within 1 hour)
export const isTokenExpired = (tokenExpiresAt: string | null): boolean => {
    if (!tokenExpiresAt) return false;

    const expiryTime = new Date(tokenExpiresAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    return expiryTime - now < oneHour;
};

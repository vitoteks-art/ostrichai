import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SOCIAL_SECRETS } from '../_shared/social-secrets.ts'
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthRequest {
    platform: string
    code: string
    redirectUri: string
}

serve(async (req) => {
    // Diagnostic: Log available env vars (keys only for security)
    console.log("Edge Function started. Available Env Var Keys:", Object.keys(Deno.env.toObject()).join(', '));

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { platform, code, redirectUri }: OAuthRequest = await req.json()

        let tokenData: any

        switch (platform) {
            case 'facebook':
                tokenData = await exchangeFacebookToken(code, redirectUri)
                break
            case 'twitter':
                tokenData = await exchangeTwitterToken(code, redirectUri)
                break
            case 'linkedin':
                tokenData = await exchangeLinkedInToken(code, redirectUri)
                break
            case 'tiktok':
                tokenData = await exchangeTikTokToken(code, redirectUri)
                break
            case 'google':
                tokenData = await exchangeGoogleToken(code, redirectUri)
                break
            default:
                return new Response(
                    JSON.stringify({ error: 'Unsupported platform' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

        return new Response(
            JSON.stringify(tokenData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('OAuth error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'OAuth exchange failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function exchangeFacebookToken(code: string, redirectUri: string) {
    const clientId = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('VITE_FACEBOOK_APP_ID') || SOCIAL_SECRETS.FACEBOOK_APP_ID
    const clientSecret = Deno.env.get('FACEBOOK_APP_SECRET') || SOCIAL_SECRETS.FACEBOOK_APP_SECRET

    if (!clientId) throw new Error('Facebook App ID not configured')
    if (!clientSecret) throw new Error('Facebook App Secret not configured (FACEBOOK_APP_SECRET)')

    const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${clientId}&` +
        `client_secret=${clientSecret}&` +
        `code=${code}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`
    )

    const data = await response.json()

    if (data.error) {
        throw new Error(data.error.message || 'Failed to exchange Facebook token')
    }

    const accessToken = data.access_token

    // Fetch user info
    const userInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
    );
    const userInfo = await userInfoResponse.json();

    const accounts = []
    // Always include the personal account
    accounts.push({
        id: userInfo.id,
        name: userInfo.name,
        profile_picture: userInfo.picture?.data?.url,
        type: 'personal',
        platform_user_id: userInfo.id,
        platform: 'facebook',
        access_token: accessToken
    });

    const diagnostics: any = {
        pages_found: 0,
        found_page_names: [],
        pages_with_ig_link: 0,
        ig_accounts_detailed: 0,
        permissions: []
    }

    // 0. Fetch Permissions
    try {
        const permsResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
        );
        const permsData = await permsResponse.json();
        console.log("Facebook Permissions:", JSON.stringify(permsData.data));
        if (permsData.data) {
            diagnostics.permissions = permsData.data
                .filter((p: any) => p.status === 'granted')
                .map((p: any) => p.permission);
        }
    } catch (e) {
        console.warn('Failed to fetch permissions:', e);
    }

    // 1. Fetch Facebook Pages (includes Page Access Tokens)
    try {
        console.log(`Fetching pages for Facebook user ${userInfo.id}...`);

        // Use simpler fields first to avoid "This method must be called with a Page Access Token" error
        // 'instagram_accounts' field is known to trigger this error when requested with a User Token
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account&access_token=${accessToken}`;

        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
            console.error("Facebook Pages API Error (me/accounts):", JSON.stringify(pagesData.error));
            diagnostics.pages_error = pagesData.error.message;

            // Fallback: Try with the absolute ID if 'me' fails
            if (pagesData.error.code === 190) {
                console.log("Retrying pages fetch with absolute user ID fallback...");
                const fallbackUrl = `https://graph.facebook.com/v18.0/${userInfo.id}/accounts?fields=id,name,access_token,picture,instagram_business_account&access_token=${accessToken}`;
                const fallbackRes = await fetch(fallbackUrl);
                const fallbackData = await fallbackRes.json();
                if (!fallbackData.error) {
                    console.log(`Fallback found ${fallbackData.data?.length || 0} pages`);
                    pagesData.data = fallbackData.data;
                    delete pagesData.error;
                } else {
                    console.error("Facebook Fallback API Error:", JSON.stringify(fallbackData.error));
                }
            }
        }

        console.log(`Discovered ${pagesData.data?.length || 0} Facebook pages`);
        diagnostics.pages_found = pagesData.data?.length || 0;

        if (pagesData.data && pagesData.data.length > 0) {
            diagnostics.found_page_names = pagesData.data.map((p: any) => p.name);
            for (const page of pagesData.data) {
                // Add Facebook Page with its specific Page Access Token
                accounts.push({
                    id: page.id,
                    name: page.name,
                    profile_picture: page.picture?.data?.url,
                    type: 'page',
                    platform_user_id: page.id,
                    platform: 'facebook',
                    access_token: page.access_token // CRITICAL: Store the Page-specific token
                });

                // Path A: Check for linked Instagram Business Account on the page
                console.log(`Checking page ${page.name} (${page.id}) for linked Instagram account (Path A)...`);
                const igAccount = page.instagram_business_account || (page.instagram_accounts?.data?.[0]);

                if (igAccount) {
                    diagnostics.pages_with_ig_link++;
                    const igId = igAccount.id;
                    console.log(`Found linked Instagram account ID: ${igId}`);
                    try {
                        const igResponse = await fetch(
                            `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
                        );
                        const igData = await igResponse.json();

                        if (igData.id) {
                            diagnostics.ig_accounts_detailed++;
                            accounts.push({
                                id: igData.id,
                                name: igData.name || igData.username,
                                username: igData.username,
                                profile_picture: igData.profile_picture_url,
                                type: 'business',
                                platform_user_id: igData.id,
                                platform: 'instagram',
                                access_token: page.access_token // IG Business API usually uses the linked Page token
                            });
                        }
                    } catch (e: any) {
                        console.warn(`Failed to fetch Instagram account details for ${igId}:`, e);
                        diagnostics.last_ig_error = e.message;
                    }
                }
            }
        }

        // Path B: Direct Discovery fallback (New)
        console.log("Attempting direct Instagram discovery (Path B)...");
        try {
            const igDirectResponse = await fetch(
                `https://graph.facebook.com/v18.0/me/instagram_business_accounts?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
            );
            const igDirectData = await igDirectResponse.json();
            if (igDirectData.data && igDirectData.data.length > 0) {
                console.log(`Path B found ${igDirectData.data.length} accounts`);
                for (const ig of igDirectData.data) {
                    // Only add if not already found via Page
                    if (!accounts.some(a => a.platform === 'instagram' && a.platform_user_id === ig.id)) {
                        accounts.push({
                            id: ig.id,
                            name: ig.name || ig.username,
                            username: ig.username,
                            profile_picture: ig.profile_picture_url,
                            type: 'business',
                            platform_user_id: ig.id,
                            platform: 'instagram',
                            access_token: accessToken // Use User token as fallback
                        });
                        diagnostics.ig_accounts_detailed++;
                    }
                }
            }
        } catch (e: any) {
            console.warn('Path B discovery failed:', e);
            diagnostics.path_b_error = e.message;
        }
    } catch (e: any) {
        console.warn('Failed to fetch Facebook pages/Instagram accounts:', e);
        diagnostics.critical_error = e.message;
    }

    return {
        access_token: accessToken,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user_info: {
            id: userInfo.id,
            name: userInfo.name,
            profile_picture: userInfo.picture?.data?.url
        },
        accounts: accounts,
        diagnostics: diagnostics
    }
}

async function exchangeTwitterToken(code: string, redirectUri: string) {
    const clientId = Deno.env.get('TWITTER_CLIENT_ID') || Deno.env.get('VITE_TWITTER_CLIENT_ID') || SOCIAL_SECRETS.TWITTER_CLIENT_ID
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET') || SOCIAL_SECRETS.TWITTER_CLIENT_SECRET

    if (!clientId) throw new Error('Twitter Client ID not configured')
    if (!clientSecret) throw new Error('Twitter Client Secret not configured (TWITTER_CLIENT_SECRET)')

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code_verifier: 'challenge'
        }).toString()
    })

    const data = await response.json()

    if (data.error) {
        throw new Error(data.error_description || 'Failed to exchange Twitter token')
    }

    // Fetch user info
    const userInfoResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: {
            'Authorization': `Bearer ${data.access_token}`
        }
    });
    const userInfo = await userInfoResponse.json();

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user_info: {
            id: userInfo.data?.id,
            username: userInfo.data?.username,
            name: userInfo.data?.name,
            profile_picture: userInfo.data?.profile_image_url
        }
    }
}

async function exchangeLinkedInToken(code: string, redirectUri: string) {
    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID') || Deno.env.get('VITE_LINKEDIN_CLIENT_ID') || SOCIAL_SECRETS.LINKEDIN_CLIENT_ID
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET') || SOCIAL_SECRETS.LINKEDIN_CLIENT_SECRET

    if (!clientId) {
        const envKeys = Object.keys(Deno.env.toObject()).join(', ');
        throw new Error(`LinkedIn Client ID not configured. Available keys in this environment: ${envKeys}`);
    }
    if (!clientSecret) throw new Error('LinkedIn Client Secret not configured (LINKEDIN_CLIENT_SECRET)')

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
        }).toString()
    })

    const data = await response.json()

    if (data.error) {
        throw new Error(data.error_description || 'Failed to exchange LinkedIn token')
    }

    // 1. Fetch user profile (Personal)
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${data.access_token}`
        }
    });
    const userInfo = await userInfoResponse.json();
    console.log("LinkedIn UserInfo retrieved:", JSON.stringify(userInfo));

    if (!userInfo.sub) {
        console.error("LinkedIn UserInfo missing 'sub' field:", userInfo);
    }

    const accounts = [];

    // Add Personal Account
    accounts.push({
        id: userInfo.sub,
        name: userInfo.name,
        profile_picture: userInfo.picture,
        type: 'personal',
        platform_user_id: userInfo.sub.startsWith('urn:li:person:') ? userInfo.sub : `urn:li:person:${userInfo.sub}`
    });

    // 2. Fetch Organizations where user is ADMIN
    try {
        const orgsResponse = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        const orgsData = await orgsResponse.json();

        if (orgsData.elements && orgsData.elements.length > 0) {
            for (const element of orgsData.elements) {
                const orgUrn = element.organizationalTarget; // urn:li:organization:12345
                const orgId = orgUrn.split(':').pop();

                // Fetch Org Details
                const orgDetailsRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                    headers: {
                        'Authorization': `Bearer ${data.access_token}`,
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                const orgDetails = await orgDetailsRes.json();

                accounts.push({
                    id: orgDetails.id,
                    name: orgDetails.localizedName,
                    profile_picture: null, // Additional call needed for logo, preserving simplicity for now
                    type: 'page',
                    platform_user_id: orgUrn.startsWith('urn:li:organization:') ? orgUrn : `urn:li:organization:${orgUrn.split(':').pop()}`
                });
            }
        }
    } catch (e) {
        console.warn('Failed to fetch LinkedIn organizations:', e);
    }

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user_info: {
            id: userInfo.sub,
            name: userInfo.name,
            profile_picture: userInfo.picture
        },
        accounts: accounts
    }
}

async function exchangeTikTokToken(code: string, redirectUri: string) {
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY') || Deno.env.get('VITE_TIKTOK_CLIENT_KEY')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')

    if (!clientKey) throw new Error('TikTok Client Key not configured (TIKTOK_CLIENT_KEY or VITE_TIKTOK_CLIENT_KEY)')
    if (!clientSecret) throw new Error('TikTok Client Secret not configured (TIKTOK_CLIENT_SECRET)')

    const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        }).toString()
    })

    const data = await response.json()

    if (data.error || data.data?.error_code) {
        throw new Error(data.data?.description || 'Failed to exchange TikTok token')
    }

    // Fetch user info
    const userInfoResponse = await fetch('https://open-api.tiktok.com/user/info/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${data.data.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: ['open_id', 'union_id', 'avatar_url', 'display_name']
        })
    });
    const userInfo = await userInfoResponse.json();

    return {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_in: data.data.expires_in,
        open_id: data.data.open_id,
        user_info: {
            id: userInfo.data?.user?.open_id,
            name: userInfo.data?.user?.display_name,
            profile_picture: userInfo.data?.user?.avatar_url
        }
    }
}

// Redundant helper removed
async function REMOVED_performGoogleTokenExchange(code: string, redirectUri: string, clientId: string, clientSecret: string) {
    console.log(`Exchanging Google code. Client ID: ${clientId.substring(0, 10)}..., Redirect URI: ${redirectUri}`);

    const exchangeStartTime = Date.now();
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }).toString()
        });

        const data = await response.json();
        const duration = Date.now() - exchangeStartTime;
        console.log(`Google token exchange took ${duration}ms`);

        if (data.error) {
            console.error("Google Token Exchange Data Error:", JSON.stringify(data));
            throw new Error(data.error_description || data.error || 'Failed to exchange Google token');
        }

        return data;
    } catch (e: any) {
        console.error("Google Token Exchange Fetch/JSON Error:", e.message);
        throw e;
    }
}

// Separate helper for user info to keep exchangeGoogleToken clean
async function exchangeGoogleToken(code: string, redirectUri: string) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || Deno.env.get('VITE_GOOGLE_CLIENT_ID') || SOCIAL_SECRETS.GOOGLE_CLIENT_ID
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || SOCIAL_SECRETS.GOOGLE_CLIENT_SECRET

    if (!clientId) throw new Error('Google Client ID not configured')
    if (!clientSecret) throw new Error('Google Client Secret not configured (GOOGLE_CLIENT_SECRET)')

    console.log(`Exchanging Google code. Client ID prefix: ${clientId.substring(0, 10)}..., Redirect URI: ${redirectUri}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        // 1. Exchange code for tokens
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }).toString(),
            signal: controller.signal
        });

        const data = await response.json();
        if (data.error) {
            console.error("Google Token Exchange Data Error:", JSON.stringify(data));
            throw new Error(data.error_description || data.error || 'Failed to exchange Google token');
        }

        // 2. Fetch user info
        console.log("Fetching Google user info...");
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${data.access_token}` },
            signal: controller.signal
        });
        const userInfo = await userInfoResponse.json();
        console.log("Google UserInfo retrieved:", userInfo.email);

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type,
            scope: data.scope,
            user_info: {
                id: userInfo.sub,
                name: userInfo.name,
                username: userInfo.email,
                profile_picture: userInfo.picture
            }
        };
    } catch (e: any) {
        if (e.name === 'AbortError') {
            console.error("Google API request timed out after 15s");
            throw new Error('Google API request timed out. Please check your network or credentials.');
        }
        console.error("Google OAuth Critical Error:", e.message);
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}

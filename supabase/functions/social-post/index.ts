import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SOCIAL_SECRETS } from '../_shared/social-secrets.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostContent {
    text: string;
    imageUrls?: string[];
    videoUrl?: string;
    hashtags?: string[];
    // YouTube-specific fields
    title?: string;
    tags?: string[];
    category?: string;
    privacy?: 'public' | 'private' | 'unlisted';
    madeForKids?: boolean;
    allowComments?: boolean;
    embeddable?: boolean;
    thumbnailUrl?: string;
}

interface SocialMediaAccount {
    id: string;
    platform: string;
    access_token: string;
    platform_user_id: string;
    account_type?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { platform, account, content } = await req.json() as {
            platform: string;
            account: SocialMediaAccount;
            content: PostContent;
        }

        let result: any

        switch (platform) {
            case 'facebook':
                result = await postToFacebook(account, content)
                break
            case 'twitter':
                result = await postToTwitter(account, content)
                break
            case 'linkedin':
                result = await postToLinkedIn(account, content)
                break
            case 'instagram':
                result = await postToInstagram(account, content)
                break
            case 'youtube':
                result = await postToYouTube(account, content)
                break
            case 'google_ads':
                // Placeholder for Google Ads - likely needs separate handling/endpoint due to complexity
                throw new Error('Google Ads posting not yet implemented directly via social-post endpoint')
                break
            default:
                return new Response(
                    JSON.stringify({ error: `Unsupported platform: ${platform}` }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Social posting error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Posting failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// --- Platform Specific Handlers ---

async function postToInstagram(account: SocialMediaAccount, content: PostContent) {
    if (!content.imageUrls || content.imageUrls.length === 0) {
        throw new Error('Instagram requires at least one image for posting via the API.');
    }

    const caption = content.hashtags && content.hashtags.length > 0
        ? `${content.text}\n\n${content.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`
        : content.text;

    const instagramUserId = account.platform_user_id;
    const accessToken = account.access_token;

    const isPageToken = accessToken.length > 100 && accessToken.startsWith('EA'); // Page tokens are usually long, but let's just log it
    console.log(`Instagram Posting Debug: ID=${instagramUserId}, TokenLength=${accessToken.length}, LikelyPageToken=${isPageToken}`);

    // 1. Create Media Container
    const imageUrl = content.imageUrls[0];
    const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramUserId}/media`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken
            })
        }
    );

    const containerData = await containerResponse.json();
    if (containerData.error) {
        let errorHint = '';
        if (containerData.error.code === 100 || containerData.error.message.includes('Unsupported post request')) {
            errorHint = ' This often happens if the account is not a Business Account, or if permissions are missing for this specific IG ID.';
        }
        throw new Error(`Instagram Media Container Error: ${containerData.error.message}${errorHint} (ID: ${instagramUserId})`);
    }

    const creationId = containerData.id;
    console.log(`Media container created: ${creationId}. Polling status...`);

    // 2. Poll for Status (Instagram processing can take time)
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 10;

    while (status !== 'FINISHED' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        const statusResponse = await fetch(
            `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();
        status = statusData.status_code;

        if (status === 'ERROR') {
            throw new Error('Instagram media processing failed.');
        }
        attempts++;
    }

    if (status !== 'FINISHED') {
        throw new Error('Instagram media processing timed out.');
    }

    // 3. Publish Media
    const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: accessToken
            })
        }
    );

    const publishData = await publishResponse.json();
    if (publishData.error) {
        throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
    }

    return {
        success: true,
        platformPostId: publishData.id,
        platformPostUrl: `https://www.instagram.com/reels/${publishData.id}/` // Generic link or fetch permalink if needed
    };
}

async function postToFacebook(account: SocialMediaAccount, content: PostContent) {
    const fullText = content.hashtags && content.hashtags.length > 0
        ? `${content.text}\n\n${content.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`
        : content.text;

    // Use specific page account provided in request
    const pageId = account.platform_user_id;
    const pageAccessToken = account.access_token;

    console.log(`Posting to Facebook Page: ${pageId}...`);

    if (content.imageUrls && content.imageUrls.length > 0) {
        if (content.imageUrls.length === 1) {
            const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: content.imageUrls[0],
                    caption: fullText,
                    access_token: pageAccessToken
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return {
                success: true,
                platformPostId: data.id || data.post_id,
                platformPostUrl: `https://facebook.com/${data.id || data.post_id}`
            };
        } else {
            // Multiple images
            const photoIds = await Promise.all(content.imageUrls.map(async (url) => {
                const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, published: false, access_token: pageAccessToken })
                });
                const d = await res.json();
                if (d.error) throw new Error(d.error.message);
                return d.id;
            }));

            const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: fullText,
                    attached_media: photoIds.map(id => ({ media_fbid: id })),
                    access_token: pageAccessToken
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return { success: true, platformPostId: data.id, platformPostUrl: `https://facebook.com/${data.id}` };
        }
    } else {
        // Text-only
        const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: fullText, access_token: pageAccessToken })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return { success: true, platformPostId: data.id, platformPostUrl: `https://facebook.com/${data.id}` };
    }
}

async function postToTwitter(account: SocialMediaAccount, content: PostContent) {
    const fullText = content.hashtags && content.hashtags.length > 0
        ? `${content.text}\n\n${content.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`
        : content.text;

    const tweetText = fullText.length > 280 ? fullText.substring(0, 277) + '...' : fullText;
    const tweetData: any = { text: tweetText };

    // 1. Handle Media Upload if images are present
    if (content.imageUrls && content.imageUrls.length > 0) {
        try {
            console.log(`Uploading ${content.imageUrls.length} images to Twitter...`);
            const mediaIds = await Promise.all(
                content.imageUrls.slice(0, 4).map(url => uploadTwitterMedia(account.access_token, url))
            );
            tweetData.media = { media_ids: mediaIds };
        } catch (mediaError: any) {
            console.warn('Twitter media upload failed:', mediaError);
            throw new Error(`Twitter Media Upload Failed: ${mediaError.message}`);
        }
    }

    // 2. Post Tweet using v2 API
    const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
    });

    const data = await response.json();
    if (data.errors) {
        console.error('Twitter API error:', data.errors);
        throw new Error(data.errors[0]?.message || 'Failed to post to Twitter');
    }

    return {
        success: true,
        platformPostId: data.data?.id,
        platformPostUrl: `https://twitter.com/i/status/${data.data?.id}`
    };
}

async function uploadTwitterMedia(accessToken: string, imageUrl: string): Promise<string> {
    // A. Fetch image binary
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
    const imageBlob = await imageRes.blob();

    // B. Upload to Twitter v1.1 Media Endpoint
    // Note: Twitter v1.1 supports OAuth 2.0 Bearer tokens for media upload for v2 apps
    const formData = new FormData();
    formData.append('media', imageBlob);

    const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
    });

    const responseText = await uploadRes.text();
    let uploadData: any;

    try {
        uploadData = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse Twitter upload response: ${responseText.substring(0, 100)}`);
    }

    if (uploadData.errors) {
        throw new Error(uploadData.errors[0]?.message || 'Twitter media upload failed');
    }

    if (!uploadData.media_id_string) {
        throw new Error('Twitter media upload did not return a media_id_string');
    }

    return uploadData.media_id_string;
}

async function postToLinkedIn(account: SocialMediaAccount, content: PostContent) {
    const fullText = content.hashtags && content.hashtags.length > 0
        ? `${content.text}\n\n${content.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`
        : content.text;

    // Use platform_user_id as author URN (either person urn or organization urn)
    // If it doesn't have a URN prefix, assume it's a person URN from legacy data
    let authorUrn = account.platform_user_id;
    if (!authorUrn.startsWith('urn:li:')) {
        authorUrn = `urn:li:person:${authorUrn}`;
    }

    // 1. Handle Image Upload (using rest/images for Posts API)
    let mediaUrn = null;
    if (content.imageUrls && content.imageUrls.length > 0) {
        // For simplicity, handle single image for now as multi-image logic is complex in new API
        const imageUrl = content.imageUrls[0];

        // A. Initialize Upload
        const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202501',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify({
                initializeUploadRequest: {
                    owner: authorUrn
                }
            })
        });
        const initResponseText = await initRes.text();
        let initData: any = {};
        try {
            if (initResponseText) {
                initData = JSON.parse(initResponseText);
            }
        } catch (e) {
            console.warn('Failed to parse LinkedIn image init response:', initResponseText);
        }

        if (initRes.status >= 400) throw new Error(initData.message || `Failed to initialize LinkedIn image upload (${initRes.status}): ${initResponseText}`);

        const uploadUrl = initData.value?.uploadUrl;
        mediaUrn = initData.value?.image;

        if (!uploadUrl || !mediaUrn) throw new Error('Failed to get LinkedIn upload URL');

        // B. Upload Image
        const imgRes = await fetch(imageUrl);
        const blob = await imgRes.blob();

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                // No Auth header for the PUT request to uploadUrl
            },
            body: blob
        });

        if (!uploadRes.ok) throw new Error('Failed to upload image binary to LinkedIn');
    }

    // 2. Create Post using Posts API
    const postData: any = {
        author: authorUrn,
        commentary: fullText,
        visibility: "PUBLIC",
        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
    };

    if (mediaUrn) {
        postData.content = {
            media: {
                id: mediaUrn,
                // title and altText are optional
            }
        };
    }

    const response = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202501',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
    });

    const responseText = await response.text();
    let data: any = {};

    try {
        if (responseText) {
            data = JSON.parse(responseText);
        }
    } catch (e) {
        console.warn('Failed to parse LinkedIn response:', responseText);
    }

    if (response.status >= 400) {
        let errorMsg = `LinkedIn API Error (${response.status}): ${responseText || 'No response body'}`;
        try {
            const errorObj = JSON.parse(responseText);
            if (errorObj.message) errorMsg = `LinkedIn: ${errorObj.message} (${response.status})`;
        } catch (e) { /* use default */ }
        throw new Error(errorMsg);
    }

    // Header x-linkedin-id usually contains the ID
    const postId = response.headers.get('x-linkedin-id') || data.id;

    return {
        success: true,
        platformPostId: postId,
        platformPostUrl: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined
    };
}

async function postToYouTube(account: SocialMediaAccount, content: PostContent) {
    if (!content.videoUrl) {
        throw new Error('YouTube requires a video URL for posting.');
    }

    // Use provided title or fallback to first line of text
    const title = content.title || content.text.split('\n')[0].substring(0, 100);
    const description = content.text || '';

    // 1. Download Video Stream
    const videoRes = await fetch(content.videoUrl);
    if (!videoRes.ok) throw new Error('Failed to fetch video for upload');
    const videoBlob = await videoRes.blob();

    // 2. Initiate Resumable Upload
    const metadata = {
        snippet: {
            title: title,
            description: description,
            tags: content.tags || content.hashtags || [],
            categoryId: content.category || '22' // Default: People & Blogs
        },
        status: {
            privacyStatus: content.privacy || 'public',
            selfDeclaredMadeForKids: content.madeForKids || false,
            embeddable: content.embeddable !== false, // Default true
            publicStatsViewable: true
        }
    };

    // Add comment settings if provided
    if (content.allowComments === false) {
        metadata.status = {
            ...metadata.status,
            publicStatsViewable: true
        };
    }

    const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': videoBlob.size.toString(),
            'X-Upload-Content-Type': 'video/*'
        },
        body: JSON.stringify(metadata)
    });

    if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error?.message || 'Failed to initiate YouTube upload');
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('Failed to get YouTube upload location');

    // 3. Upload Video
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'video/*',
            'Content-Length': videoBlob.size.toString()
        },
        body: videoBlob
    });

    if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error?.message || 'Failed to upload video to YouTube');
    }

    const data = await uploadRes.json();
    const videoId = data.id;

    // 4. Upload Thumbnail if provided
    if (content.thumbnailUrl) {
        try {
            const thumbnailRes = await fetch(content.thumbnailUrl);
            if (thumbnailRes.ok) {
                const thumbnailBlob = await thumbnailRes.blob();

                const thumbnailUploadUrl = `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`;

                const thumbUpload = await fetch(thumbnailUploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${account.access_token}`,
                        'Content-Type': 'image/jpeg',
                        'Content-Length': thumbnailBlob.size.toString()
                    },
                    body: thumbnailBlob
                });

                if (!thumbUpload.ok) {
                    console.error('Thumbnail upload failed, but video uploaded successfully');
                }
            }
        } catch (thumbError) {
            console.error('Thumbnail upload error:', thumbError);
            // Don't fail the whole upload if thumbnail fails
        }
    }

    return {
        success: true,
        platformPostId: videoId,
        platformPostUrl: `https://youtu.be/${videoId}`
    };
}


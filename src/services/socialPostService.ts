import { SocialPostPayload, SocialPostResponse } from './socialPostTypes';

const WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/social-post';

export const generateSocialPost = async (apiKey: string, payload: SocialPostPayload): Promise<SocialPostResponse> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Social Post Webhook failed: ${response.status} ${errorText}`);
    }

    // Safely parse response - handle empty or non-JSON responses
    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
        throw new Error('Social Post Webhook returned an empty response. The image generation may have failed or timed out.');
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Social Post Webhook returned invalid JSON: ${responseText.substring(0, 200)}`);
    }

    // Handle n8n array response format
    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }

    return data;
};

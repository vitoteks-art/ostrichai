
import { SocialPostPayload, SocialPostResponse } from '../types';

const WEBHOOK_URL = 'https://n8n.vitotek.com.ng/webhook-test/social-post';

export const generateSocialPost = async (apiKey: string, payload: SocialPostPayload): Promise<SocialPostResponse> => {
  // Although not all n8n webhooks require an API key, we include it if the backend expects it 
  // or if we want to maintain consistency with other services.
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

  const data = await response.json();
  
  // Handle n8n array response format
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  return data;
};
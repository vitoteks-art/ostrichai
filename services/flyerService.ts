
import { FlyerFormData, FlyerWebhookResponseItem } from '../types';

const FLYER_WEBHOOK_URL = 'https://n8n.vitotek.com.ng/webhook/new-flyer';

export const submitFlyerTask = async (apiKey: string, data: FlyerFormData): Promise<FlyerWebhookResponseItem[]> => {
  if (!apiKey) throw new Error("API Key is required");

  const response = await fetch(FLYER_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit flyer design request: ${response.status} ${errorText}`);
  }

  return await response.json();
};

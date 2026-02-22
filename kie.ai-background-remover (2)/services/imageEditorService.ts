
import { ImageEditorPayload, ImageEditorResponse } from '../types';

const IMAGE_EDITOR_WEBHOOK_URL = 'https://n8n.vitotek.com.ng/webhook-test/image-editor';

export const submitImageEditorTask = async (apiKey: string, payload: ImageEditorPayload): Promise<ImageEditorResponse> => {
  if (!apiKey) throw new Error("API Key is required");

  const response = await fetch(IMAGE_EDITOR_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit image editor task: ${response.status} ${errorText}`);
  }

  return await response.json();
};

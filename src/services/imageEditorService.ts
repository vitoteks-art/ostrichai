import { FlyerWebhookResponseItem } from './flyerService';

// Image Editor Types
export interface ImageEditorPayload {
    prompt: string;
    imageUrls: string[];
    // Output Config
    aspectRatio?: string;
    model?: string;
    resolution?: string;
    outputFormat?: string;
}

// Allow flexible response type (Array or Object)
export type ImageEditorResponse = FlyerWebhookResponseItem[] | FlyerWebhookResponseItem | any;

const IMAGE_EDITOR_WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/image-editor';

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

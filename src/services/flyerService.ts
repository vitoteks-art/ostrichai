// Flyer Designer Types
export interface Speaker {
    id: string;
    name: string;
    role: string;
}

export interface FlyerFormData {
    headline: string;
    subheadline: string;
    details: string;
    date: string;
    time: string;
    venue: string;
    contactInfo: string;
    cta: string;
    theme: string;
    additionalInfo: string;
    imageUrls: string[];
    speakers: Speaker[];
    // Colors
    primaryColor: string;
    secondaryColor: string;
    // Output Config
    aspectRatio: string;
    model: string;
    resolution: string;
    outputFormat: string;
}

export interface FlyerWebhookRawData {
    taskId: string;
    model: string;
    state: string;
    param: string;
    resultJson: string;
    failCode: string;
    failMsg: string;
    costTime: number;
    completeTime: number;
    createTime: number;
}

export interface FlyerWebhookRawInput {
    code: number;
    msg: string;
    data: FlyerWebhookRawData;
}

export interface FlyerWebhookResponseItem {
    extractedUrl: string;
    success: boolean;
    debugInfo?: any;
    rawInput?: FlyerWebhookRawInput;
}

const FLYER_WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/new-flyer';

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

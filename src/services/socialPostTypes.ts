// Social Post Types
export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube';
export type SocialAction = 'generate' | 'rewrite' | 'approve' | 'generate_image';

export interface SocialPostPayload {
    query: string;
    platform: SocialPlatform;
    sessionId: string;
    action: SocialAction;
    userId: string;
    timestamp: string;
    originalPost?: string;
    // Image Generation Config
    model?: string;
    resolution?: string;
    aspect_ratio?: string;
    image_size?: string;
    referenceImageUrls?: string[];
}

export interface SocialPostOutput {
    post?: string;
    hashtags?: string[];
    visual_idea?: string;
    image_prompt?: string;
    image_url?: string;
    imageUrl?: string; // Handle potential variations
}

export interface SocialPostResponse {
    output: SocialPostOutput;
}

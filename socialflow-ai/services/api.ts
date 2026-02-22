
import { WEBHOOK_URL } from "../constants";
import { 
  TitleRequest, 
  RegenerateTitleRequest, 
  ContentRequest, 
  RegenerateContentRequest, 
  ImagePromptRequest, 
  RegenerateImagePromptRequest, 
  ImageGenRequest, 
  TagsRequest,
  RegenerateTagsRequest,
  FinalizeRequest,
  APIErrorResponse
} from "../types";

const postToWebhook = async <T>(payload: any): Promise<T> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data = await response.json();

    // Handle n8n/webhook response formats
    if (Array.isArray(data) && data.length > 0) {
      
      // Case 1: Image Generation Response (Direct extractedUrl)
      // This handles the specific format: [{ "extractedUrl": "...", "success": true, ... }]
      if (data[0]?.extractedUrl || (data[0]?.success !== undefined && data[0]?.debugInfo)) {
         if (data[0].success === false) {
             throw new Error(data[0].failMsg || "Image generation failed");
         }
         
         if (data[0].extractedUrl) {
            return {
                stage: 'image',
                image_url: data[0].extractedUrl,
            } as unknown as T;
         }
      }

      // Case 2: Final Post Structure (Specific to finalize_post stage from backend)
      // Handles structure: [{ formatted: { post: { ... } }, raw: { ... } }]
      if (data[0]?.formatted?.post) {
         const formatted = data[0].formatted;
         const post = formatted.post;
         const raw = data[0].raw || {};
         
         let tags: string[] = [];
         if (Array.isArray(raw.approved_tags)) {
            tags = raw.approved_tags;
         } else if (typeof post.hashtags === 'string') {
            // Split by space and filter empty strings
            tags = post.hashtags.split(' ').filter((t: string) => t.trim() !== '');
         }

         return {
            stage: 'final',
            final_post: {
                title: post.title || raw.approved_title || "",
                content: post.content || raw.approved_content || "",
                image_url: post.imageUrl || raw.approved_image_url || "",
                tags: tags,
                platform: formatted.platform || payload.platform || "twitter",
                ready_to_publish: true
            }
         } as unknown as T;
      }

      // Case 3: Standard response wrapped in 'output' property
      if (data[0]?.output) {
        try {
          if (typeof data[0].output === 'string') {
            // Clean up markdown code blocks if present (e.g. ```json ... ```)
            let cleanOutput = data[0].output.trim();
            // Remove starting ```json or ``` (case insensitive)
            cleanOutput = cleanOutput.replace(/^```(?:json)?\s*/i, "");
            // Remove ending ```
            cleanOutput = cleanOutput.replace(/\s*```$/, "");
            
            data = JSON.parse(cleanOutput);
          } else {
            data = data[0].output;
          }
        } catch (e) {
          console.warn("Failed to parse nested webhook output:", e);
          // Continue with original data if parsing fails, though it likely won't match expected type T
        }
      }
    }

    if (data.error) {
      throw new Error((data as APIErrorResponse).message || "An API error occurred");
    }

    return data as T;
  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
};

export const api = {
  generateTitles: (data: TitleRequest) => 
    postToWebhook<{ stage: 'titles'; titles: string[] }>(data),

  regenerateTitles: (data: RegenerateTitleRequest) => 
    postToWebhook<{ stage: 'titles'; titles: string[] }>(data),

  generateContent: (data: ContentRequest) => 
    postToWebhook<{ stage: 'content'; content: string }>(data),

  regenerateContent: (data: RegenerateContentRequest) => 
    postToWebhook<{ stage: 'content'; content: string }>(data),

  generateImagePrompt: (data: ImagePromptRequest) => 
    postToWebhook<{ stage: 'image_prompt'; image_prompt: string }>(data),

  regenerateImagePrompt: (data: RegenerateImagePromptRequest) => 
    postToWebhook<{ stage: 'image_prompt'; image_prompt: string }>(data),

  generateImage: (data: ImageGenRequest) => 
    postToWebhook<{ stage: 'image'; image_url: string }>(data),

  generateTags: (data: TagsRequest) =>
    postToWebhook<{ stage: 'tags'; tags: string[] }>(data),

  regenerateTags: (data: RegenerateTagsRequest) =>
    postToWebhook<{ stage: 'tags'; tags: string[] }>(data),

  finalizePost: (data: FinalizeRequest) => 
    postToWebhook<{ stage: 'final'; final_post: any }>(data),
};

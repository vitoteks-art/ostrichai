
export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook';

export type AppStage = 
  | 'topic_input' 
  | 'titles' 
  | 'content' 
  | 'image_prompt' 
  | 'image_generation' 
  | 'tags'
  | 'final';

export interface FinalPostData {
  title: string;
  content: string;
  image_url: string;
  tags: string[];
  platform: Platform;
  ready_to_publish: boolean;
}

export interface ImageSettings {
  model: string;
  aspectRatio: string;
  resolution: string;
  format: string;
}

export interface AppState {
  stage: AppStage;
  isLoading: boolean;
  error: string | null;
  userId: string;
  
  // Input Data
  platform: Platform;
  topic: string;
  
  // Stage Data
  generatedTitles: string[];
  selectedTitle: string;
  
  generatedContent: string;
  
  generatedImagePrompt: string;
  
  generatedImageUrl: string;

  generatedTags: string[];
  
  finalPost: FinalPostData | null;
  
  // Feedback/Regeneration State
  isRegenerating: boolean;
  feedbackText: string;

  // Image Configuration
  imageSettings: ImageSettings;
}

// API Request Interfaces
export interface BaseRequest {
  stage: string;
  platform: Platform;
  user_id?: string;
}

export interface TitleRequest extends BaseRequest {
  topic: string;
}

export interface RegenerateTitleRequest extends BaseRequest {
  topic: string;
  feedback: string;
  rejected_titles: string[];
}

export interface ContentRequest extends BaseRequest {
  topic: string;
  approved_title: string;
}

export interface RegenerateContentRequest extends ContentRequest {
  feedback: string;
  previous_content: string;
}

export interface ImagePromptRequest extends BaseRequest {
  topic: string;
  approved_title: string;
  approved_content: string;
}

export interface RegenerateImagePromptRequest extends BaseRequest {
  approved_content: string;
  feedback: string;
  previous_prompt: string;
}

export interface ImageGenRequest {
  stage: string;
  approved_image_prompt: string;
  platform: Platform;
  user_id: string;
  // Image Config
  model?: string;
  aspect_ratio?: string;
  resolution?: string;
  format?: string;
}

export interface TagsRequest extends BaseRequest {
  topic: string;
  approved_title: string;
  approved_content: string;
}

export interface RegenerateTagsRequest extends TagsRequest {
  feedback: string;
  previous_tags: string[];
}

export interface FinalizeRequest extends BaseRequest {
  approved_title: string;
  approved_content: string;
  approved_image_url: string;
  approved_tags: string[];
}

// API Response Interfaces
export interface APIErrorResponse {
  error: boolean;
  message: string;
  stage: string;
}

export interface TitleResponse {
  stage: 'titles';
  titles: string[];
}

export interface ContentResponse {
  stage: 'content';
  content: string;
}

export interface ImagePromptResponse {
  stage: 'image_prompt';
  image_prompt: string;
}

export interface ImageResponse {
  stage: 'image';
  image_url: string;
  image_base64?: string;
}

export interface TagsResponse {
  stage: 'tags';
  tags: string[];
}

export interface FinalResponse {
  stage: 'final';
  final_post: FinalPostData;
}

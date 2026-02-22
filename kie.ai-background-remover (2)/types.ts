
export interface KieTaskData {
  taskId: string;
}

export interface KieCreateTaskResponse {
  code: number;
  message: string;
  data: KieTaskData;
}

export interface KieTaskInfoData {
  taskId: string;
  model: string;
  state: 'success' | 'running' | 'failed' | 'queued' | string;
  param: string;
  resultJson?: string;
  failCode?: string;
  failMsg?: string;
  completeTime?: number;
  createTime?: number;
  updateTime?: number;
}

export interface KieRecordInfoResponse {
  code: number;
  message: string;
  data: KieTaskInfoData;
}

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  error?: string;
}

export interface ParsedResult {
  resultUrls: string[];
}

export interface ImgbbData {
  id: string;
  url: string;
  delete_url: string;
  display_url?: string;
}

export interface ImgbbResponse {
  data: ImgbbData;
  success: boolean;
  status: number;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

// Kie Veo Types
export type VeoGenerationType = 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO' | 'EXTEND_VIDEO';
export type VeoModel = 'veo3' | 'veo3_fast';

export interface KieVeoGeneratePayload {
  prompt: string;
  imageUrls?: string[];
  model: VeoModel;
  aspectRatio: string;
  callBackUrl?: string;
  generationType: VeoGenerationType;
  enableTranslation?: boolean;
}

export interface KieVeoExtendPayload {
  taskId: string;
  prompt: string;
}

export interface KieVeoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface KieVeoResultResponse {
  code: number;
  msg: string;
  data: {
    resultUrl: string;
  };
}

export interface VeoPollResult {
  status: 'completed' | 'failed' | 'processing';
  resultUrl?: string;
  error?: string;
  metadata?: {
    prompt?: string;
    model?: string;
    aspectRatio?: string;
  };
}

export interface VideoTask {
  taskId: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  resultUrl: string | null;
  createdAt: number;
  model: VeoModel | string;
  aspectRatio?: string;
}

// Flyer Designer Types
export interface Speaker {
  id: string;
  name: string;
  role: string;
}

export interface FlyerFormData {
  headline: string;
  subheadline?: string;
  details: string;
  date?: string;
  time?: string;
  venue: string;
  contactInfo: string;
  cta: string;
  imageUrls: string[];
  theme?: string;
  additionalInfo?: string;
  speakers: Speaker[];
  // Output Config
  aspectRatio?: string;
  model?: string;
  resolution?: string;
  outputFormat?: string;
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
export type ImageEditorResponse = FlyerWebhookResponseItem[] | any;

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

// Global window augmentation for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

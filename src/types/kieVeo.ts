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

// Global window augmentation for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

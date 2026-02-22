
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

// Ad Creative Types
export interface ProductInput {
  name: string;
  productUrl?: string;
  description: string;
  targetAudience: string;
  adPlatforms?: string;
  competitors: string;
  competitorUrl?: string;
}

export interface CompetitorAdInsights {
  dominantHooks: string[];
  visualThemes: string[];
  activeOffers: string[];
}

export interface MarketIntelligence {
  painPoints: { title: string; description: string; intensity: number }[];
  desires: { title: string; description: string }[];
  objections: { title: string; counterArg: string }[];
  buyerSegments: string[];
  competitorAnalysis: { name: string; weakness: string; opportunity: string }[];
  competitorAdInsights?: CompetitorAdInsights;
  analyzedAdCount?: number;
}

export interface MessagingArchitecture {
  coreValueProp: string;
  positioningStatement: string;
  hooks: string[];
  messagingAngles: { angle: string; description: string }[];
}

export interface AdCreative {
  id: string;
  hook: string;
  headline: string;
  caption: string;
  visualConcept: string; // Description of image/video
  cta: string;
  format: 'IMAGE' | 'VIDEO';
  script?: string; // Only for video (Production Notes)

  // New Rich Data Fields
  rationale?: string;
  angle?: string;
  differentiation?: string;
}

export interface PredictionResult {
  adId: string;
  score: number; // 0-100
  resonance: number;
  clarity: number;
  attention: number;
  reasoning: string;
  status: 'WINNER' | 'LOSER' | 'AVERAGE';
}

export interface AudienceTargeting {
  interests: string[];
  lookalikes: string[];
  behaviors: string[];
  platforms: string[];

  // Rich data fields
  platformStrategy?: {
    platform: string;
    priority: string;
    reasoning: string;
  }[];
  segments?: {
    segment: string;
    interests: string[];
    behaviors: string[];
    demographics: { ageRange: string; gender: string; locations: string[] };
  }[];
  testingRoadmap?: {
    test: string;
    hypothesis: string;
    priority: string;
  }[];
}

// --- Optimization Interfaces ---

export interface DailyPerformance {
  day: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
}

export interface OptimizationMetric {
  totalSpend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
  cpm: number;
  cpc: number;
}

export interface FatigueSignal {
  signal: string;
  severity: string;
  evidence: string;
}

export interface Opportunity {
  area: string;
  potential: string;
  reasoning: string;
}

export interface OptimizationAction {
  priority: number;
  action: string;
  category: string;
  reasoning: string;
  expectedImpact: string;
  implementation: string;
}

export interface Forecast {
  projectedSpend: number;
  projectedConversions: number;
  projectedCPA: number;
  projectedROAS: number;
  confidence: string;
}

export interface SimulatedPerformance {
  spend: string;
  roas: string;
  ctr: string;
  cpa: string;
  impressions: string;
  clicks: string;
}

export interface OptimizationInsight {
  action: string;
  type: 'BUDGET' | 'CREATIVE' | 'AUDIENCE';
  reasoning: string;
  impact: 'HIGH' | 'MEDIUM';
}

export interface OptimizationResult {
  // Legacy / Fallback fields
  metrics?: SimulatedPerformance;
  insights?: OptimizationInsight[];

  // Rich Webhook Data
  campaignPerformance?: {
    period: string;
    metrics: OptimizationMetric;
    dailyBreakdown: DailyPerformance[];
  };
  performanceAnalysis?: {
    overallHealth: string;
    strengths: string[];
    weaknesses: string[];
    fatigueSignals: FatigueSignal[];
    opportunities: Opportunity[];
  };
  optimizationActions?: OptimizationAction[];
  weekAheadForecast?: Forecast;
}

export interface AppState {
  step: number;
  isLoading: boolean;
  product: ProductInput;
  intelligence: MarketIntelligence | null;
  messaging: MessagingArchitecture | null;
  creatives: AdCreative[];
  predictions: Record<string, PredictionResult>;
  targeting: AudienceTargeting | null;
  optimization: OptimizationResult | null;
}

export enum AppStep {
  INPUT = 1,
  INTELLIGENCE = 2,
  MESSAGING = 3,
  CREATIVES = 4,
  PREDICTION = 5,
  TARGETING = 6,
  OPTIMIZATION = 7
}

// Global window augmentation for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

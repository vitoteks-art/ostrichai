
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

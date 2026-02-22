
import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
    MarketIntelligence,
    MessagingArchitecture,
    AdCreative,
    PredictionResult,
    AudienceTargeting,
    ProductInput,
    OptimizationResult
} from "../types/adsEngine";

// Use environment variable for API Key (Vite standard)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/main-ads';

// Helper to validate key
export const checkApiKey = () => {
    if (!apiKey) throw new Error("API Key is missing. Please check your environment variables.");
};

/**
 * Unified Webhook Caller
 */
const callWebhook = async (step: string, payload: any) => {
    try {
        // Enrich payload: Map 'name' to 'productName' if missing
        const enrichedPayload = { ...payload };

        // Check deep nested product object
        if (enrichedPayload.product && enrichedPayload.product.name && !enrichedPayload.product.productName) {
            enrichedPayload.product.productName = enrichedPayload.product.name;
        }
        // Check top level name (if payload IS the product)
        else if (enrichedPayload.name && !enrichedPayload.productName) {
            enrichedPayload.productName = enrichedPayload.name;
        }

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                step,
                source: 'advantage-ai-engine',
                ...enrichedPayload
            }),
        });

        if (!response.ok) {
            console.warn(`Webhook step '${step}' failed with status: ${response.status}`);
            return null;
        }

        // Robust JSON handling
        const text = await response.text();
        if (!text || text.trim() === '') {
            console.warn(`Webhook step '${step}' returned empty response.`);
            return null;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(`Failed to parse JSON for step '${step}':`, e);
            return null;
        }

        // Handle array wrapping [ { ... } ]
        if (Array.isArray(data) && data.length > 0) {
            // Check for specific n8n response wrapper like { results: [...] }
            if (data[0].results) return data[0].results;
            // If the array item has 'output' (Step 2/3/4/5/6 format), return the item itself so we can access .output
            if (data[0].output) return data[0];

            return data[0];
        }

        // Handle standard object response
        if (data.results) return data.results;

        return data;
    } catch (error) {
        console.error(`Webhook connection error for step '${step}':`, error);
        return null;
    }
};

export const fetchCompetitorAds = async (product: ProductInput): Promise<any[]> => {
    const data = await callWebhook('market_intel', product);
    return data ? [data] : [];
};

/**
 * Step 1: Market Intelligence Engine
 */
export const analyzeMarket = async (product: ProductInput, competitorAds: any[] = []): Promise<MarketIntelligence> => {
    checkApiKey();

    let webhookData = competitorAds.length > 0 ? competitorAds[0] : null;

    if (!webhookData) {
        webhookData = await callWebhook('market_intel', product);
    }

    console.log('[AdsEngine] Raw Webhook Data Step 1:', webhookData);

    const data = (webhookData && webhookData.productAnalysis) ? webhookData : (webhookData?.output ? webhookData.output : webhookData);

    console.log('[AdsEngine] Processed Data Step 1:', data);

    if (data && (data.painPoints || data.productAnalysis)) {
        const mapSeverity = (severity: string): number => {
            const s = String(severity).toLowerCase();
            if (s.includes('high')) return 9;
            if (s.includes('medium')) return 6;
            if (s.includes('low')) return 3;
            return 5;
        };

        let estimatedAdCount = 0;
        if (data.adTacticalInsights?.copyPatterns) {
            estimatedAdCount = data.adTacticalInsights.copyPatterns.reduce((acc: number, curr: any) => acc + (curr.frequency || 0), 0);
        }
        if (estimatedAdCount === 0) estimatedAdCount = 15;

        const marketIntelligence: MarketIntelligence = {
            painPoints: [
                ...(data.painPoints?.emotional || []),
                ...(data.painPoints?.financial || []),
                ...(data.painPoints?.hidden || [])
            ].map((p: any) => ({
                title: p.painPoint || "Identified Pain Point",
                description: p.description || "",
                intensity: mapSeverity(p.severity || 'Medium')
            })),
            desires: (data.coreDesires || []).map((d: any) => ({
                title: d.desire || "Core Desire",
                description: d.description || ""
            })),
            objections: (data.objections || []).map((o: any) => ({
                title: o.objection || "Objection",
                counterArg: o.counterStrategy || ""
            })),
            buyerSegments: (data.buyerSegments || []).map((s: any) => s.segmentName || "Target Segment"),
            competitorAnalysis: (data.competitorAnalysis || []).map((c: any) => ({
                name: c.competitorName || "Competitor",
                weakness: Array.isArray(c.weaknesses) ? c.weaknesses.join('. ') : (c.weaknesses || "Not specified"),
                opportunity: "Leverage AI advantages to outperform on speed and personalization."
            })),
            competitorAdInsights: {
                dominantHooks: (data.adTacticalInsights?.hooks || []).map((h: any) => h.example || h.hookType),
                visualThemes: (data.adTacticalInsights?.visualThemes || []).map((t: any) => t.theme),
                activeOffers: (data.adTacticalInsights?.offers || []).map((o: any) => o.details || o.offerType)
            },
            analyzedAdCount: estimatedAdCount
        };

        return marketIntelligence;
    }

    // Fallback
    console.log("Falling back to Gemini for Step 1");
    const prompt = `
    Analyze the following product as a senior market researcher.
    Product: ${product.name}
    Description: ${product.description}
    Audience: ${product.targetAudience}
    Competitors: ${product.competitors}

    1. Extract emotional, financial, and hidden pain points. 
    2. Identify core desires and objections. 
    3. Group buyer segments.
    4. Analyze the listed competitors and identify weaknesses.
  `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            painPoints: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        intensity: { type: Type.NUMBER, description: "1 to 10 scale" }
                    }
                }
            },
            desires: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                }
            },
            objections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        counterArg: { type: Type.STRING }
                    }
                }
            },
            buyerSegments: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            competitorAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Name of competitor or category" },
                        weakness: { type: Type.STRING, description: "What they are bad at" },
                        opportunity: { type: Type.STRING, description: "How we can beat them" }
                    }
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const generatedData = JSON.parse(response.text || '{}') as MarketIntelligence;
    generatedData.analyzedAdCount = 0;
    return generatedData;
};

/**
 * Step 2: Messaging Architecture Builder
 */
export const buildMessaging = async (product: ProductInput, intelligence: MarketIntelligence): Promise<MessagingArchitecture> => {
    checkApiKey();

    const webhookResponse = await callWebhook('market_arch', { product, intelligence });

    if (webhookResponse && webhookResponse.output) {
        const out = webhookResponse.output;
        return {
            coreValueProp: out.coreValueProp || out.coreValueProposition?.primary || "Core Value Proposition",
            positioningStatement: out.positioningStatement || out.strategicPositioning?.oneLineSummary || "",
            hooks: out.hooks || out.tacticalMessagingToolkit?.adHooks || [],
            messagingAngles: (out.messagingAngles || out.differentiationPillars || []).map((p: any) => ({
                angle: p.angle || p.name,
                description: p.description || p.customerBenefit
            }))
        };
    }

    if (webhookResponse && webhookResponse.coreValueProp) {
        return webhookResponse as MessagingArchitecture;
    }

    const prompt = `
    Based on the market intelligence, build a messaging architecture.
    Product: ${product.name}
    Pain Points: ${JSON.stringify(intelligence.painPoints)}
    Desires: ${JSON.stringify(intelligence.desires)}
    Competitor Weaknesses: ${JSON.stringify(intelligence.competitorAnalysis)}
    
    ${intelligence.competitorAdInsights ? `
    COMPETITOR INTELLIGENCE (Intercepted Ad Data):
    - Their Hooks: ${JSON.stringify(intelligence.competitorAdInsights.dominantHooks)}
    - Their Visuals: ${JSON.stringify(intelligence.competitorAdInsights.visualThemes)}
    - Their Offers: ${JSON.stringify(intelligence.competitorAdInsights.activeOffers)}
    
    STRATEGIC INSTRUCTION:
    - Counter their hooks with stronger psychological angles.
    - Exploit the gap in their offers (e.g. if they offer a discount, we offer value/guarantee).
    - Differentiate our positioning from the patterns found in their active ads.
    ` : ''}
  `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            coreValueProp: { type: Type.STRING },
            positioningStatement: { type: Type.STRING },
            hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            messagingAngles: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        angle: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are a senior copywriter and brand strategist."
        }
    });

    return JSON.parse(response.text || '{}') as MessagingArchitecture;
};

/**
 * Step 3: AI Creative Generator
 */
export const generateCreatives = async (messaging: MessagingArchitecture, intelligence?: MarketIntelligence | null): Promise<AdCreative[]> => {
    checkApiKey();

    const webhookResponse = await callWebhook('ai_creative_gen', { messaging, intelligence });

    if (webhookResponse) {
        let concepts = [];
        if (webhookResponse.output && Array.isArray(webhookResponse.output.adConcepts)) {
            concepts = webhookResponse.output.adConcepts;
        } else if (Array.isArray(webhookResponse.adConcepts)) {
            concepts = webhookResponse.adConcepts;
        } else if (Array.isArray(webhookResponse)) {
            concepts = webhookResponse;
        } else if (webhookResponse.creatives && Array.isArray(webhookResponse.creatives)) {
            concepts = webhookResponse.creatives;
        }

        if (concepts.length > 0) {
            return concepts.map((concept: any, index: number) => {
                const rawFormat = concept.format || concept.type || 'IMAGE';
                const isVideo = rawFormat.toString().toUpperCase().includes('VIDEO');

                return {
                    id: `concept-${index + 1}`,
                    hook: concept.hook || "",
                    headline: concept.copyScript?.headline || concept.title || concept.headline || concept.conceptName || "",
                    caption: concept.copyScript?.body || concept.scriptOrCaption || concept.caption || "",
                    visualConcept: concept.visualDescription || concept.visualDirection || concept.visualConcept || "",
                    cta: concept.copyScript?.cta || concept.cta || "Learn More",
                    format: isVideo ? 'VIDEO' : 'IMAGE',
                    script: isVideo ? (concept.productionNotes || concept.script || "") : undefined,
                    rationale: concept.creativeRationale || concept.whyItStandsOut || "",
                    angle: concept.messagingAngle || "",
                    differentiation: concept.competitorDifferentiation || ""
                };
            });
        }
    }

    const prompt = `
    Generate 6 distinct ad concepts (mixture of Image and Video ideas) based on this messaging architecture.
    Value Prop: ${messaging.coreValueProp}
    Hooks: ${messaging.hooks.join(', ')}
    Angles: ${JSON.stringify(messaging.messagingAngles)}

    ${intelligence?.competitorAdInsights ? `
    COMPETITOR CREATIVE DATA:
    - They are using these Visual Themes: ${JSON.stringify(intelligence.competitorAdInsights.visualThemes)}
    - They are making these Offers: ${JSON.stringify(intelligence.competitorAdInsights.activeOffers)}
    
    CREATIVE INSTRUCTION:
    - Innovate beyond the competitor's visual patterns. 
    - If they lean on generic stock, propose authentic UGC. 
    - If they lean on text-heavy slides, propose dynamic motion.
    - Ensure our CTA and creative direction stands out in the feed against theirs.
    ` : ''}
  `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                hook: { type: Type.STRING },
                headline: { type: Type.STRING },
                caption: { type: Type.STRING },
                visualConcept: { type: Type.STRING, description: "Detailed description of the image or video scene" },
                cta: { type: Type.STRING },
                format: { type: Type.STRING, enum: ['IMAGE', 'VIDEO'] },
                script: { type: Type.STRING, description: "Only if format is VIDEO, otherwise empty string" }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are a direct-response creative director."
        }
    });

    return JSON.parse(response.text || '[]') as AdCreative[];
};

/**
 * Step 4: Behavioral Prediction (Synthetic A/B)
 */
export const predictPerformance = async (creatives: AdCreative[], audience: string): Promise<Record<string, PredictionResult>> => {
    checkApiKey();

    const webhookResponse = await callWebhook('A-B-test', { creatives, audience });

    if (webhookResponse) {
        let evaluations = [];

        if (webhookResponse.output && Array.isArray(webhookResponse.output.evaluations)) {
            evaluations = webhookResponse.output.evaluations;
        } else if (webhookResponse.results && Array.isArray(webhookResponse.results)) {
            evaluations = webhookResponse.results;
        } else if (Array.isArray(webhookResponse)) {
            evaluations = webhookResponse;
        }

        if (evaluations.length > 0) {
            const resultMap: Record<string, PredictionResult> = {};

            evaluations.forEach((evalItem: any) => {
                const adId = evalItem.creativeId || evalItem.adId;

                const normalizeScore = (score: number) => {
                    if (score === undefined || score === null) return 0;
                    return score <= 10 ? score * 10 : score;
                };

                const scoreVal = normalizeScore(evalItem.scores?.overallScore || evalItem.score);
                const resVal = normalizeScore(evalItem.scores?.psychologicalResonance || evalItem.resonance);
                const attVal = normalizeScore(evalItem.scores?.attentionScore || evalItem.attention);
                const clarVal = normalizeScore(evalItem.scores?.messageClarity || evalItem.clarity);

                resultMap[adId] = {
                    adId: adId,
                    score: Math.round(scoreVal),
                    resonance: Math.round(resVal),
                    clarity: Math.round(clarVal),
                    attention: Math.round(attVal),
                    reasoning: evalItem.verdict || evalItem.reasoning || (evalItem.userPerspective && evalItem.algorithmPerspective ? `${evalItem.userPerspective} \n\nAlgorithm: ${evalItem.algorithmPerspective}` : "Analysis complete."),
                    status: (evalItem.status?.toUpperCase() as any) || 'AVERAGE'
                };
            });

            return resultMap;
        }
    }

    // Fallback
    const prompt = `
    Act as a "Synthetic User" and an "Ad Algorithm". 
    Target Audience: ${audience}
    
    Evaluate each of the following ad creatives. 
    Predict their performance based on psychological resonance, message clarity, and attention score.
    Assign a status of WINNER (top 30%), LOSER (bottom 30%), or AVERAGE.
    
    Creatives to evaluate:
    ${JSON.stringify(creatives)}
  `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            results: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        adId: { type: Type.STRING },
                        score: { type: Type.NUMBER, description: "0-100 prediction score" },
                        resonance: { type: Type.NUMBER },
                        clarity: { type: Type.NUMBER },
                        attention: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ['WINNER', 'LOSER', 'AVERAGE'] }
                    }
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are an advanced AI behavioral prediction engine designed to simulate human response to advertising."
        }
    });

    const parsed = JSON.parse(response.text || '{}');
    const resultMap: Record<string, PredictionResult> = {};

    if (parsed.results && Array.isArray(parsed.results)) {
        parsed.results.forEach((res: PredictionResult) => {
            resultMap[res.adId] = res;
        });
    }

    return resultMap;
};

/**
 * Step 5: Audience Targeting Engine
 */
export const generateTargeting = async (product: ProductInput, intelligence: MarketIntelligence): Promise<AudienceTargeting> => {
    checkApiKey();

    const webhookResponse = await callWebhook('targeting', { product, intelligence });

    if (webhookResponse && webhookResponse.output) {
        const out = webhookResponse.output;

        const allInterests = Array.from(new Set(out.targetingStrategy?.flatMap((s: any) => s.interests) || []));
        const allBehaviors = Array.from(new Set(out.targetingStrategy?.flatMap((s: any) => s.behaviors) || []));
        const allPlatforms = Array.from(new Set(out.platformPriority?.map((p: any) => p.platform) || []));

        const seedLookalikes = out.lookalikeStrategy?.seedAudiences?.map((s: any) => `${s.source}`) || [];
        const customAudiences = out.lookalikeStrategy?.customAudiences?.map((s: any) => `${s.name} (${s.platform})`) || [];
        const allLookalikes = [...seedLookalikes, ...customAudiences];

        return {
            interests: allInterests as string[],
            behaviors: allBehaviors as string[],
            lookalikes: allLookalikes as string[],
            platforms: allPlatforms as string[],
            platformStrategy: out.platformPriority,
            segments: out.targetingStrategy,
            testingRoadmap: out.testingRoadmap
        };
    }

    if (webhookResponse && webhookResponse.interests) {
        return webhookResponse as AudienceTargeting;
    }

    const prompt = `
    Determine the best audience targeting strategy for:
    Product: ${product.name}
    Segments: ${intelligence.buyerSegments.join(', ')}
    Competitor Analysis: ${JSON.stringify(intelligence.competitorAnalysis)}
    
    Output best interests to target, lookalike sources, and platform selection.
  `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
            lookalikes: { type: Type.ARRAY, items: { type: Type.STRING } },
            behaviors: { type: Type.ARRAY, items: { type: Type.STRING } },
            platforms: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || '{}') as AudienceTargeting;
};

/**
 * Step 6: Dynamic Optimization
 */
export const generateOptimizationInsights = async (
    targeting: AudienceTargeting,
    winningCreatives: AdCreative[]
): Promise<OptimizationResult> => {
    checkApiKey();

    const webhookResponse = await callWebhook('dynamic-optimization', { targeting, winningCreatives });

    if (webhookResponse && webhookResponse.output) {
        const out = webhookResponse.output;

        return {
            campaignPerformance: out.campaignPerformance,
            performanceAnalysis: out.performanceAnalysis,
            optimizationActions: out.optimizationActions,
            weekAheadForecast: out.weekAheadForecast,

            metrics: {
                spend: `$${out.campaignPerformance?.metrics?.totalSpend || 0}`,
                impressions: `${out.campaignPerformance?.metrics?.impressions || 0}`,
                clicks: `${out.campaignPerformance?.metrics?.clicks || 0}`,
                ctr: `${out.campaignPerformance?.metrics?.ctr || 0}%`,
                cpa: `$${out.campaignPerformance?.metrics?.cpa || 0}`,
                roas: `${out.campaignPerformance?.metrics?.roas || 0}x`
            },
            insights: out.optimizationActions?.map((act: any) => ({
                action: act.action,
                type: act.category.toUpperCase(),
                reasoning: act.reasoning,
                impact: 'HIGH'
            })) || []
        };
    }

    const prompt = `
    Act as an Automated Ad Optimization Engine (Meta/Google Ads simulator).
    
    Context:
    We have been running ads for 7 days.
    Targeting: ${JSON.stringify(targeting.interests)}
    Winning Creatives: ${JSON.stringify(winningCreatives.map(c => c.headline))}
    
    Task:
    1. GENERATE REALISTIC SIMULATED PERFORMANCE DATA for this 7-day period. 
    2. Based on simulated numbers, identify fatigue or opportunities.
    3. Generate 3 specific optimization actions to improve performance for next week.
  `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            metrics: {
                type: Type.OBJECT,
                properties: {
                    spend: { type: Type.STRING },
                    impressions: { type: Type.STRING },
                    clicks: { type: Type.STRING },
                    ctr: { type: Type.STRING },
                    cpa: { type: Type.STRING },
                    roas: { type: Type.STRING }
                }
            },
            insights: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['BUDGET', 'CREATIVE', 'AUDIENCE'] },
                        reasoning: { type: Type.STRING },
                        impact: { type: Type.STRING, enum: ['HIGH', 'MEDIUM'] }
                    }
                }
            }
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || '{}') as OptimizationResult;
};

/**
 * Visual Assets Generator
 */
export const generateVisualAssets = async (payload: any): Promise<any> => {
    try {
        const webhookUrl = payload.assetType === 'video'
            ? 'https://n8n.getostrichai.com/webhook/video-adcreative'
            : 'https://n8n.getostrichai.com/webhook/fbimage';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Visual generation failed with status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Visual generation error:", error);
        throw error;
    }
};

import { apiClient } from '@/lib/api';

export interface FacebookAdAccount {
    id: string;
    ad_account_id: string;
    ad_account_name: string;
    account_status: string;
    currency: string;
    business_name?: string;
    spending_limit?: number;
}

export interface CampaignConfig {
    name: string;
    objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES';
    budgetType: 'daily' | 'lifetime';
    budgetAmount: number;
    startTime?: Date;
    endTime?: Date;
    targeting: {
        ageMin?: number;
        ageMax?: number;
        genders?: number[]; // 1=male, 2=female
        locations?: { countries?: string[]; cities?: string[] };
        interests?: string[];
    };
    placements?: string[];
}

export interface FinalCampaignConfig {
    // 1. Campaign Settings
    objective: string;
    campaignName: string;
    specialAdCategories: string[];
    campaignBudget?: {
        amount: number;
        type: 'DAILY' | 'LIFETIME';
    };

    // 2. Ad Set Settings
    adSetName: string;
    conversionLocation: string;
    performanceGoal: string;
    pixelId?: string;
    startTime: string;
    endTime?: string;
    adSetBudget?: {
        amount: number;
        type: 'DAILY' | 'LIFETIME';
    };

    // 3. Identity Settings
    facebookPageId: string;
    instagramAccountId?: string;

    // 4. Ad Details
    adName: string;
    creativeSource: 'MANUAL' | 'CATALOG';
    adFormat: 'SINGLE_IMAGE_VIDEO' | 'CAROUSEL' | 'COLLECTION';
    multiAdvertiserAds: boolean;
    websiteUrl: string;
    displayLink?: string;

    // 5. Targeting
    targeting: {
        interests: string[];
        locations: string[];
        ageMin: number;
        ageMax: number;
        genders: number[]; // 1=Male, 2=Female
    };
}

export interface AdCreative {
    headline: string;
    body: string;
    imageUrl?: string;
    videoUrl?: string;
    callToAction?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'DOWNLOAD' | 'CONTACT_US';
    linkUrl?: string;
}

/**
 * Maps Facebook Account Status numeric codes to database allowed strings
 * 1: ACTIVE -> active
 * 2: DISABLED -> disabled
 * 3: UNSETTLED -> unsettled
 * 7: PENDING_RISK_REVIEW -> pending_review
 * ...and others fallback to active
 */
const mapFacebookStatus = (status: number): string => {
    switch (status) {
        case 1: return 'active';
        case 2: return 'disabled';
        case 3: return 'unsettled';
        case 7:
        case 8:
        case 9:
        case 10:
            return 'pending_review';
        case 11:
        case 101:
            return 'disabled';
        default:
            return 'active';
    }
};

// Get user's Facebook ad accounts
export const getAdAccounts = async (accessToken: string): Promise<FacebookAdAccount[]> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,business,spending_limit&access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Failed to fetch ad accounts');
        }

        return data.data || [];
    } catch (error: any) {
        console.error('Error fetching ad accounts:', error);
        throw error;
    }
};

// Save ad account to database
export const saveAdAccount = async (
    userId: string,
    socialAccountId: string,
    adAccount: any
): Promise<{ success: boolean; error?: string }> => {
    try {
        await apiClient.createAdAccountRecord({
            social_account_id: socialAccountId,
            ad_account_id: adAccount.id,
            ad_account_name: adAccount.name,
            account_status: typeof adAccount.account_status === 'number'
                ? mapFacebookStatus(adAccount.account_status)
                : (adAccount.account_status || 'active'),
            currency: adAccount.currency,
            business_id: adAccount.business?.id,
            business_name: adAccount.business?.name,
            spending_limit: adAccount.spending_limit,
            capabilities: adAccount.capabilities || []
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// Get saved ad accounts from database
export const getSavedAdAccounts = async (
    userId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
        const data = await apiClient.getAdAccounts();
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// Get user's Facebook pages
export const getFacebookPages = async (accessToken: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,picture&access_token=${accessToken}`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.data || [];
    } catch (error: any) {
        console.error('Error fetching pages:', error);
        throw error;
    }
};

// Get Instagram accounts for a Facebook page
export const getInstagramAccounts = async (pageId: string, accessToken: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        if (data.instagram_business_account) {
            return [data.instagram_business_account];
        }
        return [];
    } catch (error: any) {
        console.error('Error fetching Instagram accounts:', error);
        throw error;
    }
};

// Get Datasets (Pixels) for an ad account
export const getAdAccountDatasets = async (adAccountId: string, accessToken: string): Promise<any[]> => {
    try {
        // Try datasets first
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/datasets?fields=id,name&access_token=${accessToken}`
        );
        const data = await response.json();

        if (!data.error && data.data) {
            return data.data;
        }

        // If datasets fail, try legacy pixels
        const pixelResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adspixels?fields=id,name&access_token=${accessToken}`
        );
        const pixelData = await pixelResponse.json();
        return pixelData.data || [];
    } catch (error: any) {
        console.warn('Silent failure fetching datasets/pixels:', error);
        return []; // Return empty instead of throwing to prevent wizard crash
    }
};

// Upload image to Facebook for use in ads
export const uploadAdImage = async (
    adAccountId: string,
    imageUrl: string,
    accessToken: string
): Promise<{ imageHash: string }> => {
    try {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
        });

        const base64Image = await base64Promise;

        // Upload to Facebook
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adimages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bytes: base64Image,
                    access_token: accessToken
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Failed to upload image');
        }

        // Get the image hash from response
        const imageHash = (data.images?.bytes?.hash) || (Object.values(data.images || {})[0] as any)?.hash;

        if (!imageHash) {
            throw new Error('No image hash returned from Facebook');
        }

        return { imageHash };
    } catch (error: any) {
        console.error('Error uploading ad image:', error);
        throw error;
    }
};

// Create Facebook ad campaign (Detailed)
export const createDetailedCampaign = async (
    adAccountId: string,
    config: FinalCampaignConfig,
    creative: AdCreative,
    accessToken: string,
    userId: string,
    adAccountDbId: string,
    projectId?: string
): Promise<{ success: boolean; campaignId?: string; error?: string; details?: any }> => {
    try {
        // Ensure website URL has protocol
        const ensureProtocol = (url: string) => {
            if (!url) return url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return `https://${url}`;
            }
            return url;
        };

        // Helper to map CTA names to Meta constants
        const mapCTAToMeta = (cta: string): string => {
            const map: Record<string, string> = {
                'learn more': 'LEARN_MORE',
                'shop now': 'SHOP_NOW',
                'sign up': 'SIGN_UP',
                'get quote': 'GET_QUOTE',
                'contact us': 'CONTACT_US',
                'book now': 'BOOK_NOW',
                'download': 'DOWNLOAD',
                'apply now': 'APPLY_NOW',
                'order now': 'ORDER_NOW',
                'subscribe': 'SUBSCRIBE',
                'watch more': 'WATCH_MORE'
            };
            const normalized = cta.toLowerCase().trim();
            // If it's already an uppercase constant with underscores, it might be correct
            if (/^[A-Z_]+$/.test(cta)) return cta;
            return map[normalized] || 'LEARN_MORE';
        };

        const websiteUrl = ensureProtocol(config.websiteUrl || creative.linkUrl || 'https://OstrichAi.ai');

        // Helper to map country names to ISO codes for Meta
        const mapCountryToISO = (country: string): string => {
            const map: Record<string, string> = {
                'united states': 'US',
                'usa': 'US',
                'united kingdom': 'GB',
                'uk': 'GB',
                'canada': 'CA',
                'australia': 'AU',
                'germany': 'DE',
                'france': 'FR',
                'india': 'IN',
                'brazil': 'BR',
                'mexico': 'MX',
                'spain': 'ES',
                'italy': 'IT',
                'japan': 'JP',
                'china': 'CN',
                'netherlands': 'NL',
                'sweden': 'SE',
                'switzerland': 'CH',
                'united arab emirates': 'AE',
                'uae': 'AE',
                'singapore': 'SG'
            };
            const normalized = country.toLowerCase().trim();
            // If it's already a 2-letter code, return it uppercase
            if (normalized.length === 2) return normalized.toUpperCase();
            return map[normalized] || 'US'; // Default to US if unknown to avoid crash
        };

        // Step 1: Create Campaign
        const campaignPayload: any = {
            name: config.campaignName,
            objective: config.objective,
            status: 'PAUSED',
            // Meta requires ['NONE'] if no special categories apply
            special_ad_categories: (config.specialAdCategories && config.specialAdCategories.length > 0)
                ? config.specialAdCategories
                : ['NONE'],
            access_token: accessToken
        };

        if (config.campaignBudget) {
            if (config.campaignBudget.type === 'DAILY') {
                campaignPayload.daily_budget = Math.round(config.campaignBudget.amount * 100);
            } else {
                campaignPayload.lifetime_budget = Math.round(config.campaignBudget.amount * 100);
            }
            campaignPayload.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
        }

        const campaignResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignPayload)
            }
        );
        const campaignData = await campaignResponse.json();
        if (campaignData.error) {
            console.error('Campaign creation error:', campaignData.error);
            throw new Error(`Campaign Error: ${campaignData.error.message} (${campaignData.error.error_user_msg || 'No details'})`);
        }

        const campaignId = campaignData.id;

        // Step 2: Create Ad Set
        let optimizationGoal = config.performanceGoal;

        // Ensure optimization goal is compatible with objective and conversion location
        if (config.objective === 'OUTCOME_TRAFFIC') {
            if (optimizationGoal !== 'LINK_CLICKS' && optimizationGoal !== 'LANDING_PAGE_VIEWS') {
                optimizationGoal = 'LINK_CLICKS';
            }
        } else if (config.objective === 'OUTCOME_SALES') {
            optimizationGoal = 'OFFSITE_CONVERSIONS';
        } else if (config.objective === 'OUTCOME_ENGAGEMENT') {
            optimizationGoal = 'POST_ENGAGEMENT';
        } else if (config.objective === 'OUTCOME_LEADS') {
            if (config.conversionLocation === 'WEBSITE') {
                optimizationGoal = 'OFFSITE_CONVERSIONS';
            } else {
                optimizationGoal = 'LEAD_GENERATION';
            }
        } else if (config.objective === 'OUTCOME_AWARENESS') {
            optimizationGoal = 'REACH'; // Default safe goal for Awareness
        }

        const adSetPayload: any = {
            name: config.adSetName,
            campaign_id: campaignId,
            status: 'PAUSED',
            billing_event: 'IMPRESSIONS',
            optimization_goal: optimizationGoal,
            targeting: {
                geo_locations: {
                    countries: config.targeting.locations.length > 0
                        ? config.targeting.locations.map(mapCountryToISO)
                        : ['US']
                },
                age_min: Math.floor(config.targeting.ageMin || 18),
                age_max: Math.floor(config.targeting.ageMax || 65),
                genders: (config.targeting.genders || [1, 2]).map(g => Math.floor(g)),
                // Meta requires interest IDs, not names. Removing for now to prevent crash.
                // TODO: Implement Interest Search API to resolve names to IDs
                publisher_platforms: ['facebook', 'instagram', 'audience_network', 'messenger'],
                targeting_automation: { advantage_audience: 1 } // Enabled often required for modern accounts
            },
            access_token: accessToken
        };

        // Conversion Setting - Only applicable for certain goals
        if (optimizationGoal === 'OFFSITE_CONVERSIONS' && config.pixelId) {
            adSetPayload.promoted_object = {
                pixel_id: config.pixelId,
                custom_event_type: config.objective === 'OUTCOME_LEADS' ? 'LEAD' : 'PURCHASE'
            };
        }
        // LEAD_GENERATION (Instant Forms) and Awareness goals usually do not use promoted_object at the Ad Set level.
        // LINK_CLICKS and LANDING_PAGE_VIEWS usually do NOT use promoted_object at the Ad Set level for Traffic campaigns with a website destination.

        // Budget at Ad Set level if not at Campaign level
        if (!config.campaignBudget && config.adSetBudget) {
            if (config.adSetBudget.type === 'DAILY') {
                adSetPayload.daily_budget = Math.round(config.adSetBudget.amount * 100);
            } else {
                adSetPayload.lifetime_budget = Math.round(config.adSetBudget.amount * 100);
            }
        }

        // Timing
        try {
            adSetPayload.start_time = new Date(config.startTime).toISOString();
        } catch (e) {
            adSetPayload.start_time = config.startTime; // Fallback
        }
        if (config.endTime) {
            try {
                adSetPayload.end_time = new Date(config.endTime).toISOString();
            } catch (e) {
                adSetPayload.end_time = config.endTime;
            }
        }

        const adSetResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adsets`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adSetPayload)
            }
        );
        const adSetData = await adSetResponse.json();
        if (adSetData.error) {
            console.error('Ad Set creation error:', adSetData.error);
            throw new Error(`Ad Set Error: ${adSetData.error.message} (${adSetData.error.error_user_msg || 'No details'})`);
        }

        const adSetId = adSetData.id;

        // Step 3: Upload Media & Create Ad Creative
        let imageHash: string | undefined;
        if (creative.imageUrl) {
            const uploadResult = await uploadAdImage(adAccountId, creative.imageUrl, accessToken);
            imageHash = uploadResult.imageHash;
        }

        const adCreativePayload: any = {
            name: `${config.adName} - Creative`,
            object_story_spec: {
                page_id: config.facebookPageId,
                link_data: {
                    link: websiteUrl,
                    message: creative.body,
                    name: creative.headline,
                    caption: config.displayLink || undefined,
                    call_to_action: { type: mapCTAToMeta(creative.callToAction || 'LEARN_MORE') }
                }
            },
            access_token: accessToken
        };

        if (config.instagramAccountId) {
            adCreativePayload.object_story_spec.instagram_actor_id = config.instagramAccountId;
        }

        if (imageHash) {
            adCreativePayload.object_story_spec.link_data.image_hash = imageHash;
        }

        // Multi-advertiser ads is usually handled at the Ad Set level or automatically for most accounts now.
        // Removing deprecated degrees_of_freedom_spec as it causes validation errors in v18.0+.

        const creativeResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adcreatives`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adCreativePayload)
            }
        );
        const creativeData = await creativeResponse.json();
        if (creativeData.error) {
            console.error('Creative creation error:', creativeData.error);
            throw new Error(`Creative Error: ${creativeData.error.message} (${creativeData.error.error_user_msg || 'No details'})`);
        }

        const creativeId = creativeData.id;

        // Step 4: Create Ad
        const adResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/ads`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: config.adName,
                    adset_id: adSetId,
                    creative: { creative_id: creativeId },
                    status: 'PAUSED',
                    access_token: accessToken
                })
            }
        );
        const adData = await adResponse.json();
        if (adData.error) {
            console.error('Ad creation error:', adData.error);
            throw new Error(`Ad Error: ${adData.error.message} (${adData.error.error_user_msg || 'No details'})`);
        }

        // Step 5: Log to DB
        // Step 5: Log to DB via FastAPI
        await apiClient.createCampaignRecord({
            ad_account_id: adAccountDbId,
            project_id: projectId || null,
            campaign_id: campaignId,
            adset_id: adSetId,
            ad_id: adData.id,
            campaign_name: config.campaignName,
            objective: config.objective,
            status: 'active',
            budget_type: (config.campaignBudget?.type || config.adSetBudget?.type || 'DAILY').toLowerCase(),
            budget_amount: config.campaignBudget?.amount || config.adSetBudget?.amount || 0,
            currency: 'USD',
            start_time: config.startTime,
            end_time: config.endTime || null,
            targeting: config.targeting || {},
            creative_data: creative
        });

        return { success: true, campaignId };
    } catch (error: any) {
        console.error('Detailed campaign creation failed:', error);
        return { success: false, error: error.message };
    }
};

// Create Facebook ad campaign (Legacy/Basic)
export const createCampaign = async (
    adAccountId: string,
    campaignConfig: CampaignConfig,
    creative: AdCreative,
    accessToken: string,
    userId: string,
    adAccountDbId: string,
    projectId?: string
): Promise<{ success: boolean; campaignId?: string; error?: string }> => {
    try {
        // Step 1: Create Campaign
        const campaignResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: campaignConfig.name,
                    objective: campaignConfig.objective,
                    status: 'PAUSED', // Start paused for review
                    special_ad_categories: [],
                    access_token: accessToken
                })
            }
        );

        const campaignData = await campaignResponse.json();

        if (campaignData.error) {
            throw new Error(campaignData.error.message || 'Failed to create campaign');
        }

        const campaignId = campaignData.id;

        // Step 2: Create Ad Set
        const adSetData: any = {
            name: `${campaignConfig.name} - Ad Set`,
            campaign_id: campaignId,
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'LINK_CLICKS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            status: 'PAUSED',
            targeting: {
                geo_locations: campaignConfig.targeting.locations || { countries: ['US'] },
                age_min: campaignConfig.targeting.ageMin || 18,
                age_max: campaignConfig.targeting.ageMax || 65
            },
            access_token: accessToken
        };

        // Add placements if specified
        if (campaignConfig.placements && campaignConfig.placements.length > 0) {
            // Map our internal placement IDs to Facebook's placement groups if needed, 
            // or use specific positions. For simplicity, we'll map common ones.
            const platforms: string[] = [];
            const facebook_positions: string[] = [];
            const instagram_positions: string[] = [];

            campaignConfig.placements.forEach(p => {
                if (p.startsWith('facebook_')) {
                    if (!platforms.includes('facebook')) platforms.push('facebook');
                    facebook_positions.push(p.replace('facebook_', ''));
                } else if (p.startsWith('instagram_')) {
                    if (!platforms.includes('instagram')) platforms.push('instagram');
                    instagram_positions.push(p.replace('instagram_', ''));
                } else if (p === 'audience_network') {
                    if (!platforms.includes('audience_network')) platforms.push('audience_network');
                }
            });

            if (platforms.length > 0) {
                adSetData.publisher_platforms = platforms;
                if (facebook_positions.length > 0) adSetData.facebook_positions = facebook_positions;
                if (instagram_positions.length > 0) adSetData.instagram_positions = instagram_positions;
            }
        }

        // Add budget
        if (campaignConfig.budgetType === 'daily') {
            adSetData.daily_budget = Math.round(campaignConfig.budgetAmount * 100); // Convert to cents
        } else {
            adSetData.lifetime_budget = Math.round(campaignConfig.budgetAmount * 100);
        }

        // Add schedule if provided
        if (campaignConfig.startTime) {
            adSetData.start_time = campaignConfig.startTime.toISOString();
        }
        if (campaignConfig.endTime) {
            adSetData.end_time = campaignConfig.endTime.toISOString();
        }

        // Add genders if specified
        if (campaignConfig.targeting.genders && campaignConfig.targeting.genders.length > 0) {
            adSetData.targeting.genders = campaignConfig.targeting.genders;
        }

        const adSetResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adsets`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adSetData)
            }
        );

        const adSetResponseData = await adSetResponse.json();

        if (adSetResponseData.error) {
            throw new Error(adSetResponseData.error.message || 'Failed to create ad set');
        }

        const adSetId = adSetResponseData.id;

        // Step 3: Upload Image (if provided)
        let imageHash: string | undefined;
        if (creative.imageUrl) {
            const uploadResult = await uploadAdImage(adAccountId, creative.imageUrl, accessToken);
            imageHash = uploadResult.imageHash;
        }

        // Step 4: Create Ad Creative
        const creativeData: any = {
            name: `${campaignConfig.name} - Creative`,
            object_story_spec: {
                page_id: '', // Will need to get page ID
                link_data: {
                    link: creative.linkUrl || 'https://yourwebsite.com',
                    message: creative.body,
                    name: creative.headline,
                    call_to_action: {
                        type: creative.callToAction || 'LEARN_MORE'
                    }
                }
            },
            access_token: accessToken
        };

        // Add image if uploaded
        if (imageHash) {
            creativeData.object_story_spec.link_data.image_hash = imageHash;
        }

        // Get user's pages to use as the advertiser
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.data && pagesData.data.length > 0) {
            creativeData.object_story_spec.page_id = pagesData.data[0].id;
        } else {
            throw new Error('No Facebook page found. A page is required to create ads.');
        }

        const creativeResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/adcreatives`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(creativeData)
            }
        );

        const creativeResponseData = await creativeResponse.json();

        if (creativeResponseData.error) {
            throw new Error(creativeResponseData.error.message || 'Failed to create ad creative');
        }

        const creativeId = creativeResponseData.id;

        // Step 5: Create Ad
        const adResponse = await fetch(
            `https://graph.facebook.com/v18.0/${adAccountId}/ads`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `${campaignConfig.name} - Ad`,
                    adset_id: adSetId,
                    creative: { creative_id: creativeId },
                    status: 'PAUSED',
                    access_token: accessToken
                })
            }
        );

        const adData = await adResponse.json();

        if (adData.error) {
            throw new Error(adData.error.message || 'Failed to create ad');
        }

        const adId = adData.id;

        // Step 6: Save to database via FastAPI
        await apiClient.createCampaignRecord({
            ad_account_id: adAccountDbId,
            project_id: projectId || null,
            campaign_id: campaignId,
            adset_id: adSetId,
            ad_id: adId,
            campaign_name: campaignConfig.name,
            objective: campaignConfig.objective,
            status: 'active',
            budget_type: campaignConfig.budgetType,
            budget_amount: campaignConfig.budgetAmount,
            currency: 'USD',
            start_time: campaignConfig.startTime?.toISOString() || null,
            end_time: campaignConfig.endTime?.toISOString() || null,
            targeting: campaignConfig.targeting,
            placements: campaignConfig.placements || ['facebook_feed', 'instagram_feed'],
            creative_data: creative
        });

        return {
            success: true,
            campaignId: campaignId
        };
    } catch (error: any) {
        console.error('Error creating campaign:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Get campaign performance metrics
export const getCampaignInsights = async (
    campaignId: string,
    accessToken: string
): Promise<any> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,clicks,spend,conversions&access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Failed to fetch insights');
        }

        return data.data?.[0] || {};
    } catch (error: any) {
        console.error('Error fetching campaign insights:', error);
        throw error;
    }
};

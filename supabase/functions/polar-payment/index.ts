import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Import baked-in secrets
let SECRETS = { POLAR_ACCESS_TOKEN: "", POLAR_ORGANIZATION_ID: "", POLAR_WEBHOOK_SECRET: "" };
try {
    // @ts-ignore: secrets.ts might not exist locally during build but will be on server
    const module = await import("./secrets.ts");
    SECRETS = module;
    console.log("Successfully loaded baked-in secrets.ts");
} catch (e) {
    console.log("No secrets.ts found, relying strictly on environment variables.");
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for Polar API
interface PolarCheckoutPayload {
    product_price_id?: string;
    amount?: number;
    currency?: string;
    customer_email?: string;
    customer_name?: string;
    metadata?: Record<string, any>;
    success_url?: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Robust JSON parsing
        const VERSION = "1.5.1-PRODUCTION-FINAL";

        // Initialize Supabase Client
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        let body: any;
        try {
            body = await req.json();
        } catch (e: any) {
            console.error('Failed to parse request body:', e);
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid JSON request body',
                origin: 'JSON_PARSE_ERROR',
                version: VERSION,
                msg: e?.message || 'Empty or malformed body'
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { action, ...data } = body;
        const server = body.server || 'production'; // Default to production for live payments
        const apiBase = server === 'sandbox' ? 'https://sandbox-api.polar.sh/v1' : 'https://api.polar.sh/v1';

        // Dynamic Credential Selection
        let POLAR_ACCESS_TOKEN = "";
        let POLAR_ORGANIZATION_ID = "";
        let POLAR_WEBHOOK_SECRET = "";

        if (server === 'sandbox') {
            POLAR_ACCESS_TOKEN = (SECRETS as any).SANDBOX_POLAR_ACCESS_TOKEN || Deno.env.get('SANDBOX_POLAR_ACCESS_TOKEN');
            POLAR_ORGANIZATION_ID = (SECRETS as any).SANDBOX_POLAR_ORGANIZATION_ID || Deno.env.get('SANDBOX_POLAR_ORGANIZATION_ID');
            POLAR_WEBHOOK_SECRET = (SECRETS as any).SANDBOX_POLAR_WEBHOOK_SECRET || Deno.env.get('SANDBOX_POLAR_WEBHOOK_SECRET');

            // Handle placeholders
            if (POLAR_ACCESS_TOKEN === "REPLACE_ME") POLAR_ACCESS_TOKEN = "";
            if (POLAR_ORGANIZATION_ID === "REPLACE_ME") POLAR_ORGANIZATION_ID = "";
            if (POLAR_WEBHOOK_SECRET === "REPLACE_ME") POLAR_WEBHOOK_SECRET = "";

            // Absolute fallback to production secret if sandbox specific is empty
            if (!POLAR_ACCESS_TOKEN) POLAR_ACCESS_TOKEN = (SECRETS as any).PROD_POLAR_ACCESS_TOKEN;
            if (!POLAR_ORGANIZATION_ID) POLAR_ORGANIZATION_ID = (SECRETS as any).PROD_POLAR_ORGANIZATION_ID;
            if (!POLAR_WEBHOOK_SECRET) POLAR_WEBHOOK_SECRET = (SECRETS as any).PROD_POLAR_WEBHOOK_SECRET;
        } else {
            POLAR_ACCESS_TOKEN = (SECRETS as any).PROD_POLAR_ACCESS_TOKEN || Deno.env.get('POLAR_ACCESS_TOKEN');
            POLAR_ORGANIZATION_ID = (SECRETS as any).PROD_POLAR_ORGANIZATION_ID || Deno.env.get('POLAR_ORGANIZATION_ID');
            POLAR_WEBHOOK_SECRET = (SECRETS as any).PROD_POLAR_WEBHOOK_SECRET || Deno.env.get('POLAR_WEBHOOK_SECRET');
        }

        console.log(`[${VERSION}] Action: ${action} | Server: ${server} | Token prefix: ${POLAR_ACCESS_TOKEN ? POLAR_ACCESS_TOKEN.substring(0, 10) : 'NONE'}`);

        if (action === 'ping') {
            console.log('Ping received');
            const allEnvKeys = Object.keys(Deno.env.toObject());
            return new Response(JSON.stringify({
                success: true,
                message: 'Edge Function is reachable!',
                version: VERSION,
                secrets_source: SECRETS.POLAR_ACCESS_TOKEN ? 'secrets.ts' : 'environment',
                all_keys: allEnvKeys,
                env: {
                    POLAR_ACCESS_TOKEN: POLAR_ACCESS_TOKEN ? `${POLAR_ACCESS_TOKEN.substring(0, 10)}...` : 'MISSING',
                    POLAR_ORG_ID: POLAR_ORGANIZATION_ID || 'MISSING',
                    SUPABASE_URL: SUPABASE_URL || 'MISSING',
                    SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING'
                }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (!POLAR_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing configuration:', { token: !!POLAR_ACCESS_TOKEN, url: !!SUPABASE_URL, key: !!SUPABASE_SERVICE_ROLE_KEY });
            return new Response(JSON.stringify({
                success: false,
                error: 'Server configuration error: missing environment variables.',
                details: {
                    token: !!POLAR_ACCESS_TOKEN,
                    url: !!SUPABASE_URL,
                    key: !!SUPABASE_SERVICE_ROLE_KEY
                }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }


        if (action === 'list_prices') {
            console.log(`[${VERSION}] Discovery: Listing organizations and products from ${apiBase}...`);

            // 1. Fetch Organizations
            const orgsRes = await fetch(`${apiBase}/organizations`, {
                headers: { 'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}` }
            });
            const orgs = await orgsRes.json().catch(() => ({ error: 'Failed to parse orgs JSON' }));

            // 2. Fetch Products (try with provided ID, or first found org)
            const targetOrgId = POLAR_ORGANIZATION_ID || orgs?.items?.[0]?.id;
            let products = { items: [] };
            let productError = null;

            if (targetOrgId) {
                const prodRes = await fetch(`${apiBase}/products?organization_id=${targetOrgId}`, {
                    headers: { 'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}` }
                });
                if (!prodRes.ok) {
                    productError = await prodRes.json().catch(() => ({ error: 'Raw text error' }));
                } else {
                    products = await prodRes.json();
                }
            }

            return new Response(JSON.stringify({
                success: true,
                version: VERSION,
                token_prefix: POLAR_ACCESS_TOKEN ? POLAR_ACCESS_TOKEN.substring(0, 15) : 'NONE',
                configured_org_id: POLAR_ORGANIZATION_ID,
                found_organizations: orgs?.items?.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug })) || [],
                org_fetch_status: orgsRes.status,
                products: products,
                product_error: productError,
                using_org_id: targetOrgId
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'initialize_payment') {
            const {
                amount,
                currency = 'usd',
                priceId,
                customer,
                metadata,
                redirectUrl,
                server = 'sandbox', // Support 'sandbox' as per official SDK - default to sandbox for testing
                theme = 'auto'         // Support theme
            } = data;

            let checkoutUrl = '';
            checkoutUrl = '';
            let checkoutId = '';

            console.log(`Using Polar API Base: ${apiBase} (${server})`);

            // 1. CHECK FOR DIRECT CHECKOUT LINK OVERRIDE
            if (priceId) {
                console.log(`Checking override for plan ID: ${priceId}`);
                const { data: planData, error: planError } = await supabase
                    .from('subscription_plans')
                    .select('polar_checkout_url')
                    .eq('id', priceId)
                    .single();

                if (!planError && planData?.polar_checkout_url) {
                    console.log(`[OVERRIDE] Found direct checkout URL for plan ${priceId}: ${planData.polar_checkout_url}`);
                    return new Response(JSON.stringify({
                        success: true,
                        checkoutUrl: planData.polar_checkout_url,
                        checkoutId: 'direct_override',
                        version: VERSION,
                        is_override: true
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }

            if (priceId) {
                // PLAN MAPPING - Maps our plan IDs to Polar product IDs (Production)
                const PRODUCT_ID_MAP: Record<string, string> = {
                    '550e8400-e29b-41d4-a716-446655440001': 'd9a4beec-4fd3-438f-9bdc-9e41224e9593', // Starter
                    '550e8400-e29b-41d4-a716-446655440002': 'b3441192-9f20-4d44-95d6-40469eefed04', // Pro
                    '550e8400-e29b-41d4-a716-446655440003': '6f7bf3b7-3373-47ca-946c-fc926189cebc'  // Business
                };

                // PRICE ID MAPPING - Maps product IDs to their price IDs (Production)
                const PRICE_ID_MAP: Record<string, string> = {
                    'd9a4beec-4fd3-438f-9bdc-9e41224e9593': 'd3e2ff16-4ede-4b4f-a2c7-f46a8d8ef59c', // Starter $19
                    'b3441192-9f20-4d44-95d6-40469eefed04': 'd197ec1d-cb78-40a8-bca0-a463a16cf5c4', // Pro $79
                    '6f7bf3b7-3373-47ca-946c-fc926189cebc': 'eb455f19-e905-4f33-8ba9-3c210ddffff5'  // Business $299
                };

                const actualProductId = PRODUCT_ID_MAP[priceId] || priceId;
                const actualPriceId = PRICE_ID_MAP[actualProductId];

                console.log(`Product ID Mapping: ${priceId} -> ${actualProductId}`);
                console.log(`Price ID for product: ${actualPriceId}`);

                if (!actualPriceId) {
                    throw new Error(`No price ID found for product ${actualProductId}`);
                }

                console.log('Sending request to Polar API:', JSON.stringify({
                    url: `${apiBase}/checkouts`,
                    productId: actualProductId,
                    priceId: actualPriceId,
                    customer: customer?.email
                }));

                const response = await fetch(`${apiBase}/checkouts/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_price_id: actualPriceId,
                        customer_email: customer?.email,
                        customer_name: customer?.name,
                        success_url: redirectUrl,
                        metadata: {
                            ...metadata,
                            customer_id: customer?.id,
                            app_source: 'ostrich-ai-supabase'
                        }
                    }),
                });

                if (!response.ok) {
                    let errorJson: any = {};
                    try {
                        errorJson = await response.json();
                    } catch (e) {
                        const text = await response.text().catch(() => 'No body');
                        errorJson = { raw: text };
                    }

                    console.error('Polar API Error Detail:', JSON.stringify(errorJson, null, 2));

                    return new Response(JSON.stringify({
                        success: false,
                        error: `Polar API Error (${response.status})`,
                        details: errorJson,
                        request: { priceId: actualPriceId, server }
                    }), {
                        status: 200, // Return 200 so the client can read the JSON body
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const result = await response.json();
                checkoutUrl = result.url;
                checkoutId = result.id;

            } else {
                throw new Error('product_price_id is required via priceId');
            }

            return new Response(
                JSON.stringify({
                    url: checkoutUrl,
                    id: checkoutId,
                    success: true
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'verify_payment') {
            const { reference } = data;
            console.log('Verifying payment reference:', reference);

            if (!POLAR_ACCESS_TOKEN) {
                throw new Error('Missing POLAR_ACCESS_TOKEN');
            }

            // Check standard checkouts first
            let verificationUrl = `https://api.polar.sh/v1/checkouts/${reference}`;

            // If we used custom checkouts, url might differ, but let's assume standard ID for now.
            // Or we can try/catch multiple endpoints?

            const response = await fetch(verificationUrl, {
                headers: {
                    'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
                }
            });

            if (!response.ok) {
                // Try custom checkouts endpoint if 404? 
                // For now, return error
                const errorText = await response.text();
                console.error('Polar Verification Error:', errorText);
                throw new Error(`Verification failed: ${response.statusText}`);
            }

            const session = await response.json();

            // Map Polar session status to our status
            // Polar status: open, expired, confirmed, succeeded?
            // Need to check specific Polar Checkout schema.
            // Assuming 'succeeded' or similar.

            let status = 'pending';
            if (session.status === 'succeeded' || session.status === 'confirmed') {
                status = 'successful';
            } else if (session.status === 'failed') {
                status = 'failed';
            }

            return new Response(JSON.stringify({
                status: status,
                data: {
                    id: session.id,
                    reference: session.id,
                    amount: session.amount,
                    currency: session.currency,
                    status: status,
                    paid_at: session.payment_at || new Date().toISOString(), // Fallback
                    customer: {
                        email: session.customer_email,
                        name: session.customer_name
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'webhook') {
            // Basic webhook handling stub
            // In a real scenario, we'd verify the signature properly
            // data.payload, data.headers

            const signature = req.headers.get('polar-webhook-signature');
            const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET');

            // Verification logic would go here (using HMAC SHA-256)
            // For now, we'll process the event blindly if secret matches (or skip verification for MVP if difficult in headers passing)

            console.log('Received webhook event:', data);

            // Update DB based on event type (checkout.created, subscription.created, etc.)

            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid action',
            action: action,
            origin: 'INVALID_ACTION_ERROR',
            version: VERSION
        }), {
            status: 200, // Return 200 for diagnostics
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Edge Function Critical Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error?.message || 'Unknown critical error',
                stack: error?.stack,
                origin: 'CRITICAL_CATCH_ERROR',
                version: typeof VERSION !== 'undefined' ? VERSION : "1.3.1-ERR-SCOPE",
                details: 'Check Edge Function logs for details'
            }),
            {
                status: 200, // Return 200 for diagnostics
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});

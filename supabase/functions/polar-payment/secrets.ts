// Secrets are loaded from Supabase Edge Function environment variables.
// To set them, run:
//   supabase secrets set POLAR_ACCESS_TOKEN=your_token
//   supabase secrets set POLAR_ORGANIZATION_ID=your_org_id
//   supabase secrets set POLAR_WEBHOOK_SECRET=your_webhook_secret
//   supabase secrets set POLAR_SANDBOX_ACCESS_TOKEN=your_sandbox_token
//   supabase secrets set POLAR_SANDBOX_ORGANIZATION_ID=your_sandbox_org_id

// Production Credentials (from environment)
export const PROD_POLAR_ACCESS_TOKEN = Deno.env.get("POLAR_ACCESS_TOKEN") ?? "";
export const PROD_POLAR_ORGANIZATION_ID = Deno.env.get("POLAR_ORGANIZATION_ID") ?? "";
export const PROD_POLAR_WEBHOOK_SECRET = Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "";

// Sandbox Credentials (from environment)
export const SANDBOX_POLAR_ACCESS_TOKEN = Deno.env.get("POLAR_SANDBOX_ACCESS_TOKEN") ?? "";
export const SANDBOX_POLAR_ORGANIZATION_ID = Deno.env.get("POLAR_SANDBOX_ORGANIZATION_ID") ?? "";
export const SANDBOX_POLAR_WEBHOOK_SECRET = Deno.env.get("POLAR_SANDBOX_WEBHOOK_SECRET") ?? "";

// Note: Function now defaults to production environment

// Social OAuth secrets are loaded from Supabase Edge Function environment variables.
// To set them, run:
//   supabase secrets set LINKEDIN_CLIENT_ID=your_id
//   supabase secrets set LINKEDIN_CLIENT_SECRET=your_secret
//   supabase secrets set FACEBOOK_APP_ID=your_id
//   supabase secrets set FACEBOOK_APP_SECRET=your_secret
//   supabase secrets set GOOGLE_CLIENT_ID=your_id
//   supabase secrets set GOOGLE_CLIENT_SECRET=your_secret

export const SOCIAL_SECRETS = {
    LINKEDIN_CLIENT_ID: Deno.env.get("LINKEDIN_CLIENT_ID") ?? "",
    LINKEDIN_CLIENT_SECRET: Deno.env.get("LINKEDIN_CLIENT_SECRET") ?? "",
    FACEBOOK_APP_ID: Deno.env.get("FACEBOOK_APP_ID") ?? "",
    FACEBOOK_APP_SECRET: Deno.env.get("FACEBOOK_APP_SECRET") ?? "",
    GOOGLE_CLIENT_ID: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
    GOOGLE_CLIENT_SECRET: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
    TWITTER_CLIENT_ID: Deno.env.get("TWITTER_CLIENT_ID") ?? "",
    TWITTER_CLIENT_SECRET: Deno.env.get("TWITTER_CLIENT_SECRET") ?? "",
};

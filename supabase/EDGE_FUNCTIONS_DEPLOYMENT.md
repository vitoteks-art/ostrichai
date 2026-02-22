# Supabase Edge Functions Deployment Guide

## Prerequisites

Install Supabase CLI:
```bash
npm install -g supabase
```

## Setup

### 1. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

You can find your project ref in your Supabase dashboard URL:
`https://app.supabase.com/project/YOUR-PROJECT-REF`

### 2. Set Environment Secrets

Add your OAuth credentials as Supabase secrets:

```bash
# Facebook
supabase secrets set FACEBOOK_APP_ID=your_facebook_app_id
supabase secrets set FACEBOOK_APP_SECRET=your_facebook_app_secret

# Twitter
supabase secrets set TWITTER_CLIENT_ID=your_twitter_client_id
supabase secrets set TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn
supabase secrets set LINKEDIN_CLIENT_ID=your_linkedin_client_id
supabase secrets set LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# TikTok (optional)
supabase secrets set TIKTOK_CLIENT_KEY=your_tiktok_client_key
supabase secrets set TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### 3. Deploy the Function

```bash
supabase functions deploy social-oauth
```

### 4. Verify Deployment

The function will be available at:
```
https://YOUR-PROJECT-REF.supabase.co/functions/v1/social-oauth
```

Test it with:
```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/social-oauth \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"platform":"facebook","code":"test","redirectUri":"http://localhost:5173/oauth/callback/facebook"}'
```

## Local Testing

### Start Local Functions

```bash
supabase functions serve social-oauth --env-file .env
```

This will start the function at `http://localhost:54321/functions/v1/social-oauth`

### Test Locally

Update your `.env` to point to local functions during development:
```env
VITE_SUPABASE_URL=http://localhost:54321
```

## Monitoring

### View Logs

```bash
supabase functions logs social-oauth
```

### View Recent Invocations

Check the Supabase Dashboard:
- Go to Edge Functions
- Click on `social-oauth`
- View logs and metrics

## Security Notes

✅ OAuth secrets are stored securely in Supabase
✅ Secrets are never exposed to the browser
✅ Edge Functions run on Supabase's secure infrastructure
✅ Each request is authenticated with your Supabase key

## Troubleshooting

**Error: Project not linked**
```bash
supabase link --project-ref your-project-ref
```

**Error: Secret not set**
```bash
supabase secrets list
supabase secrets set SECRET_NAME=value
```

**Function not responding**
- Check logs: `supabase functions logs social-oauth`
- Verify secrets are set
- Ensure CORS headers are correct

## Development Workflow

1. Make changes to `supabase/functions/social-oauth/index.ts`
2. Test locally: `supabase functions serve social-oauth`
3. Deploy: `supabase functions deploy social-oauth`
4. Monitor: `supabase functions logs social-oauth`

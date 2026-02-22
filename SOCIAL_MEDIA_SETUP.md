# Social Media Integration Setup Guide

This guide will help you set up OAuth authentication for the social media posting integration feature.

## Prerequisites

- Access to developer portals for each platform
- An active OstrichAi application with HTTPS enabled (OAuth requires HTTPS in production)

## Setup Steps

### 1. Facebook & Instagram Integration

Facebook and Instagram are managed through the same Meta Developer account.

#### Create a Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in the application details:
   - **App Name**: OstrichAi
   - **Contact Email**: Your email
5. Click "Create App"

#### Configure OAuth

1. In your app dashboard, go to "Settings" → "Basic"
2. Copy the **App ID** and **App Secret**
3. Add these to your `.env` file:
   ```env
   VITE_FACEBOOK_APP_ID=your_app_id_here
   FACEBOOK_APP_SECRET=your_app_secret_here
   ```

4. Add Platform:
   - Click "Add Platform" → Choose "Website"
   - **Site URL**: `https://yourdomain.com` (or `http://localhost:5173` for development)

5. Add OAuth Redirect URIs:
   - Go to "Facebook Login" in the left sidebar → "Settings"
   - Add Valid OAuth Redirect URIs:
     - Production: `https://yourdomain.com/oauth/callback/facebook`
     - Development: `http://localhost:5173/oauth/callback/facebook`

#### Request Permissions

1. Go to "App Review" → "Permissions and Features"
2. Request the following permissions:
   - `pages_show_list` - View list of Pages
   - `pages_read_engagement` - Read Page content
   - `pages_manage_posts` - Publish posts to Pages
   - `instagram_basic` - Access Instagram account info
   - `instagram_content_publish` - Publish content to Instagram

3. For each permission:
   - Click "Request Advanced Access"
   - Provide business verification documents if required
   - Explain your use case

#### Enable Instagram

1. In your app dashboard, add the "Instagram" product
2. Link your Instagram Business Account to a Facebook Page
3. The same access token will work for both platforms

---

### 2. Twitter/X Integration

#### Create a Twitter Developer App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign up for a developer account if you haven't already
3. Click "Create Project" and fill in the details
4. Create an app within your project

#### Configure OAuth 2.0

1. In your app settings, go to "Keys and tokens"
2. Generate OAuth 2.0 Client ID and Client Secret
3. Add these to your `.env` file:
   ```env
   VITE_TWITTER_CLIENT_ID=your_client_id_here
   TWITTER_CLIENT_SECRET=your_client_secret_here
   ```

4. Configure App Settings:
   - Go to "User authentication settings"
   - Enable OAuth 2.0
   - **Type of App**: Web App
   - **Callback URLs**:
     - Production: `https://yourdomain.com/oauth/callback/twitter`
     - Development: `http://localhost:5173/oauth/callback/twitter`
   - **Website URL**: Your website URL

5. Required Scopes:
   - `tweet.read` - Read tweets
   - `tweet.write` - Create tweets
   - `users.read` - Read user profile
   - `offline.access` - Get refresh tokens

---

### 3. LinkedIn Integration

#### Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information:
   - **App name**: OstrichAi
   - **LinkedIn Page**: Associate with your company page
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload a logo

#### Configure OAuth

1. In your app settings, go to the "Auth" tab
2. Add Redirect URLs:
   - Production: `https://yourdomain.com/oauth/callback/linkedin`
   - Development: `http://localhost:5173/oauth/callback/linkedin`

3. Copy the credentials and add to `.env`:
   ```env
   VITE_LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   ```

4. Products Tab:
   - Request access to "Share on LinkedIn" product
   - Request access to "Sign In with LinkedIn using OpenID Connect"

5. Required Scopes:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social` - Share content on behalf of user

---

### 4. TikTok Integration (Optional)

TikTok integration is more complex and requires business verification. It's marked as disabled by default in the UI.

#### Create a TikTok for Developers Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Register as a developer
3. Create a new app

#### Configure OAuth

1. In your app settings:
   - Add Redirect URLs:
     - Production: `https://yourdomain.com/oauth/callback/tiktok`
     - Development: `http://localhost:5173/oauth/callback/tiktok`

2. Add to `.env`:
   ```env
   VITE_TIKTOK_CLIENT_KEY=your_client_key_here
   TIKTOK_CLIENT_SECRET=your_client_secret_here
   ```

3. Required Scopes:
   - `user.info.basic`
   - `video.publish`

---

## Database Setup

Run the SQL schema file against your Supabase database:

```bash
# Load the schema
psql -h your-database.supabase.co -U postgres -d postgres -f social-media-accounts-schema.sql

# Or use Supabase dashboard:
# 1. Go to your Supabase project
# 2. Click "SQL Editor" in the left sidebar
# 3. Create a new query
# 4. Paste the contents of social-media-accounts-schema.sql
# 5. Click "Run"
```

Verify the tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social_media%';
```

You should see:
- `social_media_accounts`
- `social_media_posts`
- `scheduled_posts`

---

## Environment Variables

Update your `.env` file with all the credentials:

```env
# Social Media OAuth Credentials
VITE_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
VITE_TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Application URL (important for OAuth callbacks)
VITE_APP_URL=http://localhost:5173  # Change to your production URL in production
```

---

## Testing

### Local Development

1. Ensure your dev server is running:
   ```bash
   npm run dev
   ```

2. Navigate to Settings → Connected Accounts
3. Click "Connect" for a platform
4. You'll be redirected to the platform's OAuth page
5. Authorize the app
6. You'll be redirected back with a success message

### Production Deployment

1. Update `VITE_APP_URL` to your production URL
2. Update all OAuth redirect URLs in each platform's developer portal
3. Ensure your site is using HTTPS (required for OAuth)
4. Test the connection flow end-to-end

---

## Troubleshooting

### OAuth errors

**Error: `redirect_uri_mismatch`**
- Verify redirect URIs match exactly in the platform's developer portal
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Error: `invalid_client`**
- Verify Client ID and Secret are correct
- Ensure the app is not in sandbox/development mode (for production)

**Error: `insufficient_permissions`**
- Request and get approval for required scopes
- Some platforms require business verification

### Database errors

**Error: `relation "social_media_accounts" does not exist`**
- Run the schema SQL file
- Verify you're connected to the correct database

**Error: `permission denied for table social_media_accounts`**
- Check RLS policies are enabled
- Verify the user is authenticated

---

## Platform-Specific Notes

### Facebook/Instagram
- Instagram posting requires a **Business Account** linked to a Facebook Page
- Personal Instagram accounts cannot post via API
- Image posts work immediately; video posts may take time to process

### Twitter/X
- Free tier has limited API access
- Tweet length is 280 characters max
- Image limit is 4 images per tweet

### LinkedIn
- Personal profiles can share updates
- Company pages require admin access
- Video posting has file size limits

### TikTok
- Video-only platform
- Requires business verification
- Longer approval process for API access

---

## Next Steps

1. Set up at least one platform (Facebook recommended)
2. Test the connection flow
3. Try posting from the Social Media Post Generator
4. Monitor the `social_media_posts` table for logs
5. Set up additional platforms as needed

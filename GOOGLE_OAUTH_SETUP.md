# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for your Supabase application, enabling users to sign in with their Google accounts.

## 🚀 Quick Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it

### 2. Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** for user type (or "Internal" if using Google Workspace)
3. Fill in the required information:
   - **App name**: Your application name
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - **Authorized domains**: Add your domain (e.g., `localhost` for development)
4. Add scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users (for External user type)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Configure the OAuth client:
   - **Application type**: **"Web application"**
   - **Name**: Your app name
   - **Authorized redirect URIs**:
     - For development: `http://localhost:5173/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
4. Click **"Create"**
5. Copy the **Client ID** and **Client Secret**

### 4. Configure Supabase

#### Option A: Using Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Find **"Google"** and click **"Enable"**
4. Enter your Google credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Configure redirect URLs:
   - **Redirect URL**: `http://localhost:5173/auth/callback` (for development)
   - **Redirect URL**: `https://yourdomain.com/auth/callback` (for production)
6. Click **"Save"**

#### Option B: Using Supabase CLI (if using local development)

```sql
-- Configure Google OAuth provider
INSERT INTO auth.providers (provider, config)
VALUES (
  'google',
  '{
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "redirect_uri": "http://localhost:5173/auth/callback"
  }'::jsonb
)
ON CONFLICT (provider) DO UPDATE SET config = EXCLUDED.config;
```

### 5. Update Environment Variables

Add these to your `.env` file:

```env
# ========================================
# GOOGLE OAUTH CONFIGURATION
# ========================================
VITE_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth Redirect URLs
VITE_GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback
```

### 6. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click **"Continue with Google"**
4. Verify the OAuth flow works correctly
5. Check that users are created in Supabase Auth

## 🔧 Configuration Details

### Supabase Auth Settings

In your Supabase Dashboard:

1. **Authentication** → **Settings**
2. **Site URL**: Set to your application URL
3. **Redirect URLs**: Add all your OAuth redirect URLs
4. **Enable email confirmations**: Optional (can be disabled for testing)

### Google Cloud Console Settings

1. **APIs & Services** → **Credentials**
2. **OAuth 2.0 Client IDs** → Your client
3. **Authorized redirect URIs**: Must match Supabase settings exactly

## 🛠️ Development Setup

### Environment Variables

```env
# Development
VITE_GOOGLE_CLIENT_ID=your-dev-client-id
VITE_GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback

# Production
VITE_GOOGLE_CLIENT_ID=your-prod-client-id
VITE_GOOGLE_REDIRECT_URL=https://yourdomain.com/auth/callback
```

### Testing

1. **Test in development**: Use `http://localhost:5173`
2. **Test in production**: Use your production domain
3. **Check browser console**: For any OAuth-related errors
4. **Verify user creation**: Check Supabase Auth users

## 🔍 Troubleshooting

### Common Issues

**❌ "Invalid client" error**
- Check that your Google Client ID is correct
- Verify the redirect URI matches exactly
- Ensure the OAuth consent screen is published

**❌ "Redirect URI mismatch"**
- Make sure the redirect URI in Google Cloud Console matches your Supabase settings
- Include the protocol (http/https) and port if needed

**❌ "OAuth consent screen not configured"**
- Complete the OAuth consent screen setup in Google Cloud Console
- Add your email as a test user for External user type

**❌ "App not approved for login"**
- For External user type, add test users in Google Cloud Console
- For production, apply for Google OAuth verification

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('supabase.auth.debug', 'true');
```

## 📚 API Reference

### AuthContext Methods

```typescript
// Google OAuth sign in
const { data, error } = await signInWithGoogle();

// Handle OAuth callback (automatic)
supabase.auth.getSession(); // Gets the session after redirect
```

### Environment Variables

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback
```

## 🔒 Security Notes

- **Never commit** OAuth credentials to version control
- **Use environment variables** for all sensitive configuration
- **Configure redirect URIs** carefully to prevent open redirects
- **Monitor OAuth usage** in Google Cloud Console
- **Keep client secrets secure** and rotate them regularly

## 🚀 Production Deployment

For production:

1. **Create separate OAuth clients** for development and production
2. **Configure production redirect URIs** in Google Cloud Console
3. **Update Supabase Auth settings** with production URLs
4. **Test OAuth flow** thoroughly in production
5. **Monitor authentication metrics** in Supabase Dashboard

## 📞 Support

- **Supabase OAuth Guide**: https://supabase.com/docs/guides/auth/google-oauth
- **Google OAuth Guide**: https://developers.google.com/identity/protocols/oauth2
- **Mailtrap Integration**: `/email-settings` in your application

---

**🎉 You're all set!** Your application now supports Google OAuth authentication alongside traditional email/password authentication.
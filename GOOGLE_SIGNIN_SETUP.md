# Google Sign-In Setup Guide

This guide explains how to enable Google Sign-In authentication for your application using Supabase.

## Prerequisites
- Supabase project created
- Google Cloud Console access
- Application running locally (`npm run dev`)

---

## Part 1: Google Cloud Console Configuration

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (or create a new one)

### Step 2: Configure OAuth Consent Screen (if not already done)
1. Navigate to **APIs & Services** → **OAuth consent screen**
2. If already configured for social media posting, verify these settings:
   - **User Type**: External (or Internal for Google Workspace)
   - **App Information**: Filled in
   - **Scopes**: Ensure `openid`, `email`, `profile` are included
3. If not configured, follow the setup wizard

### Step 3: Create/Configure OAuth 2.0 Credentials

#### Option A: Use Existing Credentials (Recommended if same domain)
1. Go to **APIs & Services** → **Credentials**
2. Find your existing OAuth 2.0 Client ID
3. Click **Edit** (pencil icon)
4. Add Supabase redirect URI to **Authorized redirect URIs**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   **To find your project ref:**
   - Go to Supabase Dashboard → Settings → API
   - Look for "Project URL": `https://[PROJECT-REF].supabase.co`
5. Click **Save**

#### Option B: Create New OAuth Client (If you prefer separation)
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure:
   - **Application type**: Web application
   - **Name**: "Supabase Auth" (or any name)
   - **Authorized redirect URIs**: 
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
4. Click **Create**
5. **Copy the Client ID and Client Secret** (you'll need these)

---

## Part 2: Supabase Dashboard Configuration

### Step 1: Enable Google Provider
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** (left sidebar)
4. Click **Providers**
5. Scroll to find **Google**
6. Toggle **Enable** to ON

### Step 2: Configure Google Provider
1. In the Google provider settings, enter:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
2. Click **Save**

### Step 3: Configure Site URLs
1. Go to **Authentication** → **URL Configuration** (in the top tabs)
2. Set **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs** (comma-separated):
   ```
   http://localhost:5173,http://localhost:5173/,https://yourdomain.com,https://yourdomain.com/
   ```
4. Click **Save**

---

## Part 3: Testing

### Test the Integration
1. **Start your app**: Ensure `npm run dev` is running
2. **Open browser**: Go to `http://localhost:5173`
3. **Click "Continue with Google"** on the login page
4. **Expected flow**:
   - Redirects to Google Sign-In page
   - Select/sign in with Google account
   - Grant permissions if prompted
   - Redirects back to your app
   - **User should be logged in**

### Verify in Supabase
1. Go to **Authentication** → **Users** in Supabase Dashboard
2. You should see the new user with:
   - Provider: `google`
   - Email from Google account
   - User metadata with Google profile info

### Check Profile Creation (Optional)
If you have a `user_profiles` table:
1. Go to **Table Editor** → `user_profiles`
2. Verify a profile was created for the new user
3. Check that `full_name` is populated from Google

---

## Troubleshooting

### Error: "Redirect URI mismatch"
**Problem**: The redirect URI in your request doesn't match any in Google Cloud Console

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Ensure this **exact** URI is listed:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
4. Save and try again

### Error: "Provider not found"
**Problem**: Google provider not enabled in Supabase

**Solution**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Find **Google** and toggle it ON
3. Enter Client ID and Secret
4. Save

### Error: "Access blocked: This app's request is invalid"
**Problem**: OAuth consent screen not configured properly

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Complete all required fields
3. Add test users (if using External type in Testing mode)
4. Ensure `openid`, `email`, `profile` scopes are added

### User logs in but profile not created
**Problem**: Database trigger might be missing

**Solution**:
Check if you have a trigger that creates profiles on user signup. If not, you may need to create one or handle profile creation in your application code.

---

## Environment Variables

**Note**: For Supabase Auth, you **do NOT need** to add Google credentials to your `.env` file. Supabase handles the OAuth flow internally using the credentials configured in the dashboard.

The `VITE_GOOGLE_CLIENT_ID` in your `.env` is only for the social media posting OAuth flow, not for authentication.

---

## Security Best Practices

1. **Never commit secrets**: Keep Client Secret out of version control
2. **Use different clients**: Consider separate OAuth clients for dev/production
3. **Rotate secrets regularly**: Update Client Secret periodically
4. **Monitor usage**: Check Google Cloud Console for unusual activity
5. **Restrict domains**: Only add necessary redirect URIs

---

## Quick Reference

### Google Cloud Console
- **URL**: https://console.cloud.google.com/
- **Location**: APIs & Services → Credentials
- **Redirect URI format**: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

### Supabase Dashboard
- **URL**: https://app.supabase.com/
- **Location**: Authentication → Providers → Google
- **Required**: Client ID, Client Secret

### Testing
- **Local URL**: http://localhost:5173
- **Login page**: Click "Continue with Google"
- **Verify**: Authentication → Users in Supabase Dashboard

---

**✅ Setup Complete!** Users can now sign in with their Google accounts.

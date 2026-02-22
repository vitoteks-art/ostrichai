# Google & YouTube Integration Setup Guide

This guide details how to set up Google OAuth for the application to enable:
1.  **Sign in with Google**
2.  **YouTube Video Posting**

## 1. Google Cloud Console Setup

### A. Create a Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown in the top bar and select **"New Project"**.
3.  Name it (e.g., "OstrichAi Social") and create it.

### B. Enable APIs
1.  In the left sidebar, go to **APIs & Services > Library**.
2.  Search for and enable the following APIs:
    *   **YouTube Data API v3** (Required for video uploads)
    *   **Google People API** (Optional, but good for user profile data)
    *   **Google Ads API** (For future ad integration)

### C. Configure OAuth Consent Screen
1.  Go to **APIs & Services > OAuth consent screen**.
2.  Select **External** (unless you are a Google Workspace user and only want internal access).
3.  **App Information**: Fill in App Name, User Support Email, and Developer Contact Info.
4.  **Scopes**: Click "Add or Remove Scopes" and add:
    *   `../auth/userinfo.email` (email)
    *   `../auth/userinfo.profile` (profile)
    *   `openid`
    *   `../auth/youtube.upload` (Manage your YouTube videos)
    *   `../auth/youtube.readonly` (View your YouTube account)
5.  **Test Users**: If "External" and "Testing" status, add your Google email here to test.

### D. Create Credentials
1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials > OAuth client ID**.
3.  **Application Type**: Select "Web application".
4.  **Name**: e.g., "OstrichAi Web Client".
5.  **Authorized JavaScript origins**:
    *   `http://localhost:5173` (Local Development)
    *   `https://[YOUR_PRODUCTION_DOMAIN]`
6.  **Authorized redirect URIs**:
    *   `http://localhost:5173/oauth/callback/google`
    *   `https://[YOUR_PRODUCTION_DOMAIN]/oauth/callback/google`
7.  **Create**: Copy the **Client ID** and **Client Secret**.

## 2. Environment Variables

### A. Frontend (.env)
Add the Client ID and Redirect URL to your frontend environment variables.

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URL=http://localhost:5173/oauth/callback/google
```

### B. Backend (Supabase Edge Functions)
The Client Secret must be kept secure in the backend.

1.  Run the following commands in your terminal (using generic `npx supabase` or installed CLI):

```bash
npx supabase secrets set GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
npx supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## 3. Deploy Edge Functions
You must deploy the updated functions that contain the Google logic.

```bash
npx supabase functions deploy social-oauth
npx supabase functions deploy social-post
```

## 4. Testing
1.  Start your app (`npm run dev`).
2.  Go to the **Social Accounts** page.
3.  Connect **Google / YouTube**.
4.  Go to **Post Generator**, select **YouTube** platform.
5.  Provide a video URL (e.g., from your storage bucket) and generate a post.
6.  Click **Post** and verify the video appears on your YouTube channel.

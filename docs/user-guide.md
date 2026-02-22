# User Guide

This guide explains how to use the OstrichAi Studio web app from sign-up to exporting results.

## 1. Access and account setup

### Create an account
1. Go to `/login`.
2. Choose "Sign Up".
3. Enter full name, email, password, confirm password.
4. Submit. You will be sent to email verification.

### Verify your email
1. Open the verification email.
2. Click the verification link.
3. Return to the app and log in.

### Log in
1. Go to `/login`.
2. Enter email and password, or use "Continue with Google".
3. If you forgot your password, use "Forgot password" and follow the reset email.

### Referral signups
If you arrive with a referral link (`/login?ref=...`), the app will track the referral automatically after email verification.

## 2. Navigation basics

### Main areas
- Home: marketing pages, entry points to tools.
- Dashboard: stats, quick actions, recent projects.
- Projects: all generated assets, filtering, sorting.
- Profile: personal info, credits, settings.
- Subscription: plans, credits, billing, transactions.
- Social Dashboard: content, ads, analytics, connections.

### Project lifecycle
Most tools create a project record with status:
- `processing`: generation running.
- `completed`: results ready.
- `failed`: generation failed.

Use `/projects` and `/project/:id` to view results and history.

## 3. Credits, plans, and limits

This app uses a credit-based model. Credits are deducted when you run generation steps.
- Check your balance in `/subscription` or `/profile` -> Credits.
- Some features have monthly usage caps. If you hit a limit, upgrade your plan.
- If credits are insufficient, the app blocks the action and shows the needed amount.

## 4. Projects and results

### Projects list
Go to `/projects` to:
- Search by title.
- Filter by type (videos, logos, ads, scripts, etc.).
- Sort by newest, oldest, or title.

### Project detail
Open any project to see:
- Metadata (task IDs, prompts, timestamps).
- Generated media (video, image, script).
- Download or copy actions.

## 5. Video tools

### AI Video Generation (image to video)
Path: `/video-creation`
1. Upload an image.
2. Enter a video description.
3. Click "Generate Video".
4. Save the Task ID.
5. Check status in the same page or `/status`.
6. Download the video or upload to YouTube.

Notes:
- Task ID is required to fetch results later.
- Results include both generated and original video URLs (when available).

### Video UGC Creator (advanced modes)
Path: `/video-ugc`
Use for text-to-video, image-to-video, reference image video, and extension.

Step 1: Configure
- Choose generation type:
  - Text to Video
  - Image to Video (first/last frame)
  - Reference to Video
  - Extend Video
- Add product and content details.
- Optional: generate a detailed prompt automatically.

Step 2: Generate scenes
- Review and edit each scene prompt.
- Select model: `veo3` or `veo3_fast`.
- Select aspect ratio: `9:16` or `16:9`.
- Generate each scene.
- Download results or upload to YouTube.

History
- The history list tracks task status and results.
- You can track an external Task ID manually.

### Extend a video
Path: `/video-extend`
1. Enter the source Task ID.
2. Describe the continuation prompt.
3. Generate the extension.
4. Download or upload to YouTube.

### Lipsync (talking head)
Path: `/video-lipsync`
1. Upload an image.
2. Upload an audio file.
3. Enter a description/prompt.
4. Choose resolution: 480p or 720p.
5. Generate and track using the Task ID.
6. Download or upload to YouTube.

### Task status checker
Path: `/status`
Use this page to check any video task by Task ID and download results.

## 6. Logo design

Path: `/logo-creation`
1. Fill required fields: brand name, industry, style.
2. Optional: slogan, colors, icons, and extra instructions.
3. Select AI model:
   - Titan (premium, higher credits)
   - Nexus (medium)
   - Base (text-only)
   - Echo (text-only, budget)
4. Upload a reference logo (available for Titan and Nexus only).
5. Generate and review results at `/logo-results`.

## 7. Ads and creatives

### Campaign creative workflow
Path: `/ads-creative`
This is a multi-step ad campaign builder:
1. Product input and competitor context.
2. Market intelligence analysis.
3. Messaging architecture.
4. Creative generation + performance prediction.
5. Targeting strategy.
6. Optimization insights.
7. Final review and launch (Facebook Ads).

Notes:
- Credits are deducted per step.
- You can resume from where you left off.

### Image ad creative (batch scenes)
Path: `/image-creative`
1. Upload images (JPEG/PNG/GIF, max 7MB each).
2. Add a detailed description.
3. Choose scene count (1 to 10).
4. Submit and review results in a batch grid.

## 8. Image tools

### AI Image Editor (multi-image)
Path: `/two-image-editor`
1. Upload one or more reference images.
2. Provide editing instructions.
3. Select output settings:
   - Aspect ratio
   - Model (Titan/Nexus/Base)
   - Resolution (1K/2K/4K)
   - Output format (PNG/JPG)
4. Generate and download the edited image.

### Background remover
Path: `/background-remover`
1. Upload an image or paste an image URL.
2. Click "Remove Background".
3. Track progress in the "Recent Tasks" list.
4. Download the processed image.

## 9. Flyers

Path: `/flyer-designer`
1. Fill event details: headline, venue, contact info, CTA.
2. Optional: speakers, theme, color palette, extra instructions.
3. Choose output settings (aspect ratio, model, resolution, format).
4. Upload optional images (up to 8, Titan/Nexus only).
5. Generate and download the flyer.

## 10. Social media

### Social post generator
Path: `/social-media-post`
1. Choose a platform (Facebook, Instagram, LinkedIn, YouTube).
2. Enter your topic or prompt.
3. Generate a post.
4. Optional: rewrite or edit the content.
5. Generate an image (choose model, resolution, aspect ratio).
6. Upload a custom image or video if needed.
7. Approve and post to connected accounts.

Notes:
- Instagram requires media (image or video).
- YouTube requires a video.

### Social dashboard
Path: `/social-dashboard`
Tabs:
- Overview: metrics and recent activity.
- Content: social post management.
- Ads: campaign overview.
- Analytics: performance metrics.
- Connections: connect and manage accounts.

### Connect social accounts
Path: `/settings/connected-accounts`
Use this to link Facebook, Instagram, and other platforms for posting.

## 11. Research and scripts

### Blog research workflow
Path: `/blog-research`
This is a multi-step workflow:
1. Title generation (topic, audience, angle).
2. Section outline and sources.
3. SEO metadata (keywords, slug, description).
4. Full content generation.

Each step has its own credit cost.

### YouTube research
Path: `/youtube-research`
1. Enter a YouTube link.
2. Run research to get insights.
3. Optionally request a thumbnail or script.

### YouTube title generator
Path: `/youtube-title-gen`
1. Enter a description or keywords.
2. Generate a full content package:
   - Title
   - Description
   - Thumbnail prompt
   - Target audience and angle
   - Optional thumbnail image

### YouTube script generator
Path: `/youtube-script`
Fields:
- Title
- Temporal focus
- Target audience
- Content angle
- Controversy level
- Power words
- Duration

### Enhanced YouTube script generator
Path: `/enhanced-youtube-script`
Fields:
- Topic
- Temporal focus
- Target audience
- Specific angle
- Controversy level
- Power words
- Duration

This version is optimized for documentary-style scripts.

## 12. Lead and SEO tools

### Google Maps scraping
Path: `/google-maps-scraping`
1. Enter location and search terms.
2. Configure limits and enrichment level.
3. Select data collection options.
4. Start scraping.
5. Export results to JSON or CSV.

### SEO audit
Path: `/seo-audit`
1. Enter a website URL.
2. Generate the audit.
3. Review scorecards, issues, and opportunities.
4. Download a PDF report.

### Revenue audit
Path: `/revenue-audit`
1. Fill in business and sales data.
2. Wait for AI analysis.
3. Review leaks, projections, and recommendations.

## 13. Profile and settings

### Profile management
Path: `/profile`
- Update name, phone, location, and bio.
- Upload a profile avatar.
- Review credit balance and usage.
- Manage notification settings.

### Subscription and billing
Path: `/subscription`
- View current plan and credit balance.
- Upgrade, downgrade, or purchase credits.
- Review transactions and payment history.

## 14. Troubleshooting

### Video tasks stuck in processing
- Use the Task ID on `/status`.
- Verify that your account has enough credits.
- Try a simpler prompt or lower-quality model if available.

### Generation fails or returns empty
- Confirm required fields are filled.
- Reduce image size or number of uploads.
- Retry after a few minutes.

### Posting to social accounts fails
- Reconnect accounts in `/settings/connected-accounts`.
- Check platform permissions and account access.

## 15. Support

If you need help:
- Check `/projects` to confirm the asset was generated.
- Review the UI error message for missing fields or credit issues.
- Contact support through the in-app chat or email listed in your deployment.

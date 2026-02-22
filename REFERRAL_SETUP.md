# OstrichAi Referral System - Complete Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up the complete viral referral marketing system for OstrichAi.

## ⚠️ IMPORTANT: Fix Signup Database Error

If you're getting "Database error saving new user" during signup, follow these steps:

### Step 1: Run Updated Schema in Supabase

1. **Navigate to your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Base Schema**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl/Cmd + Enter
   - Wait for completion (should see "Success" message)

4. **Run the Referral Schema**
   - Copy the entire contents of `referral-schema.sql`
   - Paste into a new query
   - Click "Run"
   - Wait for completion

### Step 2: Verify Tables and Policies

After running the schemas, verify in Supabase:

1. **Check Tables Exist:**
   - Go to "Table Editor"
   - Verify these tables exist:
     - `profiles`
     - `user_settings`
     - `referral_campaigns`
     - `referral_links`
     - `referral_clicks`
     - `referral_conversions`
     - `user_points`
     - `reward_redemptions`

2. **Check RLS Policies:**
   - Click on `profiles` table
   - Click "Policies" tab
   - You should see several policies including:
     - "Allow profile creation for new users"
     - "Allow anonymous profile creation"
   - Make sure RLS is ENABLED

3. **Check Functions:**
   - Go to "Database" → "Functions"
   - Verify these functions exist:
     - `handle_new_user()`
     - `generate_referral_code()`
     - `update_referral_link_stats()`
     - `update_user_points()`
     - `get_campaign_leaderboard()`

### Step 3: Test Signup

After applying the schema:

1. **Clear browser cache and localStorage**
   - Open Developer Console (F12)
   - Go to Application → Local Storage
   - Clear all items
   - Refresh page

2. **Try signup again**
   - Use the signup form
   - Fill in all fields
   - Submit

3. **Expected result:**
   - ✅ Signup should succeed without errors
   - ✅ You'll receive email verification link
   - ✅ Profile will be created automatically

## 📋 Complete Setup Checklist

### Database Setup
- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Run `referral-schema.sql` in Supabase SQL Editor
- [ ] Verify all tables are created
- [ ] Check RLS policies are active
- [ ] Confirm functions are created

### Application Configuration
- [ ] Update `.env` file with correct Supabase credentials:
  ```
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
- [ ] Restart development server if running

### Testing
- [ ] Test user signup (should work without errors)
- [ ] Test user login
- [ ] Verify profile is created
- [ ] Check referral dashboard loads

### Referral System Setup
- [ ] Create first referral campaign
- [ ] Generate referral link
- [ ] Test referral link tracking
- [ ] Verify points system
- [ ] Check leaderboard functionality

## 🔧 Troubleshooting

### Problem: Still getting "Database error saving new user"

**Solution:**
1. Go to Supabase Dashboard → Authentication → Configuration
2. Scroll to "Auth Hooks"
3. Disable any PostgreSQL hooks temporarily
4. Try signup again

### Problem: Trigger conflicts

**Solution:**
Run this SQL to disable the trigger:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

### Problem: RLS policy violations

**Solution:**  
Temporarily disable RLS for debugging:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
```

Then try signup. If it works, re-enable RLS and use the correct policies from the schema files.

### Problem: Manual profile creation fails

**Workaround:**
The app is configured to handle this gracefully. Profiles will be created on first login attempt if they don't exist during signup.

## 📧 Email Configuration

For referral emails to work, configure your email service:

1. **Supabase SMTP Settings:**
   - Go to Authentication → Email Templates  
   - Configure SMTP provider (SendGrid, Mailgun, etc.)

2. **n8n Workflow Setup:**
   - Follow instructions in `REFERRAL_EMAIL_AUTOMATION_README.md`
   - Set up webhook URLs
   - Configure email templates

## 🎨 Customization

### Landing Page Customization

Each campaign can have a custom landing page. Edit in `CampaignManagement.tsx`:

- Title and subtitle
- Background/text/button colors
- Feature highlights
- Hero images
- Custom CSS

### Reward Configuration

Customize rewards in campaign creation:

- Points per referral click
- Points per conversion
- Tier thresholds (Bronze/Silver/Gold)
- Reward types (credits, discounts, free months)

## 🔐 Security Features

The system includes:

- ✅ Rate limiting (50 clicks/hour per IP)
- ✅ Abuse detection (self-referrals, rapid signups)
- ✅ Device fingerprinting
- ✅ 30-day conversion window
- ✅ Email verification required for conversions

## 📊 Analytics & Reporting

Access campaign analytics in:
- Dashboard → Referral Program → Manage Campaigns → Analytics button
- View:
  - Total clicks and conversions
  - Conversion rates
  - Viral coefficient
  - Top referrers
  - Revenue generated

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## 🆘 Need Help?

1. Check the console logs for detailed error messages
2. Verify database tables and policies in Supabase
3. Ensure environment variables are correctly set
4. Check that triggers are disabled if using manual profile creation

## 🎯 Next Steps After Setup

1. Create your first referral campaign
2. Share referral links on social media
3. Monitor leaderboard and analytics
4. Configure email automation with n8n
5. Customize landing pages for each campaign

The referral system is now ready to drive viral growth for OstrichAi! 🚀
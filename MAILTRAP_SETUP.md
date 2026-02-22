# Mailtrap Integration Setup Guide

This guide explains how to integrate Mailtrap with your Supabase application using both SMTP and API methods for comprehensive email testing and authentication.

## 🚀 Quick Setup

### 1. Get Mailtrap Credentials

1. Go to [Mailtrap.io](https://mailtrap.io) and sign up for a free account
2. Navigate to **Email Testing** → **Inboxes**
3. Create a new inbox or use the default "Demo Inbox"
4. Go to **Settings** → **SMTP Settings**
5. Copy the following credentials:
   - **Host**: `sandbox.smtp.mailtrap.io`
   - **Port**: `2525`
   - **Username**: (your Mailtrap username)
   - **Password**: (your Mailtrap password)

### 2. Configure Environment Variables

Update your `.env` file with your Mailtrap credentials:

```env
# ========================================
# MAILTRAP EMAIL CONFIGURATION
# ========================================
VITE_MAILTRAP_HOST=sandbox.smtp.mailtrap.io
VITE_MAILTRAP_PORT=2525
VITE_MAILTRAP_USER=your_mailtrap_username_here
VITE_MAILTRAP_PASS=your_mailtrap_password_here

# ========================================
# SUPABASE SMTP CONFIGURATION
# ========================================
SUPABASE_SMTP_HOST=sandbox.smtp.mailtrap.io
SUPABASE_SMTP_PORT=2525
SUPABASE_SMTP_USER=your_mailtrap_username_here
SUPABASE_SMTP_PASS=your_mailtrap_password_here
SUPABASE_SMTP_FROM=noreply@yourdomain.com
```

### 3. Configure Supabase Auth SMTP

#### Option A: Using the Admin Interface

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **"SMTP Settings"**
4. Enable **"Configure SMTP"**
5. Enter your Mailtrap credentials:
   - **Host**: `sandbox.smtp.mailtrap.io`
   - **Port**: `2525`
   - **Username**: (your Mailtrap username)
   - **Password**: (your Mailtrap password)
   - **From Email**: `noreply@yourdomain.com` (or your configured from email)
6. Click **"Save"**

#### Option B: Using the Setup Utility

1. Start your development server: `npm run dev`
2. Navigate to `/email-settings` in your application
3. Click **"Generate Supabase Config"**
4. Copy the generated SQL commands from the browser console
5. Run the SQL in your **Supabase SQL Editor**

### 4. Test the Configuration

1. Go to `/email-settings` in your application
2. Click **"Test Configuration"** to verify Mailtrap is working
3. Try creating a new user account to test email sending
4. Check your Mailtrap inbox for the confirmation email

## 🔧 SMTP vs API Integration

Mailtrap offers two integration methods, each with different use cases:

### 📬 SMTP Integration (Recommended for Auth)
- **Best for**: Authentication emails (signup, password reset, email changes)
- **How it works**: Uses email protocols (SMTP) to send emails
- **Integration**: Direct integration with Supabase Auth's built-in SMTP settings
- **Templates**: Uses Supabase's built-in email templates
- **Reliability**: More reliable for transactional emails
- **Deliverability**: Better for authentication-related emails

**✅ Use SMTP when:**
- Sending authentication emails
- Need simple, reliable email delivery
- Want to use Supabase's built-in templates
- Prefer minimal configuration

### 🚀 API Integration (For Custom Emails)
- **Best for**: Custom notifications, marketing emails, complex templates
- **How it works**: Uses REST API to send emails
- **Integration**: Requires custom code to send emails
- **Templates**: Full control over email design and content
- **Flexibility**: More control and advanced features
- **Use case**: Marketing emails, custom notifications, newsletters

**✅ Use API when:**
- Need custom email templates
- Sending marketing or promotional emails
- Want advanced email features (tracking, analytics)
- Need more control over email content

## 📧 Email Types Supported

### SMTP Integration (Supabase Auth)
- **🔐 Account Confirmation**: Sent when users sign up
- **🔑 Password Reset**: Sent when users request password reset
- **📧 Email Changes**: Sent when users change their email
- **🔒 Magic Links**: Sent for passwordless authentication

### API Integration (Custom Emails)
- **📢 Custom Notifications**: Welcome emails, updates, announcements
- **🎯 Marketing Emails**: Promotions, newsletters, product updates
- **📊 Transactional Emails**: Order confirmations, receipts, reports
- **🔄 System Notifications**: Alerts, reminders, status updates

## 🛠️ Development Tools

### Email Settings Page

Access the email configuration interface at `/email-settings`:

- **📊 Configuration Status**: Shows if Mailtrap is properly configured
- **🔧 Test Tools**: Test your SMTP configuration
- **📋 Setup Helper**: Generates Supabase configuration commands
- **📚 Instructions**: Step-by-step setup guide

### Browser Console Commands

In development mode, you can run these commands in the browser console:

```javascript
// Test Mailtrap configuration
await MailService.testConfiguration();

// Generate Supabase configuration
await setupSupabaseMailtrap();

// Check if Mailtrap is configured
MailService.isConfigured();
```

## 🔍 Troubleshooting

### Common Issues

**❌ "Mailtrap not configured"**
- Check that your `.env` file has the correct Mailtrap credentials
- Ensure environment variables are loaded (restart dev server)

**❌ "SMTP connection failed"**
- Verify your Mailtrap credentials are correct
- Check that your Mailtrap inbox is active
- Ensure no firewall is blocking SMTP connections

**❌ "Invalid response format"**
- The webhook response format might have changed
- Check the browser console for detailed error messages

**❌ "Emails not appearing in Mailtrap"**
- Check your Mailtrap inbox spam folder
- Verify the "From Email" matches your configured sender
- Check Supabase Auth logs for SMTP errors

### Debug Mode

Enable debug logging by checking the browser console:

```javascript
// Enable detailed logging
localStorage.setItem('mailtrap-debug', 'true');
```

## 📚 API Reference

### MailService

```typescript
// Check if configured
MailService.isConfigured(): boolean

// Get configuration
MailService.getConfig(): MailtrapConfig | null

// Test configuration
MailService.testConfiguration(): Promise<boolean>

// Get Supabase SMTP config
MailService.getSupabaseSMTPConfig(): object
```

### Setup Utility

```typescript
// Generate Supabase configuration
setupSupabaseMailtrap(): Promise<boolean>
```

## 🔒 Security Notes

- **Never commit** Mailtrap credentials to version control
- **Use environment variables** for all sensitive configuration
- **Rotate credentials** regularly in production
- **Monitor email usage** to avoid hitting Mailtrap limits

## 🚀 Production Considerations

For production use:

1. **Upgrade Mailtrap**: Consider a paid Mailtrap plan for better deliverability
2. **Custom Domain**: Use your own domain for the "From Email" address
3. **Email Templates**: Customize the email templates in Supabase Auth settings
4. **Rate Limiting**: Implement rate limiting for email sending
5. **Monitoring**: Set up monitoring for email delivery failures

## 📞 Support

- **Mailtrap Documentation**: https://help.mailtrap.io
- **Supabase SMTP Guide**: https://supabase.com/docs/guides/auth/smtp
- **Email Settings Page**: `/email-settings` in your application

---

**🎉 You're all set!** Your Supabase application now uses Mailtrap for email testing and authentication emails.
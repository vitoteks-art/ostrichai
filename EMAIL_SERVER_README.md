# Email API Server

A simple Node.js server that handles email sending via Mailtrap SMTP to avoid CORS issues when sending emails from the frontend application.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install dependencies for the email server
npm install --package-lock-only package-email.json
```

Or manually install:

```bash
npm install express nodemailer cors dotenv
```

### 2. Configure Environment Variables

Make sure your `.env` file has the correct Mailtrap credentials:

```env
# Mailtrap SMTP Configuration
VITE_MAILTRAP_HOST=sandbox.smtp.mailtrap.io
VITE_MAILTRAP_PORT=2525
VITE_MAILTRAP_USER=your_mailtrap_username
VITE_MAILTRAP_PASS=your_mailtrap_password

# Supabase SMTP Configuration
SUPABASE_SMTP_FROM=noreply@yourdomain.com

# Email API Configuration
VITE_EMAIL_API_URL=http://localhost:3001/api
EMAIL_API_PORT=3001
```

### 3. Start the Email Server

```bash
# Start the email server
node email-server.js
```

The server will start on `http://localhost:3001` and display:
```
🚀 Email API Server running on http://localhost:3001
📧 Configured for Mailtrap SMTP
🔗 Frontend should connect to: http://localhost:3001/api
```

### 4. Start Your Frontend Application

In a separate terminal:

```bash
# Start your Vite development server
npm run dev
```

## 📡 API Endpoints

### Send Single Email
```http
POST http://localhost:3001/api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello!</h1><p>This is a test email.</p>",
  "text": "Hello! This is a test email.",
  "recipientId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123456789"
}
```

### Send Bulk Emails
```http
POST http://localhost:3001/api/email/bulk-send
Content-Type: application/json

{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Email 1",
      "html": "<p>Email 1 content</p>",
      "recipientId": "user1"
    },
    {
      "to": "user2@example.com",
      "subject": "Email 2",
      "html": "<p>Email 2 content</p>",
      "recipientId": "user2"
    }
  ]
}
```

**Response:**
```json
[
  {
    "success": true,
    "messageId": "msg_123456789",
    "recipientId": "user1"
  },
  {
    "success": true,
    "messageId": "msg_987654321",
    "recipientId": "user2"
  }
]
```

### Health Check
```http
GET http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "Email API Server"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_MAILTRAP_HOST` | Mailtrap SMTP host | `sandbox.smtp.mailtrap.io` |
| `VITE_MAILTRAP_PORT` | Mailtrap SMTP port | `2525` |
| `VITE_MAILTRAP_USER` | Mailtrap username | Required |
| `VITE_MAILTRAP_PASS` | Mailtrap password | Required |
| `SUPABASE_SMTP_FROM` | From email address | `noreply@yourdomain.com` |
| `VITE_EMAIL_API_URL` | Frontend API URL | `http://localhost:3001/api` |
| `EMAIL_API_PORT` | Server port | `3001` |

### CORS Configuration

The server allows requests from:
- `http://localhost:8080` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `http://127.0.0.1:8080` (Alternative localhost)

## 🚀 Production Deployment

### Option 1: Separate Server
1. Deploy the email server to a VPS or cloud service
2. Update `VITE_EMAIL_API_URL` in your `.env` file
3. Ensure Mailtrap credentials are configured

### Option 2: Same Server (Recommended)
1. Deploy both frontend and email server together
2. Use a reverse proxy (nginx) to route requests:
   - `/` → Frontend
   - `/api/email/*` → Email server

### Option 3: Serverless
Convert the email server to a serverless function:
- AWS Lambda
- Vercel Functions
- Netlify Functions

## 🔍 Troubleshooting

### Common Issues

**❌ "Connection refused"**
- Email server is not running
- Wrong port number
- Firewall blocking connections

**❌ "Authentication failed"**
- Incorrect Mailtrap credentials
- Wrong SMTP settings
- Mailtrap account issues

**❌ "CORS error"**
- Frontend not allowed by CORS policy
- Update CORS origins in `email-server.js`

**❌ "Email not sent"**
- Check Mailtrap logs
- Verify SMTP configuration
- Check network connectivity

### Debug Mode

Enable debug logging by modifying `email-server.js`:

```javascript
const transporter = nodemailer.createTransporter({
  // ... existing config
  debug: true,
  logger: true
});
```

## 📊 Monitoring

The server logs all email sending activities:
- ✅ Successful sends with message IDs
- ❌ Failed sends with error details
- 📊 Bulk send summaries

Check your Mailtrap inbox to verify emails are being delivered.

## 🔒 Security Notes

- **Never commit** email credentials to version control
- **Use environment variables** for all sensitive data
- **Monitor email usage** to avoid hitting Mailtrap limits
- **Rate limiting** is implemented (100ms between emails)

## 📞 Support

- **Mailtrap Documentation**: https://help.mailtrap.io
- **Nodemailer Documentation**: https://nodemailer.com
- **Express Documentation**: https://expressjs.com

---

**🎉 You're all set!** Your email system now uses a proper backend server to avoid CORS issues while maintaining all the frontend functionality.
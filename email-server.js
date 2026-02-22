/**
 * Simple Email API Server
 * Handles email sending via Mailtrap SMTP to avoid CORS issues
 *
 * To run: node email-server.js
 * Server will start on http://localhost:3001
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.EMAIL_API_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());

// Create transporter using Mailtrap SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.VITE_MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.VITE_MAILTRAP_PORT) || 2525,
    auth: {
      user: process.env.VITE_MAILTRAP_USER,
      pass: process.env.VITE_MAILTRAP_PASS,
    },
  });
};

// Email sending endpoint
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log(`📧 Sending email to: ${to}`);

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SUPABASE_SMTP_FROM || `noreply@${(process.env.VITE_MAILTRAP_USER || '').split('@')[0]}.com`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully. Message ID: ${result.messageId}`);

    res.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Bulk email sending endpoint
app.post('/api/email/bulk-send', async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emails array is required'
      });
    }

    console.log(`📧 Sending ${emails.length} emails`);

    const transporter = createTransporter();
    const results = [];

    // Send emails with rate limiting (max 10 per second)
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      try {
        const mailOptions = {
          from: process.env.SUPABASE_SMTP_FROM || `noreply@${(process.env.VITE_MAILTRAP_USER || '').split('@')[0]}.com`,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text || email.html.replace(/<[^>]*>/g, ''),
        };

        const result = await transporter.sendMail(mailOptions);
        results.push({
          success: true,
          messageId: result.messageId,
          recipientId: email.recipientId,
        });

        console.log(`✅ Email ${i + 1}/${emails.length} sent to: ${email.to}`);

        // Rate limiting: wait 100ms between emails
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Email ${i + 1} failed:`, error.message);
        results.push({
          success: false,
          error: error.message,
          recipientId: email.recipientId,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`📊 Bulk send completed: ${successCount} success, ${failCount} failed`);

    res.json(results);

  } catch (error) {
    console.error('❌ Bulk email sending failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Email API Server',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email API Server running on http://localhost:${PORT}`);
  console.log(`📧 Configured for Mailtrap SMTP`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📧 Email API Server shutting down...');
  process.exit(0);
});
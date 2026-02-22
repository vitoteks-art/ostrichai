-- Email System Database Schema for Supabase
-- Stores email campaigns, templates, and send logs
-- Integrates with existing n8n webhook for sending

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  type TEXT NOT NULL CHECK (type IN ('promotional', 'newsletter', 'transactional', 'announcement')),
  variables JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  type TEXT NOT NULL CHECK (type IN ('promotional', 'newsletter', 'transactional', 'announcement')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('clients', 'prospects', 'all', 'custom')),
  recipient_filters JSONB DEFAULT '{}',
  recipients JSONB NOT NULL DEFAULT '[]', -- Array of EmailRecipient objects
  cc TEXT[], -- Array of CC email addresses
  bcc TEXT[], -- Array of BCC email addresses
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats JSONB DEFAULT '{"totalRecipients": 0, "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "unsubscribed": 0, "failed": 0}'
);

-- Email Sends Table (logs each individual email send)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_id TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  message_id TEXT, -- From n8n/webhook response
  error_message TEXT,
  webhook_response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Table (detailed logs for debugging)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
DROP POLICY IF EXISTS "Users can view active templates" ON email_templates;
CREATE POLICY "Users can view active templates" ON email_templates
  FOR SELECT USING (is_active = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- RLS Policies for email_campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON email_campaigns;
CREATE POLICY "Users can view own campaigns" ON email_campaigns
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can manage own campaigns" ON email_campaigns;
CREATE POLICY "Users can manage own campaigns" ON email_campaigns
  FOR ALL USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can view all campaigns" ON email_campaigns;
CREATE POLICY "Admins can view all campaigns" ON email_campaigns
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all campaigns" ON email_campaigns;
CREATE POLICY "Admins can manage all campaigns" ON email_campaigns
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- RLS Policies for email_sends
DROP POLICY IF EXISTS "Users can view own sends" ON email_sends;
CREATE POLICY "Users can view own sends" ON email_sends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns
      WHERE email_campaigns.id = email_sends.campaign_id
      AND email_campaigns.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all sends" ON email_sends;
CREATE POLICY "Admins can view all sends" ON email_sends
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "System can insert sends" ON email_sends;
CREATE POLICY "System can insert sends" ON email_sends
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update sends" ON email_sends;
CREATE POLICY "System can update sends" ON email_sends
  FOR UPDATE USING (true);

-- RLS Policies for email_logs
DROP POLICY IF EXISTS "Users can view own logs" ON email_logs;
CREATE POLICY "Users can view own logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_sends
      WHERE email_sends.id = email_logs.send_id
      AND EXISTS (
        SELECT 1 FROM email_campaigns
        WHERE email_campaigns.id = email_sends.campaign_id
        AND email_campaigns.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can view all logs" ON email_logs;
CREATE POLICY "Admins can view all logs" ON email_logs
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "System can insert logs" ON email_logs;
CREATE POLICY "System can insert logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_sends_updated_at ON email_sends;
CREATE TRIGGER update_email_sends_updated_at
  BEFORE UPDATE ON email_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON email_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient_email ON email_sends(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_send_id ON email_logs(send_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_level ON email_logs(level);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- Insert default templates from types/email.ts
INSERT INTO email_templates (id, name, subject, html_content, text_content, type, variables, created_by, is_active)
SELECT
  gen_random_uuid(),
  template_data->>'name',
  template_data->>'subject',
  template_data->>'htmlContent',
  template_data->>'textContent',
  template_data->>'type',
  (template_data->>'variables')::jsonb,
  NULL,
  true
FROM (
  VALUES
  ('{
    "name": "Special Offer",
    "subject": "🎉 Special Offer Just for You - {{company_name}}",
    "htmlContent": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h1 style=\"color: #333;\">Exclusive Offer!</h1><p>Dear {{recipient_name}},</p><p>We have an exciting special offer just for our valued customers!</p><div style=\"background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;\"><h2 style=\"color: #007bff; margin-top: 0;\">Limited Time Offer</h2><p>Get 20% off your next purchase with code: <strong>SPECIAL20</strong></p></div><p>Don''t miss out on this exclusive deal!</p><p>Best regards,<br>The {{company_name}} Team</p><hr style=\"margin: 30px 0; border: none; border-top: 1px solid #eee;\"><p style=\"font-size: 12px; color: #666;\">You received this email because you''re a valued customer. <a href=\"{{unsubscribe_url}}\" style=\"color: #007bff;\">Unsubscribe</a></p></div>",
    "textContent": "Exclusive Offer! Dear {{recipient_name}}, We have an exciting special offer just for our valued customers! Limited Time Offer: Get 20% off your next purchase with code: SPECIAL20. Don''t miss out on this exclusive deal! Best regards, The {{company_name}} Team. You received this email because you''re a valued customer. Unsubscribe: {{unsubscribe_url}}",
    "type": "promotional",
    "variables": ["recipient_name", "company_name", "unsubscribe_url"]
  }'::jsonb),
  ('{
    "name": "Product Announcement",
    "subject": "🚀 New Product Launch - {{company_name}}",
    "htmlContent": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h1 style=\"color: #333;\">Exciting News!</h1><p>Dear {{recipient_name}},</p><p>We''re thrilled to announce the launch of our newest product!</p><div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;\"><h2 style=\"margin-top: 0;\">New Product Available Now</h2><p>Discover amazing features that will transform your experience.</p></div><p>Learn more about this exciting new addition to our product line.</p><p>Best regards,<br>The {{company_name}} Team</p><hr style=\"margin: 30px 0; border: none; border-top: 1px solid #eee;\"><p style=\"font-size: 12px; color: #666;\">You received this email because you''re subscribed to our updates. <a href=\"{{unsubscribe_url}}\" style=\"color: #007bff;\">Unsubscribe</a></p></div>",
    "textContent": "Exciting News! Dear {{recipient_name}}, We''re thrilled to announce the launch of our newest product! New Product Available Now: Discover amazing features that will transform your experience. Learn more about this exciting new addition to our product line. Best regards, The {{company_name}} Team. You received this email because you''re subscribed to our updates. Unsubscribe: {{unsubscribe_url}}",
    "type": "promotional",
    "variables": ["recipient_name", "company_name", "unsubscribe_url"]
  }'::jsonb),
  ('{
    "name": "Newsletter",
    "subject": "📬 Monthly Newsletter - {{company_name}}",
    "htmlContent": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h1 style=\"color: #333;\">Monthly Newsletter</h1><p>Dear {{recipient_name}},</p><p>Welcome to our monthly newsletter! Here''s what''s new this month:</p><div style=\"background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;\"><h3 style=\"color: #495057;\">📰 Latest Updates</h3><ul><li>New features and improvements</li><li>Upcoming events and webinars</li><li>Customer success stories</li><li>Helpful tips and tricks</li></ul></div><p>Stay tuned for more exciting updates!</p><p>Best regards,<br>The {{company_name}} Team</p><hr style=\"margin: 30px 0; border: none; border-top: 1px solid #eee;\"><p style=\"font-size: 12px; color: #666;\">You received this email because you''re subscribed to our newsletter. <a href=\"{{unsubscribe_url}}\" style=\"color: #007bff;\">Unsubscribe</a></p></div>",
    "textContent": "Monthly Newsletter. Dear {{recipient_name}}, Welcome to our monthly newsletter! Here''s what''s new this month: Latest Updates: - New features and improvements - Upcoming events and webinars - Customer success stories - Helpful tips and tricks. Stay tuned for more exciting updates! Best regards, The {{company_name}} Team. You received this email because you''re subscribed to our newsletter. Unsubscribe: {{unsubscribe_url}}",
    "type": "newsletter",
    "variables": ["recipient_name", "company_name", "unsubscribe_url"]
  }'::jsonb)
) AS template_data(template_data)
ON CONFLICT DO NOTHING;

-- Comments for setup instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Update your application services to use these tables
-- 3. Test email sending with database logging
-- 4. Monitor performance and adjust indexes as needed
/**
 * Email system types and interfaces
 */

export type EmailStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type EmailType = 'promotional' | 'newsletter' | 'transactional' | 'announcement';

export type RecipientType = 'clients' | 'prospects' | 'all' | 'custom';

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string;
  type: 'client' | 'prospect';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: EmailType;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

// Database version of EmailTemplate (matches database schema)
export interface EmailTemplateDB {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  type: EmailType;
  variables: string[];
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateId?: string;
  type: EmailType;
  status: EmailStatus;
  recipientType: RecipientType;
  recipientFilters?: Record<string, any>;
  recipients: EmailRecipient[];
  cc?: string[];
  bcc?: string[];
  scheduledFor?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stats?: EmailStats;
}

// Database version of EmailCampaign (matches database schema)
export interface EmailCampaignDB {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id: string | null;
  type: EmailType;
  status: EmailStatus;
  recipient_type: RecipientType;
  recipient_filters: Record<string, any>;
  recipients: EmailRecipient[];
  cc: string[] | null;
  bcc: string[] | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  stats: EmailStats;
}

export interface EmailStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  failed: number;
}

export interface EmailSendResult {
  recipientId: string;
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
  status: 'sent' | 'failed' | 'pending';
}

// Database version of EmailSend (matches database schema)
export interface EmailSendDB {
  id: string;
  campaign_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  recipient_id: string | null;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  message_id: string | null;
  error_message: string | null;
  webhook_response: any;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Database version of EmailLog (matches database schema)
export interface EmailLogDB {
  id: string;
  send_id: string | null;
  campaign_id: string | null;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EmailVariable {
  key: string;
  label: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

export interface EmailTemplateVariable {
  name: string;
  value: string;
  description: string;
}

// Common email template variables
export const COMMON_EMAIL_VARIABLES: EmailVariable[] = [
  { key: 'recipient_name', label: 'Recipient Name', description: 'The recipient\'s full name', required: false },
  { key: 'recipient_email', label: 'Recipient Email', description: 'The recipient\'s email address', required: true },
  { key: 'company_name', label: 'Company Name', description: 'Your company name', required: false, defaultValue: 'Your Company' },
  { key: 'sender_name', label: 'Sender Name', description: 'The name of the email sender', required: false },
  { key: 'unsubscribe_url', label: 'Unsubscribe URL', description: 'URL for recipients to unsubscribe', required: true },
  { key: 'campaign_name', label: 'Campaign Name', description: 'Name of the email campaign', required: false },
  { key: 'current_date', label: 'Current Date', description: 'Today\'s date', required: false },
  { key: 'current_year', label: 'Current Year', description: 'Current year', required: false },
];

// Utility functions to convert between frontend and database formats
export function emailTemplateToDB(template: EmailTemplate): EmailTemplateDB {
  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    html_content: template.htmlContent,
    text_content: template.textContent,
    type: template.type,
    variables: template.variables,
    created_by: template.createdBy,
    is_active: template.isActive,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  };
}

export function emailTemplateFromDB(dbTemplate: EmailTemplateDB): EmailTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    subject: dbTemplate.subject,
    htmlContent: dbTemplate.html_content,
    textContent: dbTemplate.text_content,
    type: dbTemplate.type,
    variables: dbTemplate.variables,
    createdBy: dbTemplate.created_by || '',
    isActive: dbTemplate.is_active,
    createdAt: dbTemplate.created_at,
    updatedAt: dbTemplate.updated_at,
  };
}

export function emailCampaignToDB(campaign: EmailCampaign): Partial<EmailCampaignDB> {
  const dbCampaign: Partial<EmailCampaignDB> = {
    name: campaign.name,
    subject: campaign.subject,
    content: campaign.content,
    template_id: campaign.templateId || null,
    type: campaign.type,
    status: campaign.status,
    recipient_type: campaign.recipientType,
    recipient_filters: campaign.recipientFilters || {},
    recipients: campaign.recipients,
    cc: campaign.cc || null,
    bcc: campaign.bcc || null,
    scheduled_for: campaign.scheduledFor || null,
    sent_at: campaign.sentAt || null,
    created_by: campaign.createdBy,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
    stats: campaign.stats || {
      totalRecipients: campaign.recipients.length,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      failed: 0,
    },
  };

  // Only include ID if it's not empty (for updates, not inserts)
  if (campaign.id && campaign.id.trim() !== '') {
    (dbCampaign as EmailCampaignDB).id = campaign.id;
  }

  return dbCampaign;
}

export function emailCampaignFromDB(dbCampaign: EmailCampaignDB): EmailCampaign {
  return {
    id: dbCampaign.id,
    name: dbCampaign.name,
    subject: dbCampaign.subject,
    content: dbCampaign.content,
    templateId: dbCampaign.template_id || undefined,
    type: dbCampaign.type,
    status: dbCampaign.status,
    recipientType: dbCampaign.recipient_type,
    recipientFilters: dbCampaign.recipient_filters,
    recipients: dbCampaign.recipients,
    cc: dbCampaign.cc || undefined,
    bcc: dbCampaign.bcc || undefined,
    scheduledFor: dbCampaign.scheduled_for || undefined,
    sentAt: dbCampaign.sent_at || undefined,
    createdBy: dbCampaign.created_by || '',
    createdAt: dbCampaign.created_at,
    updatedAt: dbCampaign.updated_at,
    stats: dbCampaign.stats,
  };
}

// Default promotional email templates
export const DEFAULT_PROMOTIONAL_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Special Offer',
    subject: '🎉 Special Offer Just for You - {{company_name}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Exclusive Offer!</h1>
        <p>Dear {{recipient_name}},</p>
        <p>We have an exciting special offer just for our valued customers!</p>
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #007bff; margin-top: 0;">Limited Time Offer</h2>
          <p>Get 20% off your next purchase with code: <strong>SPECIAL20</strong></p>
        </div>
        <p>Don't miss out on this exclusive deal!</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you're a valued customer. 
          <a href="{{unsubscribe_url}}" style="color: #007bff;">Unsubscribe</a>
        </p>
      </div>
    `,
    type: 'promotional',
    variables: ['recipient_name', 'company_name', 'unsubscribe_url'],
    isActive: true,
  },
  {
    name: 'Product Announcement',
    subject: '🚀 New Product Launch - {{company_name}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Exciting News!</h1>
        <p>Dear {{recipient_name}},</p>
        <p>We're thrilled to announce the launch of our newest product!</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
          <h2 style="margin-top: 0;">New Product Available Now</h2>
          <p>Discover amazing features that will transform your experience.</p>
        </div>
        <p>Learn more about this exciting new addition to our product line.</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you're subscribed to our updates. 
          <a href="{{unsubscribe_url}}" style="color: #007bff;">Unsubscribe</a>
        </p>
      </div>
    `,
    type: 'promotional',
    variables: ['recipient_name', 'company_name', 'unsubscribe_url'],
    isActive: true,
  },
  {
    name: 'Newsletter',
    subject: '📬 Monthly Newsletter - {{company_name}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Monthly Newsletter</h1>
        <p>Dear {{recipient_name}},</p>
        <p>Welcome to our monthly newsletter! Here's what's new this month:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">📰 Latest Updates</h3>
          <ul>
            <li>New features and improvements</li>
            <li>Upcoming events and webinars</li>
            <li>Customer success stories</li>
            <li>Helpful tips and tricks</li>
          </ul>
        </div>
        <p>Stay tuned for more exciting updates!</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you're subscribed to our newsletter. 
          <a href="{{unsubscribe_url}}" style="color: #007bff;">Unsubscribe</a>
        </p>
      </div>
    `,
    type: 'newsletter',
    variables: ['recipient_name', 'company_name', 'unsubscribe_url'],
    isActive: true,
  },
];

import { apiClient } from '../lib/api';
import { EmailAPI } from './emailApi';
import {
  EmailCampaign,
  EmailRecipient,
  EmailTemplate,
  EmailSendResult,
  EmailStats,
  EmailTemplateVariable,
  DEFAULT_PROMOTIONAL_TEMPLATES,
  COMMON_EMAIL_VARIABLES,
  EmailVariable,
  EmailTemplateDB,
  EmailCampaignDB,
  emailTemplateFromDB,
  emailCampaignToDB,
  emailCampaignFromDB,
} from '../types/email';

export class EmailCampaignService {
  /**
   * Initialize the service with default templates in database via API
   */
  static async initialize() {
    try {
      // Check if default templates already exist
      const existingTemplates = await apiClient.getEmailTemplates();

      if (!existingTemplates || existingTemplates.length === 0) {
        // Insert default templates
        for (const template of DEFAULT_PROMOTIONAL_TEMPLATES) {
          await apiClient.createEmailTemplate({
            name: template.name,
            subject: template.subject,
            html_content: template.htmlContent,
            text_content: template.textContent,
            type: template.type,
            variables: template.variables,
            is_active: true,
          }).catch(err => console.error(`Error creating default template ${template.name}:`, err));
        }
        console.log(`📧 Email Campaign Service initialized with ${DEFAULT_PROMOTIONAL_TEMPLATES.length} default templates`);
      }
    } catch (error) {
      console.error('Error in EmailCampaignService initialization:', error);
    }
  }

  /**
   * Get all available email templates via API
   */
  static async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const data = await apiClient.getEmailTemplates();
      return data.map(emailTemplateFromDB);
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  }

  /**
   * Get a specific template by ID via API
   */
  static async getTemplate(id: string): Promise<EmailTemplate | null> {
    try {
      const data = await apiClient.getEmailTemplate(id);
      return emailTemplateFromDB(data);
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return null;
    }
  }

  /**
   * Create a new email template via API
   */
  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    try {
      const dbTemplate = {
        name: template.name,
        subject: template.subject,
        html_content: template.htmlContent,
        text_content: template.textContent || null,
        type: template.type,
        variables: template.variables || [],
        is_active: template.isActive !== false,
      };

      const data = await apiClient.createEmailTemplate(dbTemplate);
      return emailTemplateFromDB(data);
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update an existing template via API
   */
  static async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const updateData: Partial<EmailTemplateDB> = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.subject) updateData.subject = updates.subject;
      if (updates.htmlContent) updateData.html_content = updates.htmlContent;
      if (updates.textContent !== undefined) updateData.text_content = updates.textContent;
      if (updates.type) updateData.type = updates.type;
      if (updates.variables) updateData.variables = updates.variables;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const data = await apiClient.updateEmailTemplate(id, updateData);
      return emailTemplateFromDB(data);
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      return null;
    }
  }

  /**
   * Delete a template via API
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      await apiClient.deleteEmailTemplate(id);
      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return false;
    }
  }

  /**
   * Get all campaigns via API
   */
  static async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const data = await apiClient.getEmailCampaigns();
      return data.map(emailCampaignFromDB);
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      return [];
    }
  }

  /**
   * Get a specific campaign by ID via API
   */
  static async getCampaign(id: string): Promise<EmailCampaign | null> {
    try {
      const data = await apiClient.getEmailCampaign(id);
      return emailCampaignFromDB(data);
    } catch (error) {
      console.error('Error in getCampaign:', error);
      return null;
    }
  }

  /**
   * Create a new email campaign via API
   */
  static async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<EmailCampaign> {
    try {
      const data = await apiClient.createEmailCampaign({
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content,
        recipients: campaign.recipients,
        cc: campaign.cc,
        bcc: campaign.bcc,
        status: 'draft',
        template_id: campaign.templateId,
      });

      return emailCampaignFromDB(data);
    } catch (error) {
      console.error('Error in createCampaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign status via API
   */
  static async updateCampaignStatus(id: string, status: EmailCampaign['status'], stats?: EmailStats): Promise<EmailCampaign | null> {
    try {
      const data = await apiClient.updateEmailCampaignStatus(id, status, stats);
      return emailCampaignFromDB(data);
    } catch (error) {
      console.error('Error in updateCampaignStatus:', error);
      return null;
    }
  }

  /**
   * Process template variables and return personalized content
   */
  static processTemplateVariables(
    content: string,
    variables: EmailTemplateVariable[],
    recipient?: EmailRecipient
  ): string {
    let processedContent = content;

    // Process custom variables
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      processedContent = processedContent.replace(regex, variable.value);
    });

    // Process common variables
    COMMON_EMAIL_VARIABLES.forEach(variable => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      let value = variable.defaultValue || '';

      if (recipient) {
        switch (variable.key) {
          case 'recipient_name':
            value = recipient.name || 'Valued Customer';
            break;
          case 'recipient_email':
            value = recipient.email;
            break;
          case 'current_date':
            value = new Date().toLocaleDateString();
            break;
          case 'current_year':
            value = new Date().getFullYear().toString();
            break;
          case 'unsubscribe_url':
            value = `${window.location.origin}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
            break;
        }
      }

      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  }

  /**
    * Send a single email to a recipient via n8n webhook
    */
  static async sendEmail(
    recipient: EmailRecipient,
    subject: string,
    htmlContent: string,
    textContent?: string,
    cc?: string[],
    bcc?: string[]
  ): Promise<EmailSendResult> {
    try {
      // Process template variables for this specific recipient
      const personalizedSubject = this.processTemplateVariables(subject, [], recipient);
      const personalizedHtml = this.processTemplateVariables(htmlContent, [], recipient);
      const personalizedText = textContent
        ? this.processTemplateVariables(textContent, [], recipient)
        : undefined;

      // Send via n8n webhook (which also logs to API)
      const response = await EmailAPI.sendEmail({
        to: recipient.email,
        cc: cc,
        bcc: bcc,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        recipientId: recipient.id,
      });

      return {
        recipientId: recipient.id,
        email: recipient.email,
        success: response.success,
        status: response.success ? 'sent' : 'failed',
        ...(response.messageId && { messageId: response.messageId }),
        ...(response.error && { error: response.error }),
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        recipientId: recipient.id,
        email: recipient.email,
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send campaign to all recipients
   */
  static async sendCampaign(campaignId: string): Promise<EmailSendResult[]> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
      throw new Error('Campaign is not in a sendable state');
    }

    // Update campaign status to sending
    await this.updateCampaignStatus(campaignId, 'sending');

    const results: EmailSendResult[] = [];
    let sentCount = 0;

    try {
      // Send emails with rate limiting
      for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];

        const personalizedSubject = this.processTemplateVariables(campaign.subject, [], recipient);
        const personalizedContent = this.processTemplateVariables(campaign.content, [], recipient);

        const result = await this.sendEmail(recipient, personalizedSubject, personalizedContent, undefined, campaign.cc, campaign.bcc);
        results.push(result);

        if (result.success) {
          sentCount++;
        }

        // Rate limiting
        if (i < campaign.recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Final stats
      const stats: EmailStats = {
        totalRecipients: campaign.recipients.length,
        sent: sentCount,
        delivered: sentCount,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        failed: campaign.recipients.length - sentCount,
      };

      // Update campaign with final stats via API
      await this.updateCampaignStatus(campaignId, 'sent', stats);

      return results;
    } catch (error) {
      console.error('Error sending campaign:', error);
      await this.updateCampaignStatus(campaignId, 'failed');
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  static async getCampaignStats(campaignId: string): Promise<EmailStats | null> {
    try {
      const campaign = await this.getCampaign(campaignId);
      return campaign?.stats || null;
    } catch (error) {
      console.error('Error in getCampaignStats:', error);
      return null;
    }
  }

  /**
   * Delete a campaign via API
   */
  static async deleteCampaign(id: string): Promise<boolean> {
    try {
      await apiClient.request(`/emails/campaigns/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error in deleteCampaign:', error);
      return false;
    }
  }

  /**
   * Get common email variables for template building
   */
  static getCommonVariables(): EmailVariable[] {
    return COMMON_EMAIL_VARIABLES;
  }

  /**
   * Validate email template variables
   */
  static validateTemplate(content: string, variables: string[]): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    const regex = /{{(\w+)}}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1];
      if (!variables.includes(variable) && !COMMON_EMAIL_VARIABLES.find(v => v.key === variable)) {
        missing.push(variable);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }
}

// Initialize the service
EmailCampaignService.initialize().catch(console.error);

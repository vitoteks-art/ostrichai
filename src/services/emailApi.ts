import { apiClient } from '../lib/api';
import { EmailSendDB, EmailLogDB } from '../types/email';

export interface EmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  campaignId?: string;
  recipientId?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailAPI {
  private static WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/email';

  /**
   * Log email send to database via API
   */
  private static async logEmailSend(sendData: Partial<EmailSendDB>): Promise<string | null> {
    try {
      const result = await apiClient.logEmailSend({
        campaign_id: sendData.campaign_id || null,
        recipient_email: sendData.recipient_email!,
        recipient_name: sendData.recipient_name || null,
        recipient_id: sendData.recipient_id || null,
        subject: sendData.subject!,
        content: sendData.content!,
        status: sendData.status || 'pending',
        message_id: sendData.message_id || null,
        error_message: sendData.error_message || null,
        webhook_response: sendData.webhook_response || null,
        sent_at: sendData.sent_at || null,
      });

      return result.id;
    } catch (error) {
      console.error('Error in logEmailSend:', error);
      return null;
    }
  }

  /**
   * Update email send status in database via API
   */
  private static async updateEmailSendStatus(sendId: string, status: string, messageId?: string, error?: string, webhookResponse?: any): Promise<void> {
    try {
      await apiClient.updateEmailSendStatus(sendId, {
        status,
        message_id: messageId,
        error_message: error,
        webhook_response: webhookResponse,
      });
    } catch (error) {
      console.error('Error in updateEmailSendStatus:', error);
    }
  }

  /**
   * Log email event to database via API
   */
  private static async logEmailEvent(sendId: string | null, campaignId: string | null, level: 'info' | 'warning' | 'error', message: string, metadata?: any): Promise<void> {
    try {
      await apiClient.createEmailLog({
        send_id: sendId,
        campaign_id: campaignId,
        level,
        message,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error in logEmailEvent:', error);
    }
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhook(): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    try {
      console.log('🧪 Testing webhook connectivity...');

      const startTime = Date.now();
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'webhook_test',
        }),
      });
      const responseTime = Date.now() - startTime;

      console.log('🧪 Webhook test response:', response.status, responseTime + 'ms');

      if (response.ok) {
        return { success: true, responseTime };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      console.error('🧪 Webhook test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email via n8n webhook with database logging
   */
  static async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    let sendId: string | null = null;
    const startTime = Date.now();

    try {
      const toAddresses = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
      const recipientEmail = Array.isArray(emailData.to) ? emailData.to[0] : emailData.to;

      console.log('📧 Sending email via n8n webhook:');
      console.log('📧 To:', toAddresses);
      console.log('📧 Subject:', emailData.subject);
      console.log('📧 Webhook URL:', this.WEBHOOK_URL);

      // Log email send to database (initial state)
      sendId = await this.logEmailSend({
        campaign_id: emailData.campaignId || null,
        recipient_email: recipientEmail,
        recipient_id: emailData.recipientId || null,
        subject: emailData.subject,
        content: emailData.html,
        status: 'pending',
      });

      await this.logEmailEvent(sendId, emailData.campaignId || null, 'info', 'Email send initiated via n8n webhook', {
        recipient: toAddresses,
        subject: emailData.subject,
        webhookUrl: this.WEBHOOK_URL,
      });

      const payload: any = {
        ...emailData,
        timestamp: new Date().toISOString(),
        source: 'admin_email',
      };

      // Only include CC and BCC if they have values
      if (emailData.cc && (Array.isArray(emailData.cc) ? emailData.cc.length > 0 : emailData.cc.trim())) {
        payload.cc = Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc];
      }

      if (emailData.bcc && (Array.isArray(emailData.bcc) ? emailData.bcc.length > 0 : emailData.bcc.trim())) {
        payload.bcc = Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc];
      }

      console.log('📧 Full payload:', JSON.stringify(payload, null, 2));

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📧 Response status:', response.status);
      console.log('📧 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: string;
        try {
          errorData = await response.text();
        } catch (e) {
          errorData = 'Unable to read error response';
        }
        console.error('📧 Error response body:', errorData);

        // Update database with failure
        if (sendId) {
          await this.updateEmailSendStatus(sendId, 'failed', undefined, `Webhook error: ${response.status} - ${errorData || response.statusText}`);
        }

        await this.logEmailEvent(sendId, emailData.campaignId || null, 'error', 'Email send failed via n8n webhook', {
          status: response.status,
          error: errorData,
          responseTime: Date.now() - startTime,
        });

        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error('Webhook endpoint not found. Please check if the n8n webhook is active.');
        } else if (response.status === 403) {
          throw new Error('Access denied to webhook. Please check webhook authentication.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait before sending more emails.');
        } else if (response.status >= 500) {
          throw new Error('Webhook server error. Please try again later.');
        } else {
          throw new Error(`Webhook error: ${response.status} - ${errorData || response.statusText}`);
        }
      }

      const result = await response.json();
      const messageId = result.messageId || `webhook_${Date.now()}`;
      console.log('✅ Email sent successfully via n8n webhook:', result);

      // Update database with success
      if (sendId) {
        await this.updateEmailSendStatus(sendId, 'sent', messageId, undefined, result);
      }

      await this.logEmailEvent(sendId, emailData.campaignId || null, 'info', 'Email sent successfully via n8n webhook', {
        messageId,
        responseTime: Date.now() - startTime,
        result,
      });

      return {
        success: true,
        messageId,
      };

    } catch (error) {
      console.error('❌ Failed to send email via n8n webhook:', error);

      // Update database with failure
      if (sendId) {
        await this.updateEmailSendStatus(sendId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      }

      await this.logEmailEvent(sendId, emailData.campaignId || null, 'error', 'Email send failed via n8n webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        responseTime: Date.now() - startTime,
        emailData,
      });

      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The webhook took too long to respond.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and webhook URL.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error. The webhook server may not allow requests from this domain.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('❌ Error details:', {
        message: errorMessage,
        originalError: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        webhookUrl: this.WEBHOOK_URL,
        emailData: emailData
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send bulk emails via n8n webhook with database logging
   */
  static async sendBulkEmails(emails: EmailRequest[]): Promise<EmailResponse[]> {
    const campaignId = emails[0]?.campaignId || null;
    const startTime = Date.now();

    try {
      console.log(`📧 Sending ${emails.length} emails via n8n webhook`);
      console.log('📧 Webhook URL:', this.WEBHOOK_URL);

      await this.logEmailEvent(null, campaignId, 'info', `Starting bulk email send of ${emails.length} emails`, {
        emailCount: emails.length,
        webhookUrl: this.WEBHOOK_URL,
      });

      // Send emails one by one via webhook with rate limiting
      const results: EmailResponse[] = [];
      const sendIds: (string | null)[] = [];

      for (let i = 0; i < emails.length; i++) {
        const emailData = emails[i];
        const toAddresses = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
        const recipientEmail = Array.isArray(emailData.to) ? emailData.to[0] : emailData.to;

        console.log(`📧 Sending email ${i + 1}/${emails.length} to:`, toAddresses);

        // Log email send to database (initial state)
        const sendId = await this.logEmailSend({
          campaign_id: campaignId,
          recipient_email: recipientEmail,
          recipient_id: emailData.recipientId || null,
          subject: emailData.subject,
          content: emailData.html,
          status: 'pending',
        });

        sendIds.push(sendId);

        await this.logEmailEvent(sendId, campaignId, 'info', `Email ${i + 1} send initiated`, {
          recipient: toAddresses,
          subject: emailData.subject,
        });

        try {
          const payload: any = {
            ...emailData,
            timestamp: new Date().toISOString(),
            source: 'admin_bulk_email',
            campaignId: emailData.campaignId,
          };

          // Only include CC and BCC if they have values
          if (emailData.cc && (Array.isArray(emailData.cc) ? emailData.cc.length > 0 : emailData.cc.trim())) {
            payload.cc = Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc];
          }

          if (emailData.bcc && (Array.isArray(emailData.bcc) ? emailData.bcc.length > 0 : emailData.bcc.trim())) {
            payload.bcc = Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc];
          }

          // Add timeout for each individual email
          const emailController = new AbortController();
          const emailTimeoutId = setTimeout(() => emailController.abort(), 30000); // 30 second timeout

          const response = await fetch(this.WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: emailController.signal,
          });

          clearTimeout(emailTimeoutId);
          console.log(`📧 Response status for email ${i + 1}:`, response.status);

          if (response.ok) {
            const result = await response.json();
            const messageId = result.messageId || `webhook_${Date.now()}_${i}`;
            console.log(`✅ Email ${i + 1} sent successfully:`, result);

            // Update database with success
            if (sendId) {
              await this.updateEmailSendStatus(sendId, 'sent', messageId, undefined, result);
            }

            await this.logEmailEvent(sendId, campaignId, 'info', `Email ${i + 1} sent successfully`, {
              messageId,
              result,
            });

            results.push({
              success: true,
              messageId,
            });
          } else {
            let errorData: string;
            try {
              errorData = await response.text();
            } catch (e) {
              errorData = 'Unable to read error response';
            }
            console.error(`❌ Email ${i + 1} failed:`, response.status, errorData);

            let errorMessage = `Webhook error: ${response.status}`;
            if (response.status === 404) {
              errorMessage = 'Webhook endpoint not found. Please check if the n8n webhook is active.';
            } else if (response.status === 403) {
              errorMessage = 'Access denied to webhook. Please check webhook authentication.';
            } else if (response.status === 429) {
              errorMessage = 'Too many requests. Please wait before sending more emails.';
            } else if (response.status >= 500) {
              errorMessage = 'Webhook server error. Please try again later.';
            } else if (errorData) {
              errorMessage = `Webhook error: ${response.status} - ${errorData}`;
            }

            // Update database with failure
            if (sendId) {
              await this.updateEmailSendStatus(sendId, 'failed', undefined, errorMessage);
            }

            await this.logEmailEvent(sendId, campaignId, 'error', `Email ${i + 1} failed`, {
              status: response.status,
              error: errorData,
              errorMessage,
            });

            results.push({
              success: false,
              error: errorMessage,
            });
          }
        } catch (emailError) {
          console.error(`❌ Error sending email ${i + 1}:`, emailError);

          let errorMessage = 'Unknown error occurred';
          if (emailError instanceof Error) {
            if (emailError.name === 'AbortError') {
              errorMessage = 'Request timed out. The webhook took too long to respond.';
            } else if (emailError.message.includes('Failed to fetch') || emailError.message.includes('NetworkError')) {
              errorMessage = 'Network error. Please check your internet connection and webhook URL.';
            } else if (emailError.message.includes('CORS')) {
              errorMessage = 'CORS error. The webhook server may not allow requests from this domain.';
            } else {
              errorMessage = emailError.message;
            }
          }

          // Update database with failure
          if (sendId) {
            await this.updateEmailSendStatus(sendId, 'failed', undefined, errorMessage);
          }

          await this.logEmailEvent(sendId, campaignId, 'error', `Email ${i + 1} error`, {
            error: errorMessage,
            originalError: emailError instanceof Error ? emailError.message : 'Unknown error',
          });

          results.push({
            success: false,
            error: errorMessage,
          });
        }

        // Rate limiting: wait 100ms between emails to avoid overwhelming the webhook
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      console.log(`✅ Bulk email completed via n8n webhook. Success: ${successCount}, Failed: ${failureCount}`);

      await this.logEmailEvent(null, campaignId, 'info', `Bulk email completed. Success: ${successCount}, Failed: ${failureCount}`, {
        successCount,
        failureCount,
        totalTime: Date.now() - startTime,
        results: results.map(r => ({ success: r.success, messageId: r.messageId, error: r.error })),
      });

      return results;

    } catch (error) {
      console.error('❌ Failed to send bulk emails via n8n webhook:', error);

      await this.logEmailEvent(null, campaignId, 'error', 'Bulk email send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        emailCount: emails.length,
        totalTime: Date.now() - startTime,
      });

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The webhook took too long to respond.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and webhook URL.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error. The webhook server may not allow requests from this domain.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('❌ Error details:', {
        message: errorMessage,
        originalError: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        webhookUrl: this.WEBHOOK_URL,
        emailCount: emails.length
      });

      // Return failed responses for all emails with the same error
      return emails.map(() => ({
        success: false,
        error: errorMessage,
      }));
    }
  }

  /**
    * Get email sending status (mock implementation for webhook)
    */
  static async getEmailStatus(messageId: string): Promise<any> {
    try {
      // Since we're using a webhook, we can't get real-time status
      // Return a mock response indicating the email was sent
      console.log('📧 Email status check for webhook (mock):', messageId);

      return {
        messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
        source: 'webhook',
        note: 'Status tracking not available for webhook-based sending'
      };
    } catch (error) {
      console.error('❌ Failed to get email status:', error);
      return null;
    }
  }

  /**
   * Export email results to different formats
   */
  static exportResults(results: EmailRequest[], format: 'json' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);

      case 'csv':
        const headers = [
          'To', 'CC', 'BCC', 'Subject', 'Content', 'Type', 'Timestamp'
        ];

        const csvRows = results.map(result => [
          Array.isArray(result.to) ? result.to.join('; ') : result.to,
          Array.isArray(result.cc) ? result.cc.join('; ') : (result.cc || ''),
          Array.isArray(result.bcc) ? result.bcc.join('; ') : (result.bcc || ''),
          result.subject,
          result.html,
          'email',
          new Date().toISOString()
        ]);

        return [headers, ...csvRows].map(row =>
          row.map(field => `"${field}"`).join(',')
        ).join('\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Debug webhook connectivity - call this from browser console
   */
  static async debugWebhook(): Promise<void> {
    console.log('🔧 Starting webhook debug...');

    // Test webhook connectivity
    const testResult = await this.testWebhook();
    console.log('🔧 Webhook test result:', testResult);

    if (testResult.success) {
      console.log('✅ Webhook is responding correctly');
      console.log('📧 Response time:', testResult.responseTime, 'ms');
    } else {
      console.error('❌ Webhook test failed:', testResult.error);
    }

    // Test with a sample email
    console.log('🔧 Testing with sample email...');
    const testPayload: EmailRequest = {
      to: ['test@example.com'],
      subject: 'Test Email from Debug',
      html: '<p>This is a test email from the debug function.</p>',
      text: 'This is a test email from the debug function.',
    };

    // Only add CC and BCC if they should be tested
    if (Math.random() > 0.5) {
      testPayload.cc = ['cc@example.com'];
    }
    if (Math.random() > 0.5) {
      testPayload.bcc = ['bcc@example.com'];
    }

    const sampleEmailResult = await this.sendEmail(testPayload);

    console.log('🔧 Sample email result:', sampleEmailResult);
  }
}

// Make debug function available globally for troubleshooting
if (typeof window !== 'undefined') {
  (window as any).debugEmailWebhook = () => EmailAPI.debugWebhook();
  console.log('🔧 Email webhook debug function available as: debugEmailWebhook()');
}

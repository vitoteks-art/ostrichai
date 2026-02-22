/**
 * Mail Service for handling email configuration with Mailtrap
 * Supports both SMTP and API integration methods
 */

interface MailtrapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  apiToken?: string;
}

interface MailtrapAPIConfig {
  apiToken: string;
  from: string;
}

export class MailService {
  private static smtpConfig: MailtrapConfig | null = null;
  private static apiConfig: MailtrapAPIConfig | null = null;

  /**
   * Initialize Mailtrap configuration (both SMTP and API)
   */
  static initialize() {
    // SMTP Configuration
    const smtpHost = import.meta.env.VITE_MAILTRAP_HOST;
    const smtpPort = parseInt(import.meta.env.VITE_MAILTRAP_PORT || '587');
    const smtpUser = import.meta.env.VITE_MAILTRAP_USER;
    const smtpPass = import.meta.env.VITE_MAILTRAP_PASS;
    const smtpFrom = import.meta.env.SUPABASE_SMTP_FROM;

    // API Configuration
    const apiToken = import.meta.env.VITE_MAILTRAP_API_TOKEN || smtpUser; // Use same token for API
    const apiFrom = import.meta.env.VITE_MAILTRAP_FROM_EMAIL || 'noreply@yourdomain.com';

    if (smtpHost && smtpUser && smtpPass) {
      this.smtpConfig = {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom || `noreply@${smtpUser.split('@')[0]}.com`
      };

      console.log('📧 Mailtrap SMTP configured successfully');
      console.log(`📧 SMTP Host: ${smtpHost}:${smtpPort}`);
      console.log(`📧 From Email: ${this.smtpConfig.from}`);
    }

    if (apiToken) {
      this.apiConfig = {
        apiToken,
        from: apiFrom
      };

      console.log('📧 Mailtrap API configured successfully');
      console.log(`📧 API Token: ${apiToken.substring(0, 10)}...`);
      console.log(`📧 From Email: ${this.apiConfig.from}`);
    }

    if (!this.smtpConfig && !this.apiConfig) {
      console.warn('⚠️ Mailtrap not configured. Please set up your Mailtrap credentials in .env file');
    }
  }

  /**
   * Get current SMTP configuration
   */
  static getSMTPConfig(): MailtrapConfig | null {
    return this.smtpConfig;
  }

  /**
   * Get current API configuration
   */
  static getAPIConfig(): MailtrapAPIConfig | null {
    return this.apiConfig;
  }

  /**
   * Check if Mailtrap SMTP is properly configured
   */
  static isSMTPConfigured(): boolean {
    return this.smtpConfig !== null;
  }

  /**
   * Check if Mailtrap API is properly configured
   */
  static isAPIConfigured(): boolean {
    return this.apiConfig !== null;
  }

  /**
   * Get SMTP configuration for Supabase
   */
  static getSupabaseSMTPConfig() {
    if (!this.smtpConfig) {
      throw new Error('Mailtrap SMTP not configured. Please set up your Mailtrap SMTP credentials.');
    }

    return {
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      user: this.smtpConfig.user,
      pass: this.smtpConfig.pass,
      from: this.smtpConfig.from,
      secure: false, // Mailtrap doesn't require TLS for sandbox
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  /**
   * Test SMTP configuration
   */
  static async testSMTPConfiguration(): Promise<boolean> {
    if (!this.smtpConfig) {
      throw new Error('Mailtrap SMTP not configured');
    }

    try {
      console.log('📧 Testing Mailtrap SMTP configuration...');

      if (!this.smtpConfig.host || !this.smtpConfig.user || !this.smtpConfig.pass) {
        throw new Error('Invalid Mailtrap SMTP configuration');
      }

      console.log('✅ Mailtrap SMTP configuration appears valid');
      return true;
    } catch (error) {
      console.error('❌ Mailtrap SMTP configuration test failed:', error);
      return false;
    }
  }

  /**
   * Send email via Backend API (which proxies to Mailtrap)
   */
  static async sendEmailViaAPI(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      console.log('📧 Sending email via Backend Proxy...');

      const { apiClient } = await import('@/lib/api');
      const result = await apiClient.sendEmail({
        to,
        subject,
        html,
        text,
        type: 'system'
      });

      console.log('✅ Email sent successfully via Backend Proxy');
      return true;

    } catch (error) {
      console.error('❌ Failed to send email via Backend Proxy:', error);
      return false;
    }
  }
}

// Initialize on import
MailService.initialize();

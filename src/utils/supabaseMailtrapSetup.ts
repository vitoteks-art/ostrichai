/**
 * Supabase Mailtrap Setup Utility
 *
 * This utility helps configure Supabase Auth to use Mailtrap for email sending.
 * Run this in your browser console or as a script to configure SMTP settings.
 */

import { MailService } from '../services/mailService';

export const setupSupabaseMailtrap = async () => {
  console.log('🚀 Setting up Supabase + Mailtrap integration...');

  // Check if Mailtrap is configured
  if (!MailService.isConfigured()) {
    console.error('❌ Mailtrap not configured. Please set up your Mailtrap credentials in .env file');
    return false;
  }

  try {
    const config = MailService.getSupabaseSMTPConfig();
    console.log('📧 Mailtrap configuration loaded:', {
      host: config.host,
      port: config.port,
      user: config.user,
      from: config.from
    });

    // Generate the SQL commands for Supabase
    const sqlCommands = generateSupabaseSQL(config);

    console.log('✅ Supabase configuration generated successfully!');
    console.log('\n📋 Copy and run this SQL in your Supabase SQL Editor:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(sqlCommands);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🔧 Manual Setup Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to Authentication > Settings');
    console.log('3. Scroll down to "SMTP Settings"');
    console.log('4. Enable "Configure SMTP"');
    console.log('5. Enter the following values:');
    console.log(`   • Host: ${config.host}`);
    console.log(`   • Port: ${config.port}`);
    console.log(`   • Username: ${config.user}`);
    console.log(`   • Password: ${config.pass}`);
    console.log(`   • From Email: ${config.from}`);
    console.log('6. Click "Save"');

    return true;

  } catch (error) {
    console.error('❌ Failed to setup Mailtrap:', error);
    return false;
  }
};

/**
 * Generate SQL commands for Supabase configuration
 */
const generateSupabaseSQL = (config: any) => {
  return `
-- ========================================
-- SUPABASE MAILTRAP SMTP CONFIGURATION
-- ========================================

-- Update auth settings to use Mailtrap SMTP
UPDATE auth.config
SET value = '${JSON.stringify({
  smtp: {
    host: config.host,
    port: config.port,
    user: config.user,
    pass: config.pass,
    from: config.from,
    secure: false,
    tls: { rejectUnauthorized: false }
  }
})}'
WHERE name = 'smtp';

-- Verify the configuration was set
SELECT value FROM auth.config WHERE name = 'smtp';

-- ========================================
-- EMAIL TEMPLATES CONFIGURATION
-- ========================================

-- Configure email templates (optional - customize as needed)
UPDATE auth.config
SET value = '${JSON.stringify({
  confirmSignup: {
    subject: 'Confirm your email',
    template: 'Welcome! Please confirm your email address.',
    url: '${window.location.origin}/auth/callback?token={{TOKEN}}'
  },
  resetPassword: {
    subject: 'Reset your password',
    template: 'Click here to reset your password:',
    url: '${window.location.origin}/auth/callback?action=reset&token={{TOKEN}}'
  }
})}'
WHERE name = 'email_templates';

-- ========================================
-- TEST EMAIL CONFIGURATION
-- ========================================

-- Test the SMTP configuration (run this in a separate query)
-- SELECT auth.test_smtp_connection();
`;
};

/**
 * Auto-run setup if in development
 */
if (import.meta.env.DEV) {
  console.log('🔧 Development mode detected - Mailtrap setup utility loaded');
  console.log('💡 Run setupSupabaseMailtrap() in console to configure emails');
}

// Export for use in other modules
export { generateSupabaseSQL };

// Email Service for OstrichAi Referral System
// Handles email notifications for referral events

import { apiClient } from '../lib/api';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  /**
   * Send referral link email
   */
  static async sendReferralLinkEmail(
    recipientEmail: string,
    recipientName: string,
    referrerName: string,
    referralLink: string,
    campaignName: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getReferralLinkTemplate(
      recipientName,
      referrerName,
      referralLink,
      campaignName
    );

    return this.sendEmail(recipientEmail, template.subject, template.html, template.text);
  }

  /**
   * Send milestone achievement email
   */
  static async sendMilestoneEmail(
    recipientEmail: string,
    recipientName: string,
    milestone: string,
    points: number,
    totalPoints: number
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getMilestoneTemplate(
      recipientName,
      milestone,
      points,
      totalPoints
    );

    return this.sendEmail(recipientEmail, template.subject, template.html, template.text);
  }

  /**
   * Send reward redemption confirmation email
   */
  static async sendRewardRedemptionEmail(
    recipientEmail: string,
    recipientName: string,
    rewardType: string,
    rewardValue: string,
    pointsSpent: number
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getRewardRedemptionTemplate(
      recipientName,
      rewardType,
      rewardValue,
      pointsSpent
    );

    return this.sendEmail(recipientEmail, template.subject, template.html, template.text);
  }

  /**
   * Send leaderboard position email
   */
  static async sendLeaderboardEmail(
    recipientEmail: string,
    recipientName: string,
    position: number,
    campaignName: string,
    points: number
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getLeaderboardTemplate(
      recipientName,
      position,
      campaignName,
      points
    );

    return this.sendEmail(recipientEmail, template.subject, template.html, template.text);
  }

  /**
   * Send conversion notification to referrer
   */
  static async sendConversionNotificationEmail(
    referrerEmail: string,
    referrerName: string,
    convertedUserName: string,
    pointsEarned: number,
    campaignName: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.getConversionNotificationTemplate(
      referrerName,
      convertedUserName,
      pointsEarned,
      campaignName
    );

    return this.sendEmail(referrerEmail, template.subject, template.html, template.text);
  }

  /**
   * Core email sending function
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiClient.sendEmail({
        to,
        subject,
        html,
        text,
        type: 'referral'
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  /**
   * Email template for referral links
   */
  private static getReferralLinkTemplate(
    recipientName: string,
    referrerName: string,
    referralLink: string,
    campaignName: string
  ): EmailTemplate {
    const subject = `${referrerName} invited you to join OstrichAi! 🎉`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Join OstrichAi</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to OstrichAi! 🚀</h1>
            </div>
            <div class="content">
              <h2>Hi ${recipientName}!</h2>
              <p><strong>${referrerName}</strong> thinks you'd love OstrichAi - the ultimate AI-powered creative platform!</p>

              <p>With OstrichAi, you can:</p>
              <ul>
                <li>🎬 Create stunning videos with AI</li>
                <li>🎨 Design professional logos instantly</li>
                <li>📱 Make engaging social media content</li>
                <li>📊 Generate ads that convert</li>
              </ul>

              <div style="text-align: center;">
                <a href="${referralLink}" class="button">Join OstrichAi Now</a>
              </div>

              <p><em>This invitation is part of the "${campaignName}" referral campaign. Both you and ${referrerName} will earn rewards!</em></p>

              <p>Ready to create amazing content? Click the button above to get started.</p>

              <p>Best regards,<br>The OstrichAi Team</p>
            </div>
            <div class="footer">
              <p>This email was sent because ${referrerName} invited you to join OstrichAi.</p>
              <p>If you don't want to receive these emails, you can <a href="#">unsubscribe</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${recipientName}!

      ${referrerName} invited you to join OstrichAi!

      OstrichAi is the ultimate AI-powered creative platform where you can:
      - Create stunning videos with AI
      - Design professional logos instantly
      - Make engaging social media content
      - Generate ads that convert

      Join now: ${referralLink}

      This invitation is part of the "${campaignName}" referral campaign.

      Best regards,
      The OstrichAi Team
    `;

    return { subject, html, text };
  }

  /**
   * Email template for milestone achievements
   */
  private static getMilestoneTemplate(
    recipientName: string,
    milestone: string,
    points: number,
    totalPoints: number
  ): EmailTemplate {
    const subject = `Congratulations! You've reached a new milestone! 🏆`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Milestone Achieved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Milestone Unlocked! 🎉</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${recipientName}!</h2>
              <p>You've achieved a new milestone: <strong>${milestone}</strong></p>

              <div class="stats">
                <h3>Points Earned: +${points}</h3>
                <p>Total Points: ${totalPoints}</p>
              </div>

              <p>Keep referring friends and unlock even more rewards!</p>

              <p>Best regards,<br>The OstrichAi Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you're part of our referral program.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Congratulations ${recipientName}!

      You've achieved a new milestone: ${milestone}

      Points Earned: +${points}
      Total Points: ${totalPoints}

      Keep referring friends and unlock even more rewards!

      Best regards,
      The OstrichAi Team
    `;

    return { subject, html, text };
  }

  /**
   * Email template for reward redemptions
   */
  private static getRewardRedemptionTemplate(
    recipientName: string,
    rewardType: string,
    rewardValue: string,
    pointsSpent: number
  ): EmailTemplate {
    const subject = `Your reward has been processed! 🎁`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reward Processed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reward { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4facfe; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reward Processed! 🎁</h1>
            </div>
            <div class="content">
              <h2>Hi ${recipientName}!</h2>
              <p>Great news! Your reward redemption has been processed.</p>

              <div class="reward">
                <h3>Reward Details:</h3>
                <p><strong>Type:</strong> ${rewardType}</p>
                <p><strong>Value:</strong> ${rewardValue}</p>
                <p><strong>Points Spent:</strong> ${pointsSpent}</p>
              </div>

              <p>You should see this reward applied to your account shortly.</p>

              <p>Best regards,<br>The OstrichAi Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you redeemed a reward in our referral program.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${recipientName}!

      Your reward redemption has been processed.

      Reward Details:
      Type: ${rewardType}
      Value: ${rewardValue}
      Points Spent: ${pointsSpent}

      You should see this reward applied to your account shortly.

      Best regards,
      The OstrichAi Team
    `;

    return { subject, html, text };
  }

  /**
   * Email template for leaderboard positions
   */
  private static getLeaderboardTemplate(
    recipientName: string,
    position: number,
    campaignName: string,
    points: number
  ): EmailTemplate {
    const subject = `You're #${position} on the leaderboard! 🏆`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Leaderboard Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .position { font-size: 48px; font-weight: bold; color: #ff6b6b; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Leaderboard Update!</h1>
            </div>
            <div class="content">
              <h2>Hey ${recipientName}!</h2>
              <p>Amazing work! You're currently ranked:</p>

              <div class="position">#${position}</div>

              <p>In the <strong>${campaignName}</strong> campaign with <strong>${points} points</strong>!</p>

              <p>Keep referring friends to climb the leaderboard and unlock exclusive rewards.</p>

              <p>Best regards,<br>The OstrichAi Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you're participating in our referral program.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hey ${recipientName}!

      You're currently ranked #${position} in the ${campaignName} campaign with ${points} points!

      Keep referring friends to climb the leaderboard and unlock exclusive rewards.

      Best regards,
      The OstrichAi Team
    `;

    return { subject, html, text };
  }

  /**
   * Email template for conversion notifications
   */
  private static getConversionNotificationTemplate(
    referrerName: string,
    convertedUserName: string,
    pointsEarned: number,
    campaignName: string
  ): EmailTemplate {
    const subject = `Someone joined OstrichAi through your referral! 🎉`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Conversion</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .points { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px solid #4CAF50; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Conversion! 🎉</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${referrerName}!</h2>
              <p><strong>${convertedUserName}</strong> just joined OstrichAi through your referral link!</p>

              <div class="points">
                <h3>+${pointsEarned} Points Earned!</h3>
                <p>Campaign: ${campaignName}</p>
              </div>

              <p>Keep sharing your referral link to earn more points and unlock amazing rewards.</p>

              <p>Best regards,<br>The OstrichAi Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this because someone joined through your referral link.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Congratulations ${referrerName}!

      ${convertedUserName} just joined OstrichAi through your referral link!

      +${pointsEarned} Points Earned!
      Campaign: ${campaignName}

      Keep sharing your referral link to earn more points and unlock amazing rewards.

      Best regards,
      The OstrichAi Team
    `;

    return { subject, html, text };
  }
}

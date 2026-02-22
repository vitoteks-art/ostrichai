# OstrichAi Referral Email Automation Setup

This document explains how to set up automated email workflows for the OstrichAi referral system using n8n.

## Overview

The referral system includes several automated email triggers:

1. **Referral Link Delivery** - When a user generates a referral link
2. **Conversion Notifications** - When someone signs up via a referral
3. **Milestone Achievements** - When users reach point thresholds
4. **Reward Redemptions** - When users redeem points for rewards
5. **Leaderboard Updates** - Periodic leaderboard position notifications

## Prerequisites

- n8n instance (cloud or self-hosted)
- Supabase project with referral tables
- Email service (SendGrid, Mailgun, etc.)
- Webhook endpoint for triggering workflows

## n8n Workflow Setup

### 1. Referral Link Delivery Workflow

**Trigger:** Webhook when referral link is generated

**Steps:**
1. **Webhook** - Receives referral link generation event
2. **HTTP Request** - Fetch referrer and recipient details from Supabase
3. **Email Template** - Generate personalized email using the EmailService templates
4. **Send Email** - Send via your email provider

**Webhook URL:** `https://your-n8n-instance.com/webhook/referral-link-generated`

**Payload:**
```json
{
  "event": "referral_link_generated",
  "referral_link_id": "uuid",
  "campaign_id": "uuid",
  "user_id": "uuid",
  "recipient_email": "user@example.com",
  "recipient_name": "John Doe"
}
```

### 2. Conversion Notification Workflow

**Trigger:** Database trigger when conversion is recorded

**Steps:**
1. **Supabase Trigger** - Listen for new conversions
2. **HTTP Request** - Get conversion details and referrer info
3. **Email Template** - Create notification email
4. **Send Email** - Notify referrer of new conversion

**Database Trigger Setup:**
```sql
-- Create a function to call n8n webhook
CREATE OR REPLACE FUNCTION notify_conversion_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call n8n webhook with conversion details
  PERFORM
    net.http_post(
      url := 'https://your-n8n-instance.com/webhook/conversion-recorded',
      body := json_build_object(
        'event', 'conversion_recorded',
        'conversion_id', NEW.id,
        'referrer_id', NEW.referrer_id,
        'converted_user_id', NEW.converted_user_id,
        'points_awarded', NEW.points_awarded,
        'campaign_id', NEW.campaign_id
      )::text
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER conversion_webhook_trigger
  AFTER INSERT ON referral_conversions
  FOR EACH ROW EXECUTE FUNCTION notify_conversion_webhook();
```

### 3. Milestone Achievement Workflow

**Trigger:** Scheduled check for milestone achievements

**Steps:**
1. **Schedule Trigger** - Run daily/weekly
2. **HTTP Request** - Query users who reached new milestones
3. **Function** - Calculate new tiers and milestones
4. **Email Template** - Generate achievement emails
5. **Send Email** - Send to qualifying users

**Schedule:** Daily at 9 AM

### 4. Reward Redemption Confirmation Workflow

**Trigger:** When reward redemption status changes to 'fulfilled'

**Steps:**
1. **Supabase Trigger** - Listen for redemption status changes
2. **HTTP Request** - Get redemption details
3. **Email Template** - Create confirmation email
4. **Send Email** - Send confirmation to user

### 5. Leaderboard Update Workflow

**Trigger:** Weekly leaderboard digest

**Steps:**
1. **Schedule Trigger** - Run weekly
2. **HTTP Request** - Get top performers from each campaign
3. **Function** - Generate personalized leaderboard emails
4. **Send Email** - Send to top 10 users per campaign

## Email Templates

The `EmailService` class provides HTML and text templates for all email types:

- `sendReferralLinkEmail()` - For sending referral invitations
- `sendMilestoneEmail()` - For milestone achievements
- `sendRewardRedemptionEmail()` - For redemption confirmations
- `sendLeaderboardEmail()` - For leaderboard positions
- `sendConversionNotificationEmail()` - For conversion notifications

## n8n Node Configuration

### Common Nodes Used:

1. **Webhook** - For receiving events
2. **HTTP Request** - For API calls to Supabase
3. **Function** - For data processing and template generation
4. **Send Email** - For sending emails via SMTP or API
5. **Schedule Trigger** - For time-based workflows

### Supabase Integration:

**Base URL:** `https://your-project.supabase.co/rest/v1`

**Headers:**
```
apikey: your-anon-key
Authorization: Bearer your-service-role-key
Content-Type: application/json
```

**Example Query - Get User Details:**
```
GET /profiles?select=id,email,full_name&id=eq.{user_id}
```

## Environment Variables

Set these in your n8n instance:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@OstrichAi.com
FROM_NAME=OstrichAi
```

## Testing Workflows

1. **Manual Testing:**
   - Use n8n's built-in testing tools
   - Send test webhooks with sample data
   - Verify email delivery

2. **Database Triggers:**
   - Test by manually inserting records into referral tables
   - Check n8n execution logs

3. **Scheduled Workflows:**
   - Run manually first, then enable scheduling
   - Monitor for errors in execution history

## Monitoring and Maintenance

1. **Logs:** Check n8n execution logs for failed workflows
2. **Error Handling:** Implement retry logic for failed email sends
3. **Rate Limiting:** Add delays between bulk email sends
4. **Analytics:** Track email open rates and click-through rates

## Troubleshooting

**Common Issues:**

1. **Webhook not triggering:** Check n8n webhook URL and payload format
2. **Email not sending:** Verify SMTP credentials and email service limits
3. **Database queries failing:** Check RLS policies and API keys
4. **Templates not rendering:** Ensure HTML is properly escaped

**Debug Steps:**

1. Test individual nodes in n8n workflow editor
2. Check Supabase logs for failed queries
3. Verify email service delivery logs
4. Use n8n's debug mode for step-by-step execution

## Security Considerations

1. **API Keys:** Store sensitive keys as environment variables
2. **Webhook Authentication:** Add authentication to webhook endpoints
3. **Rate Limiting:** Implement rate limiting on webhook endpoints
4. **Data Validation:** Validate all incoming webhook data
5. **Error Handling:** Don't expose sensitive information in error messages

## Scaling Considerations

1. **Bulk Emails:** Use queue systems for large email campaigns
2. **Database Load:** Implement caching for frequently accessed data
3. **Webhook Reliability:** Add retry logic and dead letter queues
4. **Monitoring:** Set up alerts for workflow failures

## Example n8n Workflow JSON

```json
{
  "name": "Referral Conversion Notification",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "conversion-recorded",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://your-project.supabase.co/rest/v1/referral_conversions?select=*,referrer:profiles(*),converted_user:profiles(*)&id=eq={{ $json.conversion_id }}",
        "method": "GET",
        "authentication": "headerAuth",
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "your-anon-key"
            }
          ]
        }
      },
      "name": "Get Conversion Details",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [460, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Get Conversion Details",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

This setup provides a complete automated email system for the OstrichAi referral program, ensuring users receive timely notifications about their referral activities and rewards.
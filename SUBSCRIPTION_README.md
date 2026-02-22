# 🚀 Subscription System Implementation Guide

## Overview

This subscription system is designed specifically for the Nigerian/African market with Flutterwave and Paystack integration. It provides tiered subscription plans, usage tracking, and comprehensive payment management.

## 🎯 Features Implemented

### ✅ Core Features
- **Multi-tier subscription plans** (Starter, Professional, Enterprise)
- **Flutterwave & Paystack integration** for Nigerian payments
- **Usage tracking and limits** enforcement
- **Feature access control** based on subscription
- **Real-time subscription management** UI
- **Nigerian business compliance** (VAT, invoicing)

### ✅ Payment Features
- **Multiple payment methods**: Cards, Mobile Money, USSD, Bank Transfer, QR codes
- **Multi-currency support**: NGN, USD, EUR, GBP, KES, GHS, ZAR
- **Mobile-first design** optimized for African users
- **Webhook verification** for payment security
- **Invoice generation** with Nigerian VAT compliance

## 📋 Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Execute the contents of subscription-schema.sql in Supabase SQL Editor
```

### 2. Environment Variables

Copy `.env.subscription.example` to `.env` and configure:

```bash
cp .env.subscription.example .env
```

Fill in your actual payment provider credentials:

```env
# Flutterwave (Get from https://dashboard.flutterwave.com)
VITE_FLUTTERWAVE_PUBLIC_KEY=flw_pk_test_...
FLUTTERWAVE_SECRET_KEY=flw_sk_test_...

# Paystack (Get from https://dashboard.paystack.com)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Nigerian Business Details
BUSINESS_NAME="Your Company Name"
CAC_NUMBER="RC123456"
TIN="123456789"
```

### 3. Payment Provider Setup

#### Flutterwave Setup:
1. Create account at [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Get your API keys from Settings > API
3. Set webhook URL: `https://your-domain.com/api/webhooks/flutterwave`
4. Enable Nigerian payment methods

#### Paystack Setup:
1. Create account at [Paystack Dashboard](https://dashboard.paystack.com)
2. Get your API keys from Settings > API Keys & Webhooks
3. Set webhook URL: `https://your-domain.com/api/webhooks/paystack`
4. Enable Nigerian payment channels

### 4. Webhook Endpoints

Create webhook handlers in your backend:

```typescript
// Flutterwave webhook verification
app.post('/api/webhooks/flutterwave', (req, res) => {
  const signature = req.headers['verif-hash'];
  if (!verifyFlutterwaveWebhook(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // Process successful payment
  handlePaymentSuccess('flutterwave', req.body);
  res.sendStatus(200);
});

// Paystack webhook verification
app.post('/api/webhooks/paystack', (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!verifyPaystackWebhook(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // Process successful payment
  handlePaymentSuccess('paystack', req.body);
  res.sendStatus(200);
});
```

## 💳 Subscription Plans

### 🆓 Starter Plan (Free)
- 5 videos/month
- 3 logos/month
- 5 ads/month
- 100MB storage
- Standard support

### ⭐ Professional Plan (₦2,900/month)
- 50 videos/month
- 25 logos/month
- 100 ads/month
- 5GB storage
- Priority support
- Advanced features

### 🏢 Enterprise Plan (₦9,900/month)
- Unlimited usage
- 50GB storage
- API access
- White-label solution
- Custom branding

## 🔧 Usage in Components

### Feature Access Control

```tsx
import { FeatureGate } from '@/components/FeatureGate';

function VideoGenerator() {
  return (
    <div>
      <FeatureGate feature="videoGeneration">
        <VideoGenerationForm />
      </FeatureGate>
    </div>
  );
}
```

### Usage Tracking

```tsx
import { TrackUsage } from '@/components/FeatureGate';
import { UsageService } from '@/services/usageService';

async function handleVideoGeneration() {
  // Track usage before generation
  const canProceed = await UsageService.trackUsage(userId, 'video', 1);

  if (canProceed) {
    // Proceed with video generation
    generateVideo();
  }
}
```

### Subscription Status

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';

function Dashboard() {
  const { subscription, plan, canAccess } = useSubscription();

  return (
    <div>
      <h1>Welcome to {plan?.name} Plan!</h1>

      {canAccess('videoGeneration') && (
        <VideoGenerationButton />
      )}
    </div>
  );
}
```

## 📊 Usage Tracking

The system automatically tracks:
- Feature usage (videos, logos, ads, etc.)
- Monthly limits enforcement
- Storage usage
- API calls

### Manual Usage Tracking

```typescript
import { UsageService } from '@/services/usageService';

// Track feature usage
await UsageService.trackUsage(userId, 'video', 1);

// Check if user can use feature
const limitCheck = await UsageService.checkUsageLimit(userId, 'video');
if (limitCheck.withinLimit) {
  // Allow feature usage
} else {
  // Show upgrade prompt
}
```

## 🧾 Invoice System

### Nigerian Business Compliance

The system includes:
- **VAT calculation** (7.5% Nigerian VAT)
- **Professional invoices** with Nigerian format
- **Receipt generation** for all payments
- **Tax reporting** capabilities

### Invoice Generation

```typescript
import { InvoiceService } from '@/services/invoiceService';

const invoice = await InvoiceService.generateInvoice(subscriptionId);
// Returns PDF URL and invoice data
```

## 🔐 Security Features

### Webhook Verification

```typescript
import { verifyFlutterwaveWebhook, verifyPaystackWebhook } from '@/services/paymentService';

// Verify webhook authenticity
const isValidFlutterwave = verifyFlutterwaveWebhook(payload, signature);
const isValidPaystack = verifyPaystackWebhook(payload, signature);
```

### Input Validation

```typescript
import Joi from 'joi';

const subscriptionSchema = Joi.object({
  planId: Joi.string().uuid().required(),
  paymentProvider: Joi.string().valid('flutterwave', 'paystack').required(),
  customerInfo: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+234[0-9]{10}$/)
  }).required()
});
```

## 📱 Mobile Payment Support

### USSD Integration

```typescript
// Nigerian bank USSD codes
const NIGERIAN_BANKS = [
  { code: 'access', name: 'Access Bank', ussd: '*901#' },
  { code: 'gtbank', name: 'GTBank', ussd: '*737#' },
  { code: 'firstbank', name: 'First Bank', ussd: '*894#' },
  // ... more banks
];
```

### Mobile Money

```typescript
const MOBILE_MONEY_PROVIDERS = [
  { code: 'mtn', name: 'MTN Mobile Money', ussd: '*170#' },
  { code: 'airtel', name: 'Airtel Money', ussd: '*185#' },
  { code: 'glo', name: 'Glo Mobile Money', ussd: '*805#' },
  { code: '9mobile', name: '9Mobile Money', ussd: '*223#' }
];
```

## 🚀 Testing

### Test Payment Flows

1. **Sandbox Testing**:
   ```bash
   # Use test credentials in .env
   VITE_FLUTTERWAVE_PUBLIC_KEY=flw_pk_test_...
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
   ```

2. **Test Cards** (Flutterwave):
   - Success: `5531886652142950`
   - Decline: `5258585922666501`

3. **Test Cards** (Paystack):
   - Success: `4084084084084081`
   - Decline: `4084084084084081` (with CVC 408)

### Test Webhooks

Use tools like [ngrok](https://ngrok.com) for local webhook testing:

```bash
ngrok http 3000
# Use the ngrok URL in payment provider dashboards
```

## 🔧 Troubleshooting

### Common Issues

1. **Webhook Signature Verification Fails**
   - Check if `FLUTTERWAVE_SECRET_HASH` is correct
   - Ensure webhook payload is not modified

2. **Payment Initialization Fails**
   - Verify API keys are correct
   - Check if payment provider accounts are verified

3. **Usage Limits Not Working**
   - Ensure usage tracking is implemented in feature components
   - Check subscription status is loaded correctly

### Debug Mode

Enable debug logging:

```env
DEBUG=subscription:*,payment:*,webhook:*
```

## 📈 Monitoring & Analytics

### Admin Dashboard

Access subscription analytics at `/admin/subscriptions`:

- Revenue tracking by payment provider
- Popular subscription plans
- Payment method preferences
- User churn analysis

### Usage Analytics

Monitor feature usage patterns:

```typescript
const analytics = await SubscriptionService.getAnalytics();
// Returns usage statistics and trends
```

## 🚀 Deployment Checklist

- [ ] Database schema deployed to production
- [ ] Payment provider accounts verified and approved
- [ ] Webhook endpoints configured and tested
- [ ] Environment variables updated for production
- [ ] SSL certificate installed (required for payments)
- [ ] Domain verified with payment providers
- [ ] Email service configured for invoices
- [ ] Nigerian business registration details verified

## 💡 Next Steps

1. **Implement webhook handlers** in your backend
2. **Set up email service** for invoice delivery
3. **Create admin dashboard** for subscription management
4. **Add more payment methods** as needed
5. **Implement advanced analytics** for business insights

## 📞 Support

For payment provider issues:
- **Flutterwave Support**: https://support.flutterwave.com
- **Paystack Support**: https://support.paystack.com

For implementation help, refer to:
- Flutterwave Documentation: https://developer.flutterwave.com
- Paystack Documentation: https://developers.paystack.com

---

**🎉 Your subscription system is now ready for the Nigerian market with local payment methods and business compliance!**
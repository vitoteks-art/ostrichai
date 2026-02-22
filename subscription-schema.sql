-- Subscription System Database Schema for Creative AI Platform
-- Supports Flutterwave and Paystack payment providers
-- Currently uses USD pricing with NGN support for Nigerian users

-- Subscription Plans Table
-- First, alter existing table if it exists
ALTER TABLE IF EXISTS subscription_plans
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN'));

-- Rename price column if it exists (from price_kobo or price_dollars to price_cents)
DO $$
BEGIN
   -- Check if price_kobo column exists and rename it
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'price_kobo') THEN
     ALTER TABLE subscription_plans RENAME COLUMN price_kobo TO price_cents;
   END IF;

   -- Check if price_dollars column exists and rename it
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'price_dollars') THEN
     ALTER TABLE subscription_plans RENAME COLUMN price_dollars TO price_cents;
   END IF;

   -- Add price_cents column if it doesn't exist
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'price_cents') THEN
     ALTER TABLE subscription_plans ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;
   END IF;

   -- Update interval constraint to include 'week'
   ALTER TABLE subscription_plans
   DROP CONSTRAINT IF EXISTS subscription_plans_interval_check;

   ALTER TABLE subscription_plans
   ADD CONSTRAINT subscription_plans_interval_check
   CHECK (interval IN ('month', 'year', 'week'));
END $$;

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0, -- Amount in USD cents
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN')),
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year', 'week')),
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  trial_days INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions Table
-- First, alter existing table if it exists
ALTER TABLE IF EXISTS user_subscriptions
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN'));

-- Rename amount column if it exists (from amount_kobo to amount_cents)
DO $$
BEGIN
    -- Check if amount_kobo column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'amount_kobo') THEN
      ALTER TABLE user_subscriptions RENAME COLUMN amount_kobo TO amount_cents;
    END IF;

    -- Add amount_cents column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'amount_cents') THEN
      ALTER TABLE user_subscriptions ADD COLUMN amount_cents INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add credit-related columns for hybrid pricing model
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'monthly_credits') THEN
      ALTER TABLE user_subscriptions ADD COLUMN monthly_credits INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'credit_balance') THEN
      ALTER TABLE user_subscriptions ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'overage_rate_cents') THEN
      ALTER TABLE user_subscriptions ADD COLUMN overage_rate_cents INTEGER NOT NULL DEFAULT 450; -- $4.50 per 100 credits
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'credit_rollover_days') THEN
      ALTER TABLE user_subscriptions ADD COLUMN credit_rollover_days INTEGER DEFAULT 0; -- 0 = no rollover, 30/90/180 = days
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'overage_settings') THEN
      ALTER TABLE user_subscriptions ADD COLUMN overage_settings JSONB DEFAULT '{"auto_reload": true, "manual_topup": false, "monthly_cap_cents": null}';
    END IF;

    -- Update status constraint to include 'pending_approval' and 'expired'
    ALTER TABLE user_subscriptions
    DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

    ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_status_check
    CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'pending_approval', 'expired'));
END $$;

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
   plan_id UUID REFERENCES subscription_plans(id),

   -- Multi-provider payment support
   payment_provider TEXT NOT NULL CHECK (payment_provider IN ('flutterwave', 'paystack', 'admin')),
   provider_subscription_id TEXT,
   provider_customer_id TEXT,

   -- Payment amount in cents (USD or NGN)
   amount_cents INTEGER NOT NULL DEFAULT 0,
   currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN')),

   -- Credit system for hybrid pricing
   monthly_credits INTEGER NOT NULL DEFAULT 0, -- Credits allocated monthly
   credit_balance INTEGER NOT NULL DEFAULT 0, -- Current credit balance
   overage_rate_cents INTEGER NOT NULL DEFAULT 450, -- Cost per 100 credits overage ($4.50)
   credit_rollover_days INTEGER DEFAULT 0, -- Days credits can roll over (0, 30, 90, 180)
   overage_settings JSONB DEFAULT '{"auto_reload": true, "manual_topup": false, "monthly_cap_cents": null}',

   -- Subscription status
   status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'pending_approval', 'expired')),
   current_period_start TIMESTAMP WITH TIME ZONE,
   current_period_end TIMESTAMP WITH TIME ZONE,
   cancel_at_period_end BOOLEAN DEFAULT FALSE,
   trial_end TIMESTAMP WITH TIME ZONE,

   -- Customer details
   customer_name TEXT,
   customer_phone TEXT,
   billing_address JSONB,

   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  feature_type TEXT NOT NULL, -- 'video', 'logo', 'ad', 'flyer', 'blog', 'script', 'image_edit', 'social_post', 'scraping', 'scraping_business'
  usage_count INTEGER NOT NULL DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions Table
-- First, alter existing table if it exists
ALTER TABLE IF EXISTS payment_transactions
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN'));

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),

  -- Multi-provider support
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('flutterwave', 'paystack', 'admin')),
  provider_reference TEXT NOT NULL,
  provider_transaction_id TEXT,

  -- Transaction details
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),

  -- Payment methods
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'ussd', 'mobile_money', 'qr')),
  bank_name TEXT,
  account_number TEXT,

  -- Response data from providers
  provider_response JSONB,

  -- Error tracking
  failure_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Credit Transactions Table (for tracking credit purchases and usage)
CREATE TABLE IF NOT EXISTS credit_transactions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
   subscription_id UUID REFERENCES user_subscriptions(id),

   -- Transaction type
   transaction_type TEXT NOT NULL CHECK (transaction_type IN ('monthly_allocation', 'overage_purchase', 'manual_purchase', 'usage', 'rollover', 'expiration')),

   -- Credit amounts
   credits_before INTEGER NOT NULL DEFAULT 0,
   credits_after INTEGER NOT NULL DEFAULT 0,
   credits_changed INTEGER NOT NULL DEFAULT 0, -- Positive for additions, negative for usage

   -- Cost information (for purchases)
   amount_cents INTEGER DEFAULT 0,
   currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN')),

   -- Feature usage details (for usage transactions)
   feature_type TEXT, -- 'background_removal', 'nano_banana', 'nano_banana_pro_1k', etc.
   feature_count INTEGER DEFAULT 1,

   -- Payment provider (for purchases)
   payment_provider TEXT CHECK (payment_provider IN ('flutterwave', 'paystack', 'admin')),
   provider_reference TEXT,

   -- Description and metadata
   description TEXT,
   metadata JSONB DEFAULT '{}',

   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices/Receipts Table
-- First, alter existing table if it exists
ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN'));

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  transaction_id UUID REFERENCES payment_transactions(id),

  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NGN')),

  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  billing_address JSONB,

  -- Items breakdown
  line_items JSONB NOT NULL,

  -- Tax information (supports both USD and NGN)
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 0.00, -- 0% for USD, 7.5% for NGN
  vat_amount_cents INTEGER DEFAULT 0,
  discount_amount_cents INTEGER DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- File storage
  pdf_url TEXT,
  download_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read) (DROP first if exists)
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (active = TRUE);

-- RLS Policies for user_subscriptions (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert subscriptions" ON user_subscriptions;
CREATE POLICY "System can insert subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (true);

-- Admin can view all subscriptions (for admin panel)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
  FOR SELECT USING (is_admin_or_above(auth.uid()));

-- Admin can update all subscriptions
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can update all subscriptions" ON user_subscriptions
  FOR UPDATE USING (is_admin_or_above(auth.uid()));

-- Admin can insert subscriptions (for admin approval workflow)
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can insert subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (is_admin_or_above(auth.uid()));

-- RLS Policies for user_usage (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert usage" ON user_usage;
CREATE POLICY "System can insert usage" ON user_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies for payment_transactions (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage transactions" ON payment_transactions;
CREATE POLICY "System can manage transactions" ON payment_transactions
  FOR ALL WITH CHECK (true);

-- RLS Policies for credit_transactions (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage credit transactions" ON credit_transactions;
CREATE POLICY "System can manage credit transactions" ON credit_transactions
  FOR ALL WITH CHECK (true);

-- RLS Policies for invoices (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage invoices" ON invoices;
CREATE POLICY "System can manage invoices" ON invoices
  FOR ALL WITH CHECK (true);

-- Function to automatically update updated_at timestamp
-- Note: This function may be used by other tables, so we use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at timestamps (DROP first if exists)
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance (already using IF NOT EXISTS)
-- All CREATE INDEX statements already use IF NOT EXISTS, no changes needed

-- Insert new credit-based subscription plans (USD pricing) - only if they don't exist

-- Free Trial Plan
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Free Trial', 'Perfect for testing the platform', 0, 'USD', 'month',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": false, "customBranding": false, "analytics": false, "apiAccess": false, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 20, "creditRolloverDays": 0, "overageRateCents": 0, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 1000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     false, 0, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    popular = EXCLUDED.popular,
    trial_days = EXCLUDED.trial_days,
    active = EXCLUDED.active,
    updated_at = NOW();

-- Starter Plan (Monthly)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Starter', 'Perfect for freelancers, hobbyists, small projects', 1900, 'USD', 'month',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": false, "customBranding": false, "analytics": false, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 500, "creditRolloverDays": 0, "overageRateCents": 450, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 5000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     false, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Starter Plan (Yearly) - Save 2 months ($38 savings)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Starter', 'Perfect for freelancers, hobbyists, small projects', 19000, 'USD', 'year',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": false, "customBranding": false, "analytics": false, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 500, "creditRolloverDays": 0, "overageRateCents": 450, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 5000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     false, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Pro Plan (Monthly - Most Popular)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Pro', 'For content creators, small agencies, growing businesses', 7900, 'USD', 'month',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": true, "customBranding": false, "analytics": true, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 2500, "creditRolloverDays": 90, "overageRateCents": 400, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 25000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     true, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Pro Plan (Yearly) - Save 2 months ($158 savings)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Pro', 'For content creators, small agencies, growing businesses', 79000, 'USD', 'year',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": true, "customBranding": false, "analytics": true, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 2500, "creditRolloverDays": 90, "overageRateCents": 400, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 25000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     true, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Business Plan (Monthly)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Business', 'For agencies, enterprises, high-volume users', 29900, 'USD', 'month',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": true, "customBranding": true, "analytics": true, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 12000, "creditRolloverDays": 180, "overageRateCents": 350, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 100000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     false, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Business Plan (Yearly) - Save 2 months ($598 savings)
INSERT INTO subscription_plans (id, name, description, price_cents, currency, interval, features, limits, popular, trial_days, active)
VALUES
   ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Business', 'For agencies, enterprises, high-volume users', 299000, 'USD', 'year',
     '{"videoGeneration": true, "logoDesign": true, "adCreation": true, "flyerDesign": true, "blogResearch": true, "scriptGeneration": true, "imageEditing": true, "socialMediaPosts": true, "titleGeneration": true, "batchProcessing": true, "prioritySupport": true, "customBranding": true, "analytics": true, "apiAccess": true, "whiteLabel": false, "scraping": true}',
     '{"monthlyCredits": 12000, "creditRolloverDays": 180, "overageRateCents": 350, "videosPerMonth": -1, "logosPerMonth": -1, "adsPerMonth": -1, "flyersPerMonth": -1, "blogPostsPerMonth": -1, "scriptsPerMonth": -1, "imageEditsPerMonth": -1, "socialPostsPerMonth": -1, "youtubeResearchPerMonth": -1, "titleGenPerMonth": -1, "scrapingPerMonth": -1, "storageLimit": 100000, "maxVideoDuration": 300, "maxImageResolution": "4K", "exportQuality": "premium"}',
     false, 0, true)
ON CONFLICT (id) DO UPDATE SET
   name = EXCLUDED.name,
   description = EXCLUDED.description,
   price_cents = EXCLUDED.price_cents,
   currency = EXCLUDED.currency,
   features = EXCLUDED.features,
   limits = EXCLUDED.limits,
   popular = EXCLUDED.popular,
   trial_days = EXCLUDED.trial_days,
   active = EXCLUDED.active,
   updated_at = NOW();

-- Function to calculate VAT (supports both USD and NGN)
DROP FUNCTION IF EXISTS calculate_vat(amount_cents INTEGER, currency TEXT);
CREATE OR REPLACE FUNCTION calculate_vat(amount_cents INTEGER, currency TEXT DEFAULT 'USD')
RETURNS INTEGER AS $$
BEGIN
    -- No VAT for USD, 7.5% for NGN
    IF currency = 'NGN' THEN
        RETURN ROUND((amount_cents * 7.5) / 100);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
DROP FUNCTION IF EXISTS generate_invoice_number();
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
   current_year INTEGER;
   invoice_count INTEGER;
   invoice_number TEXT;
BEGIN
   current_year := EXTRACT(YEAR FROM NOW());

   SELECT COUNT(*) INTO invoice_count
   FROM invoices
   WHERE EXTRACT(YEAR FROM created_at) = current_year;

   invoice_number := 'INV-' || current_year || '-' || LPAD((invoice_count + 1)::TEXT, 4, '0');

   RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create free subscription for new users
-- Note: This function may be used by other triggers, so we use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a free subscription for new users
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      payment_provider,
      amount_cents,
      currency,
      status,
      current_period_start,
      current_period_end,
      customer_name,
      customer_phone,
      created_at,
      updated_at
    )
    SELECT
      NEW.id,
      sp.id,
      'flutterwave',
      0,
      'USD',
      'active',
      NOW(),
      NOW() + INTERVAL '1 year', -- Free users get 1 year
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NOW(),
      NOW()
    FROM subscription_plans sp
    WHERE sp.price_cents = 0 AND sp.active = true
    LIMIT 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create free subscription for existing users who don't have one
CREATE OR REPLACE FUNCTION public.create_free_subscription_for_existing_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    free_plan_id UUID;
    subscription_created BOOLEAN := FALSE;
BEGIN
    -- Get the free plan ID
    SELECT id INTO free_plan_id
    FROM subscription_plans
    WHERE price_cents = 0 AND active = true
    LIMIT 1;

    -- Check if user already has a subscription
    IF NOT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = target_user_id
    ) THEN
        -- Create free subscription
        INSERT INTO user_subscriptions (
            user_id,
            plan_id,
            payment_provider,
            amount_cents,
            currency,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
        )
        SELECT
            target_user_id,
            free_plan_id,
            'flutterwave',
            0,
            'USD',
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            NOW(),
            NOW();

        subscription_created := TRUE;
    END IF;

    RETURN subscription_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create subscription for new users (DROP first if exists)
DROP TRIGGER IF EXISTS on_auth_user_subscription_created ON auth.users;
CREATE TRIGGER on_auth_user_subscription_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Function to allocate monthly credits to active subscriptions
CREATE OR REPLACE FUNCTION allocate_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
  subscription_record RECORD;
  credits_allocated INTEGER := 0;
BEGIN
  -- Loop through all active subscriptions that need monthly credit allocation
  FOR subscription_record IN
    SELECT id, user_id, monthly_credits, credit_balance
    FROM user_subscriptions
    WHERE status = 'active'
    AND monthly_credits > 0
    AND (
      -- Allocate credits on the first day of the month or when subscription starts
      DATE_TRUNC('month', current_period_start) = DATE_TRUNC('month', NOW())
      OR DATE_TRUNC('month', NOW()) > DATE_TRUNC('month', current_period_start)
    )
    AND NOT EXISTS (
      -- Check if credits were already allocated this month
      SELECT 1 FROM credit_transactions ct
      WHERE ct.subscription_id = user_subscriptions.id
      AND ct.transaction_type = 'monthly_allocation'
      AND DATE_TRUNC('month', ct.created_at) = DATE_TRUNC('month', NOW())
    )
  LOOP
    -- Insert credit transaction for monthly allocation
    INSERT INTO credit_transactions (
      user_id,
      subscription_id,
      transaction_type,
      credits_before,
      credits_after,
      credits_changed,
      description
    ) VALUES (
      subscription_record.user_id,
      subscription_record.id,
      'monthly_allocation',
      subscription_record.credit_balance,
      subscription_record.credit_balance + subscription_record.monthly_credits,
      subscription_record.monthly_credits,
      'Monthly credit allocation'
    );

    -- Update subscription credit balance
    UPDATE user_subscriptions
    SET credit_balance = credit_balance + monthly_credits,
        updated_at = NOW()
    WHERE id = subscription_record.id;

    credits_allocated := credits_allocated + subscription_record.monthly_credits;
  END LOOP;

  RETURN credits_allocated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits for feature usage
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_feature_type TEXT,
  p_credits_needed INTEGER,
  p_feature_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
  new_balance INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if user has enough credits
  IF subscription_record.credit_balance < p_credits_needed THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  new_balance := subscription_record.credit_balance - p_credits_needed;

  -- Insert credit transaction for usage
  INSERT INTO credit_transactions (
    user_id,
    subscription_id,
    transaction_type,
    credits_before,
    credits_after,
    credits_changed,
    feature_type,
    feature_count,
    description
  ) VALUES (
    p_user_id,
    subscription_record.id,
    'usage',
    subscription_record.credit_balance,
    new_balance,
    -p_credits_needed,
    p_feature_type,
    p_feature_count,
    'Feature usage: ' || p_feature_type
  );

  -- Update subscription credit balance
  UPDATE user_subscriptions
  SET credit_balance = new_balance,
      updated_at = NOW()
  WHERE id = subscription_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle overage credit purchase
CREATE OR REPLACE FUNCTION purchase_overage_credits(
  p_user_id UUID,
  p_credits_to_purchase INTEGER,
  p_payment_provider TEXT,
  p_provider_reference TEXT,
  p_amount_cents INTEGER,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
  new_balance INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  new_balance := subscription_record.credit_balance + p_credits_to_purchase;

  -- Insert credit transaction for overage purchase
  INSERT INTO credit_transactions (
    user_id,
    subscription_id,
    transaction_type,
    credits_before,
    credits_after,
    credits_changed,
    amount_cents,
    currency,
    payment_provider,
    provider_reference,
    description
  ) VALUES (
    p_user_id,
    subscription_record.id,
    'overage_purchase',
    subscription_record.credit_balance,
    new_balance,
    p_credits_to_purchase,
    p_amount_cents,
    p_currency,
    p_payment_provider,
    p_provider_reference,
    'Overage credit purchase: ' || p_credits_to_purchase || ' credits'
  );

  -- Update subscription credit balance
  UPDATE user_subscriptions
  SET credit_balance = new_balance,
      updated_at = NOW()
  WHERE id = subscription_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get credit balance for user
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT credit_balance INTO balance
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get credit cost for a feature
CREATE OR REPLACE FUNCTION get_feature_credit_cost(p_feature_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE p_feature_type
    WHEN 'background_removal' THEN RETURN 1;
    WHEN 'nano_banana' THEN RETURN 2;
    WHEN 'nano_banana_pro_1k' THEN RETURN 6;
    WHEN 'nano_banana_pro_4k' THEN RETURN 8;
    WHEN 'veo3_fast' THEN RETURN 20;
    WHEN 'veo3_quality' THEN RETURN 80;
    WHEN 'infinit_talk_480p' THEN RETURN 15;
    WHEN 'infinit_talk_720p' THEN RETURN 41;
    WHEN 'youtube_scraper' THEN RETURN 1;
    WHEN 'google_maps_scraper' THEN RETURN 1;
    WHEN 'ai_search' THEN RETURN 1;
    WHEN 'gpt_5_1' THEN RETURN 5;
    WHEN 'gpt_5_mini' THEN RETURN 1;
    WHEN 'gpt_5_nano' THEN RETURN 0;
    ELSE RETURN 1; -- Default to 1 credit
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments for setup instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Set up Flutterwave and Paystack webhooks
-- 3. Configure environment variables for payment providers
-- 4. Set up webhook endpoints for payment verification
-- 5. Test payment flows with both providers
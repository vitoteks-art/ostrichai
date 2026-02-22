-- FIX_POLAR_INTEGRATION.sql
-- Run this ENTIRE script in your Supabase SQL Editor

-- 1. FIX THE CHECK CONSTRAINT
-- This allows 'polar' to be stored in the payment_transactions table
ALTER TABLE payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_payment_provider_check;

ALTER TABLE payment_transactions
ADD CONSTRAINT payment_transactions_payment_provider_check
CHECK (payment_provider IN ('flutterwave', 'paystack', 'admin', 'polar'));

-- 2. ENSURE THE COLUMN EXISTS
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS polar_product_price_id TEXT;

-- 3. MAP THE PLAN IDs (Using the IDs you provided)
-- Starter Monthly
UPDATE subscription_plans
SET polar_product_price_id = 'd9a4beec-4fd3-438f-9bdc-9e41224e9593'
WHERE name = 'Starter' AND interval = 'month';

-- Pro Monthly
UPDATE subscription_plans
SET polar_product_price_id = 'b3441192-9f20-4d44-95d6-40469eefed04'
WHERE name = 'Pro' AND interval = 'month';

-- 4. VERIFY RESULTS
SELECT name, interval, polar_product_price_id FROM subscription_plans;

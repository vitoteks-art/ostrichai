-- update_polar_ids.sql

-- 1. Ensure the column exists (safe to run again)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS polar_product_price_id TEXT;

-- 2. Update Starter Plan (Monthly)
-- Check if the plan ID matches your starter plan UUID. 
-- Based on schema, Starter Monthly is '550e8400-e29b-41d4-a716-446655440001'
UPDATE subscription_plans
SET polar_product_price_id = 'd9a4beec-4fd3-438f-9bdc-9e41224e9593'
WHERE name = 'Starter' AND interval = 'month';

-- 3. Update Pro Plan (Monthly)
-- Based on schema, Pro Monthly is '550e8400-e29b-41d4-a716-446655440002'
UPDATE subscription_plans
SET polar_product_price_id = 'b3441192-9f20-4d44-95d6-40469eefed04'
WHERE name = 'Pro' AND interval = 'month';

-- 4. (Optional) Check the results
SELECT name, interval, polar_product_price_id FROM subscription_plans;

-- Add polar_product_price_id column to subscription_plans
-- This allows us to map our internal Plan IDs to Polar's Price IDs

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS polar_product_price_id TEXT;

-- Update existing plans with placeholders or actual IDs if known
-- Ideally, the USER should update these via the Admin Dashboard or SQL
-- For now, we just add the column so the code can reference it.

-- Optional: Add a check constraint to ensure it's not empty if we want to enforce it later
-- ALTER TABLE subscription_plans ADD CONSTRAINT check_polar_id_present CHECK (polar_product_price_id IS NOT NULL);

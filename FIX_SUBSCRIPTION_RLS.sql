-- ========================================
-- FIX SUBSCRIPTION RLS POLICY ERRORS
-- ========================================
-- This fixes the 42501 error: "new row violates row-level security policy for table 'user_subscriptions'"
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: Drop all existing RLS policies on subscription tables
-- ========================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🔄 Dropping existing policies on subscription tables...';
    
    FOR policy_record IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
            tablename = 'user_subscriptions' 
            OR tablename = 'subscription_plans'
            OR tablename = 'user_usage'
            OR tablename = 'payment_transactions'
            OR tablename = 'invoices'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        RAISE NOTICE '  ✅ Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    RAISE NOTICE '✅ All existing policies dropped';
END $$;

-- ========================================
-- STEP 2: Ensure RLS is enabled on all tables
-- ========================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: Create PERMISSIVE policies for subscription_plans
-- ========================================
-- Allow anyone to view active plans
CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans
FOR SELECT
USING (active = TRUE);

-- ========================================
-- STEP 4: Create PERMISSIVE policies for user_subscriptions
-- ========================================
-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
ON user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
ON user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow service role to do everything (for backend operations)
CREATE POLICY "Service role can manage all subscriptions"
ON user_subscriptions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- STEP 5: Create PERMISSIVE policies for user_usage
-- ========================================
-- Allow users to view their own usage
CREATE POLICY "Users can view their own usage"
ON user_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own usage records
CREATE POLICY "Users can track their own usage"
ON user_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can manage all usage"
ON user_usage
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- STEP 6: Create PERMISSIVE policies for payment_transactions
-- ========================================
-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own transactions
CREATE POLICY "Users can create their own transactions"
ON payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can manage all transactions"
ON payment_transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- STEP 7: Create PERMISSIVE policies for invoices
-- ========================================
-- Allow users to view their own invoices
CREATE POLICY "Users can view their own invoices"
ON invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own invoices
CREATE POLICY "Users can create their own invoices"
ON invoices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role can manage all invoices"
ON invoices
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- STEP 8: Grant necessary permissions
-- ========================================
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT ON subscription_plans TO authenticated;

GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON user_usage TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON invoices TO authenticated;

GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON user_usage TO service_role;
GRANT ALL ON payment_transactions TO service_role;
GRANT ALL ON invoices TO service_role;

-- ========================================
-- STEP 9: Verification
-- ========================================
DO $$
DECLARE
    plans_policies INTEGER;
    subscriptions_policies INTEGER;
    usage_policies INTEGER;
    transactions_policies INTEGER;
    invoices_policies INTEGER;
    plans_rls BOOLEAN;
    subscriptions_rls BOOLEAN;
    usage_rls BOOLEAN;
    transactions_rls BOOLEAN;
    invoices_rls BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO plans_policies FROM pg_policies WHERE tablename = 'subscription_plans';
    SELECT COUNT(*) INTO subscriptions_policies FROM pg_policies WHERE tablename = 'user_subscriptions';
    SELECT COUNT(*) INTO usage_policies FROM pg_policies WHERE tablename = 'user_usage';
    SELECT COUNT(*) INTO transactions_policies FROM pg_policies WHERE tablename = 'payment_transactions';
    SELECT COUNT(*) INTO invoices_policies FROM pg_policies WHERE tablename = 'invoices';
    
    -- Check RLS status
    SELECT relrowsecurity INTO plans_rls FROM pg_class WHERE relname = 'subscription_plans';
    SELECT relrowsecurity INTO subscriptions_rls FROM pg_class WHERE relname = 'user_subscriptions';
    SELECT relrowsecurity INTO usage_rls FROM pg_class WHERE relname = 'user_usage';
    SELECT relrowsecurity INTO transactions_rls FROM pg_class WHERE relname = 'payment_transactions';
    SELECT relrowsecurity INTO invoices_rls FROM pg_class WHERE relname = 'invoices';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUBSCRIPTION RLS FIX VERIFICATION:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'subscription_plans: % policies, RLS: %', plans_policies, plans_rls;
    RAISE NOTICE 'user_subscriptions: % policies, RLS: %', subscriptions_policies, subscriptions_rls;
    RAISE NOTICE 'user_usage: % policies, RLS: %', usage_policies, usage_rls;
    RAISE NOTICE 'payment_transactions: % policies, RLS: %', transactions_policies, transactions_rls;
    RAISE NOTICE 'invoices: % policies, RLS: %', invoices_policies, invoices_rls;
    RAISE NOTICE '========================================';
    
    IF subscriptions_policies >= 4 AND usage_policies >= 3 AND transactions_policies >= 3 THEN
        RAISE NOTICE '✅✅✅ SUCCESS! RLS policies are properly configured ✅✅✅';
        RAISE NOTICE '';
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. Test creating a subscription in your application';
        RAISE NOTICE '2. If you still get 403 errors, check your Supabase project URL and anon key';
        RAISE NOTICE '3. Make sure you are authenticated when making the request';
    ELSE
        RAISE WARNING '⚠️  Some policies may be missing:';
        IF subscriptions_policies < 4 THEN 
            RAISE WARNING '  - user_subscriptions has only % policies (expected at least 4)', subscriptions_policies; 
        END IF;
        IF usage_policies < 3 THEN 
            RAISE WARNING '  - user_usage has only % policies (expected at least 3)', usage_policies; 
        END IF;
        IF transactions_policies < 3 THEN 
            RAISE WARNING '  - payment_transactions has only % policies (expected at least 3)', transactions_policies; 
        END IF;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- STEP 10: Show current policies (for debugging)
-- ========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('subscription_plans', 'user_subscriptions', 'user_usage', 'payment_transactions', 'invoices')
ORDER BY tablename, policyname;
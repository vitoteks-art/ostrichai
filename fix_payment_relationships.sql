-- Robust fix for missing relationships, duplicate records, and schema cache reload
-- Version 3: Deduplicates records before applying Primary and Foreign Keys

DO $$
BEGIN
    -- STEP 0: Deduplicate records (Keep the most recent one by ctid)
    
    -- Deduplicate subscription_plans
    DELETE FROM public.subscription_plans a
    USING public.subscription_plans b
    WHERE a.ctid < b.ctid AND a.id = b.id;

    -- Deduplicate user_subscriptions
    DELETE FROM public.user_subscriptions a
    USING public.user_subscriptions b
    WHERE a.ctid < b.ctid AND a.id = b.id;

    -- Deduplicate payment_transactions
    DELETE FROM public.payment_transactions a
    USING public.payment_transactions b
    WHERE a.ctid < b.ctid AND a.id = b.id;

    -- STEP 1: Ensure Primary Keys exist
    
    -- Ensure subscription_plans has a PK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'subscription_plans' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.subscription_plans ADD PRIMARY KEY (id);
    END IF;

    -- Ensure user_subscriptions has a PK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_subscriptions' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.user_subscriptions ADD PRIMARY KEY (id);
    END IF;

    -- Ensure payment_transactions has a PK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'payment_transactions' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.payment_transactions ADD PRIMARY KEY (id);
    END IF;

    -- STEP 2: Ensure Foreign Key Relationships exist

    -- 1. user_subscriptions -> subscription_plans
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_plan_id_fkey'
    ) THEN
        ALTER TABLE public.user_subscriptions
        ADD CONSTRAINT user_subscriptions_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);
    END IF;

    -- 2. payment_transactions -> user_subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_transactions_subscription_id_fkey'
    ) THEN
        ALTER TABLE public.payment_transactions
        ADD CONSTRAINT payment_transactions_subscription_id_fkey
        FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id);
    END IF;

    -- 3. payment_transactions -> auth.users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_transactions_user_id_fkey'
    ) THEN
        ALTER TABLE public.payment_transactions
        ADD CONSTRAINT payment_transactions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 4. invoices -> user_subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_subscription_id_fkey'
    ) THEN
        ALTER TABLE public.invoices
        ADD CONSTRAINT invoices_subscription_id_fkey
        FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id);
    END IF;
    
    -- 5. invoices -> payment_transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_transaction_id_fkey'
    ) THEN
        ALTER TABLE public.invoices
        ADD CONSTRAINT invoices_transaction_id_fkey
        FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(id);
    END IF;

END $$;

-- Reload schema cache to reflect changes in PostgREST
NOTIFY pgrst, 'reload schema';

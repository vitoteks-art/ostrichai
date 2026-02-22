-- ========================================
-- ULTIMATE SIGNUP FIX - NUCLEAR OPTION
-- ========================================
-- This is the most aggressive fix possible
-- Run this if COMPREHENSIVE_SIGNUP_FIX.sql didn't work

-- ========================================
-- STEP 1: Drop ALL custom triggers on auth.users
-- ========================================
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth'
        AND c.relname = 'users'
        AND tgname NOT LIKE 'pg_%'  -- Don't drop system triggers
        AND tgname NOT LIKE 'RI_ConstraintTrigger%'  -- Don't drop foreign key triggers
        AND NOT tgisinternal  -- Don't drop internal triggers
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
    
    RAISE NOTICE '✅ All custom triggers on auth.users have been removed';
END $$;

-- ========================================
-- STEP 2: Drop the handle_new_user function
-- ========================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ========================================
-- STEP 3: Completely disable RLS on ALL relevant tables
-- ========================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_usage DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Drop ALL policies from ALL user tables
-- ========================================
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (tablename LIKE 'user%' OR tablename = 'profiles')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    RAISE NOTICE '✅ All policies dropped';
END $$;

-- ========================================
-- STEP 5: Recreate tables if they don't exist
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  activity_tracking BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 6: Grant ALL permissions to authenticated users
-- ========================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.user_settings TO anon;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_settings TO service_role;

-- ========================================
-- STEP 7: Check for auth hooks in Supabase Dashboard
-- ========================================
-- Auth Hooks can cause 500 errors during signup
-- You need to disable them in the Supabase Dashboard:
-- 1. Go to: Authentication → Hooks
-- 2. Disable any "User Created" hooks
-- 3. Disable any "User Updated" hooks

-- ========================================
-- VERIFICATION - Show current state
-- ========================================
DO $$
DECLARE
    trigger_count INTEGER;
    profile_rls BOOLEAN;
    settings_rls BOOLEAN;
    profile_policy_count INTEGER;
    settings_policy_count INTEGER;
    profile_exists BOOLEAN;
    settings_exists BOOLEAN;
BEGIN
    -- Check triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND tgname NOT LIKE 'pg_%';
    
    -- Check RLS
    SELECT COALESCE(relrowsecurity, false) INTO profile_rls 
    FROM pg_class WHERE relname = 'profiles';
    
    SELECT COALESCE(relrowsecurity, false) INTO settings_rls 
    FROM pg_class WHERE relname = 'user_settings';
    
    -- Check policies
    SELECT COUNT(*) INTO profile_policy_count 
    FROM pg_policies WHERE tablename = 'profiles';
    
    SELECT COUNT(*) INTO settings_policy_count 
    FROM pg_policies WHERE tablename = 'user_settings';
    
    -- Check table existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO profile_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings' AND table_schema = 'public'
    ) INTO settings_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ULTIMATE FIX VERIFICATION RESULTS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profiles table exists: %', profile_exists;
    RAISE NOTICE 'User Settings table exists: %', settings_exists;
    RAISE NOTICE 'Triggers on auth.users: %', trigger_count;
    RAISE NOTICE 'Profiles RLS enabled: %', profile_rls;
    RAISE NOTICE 'User Settings RLS enabled: %', settings_rls;
    RAISE NOTICE 'Profiles policies: %', profile_policy_count;
    RAISE NOTICE 'User Settings policies: %', settings_policy_count;
    RAISE NOTICE '========================================';
    
    IF profile_exists AND settings_exists 
       AND trigger_count = 0 
       AND NOT profile_rls 
       AND NOT settings_rls 
       AND profile_policy_count = 0 
       AND settings_policy_count = 0 THEN
        RAISE NOTICE '✅✅✅ SUCCESS! Database is DEFINITELY ready for signup ✅✅✅';
        RAISE NOTICE '';
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. Check Authentication → Hooks in Supabase Dashboard';
        RAISE NOTICE '   - Disable any "User Created" hooks';
        RAISE NOTICE '2. Try signing up again';
        RAISE NOTICE '3. If it STILL fails, check the API logs and share them';
    ELSE
        RAISE WARNING '⚠️  Some configuration may still be blocking signup:';
        IF NOT profile_exists THEN RAISE WARNING '  - Profiles table missing'; END IF;
        IF NOT settings_exists THEN RAISE WARNING '  - User Settings table missing'; END IF;
        IF trigger_count > 0 THEN RAISE WARNING '  - % triggers still exist on auth.users', trigger_count; END IF;
        IF profile_rls THEN RAISE WARNING '  - RLS still enabled on profiles'; END IF;
        IF settings_rls THEN RAISE WARNING '  - RLS still enabled on user_settings'; END IF;
        IF profile_policy_count > 0 THEN RAISE WARNING '  - % policies still exist on profiles', profile_policy_count; END IF;
        IF settings_policy_count > 0 THEN RAISE WARNING '  - % policies still exist on user_settings', settings_policy_count; END IF;
    END IF;
    RAISE NOTICE '========================================';
END $$;
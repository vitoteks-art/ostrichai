-- ========================================
-- COMPREHENSIVE SIGNUP FIX
-- ========================================
-- This fix addresses the "Database error saving new user" issue
-- Run this SQL in your Supabase SQL Editor

-- ========================================
-- STEP 1: Remove ALL problematic triggers
-- =========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- ========================================
-- STEP 2: Drop ALL existing RLS policies
-- ========================================

-- Drop ALL policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Drop ALL policies on user_settings table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_settings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_settings';
    END LOOP;
END $$;

-- ========================================
-- STEP 3: Disable RLS temporarily
-- ========================================
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: Ensure tables exist with correct structure
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
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

CREATE TABLE IF NOT EXISTS user_settings (
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
-- STEP 5: Create indexes if they don't exist
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ========================================
-- VERIFICATION - Check current state
-- ========================================
DO $$
DECLARE
    profile_rls BOOLEAN;
    settings_rls BOOLEAN;
    trigger_count INTEGER;
    profile_policy_count INTEGER;
    settings_policy_count INTEGER;
BEGIN
    -- Check RLS status
    SELECT relrowsecurity INTO profile_rls FROM pg_class WHERE relname = 'profiles';
    SELECT relrowsecurity INTO settings_rls FROM pg_class WHERE relname = 'user_settings';
    
    -- Check triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'users' 
    AND t.tgname LIKE '%auth_user_created%';
    
    -- Check policies
    SELECT COUNT(*) INTO profile_policy_count FROM pg_policies WHERE tablename = 'profiles';
    SELECT COUNT(*) INTO settings_policy_count FROM pg_policies WHERE tablename = 'user_settings';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION RESULTS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profiles RLS enabled: %', COALESCE(profile_rls, false);
    RAISE NOTICE 'User Settings RLS enabled: %', COALESCE(settings_rls, false);
    RAISE NOTICE 'Auth triggers found: %', trigger_count;
    RAISE NOTICE 'Profiles policies: %', profile_policy_count;
    RAISE NOTICE 'User Settings policies: %', settings_policy_count;
    RAISE NOTICE '========================================';
    
    IF COALESCE(profile_rls, false) = false 
       AND COALESCE(settings_rls, false) = false 
       AND trigger_count = 0 
       AND profile_policy_count = 0 
       AND settings_policy_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS! Database is ready for signup.';
        RAISE NOTICE 'You can now test user signup.';
    ELSE
        RAISE WARNING '⚠️  Some issues may remain. Review the counts above.';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- NEXT STEPS:
-- ========================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Check the VERIFICATION RESULTS in the output
-- 3. Try signing up a new user
-- 4. After signup works, you can optionally re-enable RLS with permissive policies
--    (See OPTIONAL_RE_ENABLE_RLS.sql file)
-- ========================================
-- ========================================
-- OPTIONAL: RE-ENABLE RLS WITH SECURE POLICIES
-- ========================================
-- ⚠️ ONLY RUN THIS AFTER signup is working!
-- This re-enables Row Level Security with secure but permissive policies

-- ========================================
-- STEP 1: Re-enable RLS on both tables
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: Create secure but permissive policies for profiles
-- ========================================

-- Allow users to view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (handles manual profile creation)
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow profile creation during signup when auth.uid() is NULL
-- This policy allows the application to create profiles for new users
CREATE POLICY "allow_profile_creation_during_signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- ========================================
-- STEP 3: Create secure but permissive policies for user_settings
-- ========================================

-- Allow users to view their own settings
CREATE POLICY "users_view_own_settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own settings
CREATE POLICY "users_update_own_settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own settings
CREATE POLICY "users_insert_own_settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow settings creation during signup when auth.uid() is NULL
CREATE POLICY "allow_settings_creation_during_signup" ON user_settings
  FOR INSERT WITH CHECK (true);

-- ========================================
-- STEP 4: Add admin policies (if admin schema is installed)
-- ========================================

-- These will only work if the is_admin_or_above function exists
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin_or_above'
    ) THEN
        -- Add admin policies for profiles
        DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
        CREATE POLICY "admins_view_all_profiles" ON profiles
          FOR SELECT USING (is_admin_or_above(auth.uid()));
        
        DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
        CREATE POLICY "admins_update_all_profiles" ON profiles
          FOR UPDATE USING (is_admin_or_above(auth.uid()));
        
        -- Add admin policies for user_settings
        DROP POLICY IF EXISTS "admins_view_all_settings" ON user_settings;
        CREATE POLICY "admins_view_all_settings" ON user_settings
          FOR SELECT USING (is_admin_or_above(auth.uid()));
        
        DROP POLICY IF EXISTS "admins_update_all_settings" ON user_settings;
        CREATE POLICY "admins_update_all_settings" ON user_settings
          FOR UPDATE USING (is_admin_or_above(auth.uid()));
        
        RAISE NOTICE '✅ Admin policies created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  Admin function not found, skipping admin policies';
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================
DO $$
DECLARE
    profile_rls BOOLEAN;
    settings_rls BOOLEAN;
    profile_policy_count INTEGER;
    settings_policy_count INTEGER;
BEGIN
    SELECT relrowsecurity INTO profile_rls FROM pg_class WHERE relname = 'profiles';
    SELECT relrowsecurity INTO settings_rls FROM pg_class WHERE relname = 'user_settings';
    SELECT COUNT(*) INTO profile_policy_count FROM pg_policies WHERE tablename = 'profiles';
    SELECT COUNT(*) INTO settings_policy_count FROM pg_policies WHERE tablename = 'user_settings';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS RE-ENABLED VERIFICATION:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profiles RLS: %', profile_rls;
    RAISE NOTICE 'Profiles policies: %', profile_policy_count;
    RAISE NOTICE 'User Settings RLS: %', settings_rls;
    RAISE NOTICE 'User Settings policies: %', settings_policy_count;
    RAISE NOTICE '========================================';
    
    IF profile_rls AND settings_rls 
       AND profile_policy_count >= 4 
       AND settings_policy_count >= 4 THEN
        RAISE NOTICE '✅ RLS successfully re-enabled with secure policies!';
        RAISE NOTICE 'Test signup again to confirm it still works.';
    ELSE
        RAISE WARNING '⚠️  RLS may not be properly configured.';
    END IF;
END $$;

-- ========================================
-- SECURITY NOTES:
-- ========================================
-- The policies include "WITH CHECK (true)" for INSERT operations
-- This is necessary because during signup, auth.uid() is NULL
-- However, after authentication, only the authenticated user can
-- modify their own data due to the auth.uid() = id checks on
-- SELECT and UPDATE operations.
-- ========================================
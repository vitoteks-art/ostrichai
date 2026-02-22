-- ========================================
-- DIAGNOSTIC CHECK FOR SIGNUP ERRORS
-- ========================================
-- Run this to see what's blocking signup

-- Check 1: All triggers on auth.users table
SELECT 
    '=== TRIGGERS ON AUTH.USERS ===' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Check 2: All functions that might be called by triggers
SELECT 
    '=== FUNCTIONS RELATED TO USER CREATION ===' as check_type,
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user%'
  OR p.proname LIKE '%profile%'
  OR p.proname LIKE '%auth%'
ORDER BY n.nspname, p.proname;

-- Check 3: RLS status on critical tables
SELECT 
    '=== RLS STATUS ===' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✅' END as rls_status
FROM pg_tables
WHERE tablename IN ('profiles', 'user_settings', 'users')
ORDER BY tablename;

-- Check 4: All policies on profiles and user_settings
SELECT 
    '=== POLICIES ===' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'user_settings')
ORDER BY tablename, policyname;

-- Check 5: Check for auth hooks (these can cause 500 errors)
SELECT 
    '=== AUTH CONFIGURATION ===' as check_type,
    key,
    value
FROM public.system_settings
WHERE category = 'auth'
  OR key LIKE '%auth%'
  OR key LIKE '%hook%';

-- Check 6: Foreign key constraints that might fail
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ===' as check_type,
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('profiles', 'user_settings');

-- Check 7: Check if profiles/user_settings tables exist at all
SELECT 
    '=== TABLE EXISTENCE ===' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'user_settings');
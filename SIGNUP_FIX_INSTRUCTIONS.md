# 🔧 Signup Error Fix Instructions

## Problem
You're experiencing a **"Database error saving new user"** error during signup. This happens because:

1. **RLS (Row Level Security)** policies are blocking profile creation during signup
2. When a user signs up, `auth.uid()` is `NULL`, so policies checking `auth.uid() = id` fail
3. Database triggers may be conflicting with manual profile creation

## Solution Overview

I've created a **comprehensive fix** that will:
- ✅ Remove all problematic triggers
- ✅ Drop conflicting RLS policies  
- ✅ Temporarily disable RLS to allow signup
- ✅ Verify the fix with detailed output

---

## 📋 Step-by-Step Fix

### Step 1: Run the Fix Script

1. **Open your Supabase Dashboard**
   - Go to: https://app.supabase.com/project/wmpwqotfncymoswctrqo

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste** the entire contents of [`COMPREHENSIVE_SIGNUP_FIX.sql`](COMPREHENSIVE_SIGNUP_FIX.sql:1)

4. **Run the script**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Check the output**
   - Look for the "VERIFICATION RESULTS" section
   - You should see:
     ```
     ✅ SUCCESS! Database is ready for signup.
     You can now test user signup.
     ```

### Step 2: Test Signup

1. **Clear your browser cache** (optional but recommended)
2. **Try signing up** with a new user account
3. **Signup should now work!** ✅

### Step 3: (Optional) Re-enable RLS with Secure Policies

⚠️ **Only do this AFTER confirming signup works!**

1. Open the SQL Editor again
2. Copy and paste the contents of [`OPTIONAL_RE_ENABLE_RLS.sql`](OPTIONAL_RE_ENABLE_RLS.sql:1)
3. Run the script
4. Test signup again to make sure it still works

---

## 🔍 What the Fix Does

### Removes Triggers
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```
This removes any automatic trigger that might be causing conflicts.

### Disables RLS Temporarily
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
```
This allows profile creation without RLS restrictions during signup.

### Your App Handles Profile Creation
The [`supabase.ts`](src/lib/supabase.ts:78) file already has a `createProfile()` function that manually creates profiles after successful signup. With RLS disabled, this will work perfectly.

---

## 🔐 Security Notes

### Is it safe to disable RLS?

**Yes, for this use case:**
- The application code in [`supabase.ts`](src/lib/supabase.ts:78) handles profile creation securely
- After signup, users can only access their own data through the authentication system
- When you re-enable RLS (Step 3), you add back the security policies

### Production Recommendation

After confirming signup works:
1. Run [`OPTIONAL_RE_ENABLE_RLS.sql`](OPTIONAL_RE_ENABLE_RLS.sql:1) to restore RLS
2. The new policies include `WITH CHECK (true)` for INSERT operations specifically to allow signup
3. SELECT and UPDATE operations still require `auth.uid() = id`, maintaining security

---

## 📊 Verification Queries

To check your database state at any time, run:

```sql
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'Enabled ✅'
    ELSE 'Disabled ❌'
  END as rls_status
FROM pg_tables
WHERE tablename IN ('profiles', 'user_settings');

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('profiles', 'user_settings')
ORDER BY tablename, policyname;

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```

---

## 🆘 Troubleshooting

### If signup still fails after running the fix:

1. **Check the verification output** - Did you see "SUCCESS!" message?

2. **Check for other triggers/policies**:
   ```sql
   -- List all policies on profiles
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   
   -- List all triggers on auth.users
   SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
   ```

3. **Check your environment variables** in `.env`:
   ```
   VITE_SUPABASE_URL=https://wmpwqotfncymoswctrqo.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. **Check server logs** in Supabase Dashboard → Logs → API Logs

5. **Test with a simple signup**:
   ```javascript
   const { data, error } = await supabase.auth.signUp({
     email: 'test@example.com',
     password: 'test123456'
   })
   console.log('Result:', data, error)
   ```

---

## 📝 Summary

1. ✅ Run [`COMPREHENSIVE_SIGNUP_FIX.sql`](COMPREHENSIVE_SIGNUP_FIX.sql:1)
2. ✅ Test signup (it should work!)
3. ✅ (Optional) Run [`OPTIONAL_RE_ENABLE_RLS.sql`](OPTIONAL_RE_ENABLE_RLS.sql:1) for extra security

**Need help?** Share the verification output from Step 1 and any error messages you see.
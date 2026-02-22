# Subscription RLS Error Fix

## Problem
You're getting this error:
```
Error code: 42501
Error: new row violates row-level security policy for table "user_subscriptions"
```

## Root Cause
The Row-Level Security (RLS) policies on the `user_subscriptions` table were too restrictive or conflicting. The original policies:
1. Had a "System can insert subscriptions" policy with `WITH CHECK (true)` that didn't work for authenticated users
2. Didn't explicitly allow users to insert their own subscription records
3. The policies were blocking authenticated users from creating subscriptions for themselves

## The Error in Detail
- **Error Code 42501**: PostgreSQL permission denied error
- **Location**: [`subscriptionService.ts:752-770`](src/services/subscriptionService.ts:752-770) in the `createSubscription` function
- **What happens**: When a user tries to create a subscription (even a free one), the INSERT operation is blocked by RLS

## Solution
Run the [`FIX_SUBSCRIPTION_RLS.sql`](FIX_SUBSCRIPTION_RLS.sql) file in your Supabase SQL Editor.

This script:
1. ✅ Drops all existing conflicting RLS policies
2. ✅ Creates new PERMISSIVE policies that allow:
   - Users to INSERT their own subscriptions (`auth.uid() = user_id`)
   - Users to SELECT their own subscriptions
   - Users to UPDATE their own subscriptions
   - Service role to manage all subscriptions
3. ✅ Fixes the same issues for `user_usage`, `payment_transactions`, and `invoices` tables
4. ✅ Grants proper permissions to authenticated users
5. ✅ Includes verification to confirm the fix worked

## How to Apply the Fix

### Step 1: Run the SQL Fix
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of [`FIX_SUBSCRIPTION_RLS.sql`](FIX_SUBSCRIPTION_RLS.sql)
4. Paste and run it
5. Check the output for "✅ SUCCESS!" message

### Step 2: Test the Fix
1. Try signing up or creating a subscription in your app
2. The 403 error should be gone
3. Users should now be able to create their own subscriptions

## Key Changes Made

### Before (Problematic)
```sql
-- This was too permissive and caused conflicts
CREATE POLICY "System can insert subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (true);
```

### After (Fixed)
```sql
-- Users can create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
ON user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions"
ON user_subscriptions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

## What This Fixes
- ✅ Users can create free subscriptions on signup
- ✅ Users can upgrade to paid subscriptions
- ✅ Admin can assign subscriptions to users
- ✅ Usage tracking works properly
- ✅ Payment transactions are recorded
- ✅ No more 403 errors on subscription creation

## Verification
After running the fix, you should see:
```
✅✅✅ SUCCESS! RLS policies are properly configured ✅✅✅

subscription_plans: 1 policies, RLS: true
user_subscriptions: 4 policies, RLS: true
user_usage: 3 policies, RLS: true
payment_transactions: 3 policies, RLS: true
invoices: 3 policies, RLS: true
```

## If You Still Have Issues

### Check Authentication
Make sure the user is authenticated before creating a subscription:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error('User not authenticated');
  return;
}
```

### Check Supabase Client
Ensure you're using the authenticated Supabase client, not the anonymous one.

### Check Service Role Key
If you're using server-side operations, make sure you're using the service role key (not the anon key) for admin operations.

## Related Files
- [`subscription-schema.sql`](subscription-schema.sql) - Original schema with problematic policies
- [`subscriptionService.ts`](src/services/subscriptionService.ts) - Service that creates subscriptions
- [`FIX_SUBSCRIPTION_RLS.sql`](FIX_SUBSCRIPTION_RLS.sql) - The fix to apply

## Technical Details

### RLS Policy Types
- **PERMISSIVE**: Multiple permissive policies are ORed together (user just needs to satisfy one)
- **RESTRICTIVE**: All restrictive policies must be satisfied (more strict)

### Policy Commands
- `FOR SELECT`: Controls read access
- `FOR INSERT`: Controls create access  
- `FOR UPDATE`: Controls modify access
- `FOR DELETE`: Controls delete access
- `FOR ALL`: Controls all operations

### Why the Original Didn't Work
The original `WITH CHECK (true)` policy allowed anyone to insert any subscription, but when combined with user-specific policies, PostgreSQL's RLS engine got confused about which policy to apply. The new approach explicitly grants permissions based on `auth.uid() = user_id`, making it clear that users can only manage their own data.

## Need More Help?
If the fix doesn't work:
1. Check the Supabase logs for more details
2. Verify your JWT token is valid
3. Make sure the table exists and has the correct columns
4. Check if there are any triggers interfering with the INSERT
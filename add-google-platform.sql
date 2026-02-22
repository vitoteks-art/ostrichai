-- Migration: Add Google/YouTube platform support to social media accounts
-- This migration adds 'google' to the platform constraint in social_media_accounts and social_media_posts tables

-- Step 1: Drop the existing constraint on social_media_accounts
ALTER TABLE social_media_accounts 
DROP CONSTRAINT IF EXISTS social_media_accounts_platform_check;

-- Step 2: Add the new constraint with 'google' included
ALTER TABLE social_media_accounts 
ADD CONSTRAINT social_media_accounts_platform_check 
CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google'));

-- Step 3: Drop the existing constraint on social_media_posts
ALTER TABLE social_media_posts 
DROP CONSTRAINT IF EXISTS social_media_posts_platform_check;

-- Step 4: Add the new constraint with 'google' included
ALTER TABLE social_media_posts 
ADD CONSTRAINT social_media_posts_platform_check 
CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google'));

-- Verify the changes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname LIKE '%platform_check%';

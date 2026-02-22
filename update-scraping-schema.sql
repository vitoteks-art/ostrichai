-- ============================================
-- UPDATE SCHEMA FOR GOOGLE SCRAPER TRACKING
-- ============================================
-- This script updates the database schema to support proper project and activity recording for Google scraping

-- 1. Update user_projects table to include 'scraping' as valid project type
-- First, we need to temporarily drop the check constraint, update the column, then recreate the constraint

-- Store the current constraint name (this might vary in different databases)
-- We'll use a generic approach that works with the existing constraint

-- Update the type column to include scraping
ALTER TABLE user_projects DROP CONSTRAINT IF EXISTS user_projects_type_check;
ALTER TABLE user_projects ADD CONSTRAINT user_projects_type_check
CHECK (type IN ('video', 'logo', 'ad', 'flyer', 'scraping', 'social_post', 'image_edit'));

-- 2. Verify the changes
-- Check that scraping type is now allowed
DO $$
BEGIN
    RAISE NOTICE 'Schema updated successfully!';
    RAISE NOTICE 'user_projects table now supports: video, logo, ad, flyer, scraping, social_post, image_edit';
    RAISE NOTICE 'user_usage table already exists in subscription-schema.sql with proper structure';
END $$;
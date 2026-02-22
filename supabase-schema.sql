-- User Profiles Table
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

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup for authenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON profiles;
CREATE POLICY "Enable insert for authenticated users during signup" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to create profiles during signup (for triggers)
DROP POLICY IF EXISTS "Service role can create profiles" ON profiles;
CREATE POLICY "Service role can create profiles" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Temporarily disable RLS for profiles during signup process
-- This allows the trigger to work without RLS conflicts
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Instead, let's create a more permissive policy for the signup process
DROP POLICY IF EXISTS "Allow profile creation for new users" ON profiles;
CREATE POLICY "Allow profile creation for new users" ON profiles
  FOR INSERT WITH CHECK (true);

-- Also allow anonymous users to create profiles during signup
DROP POLICY IF EXISTS "Allow anonymous profile creation" ON profiles;
CREATE POLICY "Allow anonymous profile creation" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() IS NULL);

-- Admin policies for profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin_or_above(auth.uid()));

-- User Projects Table (for dashboard statistics)
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'logo', 'ad', 'flyer', 'social', 'social_post', 'scraping', 'image_edit', 'youtube', 'script', 'title_generation', 'blog', 'background_remove')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  thumbnail_url TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the type constraint to include all project types (run this separately if table already exists)
-- ALTER TABLE user_projects DROP CONSTRAINT IF EXISTS user_projects_type_check;
-- ALTER TABLE user_projects ADD CONSTRAINT user_projects_type_check CHECK (type IN ('video', 'logo', 'ad', 'flyer', 'social', 'social_post', 'scraping', 'image_edit', 'youtube', 'script', 'title_generation', 'blog', 'background_remove'));

-- Enable RLS for user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for user_projects table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;
CREATE POLICY "Users can view own projects" ON user_projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON user_projects;
CREATE POLICY "Users can insert own projects" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON user_projects;
CREATE POLICY "Users can update own projects" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON user_projects;
CREATE POLICY "Users can delete own projects" ON user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policies for user_projects table
DROP POLICY IF EXISTS "Admins can view all projects" ON user_projects;
CREATE POLICY "Admins can view all projects" ON user_projects
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all projects" ON user_projects;
CREATE POLICY "Admins can manage all projects" ON user_projects
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- User Notifications Table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notifications table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity" ON user_activity;
CREATE POLICY "System can insert activity" ON user_activity
  FOR INSERT WITH CHECK (true);

-- Admin policies for user_activity table
DROP POLICY IF EXISTS "Admins can view all activity" ON user_activity;
CREATE POLICY "Admins can view all activity" ON user_activity
  FOR SELECT USING (is_admin_or_above(auth.uid()));

-- User Settings Table
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

-- User Usage Tracking Table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID,
  feature_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Allow user_settings creation for new users
DROP POLICY IF EXISTS "Allow user_settings creation for new users" ON user_settings;
CREATE POLICY "Allow user_settings creation for new users" ON user_settings
  FOR INSERT WITH CHECK (true);

-- Also allow anonymous users to create settings during signup
DROP POLICY IF EXISTS "Allow anonymous user_settings creation" ON user_settings;
CREATE POLICY "Allow anonymous user_settings creation" ON user_settings
  FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() IS NULL);

-- Create policies for user_settings table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS for user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage table (DROP first if exists)
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;
CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for user_usage table
DROP POLICY IF EXISTS "Admins can view all usage" ON user_usage;
CREATE POLICY "Admins can view all usage" ON user_usage
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all usage" ON user_usage;
CREATE POLICY "Admins can manage all usage" ON user_usage
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Storage bucket for avatars (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars bucket
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own avatar" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own avatar" ON storage.objects
--   FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NOW());

    INSERT INTO public.user_settings (id, created_at)
    VALUES (NEW.id, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable the trigger since we're handling profile creation manually
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at timestamps (DROP first if exists)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_projects_updated_at ON user_projects;
CREATE TRIGGER update_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_usage_updated_at ON user_usage;
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_type ON user_projects(type);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_feature_type ON user_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date ON user_usage(user_id, usage_date DESC);

-- Sample data for development (optional)
-- INSERT INTO user_notifications (user_id, title, message, type) VALUES
-- (auth.uid(), 'Welcome!', 'Welcome to our platform. Start creating amazing content!', 'info');

-- Comments for setup instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Create the 'avatars' storage bucket in the Supabase dashboard
-- 3. Set up the storage policies for the avatars bucket
-- 4. Update your .env file with the correct Supabase URL and anon key
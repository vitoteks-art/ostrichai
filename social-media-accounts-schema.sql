-- Social Media Accounts Schema
-- Stores connected social media accounts with encrypted tokens for OAuth

-- Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Platform information
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google')),
  platform_user_id TEXT NOT NULL, -- ID from the social media platform
  platform_username TEXT, -- Display username
  account_name TEXT, -- Display name / page name
  profile_picture_url TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token (if applicable)
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Account metadata
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'page')),
  permissions JSONB DEFAULT '[]', -- Scopes/permissions granted
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'expired', 'revoked', 'error')),
  
  -- Error tracking
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  posts_count INTEGER DEFAULT 0,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one account per platform per user
  UNIQUE(user_id, platform, platform_user_id)
);

-- Social Media Posts Table
-- Tracks all posts made to social media platforms
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL, -- Link to the project that generated the content
  
  -- Post content
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google')),
  post_text TEXT,
  image_urls JSONB DEFAULT '[]', -- Array of image URLs
  video_url TEXT,
  
  -- Platform-specific data
  platform_post_id TEXT, -- ID from the social media platform
  platform_post_url TEXT, -- Direct link to the post
  post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'story', 'reel', 'tweet', 'article')),
  
  -- Posting status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posting', 'published', 'failed', 'deleted')),
  scheduled_for TIMESTAMP WITH TIME ZONE, -- For scheduled posts
  posted_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Analytics (can be updated later)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  last_analytics_update TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Platform-specific metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Posts Table
-- Stores posts scheduled for future publishing
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  post_text TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]',
  video_url TEXT,
  
  -- Target platforms and accounts
  target_accounts JSONB NOT NULL, -- Array of account IDs to post to
  
  -- Scheduling
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  result JSONB, -- Results from posting to each account
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_user_id ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_status ON social_media_accounts(account_status);

CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_id ON social_media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_account_id ON social_media_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_project_id ON social_media_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled ON social_media_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- Enable Row Level Security
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_accounts
DROP POLICY IF EXISTS "Users can view own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can view own social media accounts" ON social_media_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can insert own social media accounts" ON social_media_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can update own social media accounts" ON social_media_accounts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own social media accounts" ON social_media_accounts;
CREATE POLICY "Users can delete own social media accounts" ON social_media_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_media_posts
DROP POLICY IF EXISTS "Users can view own social media posts" ON social_media_posts;
CREATE POLICY "Users can view own social media posts" ON social_media_posts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage social media posts" ON social_media_posts;
CREATE POLICY "System can manage social media posts" ON social_media_posts
  FOR ALL WITH CHECK (true);

-- RLS Policies for scheduled_posts
DROP POLICY IF EXISTS "Users can view own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can manage own scheduled posts" ON scheduled_posts
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_social_media_accounts_updated_at ON social_media_accounts;
CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_media_posts_updated_at ON social_media_posts;
CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update account statistics when a post is published
CREATE OR REPLACE FUNCTION update_account_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    UPDATE social_media_accounts
    SET 
      posts_count = posts_count + 1,
      last_posted_at = NEW.posted_at,
      updated_at = NOW()
    WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_account_post_stats ON social_media_posts;
CREATE TRIGGER trigger_update_account_post_stats
  AFTER INSERT OR UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_account_post_stats();

-- Facebook Ad Accounts Table
-- Stores connected Facebook ad accounts for running paid campaigns
CREATE TABLE IF NOT EXISTS facebook_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  
  -- Ad Account Information
  ad_account_id TEXT NOT NULL, -- Facebook ad account ID (act_xxxx)
  ad_account_name TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'unsettled', 'pending_review')),
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  
  -- Business Information
  business_id TEXT,
  business_name TEXT,
  
  -- Capabilities and limits
  capabilities JSONB DEFAULT '[]',
  spending_limit DECIMAL(10,2),
  
  -- Statistics
  campaigns_count INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, ad_account_id)
);

-- Facebook Campaigns Table
-- Tracks ad campaigns created through the platform
CREATE TABLE IF NOT EXISTS facebook_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_account_id UUID REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  
  -- Facebook Campaign IDs
  campaign_id TEXT, -- fb campaign ID
  adset_id TEXT, -- fb ad set ID
  ad_id TEXT, -- fb ad ID
  
  -- Campaign Configuration
  campaign_name TEXT NOT NULL,
  objective TEXT NOT NULL, -- OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'creating', 'active', 'paused', 'completed', 'failed')),
  
  -- Budget Configuration
  budget_type TEXT NOT NULL DEFAULT 'daily' CHECK (budget_type IN ('daily', 'lifetime')),
  budget_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Schedule
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Targeting
  targeting JSONB NOT NULL DEFAULT '{}', -- age, gender, locations, interests, etc.
  placements JSONB DEFAULT '["facebook_feed", "instagram_feed"]',
  
  -- Creative Content
  creative_data JSONB NOT NULL, -- headline, body, image_url, call_to_action, etc.
  
  -- Performance Metrics (updated periodically)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Error Tracking
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facebook_ad_accounts_user_id ON facebook_ad_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_accounts_status ON facebook_ad_accounts(account_status);

CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_user_id ON facebook_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_ad_account_id ON facebook_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_project_id ON facebook_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_status ON facebook_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_campaign_id ON facebook_campaigns(campaign_id);

-- RLS Policies
ALTER TABLE facebook_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ad accounts" ON facebook_ad_accounts;
CREATE POLICY "Users can view own ad accounts" ON facebook_ad_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own ad accounts" ON facebook_ad_accounts;
CREATE POLICY "Users can manage own ad accounts" ON facebook_ad_accounts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own campaigns" ON facebook_campaigns;
CREATE POLICY "Users can view own campaigns" ON facebook_campaigns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own campaigns" ON facebook_campaigns;
CREATE POLICY "Users can manage own campaigns" ON facebook_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_facebook_ad_accounts_updated_at ON facebook_ad_accounts;
CREATE TRIGGER update_facebook_ad_accounts_updated_at
  BEFORE UPDATE ON facebook_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facebook_campaigns_updated_at ON facebook_campaigns;
CREATE TRIGGER update_facebook_campaigns_updated_at
  BEFORE UPDATE ON facebook_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process scheduled posts (to be called by a cron job)
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS INTEGER AS $$
DECLARE
  post_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Find posts that are due to be posted
  FOR post_record IN
    SELECT * FROM scheduled_posts
    WHERE status = 'scheduled'
    AND scheduled_time <= NOW()
    ORDER BY scheduled_time
    LIMIT 100
  LOOP
    -- Update status to processing
    UPDATE scheduled_posts
    SET status = 'processing', updated_at = NOW()
    WHERE id = post_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

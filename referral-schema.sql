-- OstrichAi Referral Marketing System Schema
-- Run this SQL in your Supabase SQL editor

-- Referral Campaigns Table
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  reward_config JSONB DEFAULT '{
    "points_per_referral": 100,
    "points_per_conversion": 500,
    "tier_rewards": {
      "bronze": {"min_points": 1000, "reward": "1_month_free"},
      "silver": {"min_points": 2500, "reward": "3_months_free"},
      "gold": {"min_points": 5000, "reward": "1_year_free"}
    },
    "max_referrals_per_user": 100,
    "conversion_window_days": 30
  }',
  sharing_config JSONB DEFAULT '{
    "platforms": ["email", "twitter", "facebook", "linkedin", "whatsapp"],
    "default_message": "Check out OstrichAi - amazing AI tools for creators!",
    "custom_tracking": true
  }',
  landing_page_config JSONB DEFAULT '{
    "title": "Welcome to OstrichAi!",
    "subtitle": "Join thousands of creators using AI-powered tools",
    "description": "Create stunning videos, logos, ads, and more with our advanced AI platform.",
    "features": [
      "🎬 AI Video Generation",
      "🎨 Professional Logo Design",
      "📱 Social Media Content",
      "📊 Advanced Analytics"
    ],
    "primary_cta": "Start Creating Now",
    "secondary_cta": "Learn More",
    "background_color": "#f8fafc",
    "text_color": "#1f2937",
    "button_color": "#3b82f6",
    "hero_image_url": null,
    "custom_css": "",
    "custom_html": ""
  }',
  analytics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for referral_campaigns
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for referral_campaigns
DROP POLICY IF EXISTS "Users can view campaigns they created" ON referral_campaigns;
CREATE POLICY "Users can view campaigns they created" ON referral_campaigns
  FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can create their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can create their own campaigns" ON referral_campaigns
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can update their own campaigns" ON referral_campaigns
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can delete their own campaigns" ON referral_campaigns
  FOR DELETE USING (auth.uid() = creator_id);

-- Admin policies for referral_campaigns
DROP POLICY IF EXISTS "Admins can view all campaigns" ON referral_campaigns;
CREATE POLICY "Admins can view all campaigns" ON referral_campaigns
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all campaigns" ON referral_campaigns;
CREATE POLICY "Admins can manage all campaigns" ON referral_campaigns
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Referral Links Table
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  short_url TEXT,
  full_url TEXT NOT NULL,
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS for referral_links
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

-- Policies for referral_links
DROP POLICY IF EXISTS "Users can view their own referral links" ON referral_links;
CREATE POLICY "Users can view their own referral links" ON referral_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own referral links" ON referral_links;
CREATE POLICY "Users can create their own referral links" ON referral_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own referral links" ON referral_links;
CREATE POLICY "Users can update their own referral links" ON referral_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Public access for referral link clicks (no auth required)
DROP POLICY IF EXISTS "Public can view referral links for clicks" ON referral_links;
CREATE POLICY "Public can view referral links for clicks" ON referral_links
  FOR SELECT USING (true);

-- Admin policies for referral_links
DROP POLICY IF EXISTS "Admins can view all referral links" ON referral_links;
CREATE POLICY "Admins can view all referral links" ON referral_links
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all referral links" ON referral_links;
CREATE POLICY "Admins can manage all referral links" ON referral_links
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Referral Clicks Table
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clicked_by_ip INET,
  clicked_by_user_agent TEXT,
  clicked_by_fingerprint TEXT,
  referrer_url TEXT,
  device_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for referral_clicks
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for referral_clicks
DROP POLICY IF EXISTS "Users can view clicks on their referral links" ON referral_clicks;
CREATE POLICY "Users can view clicks on their referral links" ON referral_clicks
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM referral_links WHERE id = referral_link_id
    )
  );

DROP POLICY IF EXISTS "System can insert referral clicks" ON referral_clicks;
CREATE POLICY "System can insert referral clicks" ON referral_clicks
  FOR INSERT WITH CHECK (true);

-- Admin policies for referral_clicks
DROP POLICY IF EXISTS "Admins can view all referral clicks" ON referral_clicks;
CREATE POLICY "Admins can view all referral clicks" ON referral_clicks
  FOR SELECT USING (is_admin_or_above(auth.uid()));

-- Referral Conversions Table
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversion_type TEXT NOT NULL DEFAULT 'signup' CHECK (conversion_type IN ('signup', 'subscription', 'purchase')),
  points_awarded INTEGER DEFAULT 0,
  reward_tier TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  conversion_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referral_link_id, converted_user_id)
);

-- Enable RLS for referral_conversions
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;

-- Policies for referral_conversions
DROP POLICY IF EXISTS "Users can view conversions from their referrals" ON referral_conversions;
CREATE POLICY "Users can view conversions from their referrals" ON referral_conversions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM referral_links WHERE id = referral_link_id
    )
  );

DROP POLICY IF EXISTS "System can insert referral conversions" ON referral_conversions;
CREATE POLICY "System can insert referral conversions" ON referral_conversions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their conversion status" ON referral_conversions;
CREATE POLICY "Users can update their conversion status" ON referral_conversions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM referral_links WHERE id = referral_link_id
    )
  );

-- Admin policies for referral_conversions
DROP POLICY IF EXISTS "Admins can view all conversions" ON referral_conversions;
CREATE POLICY "Admins can view all conversions" ON referral_conversions
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all conversions" ON referral_conversions;
CREATE POLICY "Admins can manage all conversions" ON referral_conversions
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  current_tier TEXT DEFAULT 'none' CHECK (current_tier IN ('none', 'bronze', 'silver', 'gold', 'platinum')),
  lifetime_earned INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Enable RLS for user_points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Policies for user_points
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own points" ON user_points;
CREATE POLICY "Users can update their own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert user points" ON user_points;
CREATE POLICY "System can insert user points" ON user_points
  FOR INSERT WITH CHECK (true);

-- Admin policies for user_points
DROP POLICY IF EXISTS "Admins can view all user points" ON user_points;
CREATE POLICY "Admins can view all user points" ON user_points
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all user points" ON user_points;
CREATE POLICY "Admins can manage all user points" ON user_points
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Reward Redemptions Table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('credits', 'discount', 'free_month', 'free_year', 'custom')),
  reward_value TEXT NOT NULL, -- e.g., "100", "50%", "1_month", etc.
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reward_redemptions
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for reward_redemptions
DROP POLICY IF EXISTS "Users can view their own redemptions" ON reward_redemptions;
CREATE POLICY "Users can view their own redemptions" ON reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own redemptions" ON reward_redemptions;
CREATE POLICY "Users can create their own redemptions" ON reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pending redemptions" ON reward_redemptions;
CREATE POLICY "Users can update their own pending redemptions" ON reward_redemptions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admin policies for reward_redemptions
DROP POLICY IF EXISTS "Admins can view all redemptions" ON reward_redemptions;
CREATE POLICY "Admins can view all redemptions" ON reward_redemptions
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all redemptions" ON reward_redemptions;
CREATE POLICY "Admins can manage all redemptions" ON reward_redemptions
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Referral Analytics Table (for reporting)
CREATE TABLE IF NOT EXISTS referral_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_points_awarded INTEGER DEFAULT 0,
  viral_coefficient DECIMAL(5,2) DEFAULT 0,
  top_referrer_id UUID REFERENCES auth.users(id),
  top_referrer_clicks INTEGER DEFAULT 0,
  new_users_acquired INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- Enable RLS for referral_analytics
ALTER TABLE referral_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for referral_analytics
DROP POLICY IF EXISTS "Campaign creators can view their analytics" ON referral_analytics;
CREATE POLICY "Campaign creators can view their analytics" ON referral_analytics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM referral_campaigns WHERE id = campaign_id
    )
  );

-- Admin policies for referral_analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON referral_analytics;
CREATE POLICY "Admins can view all analytics" ON referral_analytics
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all analytics" ON referral_analytics;
CREATE POLICY "Admins can manage all analytics" ON referral_analytics
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_creator_id ON referral_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_status ON referral_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_dates ON referral_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_referral_links_campaign_id ON referral_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_referral_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_status ON referral_links(status);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_referral_link_id ON referral_clicks(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_campaign_id ON referral_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer_id ON referral_clicks(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_created_at ON referral_clicks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_referral_link_id ON referral_conversions(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_campaign_id ON referral_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer_id ON referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_converted_user_id ON referral_conversions(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON referral_conversions(status);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_campaign_id ON user_points(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_points_current_tier ON user_points(current_tier);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_campaign_id ON reward_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

CREATE INDEX IF NOT EXISTS idx_referral_analytics_campaign_id ON referral_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_date ON referral_analytics(date DESC);

-- Triggers to update updated_at timestamps
DROP TRIGGER IF EXISTS update_referral_campaigns_updated_at ON referral_campaigns;
CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON referral_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_links_updated_at ON referral_links;
CREATE TRIGGER update_referral_links_updated_at
  BEFORE UPDATE ON referral_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_conversions_updated_at ON referral_conversions;
CREATE TRIGGER update_referral_conversions_updated_at
  BEFORE UPDATE ON referral_conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reward_redemptions_updated_at ON reward_redemptions;
CREATE TRIGGER update_reward_redemptions_updated_at
  BEFORE UPDATE ON reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_analytics_updated_at ON referral_analytics;
CREATE TRIGGER update_referral_analytics_updated_at
  BEFORE UPDATE ON referral_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a random 8-character code using alphanumeric characters
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count
    FROM referral_links
    WHERE referral_code = code;

    -- Exit loop if code is unique
    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral link statistics
CREATE OR REPLACE FUNCTION update_referral_link_stats(link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_links
  SET
    clicks_count = (SELECT COUNT(*) FROM referral_clicks WHERE referral_link_id = link_id),
    conversions_count = (SELECT COUNT(*) FROM referral_conversions WHERE referral_link_id = link_id AND status = 'completed'),
    points_earned = (
      SELECT COALESCE(SUM(points_awarded), 0)
      FROM referral_conversions
      WHERE referral_link_id = link_id AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points(user_uuid UUID, campaign_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  total_earned INTEGER;
  current_record RECORD;
BEGIN
  -- Calculate total points earned across all campaigns or specific campaign
  IF campaign_uuid IS NULL THEN
    SELECT COALESCE(SUM(points_earned), 0) INTO total_earned
    FROM referral_links
    WHERE user_id = user_uuid;
  ELSE
    SELECT COALESCE(SUM(points_earned), 0) INTO total_earned
    FROM referral_links
    WHERE user_id = user_uuid AND campaign_id = campaign_uuid;
  END IF;

  -- Get or create user points record
  SELECT * INTO current_record
  FROM user_points
  WHERE user_id = user_uuid AND (
    (campaign_uuid IS NULL AND campaign_id IS NULL) OR
    campaign_id = campaign_uuid
  );

  IF current_record IS NULL THEN
    INSERT INTO user_points (user_id, campaign_id, total_points, available_points, lifetime_earned, last_activity_at)
    VALUES (user_uuid, campaign_uuid, total_earned, total_earned, total_earned, NOW());
  ELSE
    UPDATE user_points
    SET
      total_points = total_earned,
      available_points = total_earned - points_used,
      lifetime_earned = GREATEST(lifetime_earned, total_earned),
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = current_record.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to determine reward tier based on points
CREATE OR REPLACE FUNCTION get_reward_tier(points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF points >= 5000 THEN RETURN 'gold';
  ELSIF points >= 2500 THEN RETURN 'silver';
  ELSIF points >= 1000 THEN RETURN 'bronze';
  ELSE RETURN 'none';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign leaderboard
CREATE OR REPLACE FUNCTION get_campaign_leaderboard(campaign_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_clicks INTEGER,
  total_conversions INTEGER,
  total_points INTEGER,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      rl.user_id,
      COALESCE(p.full_name, 'Anonymous') as full_name,
      p.avatar_url,
      rl.clicks_count as total_clicks,
      rl.conversions_count as total_conversions,
      rl.points_earned as total_points,
      ROW_NUMBER() OVER (ORDER BY rl.points_earned DESC, rl.clicks_count DESC) as rank
    FROM referral_links rl
    LEFT JOIN profiles p ON rl.user_id = p.id
    WHERE rl.campaign_id = campaign_uuid
    AND rl.status = 'active'
  )
  SELECT
    us.user_id,
    us.full_name,
    us.avatar_url,
    us.total_clicks,
    us.total_conversions,
    us.total_points,
    us.rank
  FROM user_stats us
  WHERE us.rank <= limit_count
  ORDER BY us.rank;
END;
$$ LANGUAGE plpgsql;

-- Function to update user tier based on points
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_tier := get_reward_tier(NEW.total_points);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user tier
DROP TRIGGER IF EXISTS update_user_tier_trigger ON user_points;
CREATE TRIGGER update_user_tier_trigger
  BEFORE INSERT OR UPDATE OF total_points ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_user_tier();

-- Comments for setup instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. The update_updated_at_column function should already exist from supabase-schema.sql
-- 3. The is_admin_or_above function should already exist from admin-schema.sql
-- 4. Test the tables by running some sample queries
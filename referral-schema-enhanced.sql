-- Enhanced Landing Page Configuration for Referral Campaigns
-- Add this to your existing referral-schema.sql

-- Update the landing_page_config default to include enhanced features
ALTER TABLE referral_campaigns
DROP COLUMN IF EXISTS landing_page_config;

ALTER TABLE referral_campaigns
ADD COLUMN landing_page_config JSONB DEFAULT '{
  "template": "default",
  "form_type": "signup",
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
  "accent_color": "#6366f1",
  "hero_image_url": null,
  "gallery_images": [],
  "logo_url": null,
  "favicon_url": null,
  "custom_css": "",
  "custom_html": "",
  "layout": "centered",
  "sections": ["hero", "features", "social_proof", "cta"],
  "thank_you_page": {
    "title": "Welcome to the Team!",
    "subtitle": "Your referral link has been generated",
    "description": "Share this link to start earning rewards and climb the leaderboard!",
    "show_referral_link": true,
    "show_points_info": true,
    "redirect_delay": 3000,
    "redirect_url": null
  },
  "form_config": {
    "fields": ["email", "full_name"],
    "require_verification": true,
    "success_message": "Check your email for verification!",
    "lead_capture_fields": ["email", "full_name", "company", "phone"],
    "show_form_on_click": false
  },
  "hero_layout": "horizontal",
  "hero_layout_side": "left",
  "hero_layout_form": "below",
  "seo_config": {
    "meta_title": "Join OstrichAi - AI Tools for Creators",
    "meta_description": "Create stunning content with AI-powered tools. Join thousands of creators using OstrichAi.",
    "og_image": null,
    "twitter_card": "summary_large_image"
  }
}';

-- Create table for storing uploaded images
CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('hero_image', 'gallery_image', 'logo', 'favicon', 'og_image')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for campaign_assets
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_assets
DROP POLICY IF EXISTS "Campaign creators can manage their assets" ON campaign_assets;
CREATE POLICY "Campaign creators can manage their assets" ON campaign_assets
  FOR ALL USING (
    auth.uid() IN (
      SELECT creator_id FROM referral_campaigns WHERE id = campaign_id
    )
  );

DROP POLICY IF EXISTS "Public can view active campaign assets" ON campaign_assets;
CREATE POLICY "Public can view active campaign assets" ON campaign_assets
  FOR SELECT USING (is_active = true);

-- Admin policies for campaign_assets
DROP POLICY IF EXISTS "Admins can manage all campaign assets" ON campaign_assets;
CREATE POLICY "Admins can manage all campaign assets" ON campaign_assets
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Indexes for campaign_assets
CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_asset_type ON campaign_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_active ON campaign_assets(is_active);

-- Trigger for campaign_assets
DROP TRIGGER IF EXISTS update_campaign_assets_updated_at ON campaign_assets;
CREATE TRIGGER update_campaign_assets_updated_at
  BEFORE UPDATE ON campaign_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up unused assets
CREATE OR REPLACE FUNCTION cleanup_campaign_assets(campaign_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Mark assets as inactive if they're not referenced in landing_page_config
  UPDATE campaign_assets
  SET is_active = false
  WHERE campaign_id = campaign_uuid
  AND asset_type = 'hero_image'
  AND file_url NOT IN (
    SELECT jsonb_object_keys(landing_page_config->'hero_image_url')::text
    FROM referral_campaigns
    WHERE id = campaign_uuid
    UNION
    SELECT landing_page_config->>'hero_image_url'
    FROM referral_campaigns
    WHERE id = campaign_uuid
  );

  -- Similar cleanup for gallery images
  UPDATE campaign_assets
  SET is_active = false
  WHERE campaign_id = campaign_uuid
  AND asset_type = 'gallery_image'
  AND file_url NOT IN (
    SELECT jsonb_array_elements_text(landing_page_config->'gallery_images')
    FROM referral_campaigns
    WHERE id = campaign_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Comments for enhanced schema:
-- 1. Run this SQL after the base referral-schema.sql
-- 2. The landing_page_config now supports advanced customization
-- 3. campaign_assets table stores uploaded images with metadata
-- 4. Form types: 'signup' (creates user account) or 'lead_capture' (just collects info)
-- 5. Thank you page shows generated referral link automatically
-- Referral Form Submissions Schema
-- Stores form submissions from referral landing pages

CREATE TABLE IF NOT EXISTS referral_form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Contact Information
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  website TEXT,
  message TEXT,

  -- Form Configuration
  form_type TEXT NOT NULL CHECK (form_type IN ('signup', 'lead_capture')),
  form_config JSONB, -- Store the form configuration used

  -- Submission Metadata
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  device_info JSONB,
  fingerprint TEXT, -- For duplicate detection

  -- Status and Processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'duplicate', 'spam', 'invalid')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- GDPR Compliance
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  data_retention_until TIMESTAMP WITH TIME ZONE,

  -- Additional Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE referral_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for campaign creators
DROP POLICY IF EXISTS "Campaign creators can view their submissions" ON referral_form_submissions;
CREATE POLICY "Campaign creators can view their submissions" ON referral_form_submissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM referral_campaigns WHERE id = campaign_id
    )
  );

DROP POLICY IF EXISTS "Campaign creators can update their submissions" ON referral_form_submissions;
CREATE POLICY "Campaign creators can update their submissions" ON referral_form_submissions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM referral_campaigns WHERE id = campaign_id
    )
  );

-- Public insert policy (for form submissions)
DROP POLICY IF EXISTS "Anyone can submit forms" ON referral_form_submissions;
CREATE POLICY "Anyone can submit forms" ON referral_form_submissions
  FOR INSERT WITH CHECK (true);

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage all submissions" ON referral_form_submissions;
CREATE POLICY "Admins can manage all submissions" ON referral_form_submissions
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_campaign_id ON referral_form_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_email ON referral_form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_status ON referral_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_created_at ON referral_form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_fingerprint ON referral_form_submissions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_referral_form_submissions_referrer_id ON referral_form_submissions(referrer_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_referral_form_submissions_updated_at ON referral_form_submissions;
CREATE TRIGGER update_referral_form_submissions_updated_at
  BEFORE UPDATE ON referral_form_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to detect duplicate submissions
CREATE OR REPLACE FUNCTION check_duplicate_submission(
  campaign_uuid UUID,
  email_addr TEXT,
  fingerprint_hash TEXT DEFAULT NULL,
  time_window_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM referral_form_submissions
  WHERE campaign_id = campaign_uuid
    AND email = email_addr
    AND created_at > NOW() - INTERVAL '1 hour' * time_window_hours
    AND (fingerprint_hash IS NULL OR fingerprint = fingerprint_hash)
    AND status NOT IN ('spam', 'invalid');

  RETURN duplicate_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set data retention (GDPR compliance)
CREATE OR REPLACE FUNCTION set_data_retention_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set retention period based on form type and consent
  IF NEW.consent_given THEN
    -- 3 years for consented data
    NEW.data_retention_until := NEW.created_at + INTERVAL '3 years';
  ELSE
    -- 1 year for non-consented data
    NEW.data_retention_until := NEW.created_at + INTERVAL '1 year';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for data retention
DROP TRIGGER IF EXISTS set_data_retention_on_submission ON referral_form_submissions;
CREATE TRIGGER set_data_retention_on_submission
  BEFORE INSERT ON referral_form_submissions
  FOR EACH ROW EXECUTE FUNCTION set_data_retention_period();

-- Function to clean up expired data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_submissions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM referral_form_submissions
  WHERE data_retention_until < NOW()
    AND status IN ('processed', 'duplicate');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE referral_form_submissions IS 'Stores form submissions from referral landing pages with GDPR compliance';
COMMENT ON COLUMN referral_form_submissions.fingerprint IS 'Device fingerprint for duplicate detection';
COMMENT ON COLUMN referral_form_submissions.data_retention_until IS 'When the data should be automatically deleted for GDPR compliance';
COMMENT ON FUNCTION check_duplicate_submission IS 'Checks if a submission is a duplicate based on email, campaign, and time window';
COMMENT ON FUNCTION cleanup_expired_submissions IS 'Removes expired submissions for GDPR compliance';
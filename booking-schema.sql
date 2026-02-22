-- Booking System Tables for Supabase
-- Run this in your Supabase SQL editor

-- Meeting Types Table
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  description TEXT,
  location TEXT,
  active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#0069FF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for meeting_types
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_types table
DROP POLICY IF EXISTS "Anyone can view active meeting types" ON meeting_types;
CREATE POLICY "Anyone can view active meeting types" ON meeting_types
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Authenticated users can view all meeting types" ON meeting_types;
CREATE POLICY "Authenticated users can view all meeting types" ON meeting_types
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage meeting types" ON meeting_types;
CREATE POLICY "Admins can manage meeting types" ON meeting_types
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  meeting_type_name TEXT NOT NULL, -- Cached for performance
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- Track who created the appointment
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments table
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (true); -- Allow public booking

DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Users can cancel own appointments" ON appointments;
CREATE POLICY "Users can cancel own appointments" ON appointments
  FOR UPDATE USING ((auth.uid() = created_by OR created_by IS NULL) AND status = 'confirmed');

-- Admin policies for appointments
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Availability Settings Table
CREATE TABLE IF NOT EXISTS availability_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  enabled BOOLEAN DEFAULT true,
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Enable RLS for availability_settings
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for availability_settings table
DROP POLICY IF EXISTS "Users can view own availability" ON availability_settings;
CREATE POLICY "Users can view own availability" ON availability_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own availability" ON availability_settings;
CREATE POLICY "Users can manage own availability" ON availability_settings
  FOR ALL USING (auth.uid() = user_id);

-- Admin policies for availability_settings
DROP POLICY IF EXISTS "Admins can view all availability" ON availability_settings;
CREATE POLICY "Admins can view all availability" ON availability_settings
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all availability" ON availability_settings;
CREATE POLICY "Admins can manage all availability" ON availability_settings
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Booking Settings Table
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  min_notice_hours INTEGER DEFAULT 4 CHECK (min_notice_hours >= 0),
  max_days_in_advance INTEGER DEFAULT 60 CHECK (max_days_in_advance > 0),
  buffer_minutes INTEGER DEFAULT 0 CHECK (buffer_minutes >= 0),
  n8n_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for booking_settings
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_settings table
DROP POLICY IF EXISTS "Users can view own booking settings" ON booking_settings;
CREATE POLICY "Users can view own booking settings" ON booking_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own booking settings" ON booking_settings;
CREATE POLICY "Users can manage own booking settings" ON booking_settings
  FOR ALL USING (auth.uid() = user_id);

-- Admin policies for booking_settings
DROP POLICY IF EXISTS "Admins can view all booking settings" ON booking_settings;
CREATE POLICY "Admins can view all booking settings" ON booking_settings
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all booking settings" ON booking_settings;
CREATE POLICY "Admins can manage all booking settings" ON booking_settings
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_meeting_types_updated_at ON meeting_types;
CREATE TRIGGER update_meeting_types_updated_at
  BEFORE UPDATE ON meeting_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_settings_updated_at ON availability_settings;
CREATE TRIGGER update_availability_settings_updated_at
  BEFORE UPDATE ON availability_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_meeting_type_id ON appointments(meeting_type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_email ON appointments(client_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_availability_settings_user_id ON availability_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_settings_day ON availability_settings(day_of_week);

CREATE INDEX IF NOT EXISTS idx_booking_settings_user_id ON booking_settings(user_id);

-- Insert default meeting types
INSERT INTO meeting_types (name, duration, description, location, active, color) VALUES
('15-min Quick Call', 15, 'A brief chat to discuss your needs', 'Google Meet (link will be provided)', true, '#0069FF'),
('30-min Consultation', 30, 'In-depth discussion about your project', 'Zoom (link will be provided)', true, '#00C4CC')
ON CONFLICT DO NOTHING;

-- Insert default availability (Monday to Friday, 9 AM to 5 PM)
INSERT INTO availability_settings (user_id, day_of_week, enabled, start_time, end_time)
SELECT
  auth.uid(),
  day_name,
  CASE WHEN day_name IN ('saturday', 'sunday') THEN false ELSE true END,
  '09:00',
  '17:00'
FROM unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) AS day_name
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- Insert default booking settings
INSERT INTO booking_settings (user_id, min_notice_hours, max_days_in_advance, buffer_minutes, n8n_webhook_url)
VALUES (auth.uid(), 4, 60, 0, 'https://n8n.srv939063.hstgr.cloud/webhook/calendly')
ON CONFLICT (user_id) DO NOTHING;

-- Comments for setup instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Make sure your auth.users table has the is_admin_or_above() function
-- 3. Update your application to use the new booking service
-- 4. Test the booking flow with the new database backend
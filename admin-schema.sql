-- ============================================
-- ADMIN DASHBOARD DATABASE SCHEMA
-- 4-Tier Role Hierarchy: Super Admin → Admin → Moderator → Viewer
-- ============================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer', 'user')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer', 'user')),
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN DEFAULT FALSE,
  can_read BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission, resource)
);

-- Admin Activity Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Processes Table
CREATE TABLE IF NOT EXISTS workflow_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('approval', 'notification', 'automation', 'custom')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Tasks Table
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID REFERENCES workflow_processes(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Reports Table
CREATE TABLE IF NOT EXISTS admin_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('user_activity', 'system_health', 'analytics', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly', 'custom', 'manual')),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Export Requests Table (GDPR Compliance)
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'correction')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  format TEXT CHECK (format IN ('json', 'csv', 'pdf')),
  file_url TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions Table (Security Monitoring)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'critical')),
  source TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or above
CREATE OR REPLACE FUNCTION is_admin_or_above(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_roles.user_id = $1
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'viewer' THEN 4
      ELSE 5
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    status
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    'success'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- User Roles Policies
DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;
CREATE POLICY "Super admins can manage all roles" ON user_roles
  FOR ALL USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Role Permissions Policies
DROP POLICY IF EXISTS "Admins can manage permissions" ON role_permissions;
CREATE POLICY "Admins can manage permissions" ON role_permissions
  FOR ALL USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "All users can view permissions" ON role_permissions;
CREATE POLICY "All users can view permissions" ON role_permissions
  FOR SELECT USING (true);

-- Admin Audit Log Policies
DROP POLICY IF EXISTS "Admins can view audit log" ON admin_audit_log;
CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit log" ON admin_audit_log;
CREATE POLICY "System can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (true);

-- System Settings Policies
DROP POLICY IF EXISTS "Admins can manage settings" ON system_settings;
CREATE POLICY "Admins can manage settings" ON system_settings
  FOR ALL USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "All users can view public settings" ON system_settings;
CREATE POLICY "All users can view public settings" ON system_settings
  FOR SELECT USING (is_public = true);

-- Workflow Processes Policies
DROP POLICY IF EXISTS "Admins can manage workflows" ON workflow_processes;
CREATE POLICY "Admins can manage workflows" ON workflow_processes
  FOR ALL USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Users can view active workflows" ON workflow_processes;
CREATE POLICY "Users can view active workflows" ON workflow_processes
  FOR SELECT USING (status = 'active');

-- Workflow Tasks Policies
DROP POLICY IF EXISTS "Users can view assigned tasks" ON workflow_tasks;
CREATE POLICY "Users can view assigned tasks" ON workflow_tasks
  FOR SELECT USING (auth.uid() = assigned_to OR is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Users can update assigned tasks" ON workflow_tasks;
CREATE POLICY "Users can update assigned tasks" ON workflow_tasks
  FOR UPDATE USING (auth.uid() = assigned_to OR is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all tasks" ON workflow_tasks;
CREATE POLICY "Admins can manage all tasks" ON workflow_tasks
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Admin Reports Policies
DROP POLICY IF EXISTS "Admins can manage reports" ON admin_reports;
CREATE POLICY "Admins can manage reports" ON admin_reports
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Data Export Requests Policies
DROP POLICY IF EXISTS "Users can manage own export requests" ON data_export_requests;
CREATE POLICY "Users can manage own export requests" ON data_export_requests
  FOR ALL USING (auth.uid() = user_id OR is_admin_or_above(auth.uid()));

-- User Sessions Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id OR is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "System can manage sessions" ON user_sessions;
CREATE POLICY "System can manage sessions" ON user_sessions
  FOR ALL USING (true);

-- System Alerts Policies
DROP POLICY IF EXISTS "Admins can manage alerts" ON system_alerts;
CREATE POLICY "Admins can manage alerts" ON system_alerts
  FOR ALL USING (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "All users can view active alerts" ON system_alerts;
CREATE POLICY "All users can view active alerts" ON system_alerts
  FOR SELECT USING (status = 'active');

-- ============================================
-- AUDIT TRIGGERS
-- ============================================

-- Trigger for user_roles
DROP TRIGGER IF EXISTS audit_user_roles ON user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Trigger for system_settings
DROP TRIGGER IF EXISTS audit_system_settings ON system_settings;
CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Core admin indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON user_roles(created_at DESC);

-- Audit log indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- Workflow indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_process_id ON workflow_tasks(process_id);
CREATE INDEX IF NOT EXISTS idx_workflow_processes_status ON workflow_processes(status);

-- Session indexes for active user queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);

-- Alert indexes for system monitoring
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- Profile indexes for user queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Project indexes for dashboard stats
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(created_at DESC);

-- Activity indexes for recent activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status_priority ON workflow_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status_type ON system_alerts(status, type);

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================

INSERT INTO role_permissions (role, permission, resource, can_create, can_read, can_update, can_delete) VALUES
-- Super Admin (Full Access)
('super_admin', 'manage', 'users', true, true, true, true),
('super_admin', 'manage', 'roles', true, true, true, true),
('super_admin', 'manage', 'settings', true, true, true, true),
('super_admin', 'manage', 'workflows', true, true, true, true),
('super_admin', 'manage', 'reports', true, true, true, true),
('super_admin', 'view', 'audit_log', false, true, false, false),

-- Admin (Most Access)
('admin', 'manage', 'users', true, true, true, false),
('admin', 'manage', 'roles', false, true, true, false),
('admin', 'manage', 'workflows', true, true, true, true),
('admin', 'manage', 'reports', true, true, true, true),
('admin', 'view', 'audit_log', false, true, false, false),
('admin', 'manage', 'content', true, true, true, true),

-- Moderator (Limited Access)
('moderator', 'manage', 'users', false, true, true, false),
('moderator', 'view', 'roles', false, true, false, false),
('moderator', 'manage', 'content', true, true, true, false),
('moderator', 'manage', 'workflows', false, true, true, false),
('moderator', 'view', 'reports', false, true, false, false),

-- Viewer (Read-Only)
('viewer', 'view', 'users', false, true, false, false),
('viewer', 'view', 'roles', false, true, false, false),
('viewer', 'view', 'content', false, true, false, false),
('viewer', 'view', 'workflows', false, true, false, false),
('viewer', 'view', 'reports', false, true, false, false),

-- User (Basic Access)
('user', 'view', 'content', false, true, false, false),
('user', 'manage', 'own_data', true, true, true, false)
ON CONFLICT (role, permission, resource) DO NOTHING;

-- ============================================
-- UPDATE TRIGGERS FOR TIMESTAMP
-- ============================================

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_processes_updated_at ON workflow_processes;
CREATE TRIGGER update_workflow_processes_updated_at
  BEFORE UPDATE ON workflow_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_tasks_updated_at ON workflow_tasks;
CREATE TRIGGER update_workflow_tasks_updated_at
  BEFORE UPDATE ON workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_reports_updated_at ON admin_reports;
CREATE TRIGGER update_admin_reports_updated_at
  BEFORE UPDATE ON admin_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_roles IS 'Stores user role assignments with 4-tier hierarchy';
COMMENT ON TABLE role_permissions IS 'Defines granular permissions for each role';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit trail for all admin actions';
COMMENT ON TABLE workflow_processes IS 'Workflow automation definitions';
COMMENT ON TABLE workflow_tasks IS 'Individual workflow task instances';
COMMENT ON TABLE data_export_requests IS 'GDPR compliance - user data export/deletion requests';
COMMENT ON TABLE user_sessions IS 'Security monitoring - track active user sessions';
COMMENT ON TABLE system_alerts IS 'System-wide alerts and notifications';
-- ============================================
-- ADMIN DASHBOARD PERFORMANCE INDEXES
-- Run this after the main admin-schema.sql
-- ============================================

-- Additional indexes for improved dashboard performance
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON user_roles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_process_id ON workflow_tasks(process_id);
CREATE INDEX IF NOT EXISTS idx_workflow_processes_status ON workflow_processes(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);

-- Composite indexes for common query patterns (dashboard optimization)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status_priority ON workflow_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status_type ON system_alerts(status, type);

-- Maintenance: Analyze tables for query planner
ANALYZE user_roles;
ANALYZE admin_audit_log;
ANALYZE workflow_processes;
ANALYZE workflow_tasks;
ANALYZE user_sessions;
ANALYZE system_alerts;
ANALYZE profiles;
ANALYZE user_projects;
ANALYZE user_activity;
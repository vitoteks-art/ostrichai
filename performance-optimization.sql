-- ============================================
-- SQL PERFORMANCE OPTIMIZATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Optimize Project Lookups (Fixes 500 Statement Timeout)
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id_created_at 
ON user_projects(user_id, created_at DESC);

-- 2. Optimize Session Tracking
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON user_sessions(user_id);

-- 3. Optimize Profile Lookups (Common for joins)
CREATE INDEX IF NOT EXISTS idx_profiles_email_id 
ON profiles(email, id);

-- 4. Optimize Activity Logging
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id_created_at 
ON user_activity(user_id, created_at DESC);

-- 5. Optimize RLS Functions (CRITICAL for performance)
-- Marking functions as STABLE allows Postgres to evaluate them once per query 
-- instead of once per row, which drastically reduces RLS overhead.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_or_above') THEN
        ALTER FUNCTION is_admin_or_above(UUID) STABLE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
        ALTER FUNCTION is_super_admin(UUID) STABLE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        ALTER FUNCTION has_role(UUID, TEXT) STABLE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
        ALTER FUNCTION get_user_role(UUID) STABLE;
    END IF;
END $$;

-- 6. Optimized Dashboard RPCs
-- These functions perform all required count/stats operations in a single query
-- on the server, returning a single JSON object.

-- User Dashboard Stats RPC
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    res JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalProjects', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id),
        'videosCreated', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'video' AND status = 'completed'),
        'logosGenerated', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'logo' AND status = 'completed'),
        'adsCreated', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'ad' AND status = 'completed'),
        'flyersCreated', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'flyer' AND status = 'completed'),
        'socialPostsCreated', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND (type = 'social_post' OR type = 'social') AND status = 'completed'),
        'imagesEdited', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'image_edit' AND status = 'completed'),
        'scrapingProjects', (SELECT count(*) FROM user_projects WHERE user_id = p_user_id AND type = 'scraping' AND status = 'completed'),
        'storageUsed', 0, -- Implement storage logic here
        'storageLimit', 1000,
        'recentProjects', (
            SELECT jsonb_agg(p) 
            FROM (
                SELECT id, title, type, status, thumbnail_url, created_at 
                FROM user_projects 
                WHERE user_id = p_user_id 
                ORDER BY created_at DESC 
                LIMIT 4
            ) p
        ),
        'recentActivities', (
            SELECT jsonb_agg(a) 
            FROM (
                SELECT id, action, details, created_at 
                FROM user_activity 
                WHERE user_id = p_user_id 
                ORDER BY created_at DESC 
                LIMIT 10
            ) a
        )
    ) INTO res;
    
    RETURN res;
END;
$$;

-- Admin Dashboard Stats RPC
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    res JSONB;
BEGIN
    -- Permission check
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    SELECT jsonb_build_object(
        'totalUsers', (SELECT count(*) FROM profiles),
        'activeUsers', (SELECT count(DISTINCT user_id) FROM user_sessions WHERE is_active = true),
        'totalProjects', (SELECT count(*) FROM user_projects),
        'activeProcesses', (SELECT count(*) FROM workflow_processes WHERE status = 'active'),
        'pendingTasks', (SELECT count(*) FROM workflow_tasks WHERE status = 'pending'),
        'systemAlerts', (SELECT count(*) FROM system_alerts WHERE status = 'active'),
        'recentActivityCount', (SELECT count(*) FROM user_activity WHERE created_at > now() - interval '24 hours')
    ) INTO res;
    
    RETURN res;
END;
$$;

-- 7. Optimize Admin User Management
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

CREATE OR REPLACE FUNCTION get_admin_users(
    p_admin_id UUID,
    p_search TEXT DEFAULT '',
    p_role_filter TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    role TEXT,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Permission check
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    WITH filtered_users AS (
        SELECT 
            p.id,
            p.email,
            p.full_name,
            p.avatar_url,
            p.created_at,
            COALESCE(r.role, 'user') as role,
            (SELECT login_at FROM user_sessions WHERE user_id = p.id ORDER BY login_at DESC LIMIT 1) as last_login,
            EXISTS (SELECT 1 FROM user_sessions WHERE user_id = p.id AND is_active = true) as is_active
        FROM profiles p
        LEFT JOIN user_roles r ON p.id = r.user_id
        WHERE 
            (p_search = '' OR p.email ILIKE '%' || p_search || '%' OR p.full_name ILIKE '%' || p_search || '%')
            AND (p_role_filter = 'all' OR r.role = p_role_filter)
    )
    SELECT 
        fu.id,
        fu.email,
        fu.full_name,
        fu.avatar_url,
        fu.created_at,
        fu.role,
        fu.last_login,
        fu.is_active,
        (SELECT count(*) FROM filtered_users)
    FROM filtered_users fu
    ORDER BY fu.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Re-analyze updated tables
ANALYZE user_roles;
ANALYZE user_sessions;
ANALYZE profiles;

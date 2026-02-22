// Admin Dashboard Type Definitions

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer' | 'user';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export type ResourceType =
  | 'users'
  | 'roles'
  | 'settings'
  | 'workflows'
  | 'reports'
  | 'content'
  | 'audit_log'
  | 'own_data';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  assigned_at: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission: string;
  resource: ResourceType;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'pending';
  metadata: Record<string, any>;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowProcess {
  id: string;
  name: string;
  description: string | null;
  type: 'approval' | 'notification' | 'automation' | 'custom';
  status: 'active' | 'inactive' | 'draft';
  config: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTask {
  id: string;
  process_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdminReport {
  id: string;
  name: string;
  description: string | null;
  type: 'user_activity' | 'system_health' | 'analytics' | 'custom';
  config: Record<string, any>;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom' | 'manual' | null;
  last_run: string | null;
  next_run: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  request_type: 'export' | 'deletion' | 'correction';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'json' | 'csv' | 'pdf' | null;
  file_url: string | null;
  requested_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, any>;
  login_at: string;
  logout_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProcesses: number;
  pendingTasks: number;
  systemAlerts: number;
  recentActivity: number;
  storageUsed: number;
  apiCalls: number;
  errorRate: number;
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageSettings: boolean;
  canManageWorkflows: boolean;
  canViewAuditLog: boolean;
  canManageReports: boolean;
  canDeleteData: boolean;
  canExportData: boolean;
}

// Role hierarchy helper
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 1,
  admin: 2,
  moderator: 3,
  viewer: 4,
  user: 5,
};

// Check if a role has higher or equal privileges than another
export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

// Check if a role has a specific permission
export function hasPermission(
  permissions: RolePermission[],
  role: UserRole,
  resource: ResourceType,
  action: PermissionAction
): boolean {
  const permission = permissions.find(
    p => p.role === role && p.resource === resource
  );

  if (!permission) return false;

  switch (action) {
    case 'create':
      return permission.can_create;
    case 'read':
      return permission.can_read;
    case 'update':
      return permission.can_update;
    case 'delete':
      return permission.can_delete;
    default:
      return false;
  }
}

import { API_BASE_URL } from '../lib/api';
import type {
  UserRole,
  UserRoleAssignment,
  RolePermission,
  AdminAuditLog,
  AdminUser,
  AdminDashboardStats,
  AdminPermissions,
  ResourceType,
  PermissionAction,
  WorkflowProcess,
  WorkflowTask,
  SystemAlert,
  DataExportRequest,
  SystemSetting,
} from '../types/admin';

export interface PaginatedAdminUsers {
  users: AdminUser[];
  totalCount: number;
}

/**
 * Admin Service
 * Handles all admin-related operations including role management,
 * permissions, audit logging, and user management
 */
class AdminService {
  /**
    * Check if the current user has a specific role
    */
  /**
    * Check if the current user has a specific role
    */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      console.log('Fetching user role via FastAPI');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        return 'user';
      }

      const data = await response.json();
      return (data.role as UserRole) || 'user';
    } catch (error) {
      console.warn('Error in getUserRole:', error);
      return 'user';
    }
  }

  /**
   * Check if user is admin or above
   */
  async isAdminOrAbove(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === 'super_admin' || role === 'admin';
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === 'super_admin';
  }

  /**
    * Get user's permissions
    */
  async getUserPermissions(userId: string): Promise<AdminPermissions> {
    const role = await this.getUserRole(userId);
    // RBAC is currently simplified to Admin vs User. 
    // We return role-based permissions directly.
    return this.getRoleBasedPermissions(role);
  }

  /**
   * Map database permissions to AdminPermissions interface
   */
  private mapPermissionsToAdminPermissions(
    permissions: RolePermission[],
    role: UserRole
  ): AdminPermissions {
    const hasPermission = (resource: ResourceType, action: 'create' | 'read' | 'update' | 'delete') => {
      const perm = permissions.find(p => p.resource === resource);
      if (!perm) return false;
      return perm[`can_${action}`];
    };

    return {
      canManageUsers: hasPermission('users', 'update') || role === 'super_admin',
      canManageRoles: hasPermission('roles', 'update') || role === 'super_admin',
      canManageSettings: hasPermission('settings', 'update') || role === 'super_admin',
      canManageWorkflows: hasPermission('workflows', 'update') || role === 'super_admin',
      canViewAuditLog: hasPermission('audit_log', 'read'),
      canManageReports: hasPermission('reports', 'update'),
      canDeleteData: hasPermission('users', 'delete') || role === 'super_admin',
      canExportData: true, // All roles can export their own data (GDPR)
    };
  }

  /**
    * Default permissions for non-admin users
    */
  private getDefaultPermissions(): AdminPermissions {
    return {
      canManageUsers: false,
      canManageRoles: false,
      canManageSettings: false,
      canManageWorkflows: false,
      canViewAuditLog: false,
      canManageReports: false,
      canDeleteData: false,
      canExportData: true,
    };
  }

  /**
    * Get role-based permissions when role_permissions table is not available
    */
  private getRoleBasedPermissions(role: UserRole): AdminPermissions {
    switch (role) {
      case 'super_admin':
        return {
          canManageUsers: true,
          canManageRoles: true,
          canManageSettings: true,
          canManageWorkflows: true,
          canViewAuditLog: true,
          canManageReports: true,
          canDeleteData: true,
          canExportData: true,
        };
      case 'admin':
        return {
          canManageUsers: true,
          canManageRoles: false,
          canManageSettings: true,
          canManageWorkflows: true,
          canViewAuditLog: true,
          canManageReports: true,
          canDeleteData: false,
          canExportData: true,
        };
      case 'moderator':
        return {
          canManageUsers: false,
          canManageRoles: false,
          canManageSettings: false,
          canManageWorkflows: false,
          canViewAuditLog: false,
          canManageReports: false,
          canDeleteData: false,
          canExportData: true,
        };
      case 'viewer':
        return {
          canManageUsers: false,
          canManageRoles: false,
          canManageSettings: false,
          canManageWorkflows: false,
          canViewAuditLog: false,
          canManageReports: false,
          canDeleteData: false,
          canExportData: true,
        };
      default:
        return this.getDefaultPermissions();
    }
  }

  /**
    * Assign role to user (Admin only)
    */
  async assignRole(
    userId: string,
    role: UserRole,
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if assigner has permission
      const assignerIsAdmin = await this.isAdminOrAbove(assignedBy);
      if (!assignerIsAdmin) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Prevent non-super-admins from creating super-admins
      if (role === 'super_admin') {
        const assignerIsSuperAdmin = await this.isSuperAdmin(assignedBy);
        if (!assignerIsSuperAdmin) {
          return { success: false, error: 'Only super admins can assign super admin role' };
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to assign role' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in assignRole:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(
    userId: string,
    role: UserRole,
    removedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In simplified model, removing role means setting back to 'user'
      return this.assignRole(userId, 'user', removedBy);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Audit logging is handled by backend or not explicitly called from frontend
    // to avoid spoofing. Leaving stub for interface compatibility or future use.
    console.log('Admin action:', action, resourceType);
  }

  /**
   * Get paginated users with optimized RPC
   */
  async getPaginatedUsers(
    adminId: string,
    params: {
      search?: string;
      roleFilter?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedAdminUsers> {
    try {
      console.log('👥 Fetching users via FastAPI');

      const queryParams = new URLSearchParams({
        skip: (params.offset || 0).toString(),
        limit: (params.limit || 50).toString()
      });

      const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users from backend');
      }

      const users = await response.json();

      // Transform to AdminUser format if needed. 
      // Assuming backend returns a list of users directly for now.
      // Need to adjust if backend response structure differs (e.g. wrapped in object).

      // Based on my router implementation: response_model=List[UserAdminView]
      const mappedUsers: AdminUser[] = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || 'N/A',
        avatar_url: '',
        created_at: u.created_at,
        role: u.role || (u.is_admin ? 'admin' : 'user'),
        last_sign_in_at: u.last_sign_in_at || null,
        is_active: u.is_active
      }));

      return {
        users: mappedUsers,
        totalCount: users.length // Ideally backend should return count
      };

    } catch (error) {
      console.error('Critical error in getPaginatedUsers:', error);
      return { users: [], totalCount: 0 };
    }
  }

  /**
   * Get all users with their roles (Admin only)
   * @deprecated Use getPaginatedUsers for better performance
   */
  async getAllUsers(adminId: string): Promise<AdminUser[]> {
    const { users } = await this.getPaginatedUsers(adminId, { limit: 1000 });
    return users;
  }

  /**
    * Get admin dashboard statistics - Optimized for performance
    */
  async getDashboardStats(adminId: string): Promise<AdminDashboardStats | null> {
    try {
      console.log('📊 Fetching admin dashboard stats via FastAPI');
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const stats = await response.json();
      return {
        totalUsers: stats.total_users || 0,
        activeUsers: 0, // Should be implemented in backend
        totalProjects: 0,
        activeProcesses: 0,
        pendingTasks: 0,
        systemAlerts: 0,
        recentActivity: 0,
        storageUsed: 0,
        apiCalls: 0,
        errorRate: 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
  }

  /**
   * Get audit log entries
   */
  async getAuditLog(
    adminId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminAuditLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/audit-log?limit=${limit}&skip=${offset}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  /**
   * Create system alert
   */
  async createSystemAlert(
    adminId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'critical',
    source: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ title, message, type, source })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to create alert' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Request data export (GDPR compliance)
   */
  async requestDataExport(
    userId: string,
    requestType: 'export' | 'deletion' | 'correction',
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ user_id: userId, request_type: requestType, format })
      });

      if (!response.ok) {
        return { success: false, error: 'Export failed' };
      }

      const data = await response.json();
      return { success: true, requestId: data.requestId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system settings
   */
  async getSystemSettings(adminId: string): Promise<SystemSetting[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return [];
    }
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(
    adminId: string,
    key: string,
    value: any,
    category: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ value, category })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to update setting' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
    * Update user profile (Admin only)
    */
  async updateUserProfile(
    adminId: string,
    userId: string,
    profileData: {
      full_name?: string;
      phone?: string;
      location?: string;
      bio?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating user profile via FastAPI');

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Profile update failed' }));
        throw new Error(errorData.detail || 'Failed to update user profile');
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Exception updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
    * Deactivate/Reactivate user (Admin only)
    */
  async toggleUserStatus(
    adminId: string,
    userId: string,
    deactivate: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Toggling user status via FastAPI');

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ is_active: !deactivate })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Status toggle failed' }));
        throw new Error(errorData.detail || 'Failed to update user status');
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Exception toggling user status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
    * Delete user (Admin only)
    */
  async deleteUser(
    adminId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting user via FastAPI');

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'User deletion failed' }));
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Exception deleting user:', error);
      return { success: false, error: error.message };
    }
  }
}

export const adminService = new AdminService();
export default adminService;

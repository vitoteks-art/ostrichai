import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { adminService } from '../services/adminService';
import type {
  AdminPermissions,
  AdminDashboardStats,
  UserRole,
  AdminUser,
  AdminAuditLog,
  SystemAlert,
} from '../types/admin';

interface AdminContextType {
  // State
  permissions: AdminPermissions | null;
  dashboardStats: AdminDashboardStats | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole | null;
  loading: boolean;

  // Actions
  refreshPermissions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  checkPermission: (resource: string, action: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(false);

  const resetAdminContext = useCallback(() => {
    setPermissions(null);
    setDashboardStats(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUserRole(null);
    setLoading(false);
    initializingRef.current = false;
  }, []);

  const initializeAdminContext = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous initializations only
    if (initializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    console.log('Starting admin context initialization for user:', userId);
    initializingRef.current = true;
    setLoading(true);

    try {
      // Parallelize all initialization calls
      const [roleResult, permissionsResult, statsResult] = await Promise.allSettled([
        adminService.getUserRole(userId),
        adminService.getUserPermissions(userId),
        adminService.getDashboardStats(userId)
      ]);

      // 1. Handle Role (Critical)
      let role: UserRole = 'user';

      // Check user metadata for is_admin flag first (fastest)
      if (user?.user_metadata?.is_admin) {
        role = 'admin';
        console.log('User recognized as admin from metadata');
      }

      if (roleResult.status === 'fulfilled' && roleResult.value && roleResult.value !== 'user') {
        role = roleResult.value as UserRole;
        console.log('User role fetched from service:', role);
      }

      setUserRole(role);
      setIsAdmin(role === 'admin' || role === 'super_admin');
      setIsSuperAdmin(role === 'super_admin');

      // 2. Handle Permissions
      let userPermissions: AdminPermissions | null = null;
      if (permissionsResult.status === 'fulfilled') {
        userPermissions = permissionsResult.value;
        console.log('User permissions fetched:', userPermissions);
      } else {
        console.warn('Permissions check failed, using role-based defaults:', permissionsResult.reason);
        // Fallback to role-based defaults if explicit permissions fail
        userPermissions = {
          canManageUsers: role === 'admin' || role === 'super_admin',
          canManageRoles: role === 'super_admin',
          canManageSettings: role === 'admin' || role === 'super_admin',
          canManageWorkflows: role === 'admin' || role === 'super_admin',
          canViewAuditLog: role === 'admin' || role === 'super_admin',
          canManageReports: role === 'admin' || role === 'super_admin',
          canDeleteData: role === 'super_admin',
          canExportData: true,
        };
      }
      setPermissions(userPermissions);

      // 3. Handle Stats
      if (statsResult.status === 'fulfilled') {
        setDashboardStats(statsResult.value);
      } else {
        console.warn('Stats check failed (non-critical):', statsResult.reason);
        setDashboardStats(null);
      }

      console.log('Admin context initialized successfully');

    } catch (error) {
      console.error('Critical admin context initialization failed:', error);

      // Set safe defaults on critical failure
      setUserRole('user');
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setPermissions({
        canManageUsers: false,
        canManageRoles: false,
        canManageSettings: false,
        canManageWorkflows: false,
        canViewAuditLog: false,
        canManageReports: false,
        canDeleteData: false,
        canExportData: true,
      });
      setDashboardStats(null);
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      initializeAdminContext(user.id);
    } else {
      resetAdminContext();
    }
  }, [user?.id, initializeAdminContext, resetAdminContext]);

  const refreshPermissions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [role, userPermissions] = await Promise.all([
        adminService.getUserRole(user.id),
        adminService.getUserPermissions(user.id),
      ]);

      setUserRole(role);
      setPermissions(userPermissions);
      setIsAdmin(role === 'admin' || role === 'super_admin');
      setIsSuperAdmin(role === 'super_admin');
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  }, [user?.id]);

  const refreshStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const stats = await adminService.getDashboardStats(user.id);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
      // Don't update state on error to prevent UI flicker
    }
  }, [user?.id]);

  const checkPermission = (resource: string, action: string): boolean => {
    if (!permissions) return false;

    // Map resource and action to permission checks
    switch (resource) {
      case 'users':
        return permissions.canManageUsers && action === 'manage';
      case 'roles':
        return permissions.canManageRoles && action === 'manage';
      case 'settings':
        return permissions.canManageSettings && action === 'manage';
      case 'workflows':
        return permissions.canManageWorkflows && action === 'manage';
      case 'audit_log':
        return permissions.canViewAuditLog && action === 'view';
      case 'reports':
        return permissions.canManageReports && action === 'manage';
      case 'data':
        return (action === 'delete' ? permissions.canDeleteData : permissions.canExportData);
      default:
        return false;
    }
  };

  const value: AdminContextType = {
    permissions,
    dashboardStats,
    isAdmin,
    isSuperAdmin,
    userRole,
    loading,
    refreshPermissions,
    refreshStats,
    checkPermission,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

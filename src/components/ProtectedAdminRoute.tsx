import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
  requiredPermission?: string;
  requiredAction?: string;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredAction,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: adminLoading, checkPermission } = useAdmin();
  const location = useLocation();

  // Show loading while checking authentication and permissions
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    if (requiredRole === 'super_admin' && !isSuperAdmin) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You need Super Admin privileges to access this page.
            </p>
          </div>
        </div>
      );
    }

    if (requiredRole === 'admin' && !isAdmin) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You need Admin privileges to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check specific permission requirements
  if (requiredPermission && requiredAction) {
    const hasPermission = checkPermission(requiredPermission, requiredAction);
    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to {requiredAction} {requiredPermission}.
            </p>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

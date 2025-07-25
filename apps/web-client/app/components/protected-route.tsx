import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { ProtectedRouteProps } from '../types/auth.types';

/**
 * Protected route wrapper component that enforces authentication
 * and optionally checks for required permissions
 */
export function ProtectedRoute({
  children,
  requiredPermissions = [],
  fallback: Fallback,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasAllPermissions } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    if (Fallback) {
      return <Fallback />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">You don't have the required permissions to access this page.</p>
          <p className="text-sm text-gray-400 mb-4">Required permissions: {requiredPermissions.join(', ')}</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Route loader function that checks authentication status
 * Can be used with React Router's loader functionality
 */
export async function requireAuth(request: Request) {
  // This would typically check auth status from the store or API
  // For now, we'll return null and let the ProtectedRoute component handle it
  return null;
}

/**
 * HOC version of ProtectedRoute for wrapping components
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[] = [],
) {
  return (props: P) => (
    <ProtectedRoute requiredPermissions={requiredPermissions}>
      <Component {...props} />
    </ProtectedRoute>
  );
}

export default ProtectedRoute;

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAppSelector, useAppDispatch } from '../store';
import {
  useLoginMutation,
  useLogoutMutation,
  useGetStatusQuery,
  useLazyGetStatusQuery,
} from '../features/auth/auth.api';
import {
  clearCredentials,
  setAuthError,
  clearAuthError,
  selectCurrentUser,
  selectCurrentToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectLastAuthCheck,
} from '../features/auth/auth.slice';
import type { UseAuthReturn, LoginCredentials, User, AuthApiError } from '../types/auth.types';

/**
 * Custom hook for authentication state management
 * Provides a clean interface for components to interact with auth state
 */
export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Selectors
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectCurrentToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const lastAuthCheck = useAppSelector(selectLastAuthCheck);

  // API hooks
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [checkStatus, statusResult] = useLazyGetStatusQuery();

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        dispatch(clearAuthError());
        const result = await loginMutation(credentials).unwrap();
        return result;
      } catch (error) {
        const authError = error as AuthApiError;
        dispatch(setAuthError(authError.message));
        throw authError;
      }
    },
    [loginMutation, dispatch],
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint (optional, for server-side cleanup)
      await logoutMutation().unwrap();
    } catch (error) {
      // Ignore logout endpoint errors, still clear local state
      console.warn('Logout endpoint failed:', error);
    } finally {
      // Always clear local auth state
      dispatch(clearCredentials());
      // Redirect to login page
      navigate('/login');
    }
  }, [logoutMutation, dispatch, navigate]);

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      const result = await checkStatus().unwrap();
      return result;
    } catch (error) {
      const authError = error as AuthApiError;

      // If unauthorized, clear auth state
      if (authError.status === 401) {
        dispatch(clearCredentials());
      }

      throw authError;
    }
  }, [checkStatus, dispatch]);

  // Clear auth error
  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Check if auth is stale (needs refresh)
  const isAuthStale = useMemo(() => {
    if (!lastAuthCheck || !isAuthenticated) return false;

    const STALE_TIME = 15 * 60 * 1000; // 15 minutes
    return Date.now() - lastAuthCheck > STALE_TIME;
  }, [lastAuthCheck, isAuthenticated]);

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user?.permissions],
  );

  // Check if user has specific role
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles?.includes(role) ?? false;
    },
    [user?.roles],
  );

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission],
  );

  // Check if user has all specified permissions
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      return permissions.every((permission) => hasPermission(permission));
    },
    [hasPermission],
  );

  // Force auth refresh
  const refreshAuth = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await checkAuthStatus();
    } catch (error) {
      console.error('Auth refresh failed:', error);
      // On refresh failure, logout user
      await logout();
    }
  }, [isAuthenticated, checkAuthStatus, logout]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || statusResult.isLoading,
    error,
    isAuthStale,

    // Actions
    login,
    logout,
    checkAuthStatus,
    clearError,
    refreshAuth,

    // Permission helpers
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * Hook for checking if user is authenticated and redirecting if not
 * Useful for protected routes
 */
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated (after loading is complete)
  if (!isLoading && !isAuthenticated) {
    navigate(redirectTo);
    return false;
  }

  return isAuthenticated;
}

/**
 * Hook for checking specific permissions
 * Returns loading state while permissions are being checked
 */
export function usePermissions(requiredPermissions: string[] = []) {
  const { user, isLoading, hasAllPermissions } = useAuth();

  const hasRequiredPermissions = useMemo(() => {
    if (!user || requiredPermissions.length === 0) return true;
    return hasAllPermissions(requiredPermissions);
  }, [user, requiredPermissions, hasAllPermissions]);

  return {
    hasPermissions: hasRequiredPermissions,
    isLoading,
    user,
  };
}

export default useAuth;

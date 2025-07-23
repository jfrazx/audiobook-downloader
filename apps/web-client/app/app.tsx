import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { useAppSelector } from './store';
import { selectAuthLoading } from './features/auth/auth.slice';
import Welcome from './welcome';
import type { WelcomeProps } from './types/auth.types';

interface AppProps {
  className?: string;
}

export function App({ className = '' }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, checkAuthStatus, isAuthStale } = useAuth();
  const authLoading = useAppSelector(selectAuthLoading);

  // Handle auth state changes and routing
  useEffect(() => {
    const handleAuthFlow = async () => {
      // If user is authenticated and on root path, could redirect to dashboard
      if (isAuthenticated && user && location.pathname === '/') {
        // For now, stay on welcome page
        // In Phase 2, we'll implement: navigate('/dashboard');
        console.log('User authenticated:', user.username);
      }

      // If auth is stale, refresh it
      if (isAuthStale && isAuthenticated) {
        try {
          await checkAuthStatus();
        } catch (error) {
          console.error('Failed to refresh auth status:', error);
          // User will be logged out by the auth hook
        }
      }
    };

    // Only run auth flow when not loading
    if (!isLoading && !authLoading) {
      handleAuthFlow();
    }
  }, [
    isAuthenticated,
    user,
    location.pathname,
    navigate,
    isLoading,
    authLoading,
    isAuthStale,
    checkAuthStatus,
  ]);

  // Show loading spinner while checking auth status
  if (isLoading || authLoading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
          <p className="text-gray-400 text-sm mt-2">Checking authentication status</p>
        </div>
      </div>
    );
  }

  const welcomeProps: WelcomeProps = {
    title: 'AudioBook Downloader',
    subtitle: 'Your personal audiobook library management system',
    showLoginButton: !isAuthenticated,
    className: className,
  };

  return (
    <div className={className}>
      <Welcome {...welcomeProps} />
    </div>
  );
}

export default App;

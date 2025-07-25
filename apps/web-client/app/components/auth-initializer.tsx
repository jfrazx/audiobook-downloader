import { restoreAuth } from '../features/auth/auth.slice';
import { useAppDispatch } from '../hooks/redux';
import { useEffect } from 'react';

/**
 * Component that initializes auth state from localStorage after hydration
 * This ensures we don't try to access localStorage during SSR
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export default AuthInitializer;

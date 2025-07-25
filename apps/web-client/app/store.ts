import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { authApi } from './features/auth/auth.api';
import authReducer, { restoreAuth, clearCredentials } from './features/auth/auth.slice';
import type { AuthState } from './types/auth.types';

const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: restoreAuth,
  effect: async (action, listenerApi) => {
    try {
      const result = await listenerApi.dispatch(authApi.endpoints.getStatus.initiate());

      if (!result.data?.isAuthenticated) {
        listenerApi.dispatch(clearCredentials());
      }
    } catch (error) {
      console.error('Auth restoration check failed:', error);
      listenerApi.dispatch(clearCredentials());
    }
  },
});

authListenerMiddleware.startListening({
  matcher: authApi.endpoints.getStatus.matchRejected,
  effect: (action, listenerApi) => {
    if (action.payload?.status === 401) {
      listenerApi.dispatch(clearCredentials());
    }
  },
});

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    })
      .concat(authApi.middleware)
      .concat(authListenerMiddleware.middleware),
});

// Setup RTK Query refetch on focus/reconnect
setupListeners(store.dispatch);

store.dispatch(restoreAuth());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const selectAuthState = (state: RootState): AuthState => state.auth;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const persistAuthState = () => {
  const state = store.getState();
  try {
    const authState = {
      user: state.auth.user,
      token: state.auth.token,
      isAuthenticated: state.auth.isAuthenticated,
      lastAuthCheck: Date.now(),
    };
    localStorage.setItem('auth_backup', JSON.stringify(authState));
  } catch (error) {
    console.error('Failed to persist auth state:', error);
  }
};

export const cleanupAuthState = () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_backup');
  } catch (error) {
    console.error('Failed to cleanup auth state:', error);
  }
};

export default store;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from './auth.api';
import { AuthState, User, LoginResponse, AUTH_STORAGE_KEYS } from '../../types/auth.types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastAuthCheck: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { user, access_token } = action.payload;
      state.user = user;
      state.token = access_token;
      state.isAuthenticated = true;
      state.error = null;
      state.lastAuthCheck = Date.now();

      try {
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, access_token);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
      } catch (error) {
        console.error('Failed to persist auth data:', error);
      }
    },

    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastAuthCheck = null;

      try {
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      } catch (error) {
        console.error('Failed to clear auth data:', error);
      }
    },

    setAuthError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };

        try {
          localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(state.user));
        } catch (error) {
          console.error('Failed to update user data:', error);
        }
      }
    },

    restoreAuth: (state) => {
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
        const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

        if (token && userStr) {
          const user: User = JSON.parse(userStr);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
          state.lastAuthCheck = Date.now();
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        const { user, access_token } = action.payload;
        state.user = user;
        state.token = access_token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        state.lastAuthCheck = Date.now();

        try {
          localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, access_token);
          localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
          console.error('Failed to persist login data:', error);
        }
      })
      .addMatcher(authApi.endpoints.login.matchRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      .addMatcher(authApi.endpoints.getStatus.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(authApi.endpoints.getStatus.matchFulfilled, (state, action) => {
        if (action.payload.isAuthenticated && action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.lastAuthCheck = Date.now();
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addMatcher(authApi.endpoints.getStatus.matchRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to check auth status';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;

        try {
          localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
          localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        } catch (error) {
          console.error('Failed to clear auth data on status check failure:', error);
        }
      });
  },
});

export const {
  setCredentials,
  clearCredentials,
  setAuthError,
  clearAuthError,
  setAuthLoading,
  updateUser,
  restoreAuth,
} = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectLastAuthCheck = (state: { auth: AuthState }) => state.auth.lastAuthCheck;

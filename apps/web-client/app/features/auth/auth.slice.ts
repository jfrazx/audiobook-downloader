import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './auth.api';

const initialState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.token = payload.access_token;
    });
    builder.addMatcher(authApi.endpoints.getStatus.matchFulfilled, (state, { payload }) => {
      state.user = payload;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

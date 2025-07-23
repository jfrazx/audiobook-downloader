import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../store';
import { Http } from '@status/codes';
import type {
  AuthApiError,
  AuthStatusResponse,
  LoginCredentials,
  LoginResponse,
  User,
} from '../../types/auth.types';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/auth/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch({ type: 'auth/clearCredentials' });
  }

  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
      transformErrorResponse: (response): AuthApiError => {
        return {
          status: typeof response.status === 'number' ? response.status : 500,
          statusText: 'error' in response ? response.error : 'Unknown error',
          message: getErrorMessage(response),
          details: response.data as Record<string, any>,
          timestamp: new Date().toISOString(),
        };
      },
    }),

    getStatus: builder.query<AuthStatusResponse, void>({
      query: () => 'status',
      providesTags: ['Auth'],
      transformResponse: (response: AuthStatusResponse): AuthStatusResponse => {
        if (typeof response === 'object' && response !== null) {
          if ('user' in response) {
            return {
              isAuthenticated: !!response.user,
              user: response.user || null,
              expiresAt: response.expiresAt,
            };
          } else if ('isAuthenticated' in response) {
            return response;
          }
        }

        return {
          isAuthenticated: false,
          user: null,
        };
      },
      transformErrorResponse: (response: FetchBaseQueryError): AuthApiError => ({
        status: typeof response.status === 'number' ? response.status : 500,
        statusText: 'error' in response ? response.error : 'Unknown error',
        message: 'Failed to check authentication status',
        details: response.data as Record<string, any>,
        timestamp: new Date().toISOString(),
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
      onQueryStarted: async (_, { dispatch }) => {
        dispatch({ type: 'auth/clearCredentials' });
      },
    }),

    refreshToken: builder.mutation<LoginResponse, void>({
      query: () => ({
        url: 'refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (updates) => ({
        url: 'profile',
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['User'],
      onQueryStarted: async (updates, { dispatch, queryFulfilled }) => {
        try {
          const { data: updatedUser } = await queryFulfilled;
          dispatch({ type: 'auth/updateUser', payload: updatedUser });
        } catch (error) {
          // TODO: toast error message
          console.error('Failed to update profile:', error);
        }
      },
    }),
  }),
});

function getErrorMessage(response: any): string {
  if (response.data?.message) {
    return response.data.message;
  }

  if (response.data?.error) {
    return response.data.error;
  }

  if (typeof response.status === 'number') {
    switch (response.status) {
      case Http.BadRequest:
        return 'Invalid request data';
      case Http.Unauthorized:
        return 'Invalid username or password';
      case Http.Forbidden:
        return 'Access forbidden';
      case Http.NotFound:
        return 'Service not found';
      case Http.InternalServerError:
        return 'Server error. Please try again later.';
      default:
        return `Request failed with status ${response.status}`;
    }
  }

  return 'Network error. Please check your connection.';
}

export const {
  useLoginMutation,
  useGetStatusQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useLazyGetStatusQuery,
} = authApi;

export default authApi;

// Core auth type definitions
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  permissions?: string[];
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastAuthCheck: number | null;
}

// Form validation types
export interface FormValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
  valid: boolean;
}

export interface LoginFormState {
  username: FormField;
  password: FormField;
  showPassword: boolean;
  isSubmitting: boolean;
  validationErrors: FormValidationErrors;
}

// API Error types
export interface AuthApiError {
  status: number;
  statusText: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user: User | null;
  expiresAt?: string;
}

// Component prop types
export interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: AuthApiError) => void;
  redirectTo?: string;
  className?: string;
}

export interface WelcomeProps {
  title: string;
  subtitle?: string;
  showLoginButton?: boolean;
  className?: string;
}

// Auth context types (if using React Context)
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  error: string | null;
}

// Route protection types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallback?: React.ComponentType;
  redirectTo?: string;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isAuthStale: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<AuthStatusResponse>;
}

// Form validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  username: ValidationRule;
  password: ValidationRule;
}

// Constants
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  NETWORK_ERROR: 'Network connection error',
  SERVER_ERROR: 'Server error. Please try again later.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  VALIDATION_FAILED: 'Please check your input and try again',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

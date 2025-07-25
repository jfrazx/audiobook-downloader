import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useLoginMutation } from './auth.api';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated } from './auth.slice';
import { Http } from '@status/codes';
import type {
  AuthApiError,
  FormValidationErrors,
  LoginCredentials,
  LoginFormState,
} from '../../types/auth.types';

interface LoginFormProps {
  onSuccess?: (redirectTo?: string) => void;
  onError?: (error: AuthApiError) => void;
  redirectTo?: string;
  className?: string;
}

const validationRules = {
  username: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  password: {
    required: true,
    minLength: 3,
    maxLength: 128,
  },
} as const;

export function LoginForm({ onSuccess, onError, redirectTo = '/dashboard', className = '' }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [login, { isLoading, error }] = useLoginMutation();

  const from = location.state?.from?.pathname || redirectTo;
  const [formState, setFormState] = useState<LoginFormState>({
    username: {
      value: '',
      error: undefined,
      touched: false,
      valid: false,
    },
    password: {
      value: '',
      error: undefined,
      touched: false,
      valid: false,
    },
    showPassword: false,
    isSubmitting: false,
    validationErrors: {},
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateField = useCallback((field: keyof LoginCredentials, value: string): string | undefined => {
    const rules = validationRules[field];

    if (rules.required && !value.trim()) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be less than ${rules.maxLength} characters`;
    }

    if (field === 'password' && value && value.length < 3) {
      return 'Password is too short';
    }

    return undefined;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormValidationErrors = {};
    let isValid = true;

    const usernameError = validateField('username', formState.username.value);
    if (usernameError) {
      errors.username = usernameError;
      isValid = false;
    }

    const passwordError = validateField('password', formState.password.value);
    if (passwordError) {
      errors.password = passwordError;
      isValid = false;
    }

    setFormState((prev) => ({
      ...prev,
      validationErrors: errors,
      username: { ...prev.username, error: usernameError, valid: !usernameError },
      password: { ...prev.password, error: passwordError, valid: !passwordError },
    }));

    return isValid;
  }, [formState.username.value, formState.password.value, validateField]);

  const handleFieldChange = useCallback(
    (field: keyof LoginCredentials, value: string) => {
      setFormState((prev) => {
        const error = validateField(field, value);
        return {
          ...prev,
          [field]: {
            value,
            error,
            touched: true,
            valid: !error,
          },
          validationErrors: {
            ...prev.validationErrors,
            [field]: undefined,
          },
        };
      });
    },
    [validateField],
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || isLoading) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const credentials: LoginCredentials = {
        username: formState.username.value.trim(),
        password: formState.password.value,
      };

      const result = await login(credentials).unwrap();

      // Success callback
      onSuccess?.(from);

      // Navigate to dashboard or specified redirect
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      const authError = err as AuthApiError;
      onError?.(authError);
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [
    formState.username.value,
    formState.password.value,
    validateForm,
    isLoading,
    login,
    onSuccess,
    onError,
    from,
    navigate,
  ]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const togglePasswordVisibility = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  }, []);

  // Get error message from API error
  const getErrorMessage = useCallback((): string | null => {
    if (error && 'status' in error) {
      switch (error.status) {
        case Http.Unauthorized:
          return 'Invalid username or password';
        case Http.TooManyRequests:
          return 'Too many login attempts. Please try again later.';
        case Http.InternalServerError:
        case Http.BadGateway:
        case Http.ServiceUnavailable:
          return 'Server error. Please try again later.';
        default:
          return 'Login failed. Please try again.';
      }
    }
    if (error) {
      return 'Network error. Please check your connection.';
    }
    return null;
  }, [error]);

  const isFormValid = formState.username.valid && formState.password.valid;
  const canSubmit = isFormValid && !isLoading && !formState.isSubmitting;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 ${className}`}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to access your audiobook library</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="space-y-6">
            {/* Global Error Message */}
            {getErrorMessage() && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{getErrorMessage()}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formState.username.value}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg bg-white/5 text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    transition-all duration-200
                    ${formState.username.error && formState.username.touched ? 'border-red-500' : 'border-white/30 hover:border-white/50'}
                  `}
                  placeholder="Enter your username"
                  disabled={isLoading || formState.isSubmitting}
                />
              </div>
              {formState.username.error && formState.username.touched && (
                <p className="mt-1 text-sm text-red-400" role="alert">
                  {formState.username.error}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={formState.showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formState.password.value}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`
                    block w-full pl-10 pr-12 py-3 border rounded-lg bg-white/5 text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    transition-all duration-200
                    ${formState.password.error && formState.password.touched ? 'border-red-500' : 'border-white/30 hover:border-white/50'}
                  `}
                  placeholder="Enter your password"
                  disabled={isLoading || formState.isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading || formState.isSubmitting}
                  aria-label={formState.showPassword ? 'Hide password' : 'Show password'}
                >
                  {formState.showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formState.password.error && formState.password.touched && (
                <p className="mt-1 text-sm text-red-400" role="alert">
                  {formState.password.error}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="
                group relative w-full flex justify-center py-3 px-4 border border-transparent
                text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
              "
            >
              {isLoading || formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* OIDC Login Button */}
            <a
              href="/api/auth/oidc"
              className="
                w-full flex justify-center py-3 px-4 border border-white/30
                text-sm font-medium rounded-lg text-gray-200 bg-white/5 hover:bg-white/10
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
              "
            >
              Login with SSO
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Secure access to your audiobook collection</p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

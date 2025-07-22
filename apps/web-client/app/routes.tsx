import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./app.tsx'),
  route('about', './routes/about.tsx'),
  route('login', './routes/login.tsx'),
  route('auth/oidc/callback', './routes/auth/oidc/callback.tsx'),
] satisfies RouteConfig;

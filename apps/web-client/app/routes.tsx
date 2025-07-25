import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./app.tsx'),
  route('about', './routes/about.tsx'),
  route('login', './routes/login.tsx'),
  route('auth/oidc/callback', './routes/auth/oidc/callback.tsx'),

  route('dashboard', './layouts/dashboard.tsx', [
    index('./routes/dashboard/index.tsx'),
    route('libraries', './routes/dashboard/libraries.tsx'),
    route('downloads', './routes/dashboard/downloads.tsx'),
    route('scans', './routes/dashboard/scans.tsx'),
    route('activity', './routes/dashboard/activity.tsx'),
    route('jobs', './routes/dashboard/jobs.tsx'),
    route('settings', './routes/dashboard/settings.tsx'),
  ]),
] satisfies RouteConfig;

import { ProtectedRoute } from '../components/protected-route';
import { DashboardLayout } from '../components/dashboard-layout';

/**
 * Dashboard layout wrapper that ensures authentication before rendering
 */
export default function DashboardLayoutWrapper() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthChecking = useAuthStore((s) => s.isAuthChecking);

  if (isAuthChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/401" replace />;
  }

  return <Outlet />;
}

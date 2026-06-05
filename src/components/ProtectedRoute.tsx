import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authApi } from '@/api/api';

export const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Gọi API lấy info để check session
    authApi.getInfo()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Nếu auth hợp lệ -> render các route con (Outlet), ngược lại đá về login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
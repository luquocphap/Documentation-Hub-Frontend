import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  buildWorkspaceRedirectQuery,
  normalizeWorkspaceRedirect,
} from "@/lib/workspaceRedirect";

export function WorkspaceProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isAuthChecking = useAuthStore(
    (state) => state.isAuthChecking
  );

  if (isAuthChecking) {
    return null;
  }

  if (!isAuthenticated) {
    const redirectTo = normalizeWorkspaceRedirect(
      `${location.pathname}${location.search}${location.hash}`
    );

    return (
      <Navigate
        to={`/register${buildWorkspaceRedirectQuery(redirectTo)}`}
        replace
      />
    );
  }

  return <Outlet />;
}

import './App.css'
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import VerifySuccessPage from './pages/VerifySuccessPage'
import DashboardPage from './pages/DashboardPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import WorkspacePage from './pages/WorkspacePage'
import { Toaster } from './components/ui/sonner'
import WorkspaceSettingsPage from './pages/WorkspaceSettingPage'
import WorkspaceMembersPage from './pages/WorkspaceMembersPage'
import UnauthenticatedPage from './pages/UnauthenticatedPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import DocumentPage from './pages/DocumentPage'
import { ActivityLogPage } from './pages/ActivityLogsPage'
import { useAuthStore } from './stores/useAuthStore'
import { WorkspaceProtectedRoute } from './components/WorkspaceProtectedRoute'
import { WorkspaceLayout } from './components/WorkspaceLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to='/dashboard' replace />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />
          <Route path="/auth/verify-email" element={<VerifySuccessPage />} />
          <Route path="/401" element={<UnauthenticatedPage />} />
          <Route path="/403" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path="/document/:documentId" element={<DocumentPage />} />
          </Route>

          <Route element={<WorkspaceProtectedRoute />}>
            <Route path="/workspaces/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<WorkspacePage />} />
              <Route path="settings" element={<WorkspaceSettingsPage />} />
              <Route path="members" element={<WorkspaceMembersPage />} />
              <Route path="activity-logs" element={<ActivityLogPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

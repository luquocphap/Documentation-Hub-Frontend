import './App.css'
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
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

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/register' replace />} />
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
          <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
          <Route path="/workspaces/:workspaceId/members" element={<WorkspaceMembersPage />} />
          <Route path='/workspaces/:workspaceId/activity-logs' element={<ActivityLogPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}

export default App

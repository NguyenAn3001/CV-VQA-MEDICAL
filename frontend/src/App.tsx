import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/auth/AuthPage';
import ChangePassword from './pages/auth/ChangePassword';
import ChatPage from './pages/chat/ChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import UsersPage from './pages/admin/UsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminSessionsPage from './pages/admin/AdminSessionsPage';
import SessionsPage from './pages/admin/SessionsPage';
import SessionDetailPage from './pages/chat/SessionDetailPage';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};

/**
 * AdminRoute — standalone guard (does NOT rely on being inside AppLayout).
 * Checks auth + mustChangePassword + admin role independently.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword);

  if (isAuthenticated && mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <AuthPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* ── Chat / Profile — wrapped in AppLayout (chat sidebar) ───── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:sessionId" element={<ChatPage />} />
            <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Legacy admin pages (still use chat AppLayout) */}
            <Route path="/admin/users-legacy" element={<AdminUsersPage />} />
            <Route path="/admin/analytics-legacy" element={<AdminAnalyticsPage />} />
            <Route path="/admin/sessions-legacy" element={<AdminSessionsPage />} />
            <Route path="/admin/settings-legacy" element={<AdminSettingsPage />} />
          </Route>

          {/* ── Admin Dashboard — NOT inside AppLayout ─────────────────── */}
          {/* Each page renders DashboardLayout + AdminSidebar internally.  */}
          {/* This prevents the double-sidebar overlap.                     */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AnalyticsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <AdminRoute>
                <SessionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/models"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

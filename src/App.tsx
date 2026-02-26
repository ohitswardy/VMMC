import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ORCalendarPage from './pages/ORCalendarPage';
import DashboardPage from './pages/DashboardPage';
import LiveBoardPage from './pages/LiveBoardPage';
import BookingsPage from './pages/BookingsPage';
import ORRoomsPage from './pages/ORRoomsPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import DocumentsPage from './pages/DocumentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import {
  useNotificationsStore,
  useBookingsStore,
  useORRoomsStore,
  useORPriorityScheduleStore,
} from './stores/appStore';
import { useEffect } from 'react';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/calendar" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user, initAuth, isLoading: authLoading } = useAuthStore();
  const { loadNotifications } = useNotificationsStore();
  const { loadBookings } = useBookingsStore();
  const { loadRooms, loadLiveStatuses } = useORRoomsStore();
  const { loadSchedule } = useORPriorityScheduleStore();

  // Initialize Supabase auth session on first load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Bootstrap all app data once auth is confirmed (not while still loading)
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      loadBookings();
      loadRooms();
      loadLiveStatuses();
      loadSchedule();
      loadNotifications(user.id);
    }
  }, [isAuthenticated, user, authLoading, loadBookings, loadRooms, loadLiveStatuses, loadSchedule, loadNotifications]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          duration: 4000,
          style: { borderRadius: '12px', padding: '12px 16px' },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/calendar" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<ORCalendarPage />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="live-board" element={<LiveBoardPage />} />
          <Route
            path="bookings"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin', 'department_user']}>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="or-rooms"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin', 'nurse']}>
                <ORRoomsPage />
              </ProtectedRoute>
            }
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="reports"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="documents"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin']}>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={['super_admin', 'anesthesiology_admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

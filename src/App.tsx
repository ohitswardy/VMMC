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
  useAuditLogsStore,
} from './stores/appStore';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { sendUpcomingReminders, sendPurgeWarnings } from './lib/notificationHelper';
import type { Notification } from './lib/types';
import DataPrivacyModal from './components/ui/DataPrivacyModal';
import { hasAcknowledgedCurrentPolicy } from './lib/privacyPolicy';
import useIdleTimeout from './lib/useIdleTimeout';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/calendar" replace />;
  return <>{children}</>;
}

// ── Idle-timeout constants ──
const IDLE_TIMEOUT_MS  = 30 * 60 * 1000; // 30 minutes
const IDLE_WARNING_MS  =  5 * 60 * 1000; //  5-minute warning before logout

export default function App() {
  const { isAuthenticated, user, initAuth, isLoading: authLoading, logout } = useAuthStore();
  const { loadNotifications, addNotification } = useNotificationsStore();
  const { loadBookings, bookings } = useBookingsStore();
  const { loadRooms, loadLiveStatuses } = useORRoomsStore();
  const { loadSchedule } = useORPriorityScheduleStore();
  const { loadLogs } = useAuditLogsStore();

  // ── Data Privacy Modal state ──
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // ── Session idle-timeout state ──

  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const idleCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_WARNING_MS / 1000); // seconds

  const handleIdleWarning = useCallback(() => {
    setShowIdleWarning(true);
    setIdleCountdown(Math.round(IDLE_WARNING_MS / 1000));
    // Start a 1-second countdown so the UI can show remaining time
    idleCountdownRef.current = setInterval(() => {
      setIdleCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  }, []);

  const handleIdleWarningDismiss = useCallback(() => {
    setShowIdleWarning(false);
    if (idleCountdownRef.current) { clearInterval(idleCountdownRef.current); idleCountdownRef.current = null; }
  }, []);

  const handleIdleLogout = useCallback(() => {
    setShowIdleWarning(false);
    if (idleCountdownRef.current) { clearInterval(idleCountdownRef.current); idleCountdownRef.current = null; }
    logout();
    // Toast will show on the login page after redirect
    setTimeout(() => {
      import('react-hot-toast').then(({ default: toast }) => {
        toast('You have been signed out due to inactivity.', { icon: '🔒', duration: 6000 });
      });
    }, 300);
  }, [logout]);

  useIdleTimeout({
    timeoutMs: IDLE_TIMEOUT_MS,
    warningMs: IDLE_WARNING_MS,
    enabled: isAuthenticated && !authLoading,
    onIdle: handleIdleLogout,
    onWarning: handleIdleWarning,
    onWarningDismiss: handleIdleWarningDismiss,
  });
  // Refs for tracking already-sent reminders / purge warnings (persists across interval ticks)
  const sentReminderRef = useRef(new Set<string>());
  const sentPurgeRef = useRef(new Set<string>());

  // Initialize Supabase auth session on first load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Show Data Privacy Modal once per login.
  // Logout clears the localStorage ack (authStore), so the next login always shows it.
  // Page refresh keeps the ack → modal stays hidden.
  // Bumping PRIVACY_POLICY_VERSION also re-triggers it for all users.
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      if (!hasAcknowledgedCurrentPolicy(user.id)) {
        setShowPrivacyModal(true);
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const handleClosePrivacyModal = useCallback(() => {
    setShowPrivacyModal(false);
  }, []);

  // Bootstrap all app data once auth is confirmed (not while still loading)
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      loadBookings();
      loadRooms();
      loadLiveStatuses();
      loadSchedule();
      loadNotifications(user.id);
      // Load audit logs for admin roles
      if (user.role === 'super_admin' || user.role === 'anesthesiology_admin') {
        loadLogs();
      }
    }
  }, [isAuthenticated, user, authLoading, loadBookings, loadRooms, loadLiveStatuses, loadSchedule, loadNotifications, loadLogs]);

  // ── Real-time subscription for notifications ──
  // Listens for new notifications inserted for the current user and adds them to the store
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          addNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, addNotification]);

  // ── Periodic reminder & purge-warning scheduler ──
  // Runs every 5 minutes for admins, checks bookings for 24h/2h reminders and purge warnings
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isAdminUser = user.role === 'super_admin' || user.role === 'anesthesiology_admin';
    if (!isAdminUser) return; // Only admin sessions run the scheduler to avoid duplicate notifications

    const runChecks = async () => {
      if (bookings.length === 0) return;
      sentReminderRef.current = await sendUpcomingReminders(bookings, sentReminderRef.current);
      sentPurgeRef.current = await sendPurgeWarnings(bookings, sentPurgeRef.current);
    };

    // Run once immediately, then every 5 minutes
    runChecks();
    const interval = setInterval(runChecks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, bookings]);

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
      {/* Session idle-timeout warning overlay */}
      {showIdleWarning && <IdleWarningOverlay countdown={idleCountdown} />}

      {/* Data Privacy Agreement Modal — shown on every login & policy version update */}
      {isAuthenticated && user && (
        <DataPrivacyModal
          isOpen={showPrivacyModal}
          onClose={handleClosePrivacyModal}
          userId={user.id}
        />
      )}

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

/* ─────────────────────────────────────────────────────────────
   Idle-timeout warning overlay
   Shows a non-interactive banner at the top of the screen with a
   countdown so the user knows they're about to be signed out.
   Any mouse / keyboard activity dismisses the warning and resets.
───────────────────────────────────────────────────────────── */
function IdleWarningOverlay({ countdown }: { countdown: number }) {
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeStr = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center pointer-events-none">
      <div
        className="mt-4 pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-[12px] bg-gray-900 text-white shadow-xl animate-[slideDown_0.25s_ease-out]"
        role="alert"
      >
        <span className="text-lg">🔒</span>
        <div className="text-[13px] leading-snug">
          <span className="font-semibold">Session expiring due to inactivity</span>
          <span className="ml-1.5 text-gray-300">— auto-logout in</span>
          <span className="ml-1.5 font-mono font-bold text-amber-400">{timeStr}</span>
        </div>
        <span className="text-[11px] text-gray-400 ml-2">Move your mouse to stay signed in</span>
      </div>
    </div>
  );
}

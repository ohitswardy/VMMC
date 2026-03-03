import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, Calendar, CheckCircle,
  Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, UserCheck, X
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useBookingsStore, useORRoomsStore } from '../stores/appStore';
import { BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptBg, getDeptName, formatTime } from '../lib/utils';
import { notifyBookingApproved, notifyBookingDenied } from '../lib/notificationHelper';
import { auditBookingApprove, auditBookingDeny } from '../lib/auditHelper';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { CustomSelect } from '../components/ui/CustomSelect';
import PageHelpButton from '../components/ui/PageHelpButton';
import { DASHBOARD_HELP } from '../lib/helpContent';
import BookingDetailModal from '../components/booking/BookingDetailModal';
import type { Booking } from '../lib/types';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { bookings, updateBooking, isLoading: bookingsLoading } = useBookingsStore();
  const { rooms, isLoading: roomsLoading } = useORRoomsStore();

  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Anesthesiologist prompt state
  const [anesPromptBookingId, setAnesPromptBookingId] = useState<string | null>(null);
  const [anesInput, setAnesInput] = useState('');
  const [anesSubmitting, setAnesSubmitting] = useState(false);

  // Deny reason prompt state
  const [denyPromptBookingId, setDenyPromptBookingId] = useState<string | null>(null);
  const [denyReasonInput, setDenyReasonInput] = useState('');
  const [denySubmitting, setDenySubmitting] = useState(false);

  const handleApprove = async (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    if (!booking.anesthesiologist || !booking.anesthesiologist.trim()) {
      // No anesthesiologist assigned — prompt before approving
      setAnesInput('');
      setAnesPromptBookingId(id);
      return;
    }
    setApprovingId(id);
    try {
      await updateBooking(id, { status: 'approved', approved_by: user?.id, updated_at: new Date().toISOString() });
      toast.success('Booking approved');
      notifyBookingApproved(booking, user?.full_name || 'Admin');
      if (user) auditBookingApprove(user.id, booking);
    } catch { toast.error('Failed to approve'); }
    finally { setApprovingId(null); }
  };

  const handleAnesPromptSubmit = async () => {
    if (!anesPromptBookingId) return;
    if (!anesInput.trim()) { toast.error('Please enter an anesthesiologist name.'); return; }
    const booking = bookings.find((b) => b.id === anesPromptBookingId);
    setAnesSubmitting(true);
    try {
      await updateBooking(anesPromptBookingId, { anesthesiologist: anesInput.trim(), status: 'approved', approved_by: user?.id, updated_at: new Date().toISOString() });
      toast.success('Booking approved');
      if (booking) {
        notifyBookingApproved(booking, user?.full_name || 'Admin');
        if (user) auditBookingApprove(user.id, booking);
      }
      setAnesPromptBookingId(null);
    } catch { toast.error('Failed to approve'); }
    finally { setAnesSubmitting(false); }
  };

  const handleDeny = (id: string) => {
    setDenyReasonInput('');
    setDenyPromptBookingId(id);
  };

  const handleDenyPromptSubmit = async () => {
    if (!denyPromptBookingId) return;
    if (!denyReasonInput.trim()) { toast.error('Please enter a denial reason.'); return; }
    const booking = bookings.find((b) => b.id === denyPromptBookingId);
    setDenySubmitting(true);
    try {
      await updateBooking(denyPromptBookingId, { status: 'denied', denial_reason: denyReasonInput.trim(), updated_at: new Date().toISOString() });
      toast.success('Booking denied');
      if (booking) {
        notifyBookingDenied(booking, user?.full_name || 'Admin', denyReasonInput.trim());
        if (user) auditBookingDeny(user.id, booking, denyReasonInput.trim());
      }
      setDenyPromptBookingId(null);
    } catch { toast.error('Failed to deny'); }
    finally { setDenySubmitting(false); }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';

  // Keep selectedBooking in sync with store data so UI reflects changes (e.g. anesthesiologist assignment)
  const freshSelectedBooking = useMemo(() => {
    if (!selectedBooking) return null;
    return bookings.find(b => b.id === selectedBooking.id) ?? selectedBooking;
  }, [selectedBooking, bookings]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayBookings = bookings.filter((b) => b.date === today);
    return {
      total: todayBookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      ongoing: todayBookings.filter((b) => b.status === 'ongoing').length,
      completed: todayBookings.filter((b) => b.status === 'completed').length,
    };
  }, [bookings]);

  // Generate real sparkline data from the last 7 days of bookings
  const sparklineData = useMemo(() => {
    const days: { d: string; total: number; pending: number; ongoing: number; completed: number; cancelled: number; emergency: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLabel = format(d, 'EEE').charAt(0);
      const dayBookings = bookings.filter((b) => b.date === dateStr);
      days.push({
        d: dayLabel,
        total: dayBookings.length,
        pending: dayBookings.filter((b) => b.status === 'pending').length,
        ongoing: dayBookings.filter((b) => b.status === 'ongoing').length,
        completed: dayBookings.filter((b) => b.status === 'completed').length,
        cancelled: dayBookings.filter((b) => b.status === 'cancelled').length,
        emergency: dayBookings.filter((b) => b.is_emergency).length,
      });
    }
    return days;
  }, [bookings]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (statusFilter !== 'all') result = result.filter((b) => b.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) => b.patient_name.toLowerCase().includes(term) || b.procedure.toLowerCase().includes(term) || b.surgeon.toLowerCase().includes(term)
      );
    }
    if (!isAdmin && user?.department_id) result = result.filter((b) => b.department_id === user.department_id);
    return result;
  }, [bookings, statusFilter, searchTerm, isAdmin, user]);

  // Pagination for "All Bookings"
  const DASH_PAGE_SIZE = 20;
  const [bookingsPage, setBookingsPage] = useState(1);
  const totalBookingsPages = Math.max(1, Math.ceil(filtered.length / DASH_PAGE_SIZE));
  const paginatedBookings = useMemo(() => {
    const start = (bookingsPage - 1) * DASH_PAGE_SIZE;
    return filtered.slice(start, start + DASH_PAGE_SIZE);
  }, [filtered, bookingsPage]);
  // Reset page when filters change
  useMemo(() => { setBookingsPage(1); }, [statusFilter, searchTerm]);

  if ((bookingsLoading || roomsLoading) && bookings.length === 0) {
    return <PageLoader label="Loading dashboard…" />;
  }

  return (
    <div className="page-container">

      {/* Anesthesiologist Prompt Modal */}
      {anesPromptBookingId && (() => {
        const b = bookings.find((bk) => bk.id === anesPromptBookingId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900">Assign Anesthesiologist</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Required before approving this case</p>
                  </div>
                </div>
                <button onClick={() => setAnesPromptBookingId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {b && (
                <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-800 truncate">{b.procedure}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.patient_name} · {getDeptName(b.department_id)} · {b.date}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Anesthesiologist Name</label>
                <input
                  type="text"
                  autoFocus
                  value={anesInput}
                  onChange={(e) => setAnesInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnesPromptSubmit()}
                  placeholder="e.g. Dr. Juan Dela Cruz"
                  className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAnesPromptBookingId(null)}>Cancel</Button>
                <Button variant="accent" className="flex-1" loading={anesSubmitting} onClick={handleAnesPromptSubmit}>Approve</Button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Deny Reason Prompt Modal */}
      {denyPromptBookingId && (() => {
        const b = bookings.find((bk) => bk.id === denyPromptBookingId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900">Deny Booking</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Please provide a reason for denial</p>
                  </div>
                </div>
                <button onClick={() => setDenyPromptBookingId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {b && (
                <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-800 truncate">{b.procedure}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.patient_name} · {getDeptName(b.department_id)} · {b.date}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Denial Reason</label>
                <textarea
                  autoFocus
                  rows={3}
                  value={denyReasonInput}
                  onChange={(e) => setDenyReasonInput(e.target.value)}
                  placeholder="e.g. Incomplete pre-operative clearance"
                  className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDenyPromptBookingId(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" loading={denySubmitting} onClick={handleDenyPromptSubmit}>Deny</Button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>
            {isAdmin ? 'Anesthesiology admin overview' : `${getDeptName(user?.department_id as any)} department`}
          </p>
        </div>
        <PageHelpButton {...DASHBOARD_HELP} />
      </div>

      {/* ── UntitledUI-style Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Card 1 — Today's Cases (mini bar chart) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Today's Cases</p>
            <Calendar className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-500">
              today
            </span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <BarChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 2 — Pending (area sparkline, amber) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Pending</p>
            <Clock className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
              awaiting review
            </span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2}
                  fill="url(#pendingFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 3 — Ongoing (line chart, emerald) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Ongoing</p>
            <ClipboardList className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.ongoing}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              in progress
            </span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ongoingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ongoing" stroke="#10b981" strokeWidth={2}
                  fill="url(#ongoingFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 4 — Completed (area sparkline, blue) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Completed</p>
            <CheckCircle className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.completed}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700">
              today
            </span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#completedFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Pending Approvals (Admin) */}
      {isAdmin && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
          <div className="bg-white rounded-[10px] border border-gray-200">
            <div className="px-4 md:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] bg-amber-50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900">Pending Approval</h2>
              </div>
              <span className="px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
                {stats.pending}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {[...bookings.filter((b) => b.status === 'pending')].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((b) => {
                const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                });
                return (
                <div key={b.id} className="px-4 md:px-5 py-3.5 hover:bg-gray-50 active:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-10 md:h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: getDeptColor(b.department_id) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">
                        {getDeptName(b.department_id)} · {b.patient_name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-400">{formatTime(b.start_time)}–{formatTime(b.end_time)}</p>
                        <span className="text-[10px] text-gray-400">·</span>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted {submittedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="accent" size="sm" loading={approvingId === b.id} onClick={() => handleApprove(b.id)}>Approve</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeny(b.id)}>Deny</Button>
                    </div>
                  </div>
                </div>
              )})}
              {stats.pending === 0 && (
                <div className="px-4 py-10 text-center text-sm text-gray-400">No pending requests</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bookings — Cards on mobile, Table on desktop */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
        <div className="bg-white rounded-[10px] border border-gray-200">
          <div className="px-4 md:px-5 py-3.5 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-900">All Bookings</h2>
              <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full py-2.5 md:py-2 input-base"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'all', label: 'All' },
                  ...BOOKING_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
                ]}
                className="shrink-0 min-w-[120px]"
              />
            </div>
          </div>

          {/* Mobile: Card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {paginatedBookings.map((b) => {
              const room = rooms.find((r) => r.id === b.or_room_id);
              const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              });
              return (
                <div key={b.id} className="px-4 py-3.5 hover:bg-gray-50 active:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                  <div className="flex items-start gap-3">
                    <div className="w-1 rounded-full self-stretch flex-shrink-0" style={{ backgroundColor: getDeptColor(b.department_id) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                      <p className="text-[13px] text-gray-600">{b.patient_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {getDeptName(b.department_id)} · {room?.name || '—'} · {b.date}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(b.start_time)}–{formatTime(b.end_time)} · {b.surgeon.split('/')[0]}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Submitted {submittedAt}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Department</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Patient</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Procedure</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Date/Time</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Room</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Submitted</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedBookings.map((b) => {
                  const room = rooms.find((r) => r.id === b.or_room_id);
                  const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  });
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDeptColor(b.department_id) }} />
                          <span className="text-[13px] text-gray-700">{getDeptName(b.department_id)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-700">{b.patient_name}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-700 max-w-[200px] truncate">{b.procedure}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-500">
                        {b.date}<br />
                        <span className="text-xs text-gray-400">{formatTime(b.start_time)}–{formatTime(b.end_time)}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-500">{room?.name || '—'}</td>
                      <td className="px-5 py-3 text-[12px] text-gray-400 whitespace-nowrap">{submittedAt}</td>
                      <td className="px-5 py-3"><StatusBadge status={b.status} size="sm" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-14 text-center text-sm text-gray-400">No bookings found.</div>
          )}
          {/* Pagination */}
          {totalBookingsPages > 1 && (
            <div className="px-4 md:px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Page {bookingsPage} of {totalBookingsPages} ({filtered.length} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                  disabled={bookingsPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setBookingsPage((p) => Math.min(totalBookingsPages, p + 1))}
                  disabled={bookingsPage === totalBookingsPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Booking detail modal */}
      {freshSelectedBooking && (
        <BookingDetailModal
          isOpen={!!freshSelectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={freshSelectedBooking}
          rooms={rooms}
        />
      )}
    </div>
  );
}

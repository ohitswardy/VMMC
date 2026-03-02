import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, CalendarDays, Clock, ChevronDown, CalendarRange, FileText, CheckCircle, XCircle, X, AlertCircle, ArrowRight, User, Stethoscope, Building2 } from 'lucide-react';
import {
  format, addDays, subDays, isToday, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay,
} from 'date-fns';
import toast from 'react-hot-toast';
import { useORRoomsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { DEPARTMENTS, BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptName, formatTime } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useBookingsStore, useChangeRequestsStore } from '../stores/appStore';
import BookingDetailModal from '../components/booking/BookingDetailModal';
import ChangeScheduleModal from '../components/booking/ChangeScheduleModal';
import PageHelpButton from '../components/ui/PageHelpButton';
import { BOOKINGS_HELP } from '../lib/helpContent';
import {
  notifyChangeRequestApproved,
  notifyChangeRequestDenied,
} from '../lib/notificationHelper';
import {
  auditChangeRequestReview,
} from '../lib/auditHelper';
import type { Booking, ORRoom, BookingChangeRequest } from '../lib/types';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
};

/* ─────────────────────────────────────────────────────────────
   Inline day-picker popover for the booking date navigator
───────────────────────────────────────────────────────────── */
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function DayPickerPopover({
  date, onChange,
}: {
  date: Date;
  onChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(date);
  const [dir, setDir] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Keep popover month in sync when the parent date changes via arrows
  useEffect(() => { setMonth(date); }, [date]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const prevMonth = useCallback(() => { setDir(-1); setMonth((m) => subMonths(m, 1)); }, []);
  const nextMonth = useCallback(() => { setDir(1);  setMonth((m) => addMonths(m, 1)); }, []);

  const selectDay = useCallback((d: Date) => {
    onChange(d);
    setOpen(false);
  }, [onChange]);

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(month),     { weekStartsOn: 0 }),
  });

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 min-w-[164px] justify-center
          rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors group"
        aria-label="Pick a date"
      >
        <CalendarDays className="w-3.5 h-3.5 text-accent-500 shrink-0" />
        <span className="text-[13px] font-semibold text-gray-800">
          {isToday(date) ? 'Today · ' : ''}{format(date, 'EEE, MMM d, yyyy')}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${
          open ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2
              bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/70
              p-4 w-[296px]"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</span>
              <button type="button" onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="h-8 flex items-center justify-center text-[11px] font-medium text-gray-400">{d}</div>
              ))}
            </div>

            {/* Days — animated slide on month change */}
            <AnimatePresence initial={false} custom={dir} mode="wait">
              <motion.div
                key={format(month, 'yyyy-MM')}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="grid grid-cols-7"
              >
                {calDays.map((day) => {
                  const inMonth  = isSameMonth(day, month);
                  const selected = isSameDay(day, date);
                  const today    = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`
                        h-9 w-full flex items-center justify-center text-[13px] rounded-lg transition-all duration-100
                        ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${selected ? 'bg-accent-600 !text-white font-semibold shadow-sm' : ''}
                        ${!selected && today ? 'font-bold text-accent-600 ring-1 ring-accent-300' : ''}
                        ${!selected && inMonth ? 'hover:bg-accent-50 hover:text-accent-700 cursor-pointer' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onChange(new Date()); setOpen(false); }}
                className="text-xs font-medium text-accent-600 hover:text-accent-700
                  px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors"
              >
                Go to Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reusable booking card used in both Day and 2-Week views
───────────────────────────────────────────────────────────── */
function BookingCard({
  booking: b, index: i, rooms, isAdmin, onSelect,
}: {
  booking: Booking;
  index: number;
  rooms: ORRoom[];
  isAdmin: boolean;
  onSelect: (b: Booking) => void;
}) {
  const room = rooms.find((r) => r.id === b.or_room_id);
  const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: Math.min(i * 0.03, 0.3) }}
      className="bg-white rounded-[10px] border border-gray-200 overflow-hidden hover:shadow-sm active:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onSelect(b)}
    >
      {/* Dept color bar */}
      <div className="h-[2px]" style={{ backgroundColor: getDeptColor(b.department_id) }} />
      <div className="p-4 space-y-3">
        {/* Top row: procedure + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
            <p className="text-[13px] text-gray-500 mt-0.5">{b.patient_name} ({b.patient_age}/{b.patient_sex})</p>
          </div>
          <StatusBadge status={b.status} size="sm" />
        </div>

        {/* Scheduled time — prominent */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <Clock className="w-3.5 h-3.5 text-accent-500 shrink-0" />
          <span className="text-[13px] font-bold text-gray-800">
            {formatTime(b.start_time)} – {formatTime(b.end_time)}
          </span>
          <span className="ml-auto text-[11px] text-gray-400 shrink-0">{room?.name ?? '—'}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          <div>
            <span className="text-gray-400">Dept</span>
            <span className="ml-1.5 font-medium" style={{ color: getDeptColor(b.department_id) }}>{getDeptName(b.department_id)}</span>
          </div>
          <div>
            <span className="text-gray-400">Ward</span>
            <span className="ml-1.5 text-gray-600">{b.ward || '—'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Surgeon</span>
            <span className="ml-1.5 text-gray-600">{b.surgeon}</span>
          </div>
        </div>

        {b.is_emergency && (
          <div className="px-2.5 py-1.5 rounded-[6px] bg-red-50 border border-red-100 text-[11px] font-semibold text-red-600">
            🚨 Emergency Case
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Submitted {submittedAt}
          </p>
          {isAdmin && b.status === 'pending' && (
            <span className="text-[11px] font-medium text-accent-600">Approve / Edit →</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { isChangeFormOpen, changeBooking, closeChangeForm } = useBookingsStore();
  const { bookings, updateBooking, loadBookings } = useBookingsStore();
  const { rooms } = useORRoomsStore();
  const { requests, loadRequests, updateRequest } = useChangeRequestsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'day' | '2week'>('day');
  const [showChangeRequests, setShowChangeRequests] = useState(true);
  const [denyingRequestId, setDenyingRequestId] = useState<string | null>(null);
  const [denyReasonText, setDenyReasonText] = useState('');
  const [crActionLoading, setCrActionLoading] = useState<string | null>(null);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [panelApprovingId, setPanelApprovingId] = useState<string | null>(null);
  const [panelDenyingId, setPanelDenyingId] = useState<string | null>(null);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<BookingChangeRequest | null>(null);
  const [crModalDenying, setCrModalDenying] = useState(false);
  const [crModalDenyReason, setCrModalDenyReason] = useState('');
  const [showMyBookingsPanel, setShowMyBookingsPanel] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const endDateStr = format(addDays(currentDate, 13), 'yyyy-MM-dd');

  // Load change requests on mount for admins
  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin, loadRequests]);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests]
  );

  const allPendingBookings = useMemo(
    () => [...bookings.filter((b) => b.status === 'pending')]
      .sort((a, b) => new Date(a.date + 'T' + a.start_time).getTime() - new Date(b.date + 'T' + b.start_time).getTime()),
    [bookings]
  );

  // All bookings for this department (incl. those submitted by Anes on their behalf)
  const myAllBookings = useMemo(() => {
    if (isAdmin || !user?.department_id) return [];
    return [...bookings.filter((b) => b.department_id === user.department_id)]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bookings, isAdmin, user]);

  const handlePanelApprove = async (id: string) => {
    setPanelApprovingId(id);
    try {
      await updateBooking(id, { status: 'approved' });
      toast.success('Booking approved');
    } catch { toast.error('Failed to approve'); }
    finally { setPanelApprovingId(null); }
  };

  const handlePanelDeny = async (id: string) => {
    setPanelDenyingId(id);
    try {
      await updateBooking(id, { status: 'denied' });
      toast.success('Booking denied');
    } catch { toast.error('Failed to deny'); }
    finally { setPanelDenyingId(null); }
  };

  const handleApproveRequest = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const booking = bookings.find((b) => b.id === req.original_booking_id);
    if (!booking) { toast.error('Original booking not found.'); return; }

    setCrActionLoading(requestId);
    try {
      // Step 1: mark the change request as approved
      await updateRequest(requestId, {
        status: 'approved',
        reviewed_by: user?.id,
      });

      // Step 2: apply ALL requested changes to the original booking.
      // Preserve the original duration so end_time stays consistent.
      const [origStartH, origStartM] = booking.start_time.split(':').map(Number);
      const [origEndH, origEndM] = booking.end_time.split(':').map(Number);
      const durationMin = (origEndH * 60 + origEndM) - (origStartH * 60 + origStartM);
      const [newStartH, newStartM] = req.new_preferred_time.split(':').map(Number);
      const newEndTotalMin = newStartH * 60 + newStartM + (durationMin > 0 ? durationMin : 60);
      const newEndH = Math.floor(newEndTotalMin / 60) % 24;
      const newEndM = newEndTotalMin % 60;
      const newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`;

      // Build the update payload with every field from the change request
      const bookingUpdates: Partial<Booking> = {
        date: req.new_date,
        start_time: req.new_preferred_time,
        end_time: newEndTime,
        department_id: req.department_id,
        status: booking.status === 'pending' ? 'approved' : booking.status,
      };

      // Apply procedure change
      if (req.procedure) {
        bookingUpdates.procedure = req.procedure;
      }

      // Apply anesthesiologist change
      if (req.preferred_anesthesiologist) {
        bookingUpdates.anesthesiologist = req.preferred_anesthesiologist;
      }

      // Parse patient_details back into individual fields.
      // Format: "Name Age/Sex/Category Ward WardName"
      if (req.patient_details) {
        const detailStr = req.patient_details.trim();
        const wardIdx = detailStr.lastIndexOf(' Ward ');
        if (wardIdx !== -1) {
          const beforeWard = detailStr.substring(0, wardIdx).trim();
          const wardValue = detailStr.substring(wardIdx + 6).trim();
          // Find the last token that matches "age/sex/category"
          const slashMatch = beforeWard.match(/^(.+?)\s+(\d+)\/(M|F)\/(.*?)$/i);
          if (slashMatch) {
            bookingUpdates.patient_name = slashMatch[1].trim();
            bookingUpdates.patient_age = parseInt(slashMatch[2], 10);
            bookingUpdates.patient_sex = slashMatch[3].toUpperCase() as 'M' | 'F';
            bookingUpdates.patient_category = slashMatch[4].trim() as Booking['patient_category'];
          }
          bookingUpdates.ward = wardValue;
        }
      }

      await updateBooking(booking.id, bookingUpdates);

      notifyChangeRequestApproved(booking, req.created_by, user?.full_name || 'Admin', req.new_date, req.new_preferred_time);
      if (user) auditChangeRequestReview(user.id, requestId, booking.id, 'approved');
      toast.success('Change request approved and booking updated.');

      // Force re-sync so calendar and other views reflect the change immediately
      await Promise.all([loadBookings(), loadRequests()]);
    } catch (err) {
      console.error('Failed to approve change request:', err);
      toast.error('Failed to approve change request. Please try again.');
    } finally {
      setCrActionLoading(null);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    if (!denyReasonText.trim()) { toast.error('Enter a denial reason.'); return; }
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const booking = bookings.find((b) => b.id === req.original_booking_id);
    if (!booking) { toast.error('Original booking not found.'); return; }

    setCrActionLoading(requestId);
    try {
      await updateRequest(requestId, {
        status: 'denied',
        reviewed_by: user?.id,
      });
      notifyChangeRequestDenied(booking, req.created_by, user?.full_name || 'Admin', denyReasonText.trim());
      if (user) auditChangeRequestReview(user.id, requestId, booking.id, 'denied', denyReasonText.trim());
      toast.success('Change request denied.');
      setDenyingRequestId(null);
      setDenyReasonText('');
      await loadRequests();
    } catch (err) {
      console.error('Failed to deny change request:', err);
      toast.error('Failed to deny change request. Please try again.');
    } finally {
      setCrActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    let result = bookings;

    // ── Scope to date range based on view mode ──
    if (viewMode === '2week' && isAdmin) {
      result = result.filter((b) => b.date >= dateStr && b.date <= endDateStr);
    } else {
      result = result.filter((b) => b.date === dateStr);
    }

    if (!isAdmin && user?.department_id) {
      result = result.filter((b) => b.department_id === user.department_id);
    }
    if (deptFilter !== 'all') {
      result = result.filter((b) => b.department_id === deptFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.patient_name.toLowerCase().includes(term) ||
          b.procedure.toLowerCase().includes(term) ||
          b.surgeon.toLowerCase().includes(term)
      );
    }

    // ── Sort by date then start_time ascending ──
    return [...result].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  }, [bookings, search, statusFilter, deptFilter, isAdmin, user, dateStr, endDateStr, viewMode]);

  // Group bookings by date for the 2-week view
  const groupedByDate = useMemo(() => {
    if (viewMode !== '2week') return [];
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    }
    // Fill in all 14 days even if empty
    const days: { date: string; label: string; bookings: Booking[] }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(currentDate, i);
      const ds = format(d, 'yyyy-MM-dd');
      days.push({
        date: ds,
        label: format(d, 'EEE, MMM d'),
        bookings: map.get(ds) || [],
      });
    }
    return days;
  }, [filtered, viewMode, currentDate]);

  const goTo = (dir: 'prev' | 'next') =>
    setCurrentDate((d) => (dir === 'next' ? addDays(d, 1) : subDays(d, 1)));

  // ── Change Request Detail Modal ──
  const crModalBooking = selectedChangeRequest
    ? bookings.find((b) => b.id === selectedChangeRequest.original_booking_id) ?? null
    : null;

  return (
    <div className="page-container">

      {/* ── Change Request Detail Modal ── */}
      <AnimatePresence>
        {selectedChangeRequest && (
          <motion.div
            key="cr-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSelectedChangeRequest(null); setCrModalDenying(false); setCrModalDenyReason(''); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">Change Request Details</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Submitted {format(new Date(selectedChangeRequest.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedChangeRequest(null); setCrModalDenying(false); setCrModalDenyReason(''); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* ── Original Booking Info ── */}
                {crModalBooking && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Original Booking</p>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{crModalBooking.procedure}</p>
                          <p className="text-[13px] text-gray-500 mt-0.5">{crModalBooking.patient_name} · {crModalBooking.patient_age}/{crModalBooking.patient_sex}</p>
                        </div>
                        <StatusBadge status={crModalBooking.status} size="sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500">Schedule:</span>
                          <span className="font-medium text-gray-800">{crModalBooking.date} · {formatTime(crModalBooking.start_time)}–{formatTime(crModalBooking.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500">Dept:</span>
                          <span className="font-medium" style={{ color: getDeptColor(crModalBooking.department_id) }}>{getDeptName(crModalBooking.department_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500">Surgeon:</span>
                          <span className="font-medium text-gray-800">{crModalBooking.surgeon}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500">Anesthesiologist:</span>
                          <span className="font-medium text-gray-800">{crModalBooking.anesthesiologist || 'Not assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Ward:</span>
                          <span className="font-medium text-gray-800">{crModalBooking.ward || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Room:</span>
                          <span className="font-medium text-gray-800">{rooms.find((r) => r.id === crModalBooking.or_room_id)?.name || '—'}</span>
                        </div>
                      </div>
                      {crModalBooking.notes && (
                        <p className="text-[12px] text-gray-500 italic border-t border-gray-200 pt-2">Notes: {crModalBooking.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Requested Changes ── */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Requested Changes</p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                    {/* Schedule change */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-medium text-gray-500 w-24 shrink-0">Schedule</span>
                      <span className="text-[13px] text-gray-500 line-through">
                        {crModalBooking ? `${crModalBooking.date} · ${formatTime(crModalBooking.start_time)}` : '—'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[13px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {selectedChangeRequest.new_date} · {formatTime(selectedChangeRequest.new_preferred_time)}
                      </span>
                    </div>

                    {/* Department change */}
                    {selectedChangeRequest.department_id !== crModalBooking?.department_id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-gray-500 w-24 shrink-0">Department</span>
                        <span className="text-[13px] text-gray-500 line-through">{crModalBooking ? getDeptName(crModalBooking.department_id) : '—'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[13px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">{getDeptName(selectedChangeRequest.department_id)}</span>
                      </div>
                    )}

                    {/* Procedure change */}
                    {selectedChangeRequest.procedure && selectedChangeRequest.procedure !== crModalBooking?.procedure && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-gray-500 w-24 shrink-0">Procedure</span>
                        <span className="text-[13px] text-gray-500 line-through">{crModalBooking?.procedure}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[13px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">{selectedChangeRequest.procedure}</span>
                      </div>
                    )}

                    {/* Anesthesiologist change */}
                    {selectedChangeRequest.preferred_anesthesiologist && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-gray-500 w-24 shrink-0">Anesthesiologist</span>
                        <span className="text-[13px] text-gray-500 line-through">{crModalBooking?.anesthesiologist || 'Not assigned'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[13px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">{selectedChangeRequest.preferred_anesthesiologist}</span>
                      </div>
                    )}

                    {/* Patient details */}
                    {selectedChangeRequest.patient_details && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-gray-500 w-24 shrink-0">Patient</span>
                        <span className="text-[13px] text-gray-700">{selectedChangeRequest.patient_details}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Reason ── */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason for Change</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                    <p className="text-[13px] font-medium text-gray-800">{selectedChangeRequest.reason}{selectedChangeRequest.reason_other ? ` — ${selectedChangeRequest.reason_other}` : ''}</p>
                    {selectedChangeRequest.additional_info && (
                      <p className="text-[12px] text-gray-500 mt-1.5">{selectedChangeRequest.additional_info}</p>
                    )}
                  </div>
                </div>

                {/* ── Deny input ── */}
                {crModalDenying && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Denial Reason</p>
                    <input
                      type="text"
                      autoFocus
                      value={crModalDenyReason}
                      onChange={(e) => setCrModalDenyReason(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setCrModalDenying(false)}
                      placeholder="Enter reason for denial..."
                      className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer ─ Actions */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                {crModalDenying ? (
                  <>
                    <button
                      onClick={() => { setCrModalDenying(false); setCrModalDenyReason(''); }}
                      className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!crModalDenyReason.trim()) { toast.error('Enter a denial reason.'); return; }
                        setDenyReasonText(crModalDenyReason);
                        // temporarily set denyReasonText and call handler
                        const req = selectedChangeRequest;
                        const bk = bookings.find((b) => b.id === req.original_booking_id);
                        if (!bk) { toast.error('Original booking not found.'); return; }
                        setCrActionLoading(req.id);
                        try {
                          await updateRequest(req.id, { status: 'denied', reviewed_by: user?.id });
                          notifyChangeRequestDenied(bk, req.created_by, user?.full_name || 'Admin', crModalDenyReason.trim());
                          if (user) auditChangeRequestReview(user.id, req.id, bk.id, 'denied', crModalDenyReason.trim());
                          toast.success('Change request denied.');
                          setSelectedChangeRequest(null);
                          setCrModalDenying(false);
                          setCrModalDenyReason('');
                          await loadRequests();
                        } catch { toast.error('Failed to deny.'); }
                        finally { setCrActionLoading(null); }
                      }}
                      disabled={crActionLoading === selectedChangeRequest.id}
                      className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {crActionLoading === selectedChangeRequest.id ? 'Denying...' : 'Confirm Deny'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedChangeRequest(null); }}
                      className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setCrModalDenying(true)}
                      disabled={crActionLoading === selectedChangeRequest.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Deny
                    </button>
                    <button
                      onClick={async () => {
                        await handleApproveRequest(selectedChangeRequest.id);
                        setSelectedChangeRequest(null);
                      }}
                      disabled={crActionLoading === selectedChangeRequest.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {crActionLoading === selectedChangeRequest.id ? 'Approving...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My Bookings Slide-over Panel (dept users) ── */}
      <AnimatePresence>
        {showMyBookingsPanel && (
          <>
            <motion.div
              key="my-bookings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setShowMyBookingsPanel(false)}
            />
            <motion.div
              key="my-bookings-drawer"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">My Bookings</h2>
                    <p className="text-[11px] text-gray-400">{getDeptName(user?.department_id as any)} · all dates</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-[11px] font-bold border border-accent-200">
                    {myAllBookings.length}
                  </span>
                  <button
                    onClick={() => setShowMyBookingsPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {myAllBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">No bookings yet.</p>
                  </div>
                ) : (
                  myAllBookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.or_room_id);
                    const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    });
                    return (
                      <div
                        key={b.id}
                        className="px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => { setShowMyBookingsPanel(false); setSelectedBooking(b); }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-1 rounded-full self-stretch flex-shrink-0"
                            style={{ backgroundColor: getDeptColor(b.department_id) }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                              <StatusBadge status={b.status} size="sm" />
                            </div>
                            <p className="text-[13px] text-gray-600">{b.patient_name} · {b.patient_age}/{b.patient_sex}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {room?.name || 'No room assigned'} · Ward {b.ward || '—'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {b.date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                            </p>
                            {b.is_emergency && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">🚨 Emergency</span>
                            )}
                            <p className="text-[11px] text-gray-400 mt-1">Submitted {submittedAt}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Pending Cases Slide-over Panel ── */}
      <AnimatePresence>
        {showPendingPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              key="pending-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setShowPendingPanel(false)}
            />
            {/* Drawer */}
            <motion.div
              key="pending-drawer"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">Pending Cases</h2>
                    <p className="text-[11px] text-gray-400">All unreviewed bookings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">
                    {allPendingBookings.length}
                  </span>
                  <button
                    onClick={() => setShowPendingPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {allPendingBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm text-gray-400">All caught up! No pending cases.</p>
                  </div>
                ) : (
                  allPendingBookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.or_room_id);
                    const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    });
                    const isApproving = panelApprovingId === b.id;
                    const isDenying = panelDenyingId === b.id;
                    return (
                      <div key={b.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-1 rounded-full self-stretch flex-shrink-0"
                            style={{ backgroundColor: getDeptColor(b.department_id) }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                              {b.is_emergency && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md shrink-0">🚨 EMRG</span>
                              )}
                            </div>
                            <p className="text-[13px] text-gray-600">{b.patient_name} · {b.patient_age}/{b.patient_sex}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {getDeptName(b.department_id)} · {room?.name || 'No room'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {b.date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Submitted {submittedAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 ml-4">
                          <button
                            onClick={() => { setShowPendingPanel(false); setSelectedBooking(b); }}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handlePanelApprove(b.id)}
                            disabled={isApproving || isDenying}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                          >
                            {isApproving ? (
                              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handlePanelDeny(b.id)}
                            disabled={isApproving || isDenying}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                          >
                            {isDenying ? (
                              <span className="inline-block w-3.5 h-3.5 border-2 border-red-300/40 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Deny
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="page-header mb-0">
            <h1>Bookings</h1>
            <p>
              {isAdmin ? 'All department bookings' : `${getDeptName(user?.department_id as any)} bookings`}
            </p>
          </div>
          <PageHelpButton {...BOOKINGS_HELP} />
        </div>

        {/* Daily pagination navigator */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-[10px] px-1 py-1 self-start sm:self-auto">
          <button
            onClick={() => goTo('prev')}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Clickable date label — opens calendar popover */}
          <DayPickerPopover date={currentDate} onChange={setCurrentDate} />

          <button
            onClick={() => goTo('next')}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday(currentDate) && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-1 px-2 py-1 rounded-lg text-[11px] font-medium text-accent-600 hover:bg-accent-50 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* View mode toggle — admin only */}
        {isAdmin && (
          <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-[10px] px-1 py-1 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                viewMode === 'day'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('2week')}
              className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === '2week'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              2 Weeks
            </button>
          </div>
        )}
      </div>

      {/* ── Change Request Review Panel (admin only) ── */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[10px] overflow-hidden">
          <button
            onClick={() => setShowChangeRequests((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-[13px] font-semibold text-amber-800">
                Pending Change Requests ({pendingRequests.length})
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${showChangeRequests ? 'rotate-180' : ''}`} />
          </button>
          {showChangeRequests && (
            <div className="px-4 pb-3 space-y-2">
              {pendingRequests.map((req) => {
                const booking = bookings.find((b) => b.id === req.original_booking_id);
                const isDenying = denyingRequestId === req.id;
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-lg border border-amber-100 p-3 space-y-2 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors"
                    onClick={() => { setSelectedChangeRequest(req); setCrModalDenying(false); setCrModalDenyReason(''); }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900">{req.procedure}</p>
                        <p className="text-[12px] text-gray-500">
                          {getDeptName(req.department_id)} · {req.patient_details}
                        </p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Requested: <span className="font-medium text-gray-700">{req.new_date} {formatTime(req.new_preferred_time)}</span>
                          {' · '}{req.reason}{req.reason_other ? ` — ${req.reason_other}` : ''}
                        </p>
                        {booking && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Original: {booking.date} {formatTime(booking.start_time)} · {booking.procedure}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[11px] text-gray-400">
                          {format(new Date(req.created_at), 'MMM d, h:mm a')}
                        </span>
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">View details →</span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                    {isDenying ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={denyReasonText}
                          onChange={(e) => setDenyReasonText(e.target.value)}
                          placeholder="Denial reason..."
                          className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-accent-300 focus:ring-1 focus:ring-accent-200 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleDenyRequest(req.id)}
                          disabled={crActionLoading === req.id}
                          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          Confirm Deny
                        </button>
                        <button
                          onClick={() => { setDenyingRequestId(null); setDenyReasonText(''); }}
                          className="px-2 py-1.5 text-[11px] text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          disabled={crActionLoading === req.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => setDenyingRequestId(req.id)}
                          disabled={crActionLoading === req.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          Deny
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[10px] border border-gray-200 px-3 md:px-4 py-3 space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-3">
        <div className="relative flex-1 min-w-0 md:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, procedure..."
            className="w-full py-2.5 md:py-2 input-base"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <CustomSelect
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
              options={[
                { value: 'all', label: 'All Depts' },
                ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
              ]}
              className="shrink-0"
            />
          )}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              ...BOOKING_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
            ]}
            className="shrink-0"
          />
          {isAdmin && (
            <button
              onClick={() => setShowPendingPanel(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold hover:bg-amber-100 active:bg-amber-200 transition-colors shrink-0"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Pending Cases
              {allPendingBookings.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {allPendingBookings.length}
                </span>
              )}
            </button>
          )}
          {!isAdmin && user?.department_id && (
            <button
              onClick={() => setShowMyBookingsPanel(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-[12px] font-semibold hover:bg-accent-100 active:bg-accent-200 transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              My Bookings
              {myAllBookings.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-600 text-white text-[10px] font-bold">
                  {myAllBookings.length > 99 ? '99+' : myAllBookings.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Count summary */}
      <p className="text-[12px] text-gray-400 -mt-1">
        {filtered.length} booking{filtered.length !== 1 ? 's' : ''}{' '}
        {viewMode === '2week' && isAdmin ? (
          <>from <span className="font-medium text-gray-600">{format(currentDate, 'MMM d')}</span> to <span className="font-medium text-gray-600">{format(addDays(currentDate, 13), 'MMM d, yyyy')}</span></>
        ) : (
          <>on <span className="font-medium text-gray-600">{format(currentDate, 'MMMM d, yyyy')}</span></>
        )}
      </p>

      {/* Cards — Day view */}
      {(viewMode === 'day' || !isAdmin) && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
            >
              {filtered.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} rooms={rooms} isAdmin={isAdmin} onSelect={setSelectedBooking} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-sm text-gray-400">
              No bookings for {format(currentDate, 'MMMM d, yyyy')}.
            </div>
          )}
        </>
      )}

      {/* Cards — 2-Week view (admin only) */}
      {viewMode === '2week' && isAdmin && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`2w-${dateStr}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {groupedByDate.map((group) => {
                const dateObj = new Date(group.date + 'T00:00:00');
                const isGroupToday = isToday(dateObj);
                return (
                  <div key={group.date}>
                    {/* Day header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-[13px] font-bold ${
                        isGroupToday ? 'text-accent-600' : 'text-gray-700'
                      }`}>
                        {isGroupToday ? 'Today · ' : ''}{group.label}
                      </h3>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        group.bookings.length > 0
                          ? 'bg-accent-50 text-accent-700'
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        {group.bookings.length}
                      </span>
                    </div>

                    {group.bookings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                        {group.bookings.map((b, i) => (
                          <BookingCard key={b.id} booking={b} index={i} rooms={rooms} isAdmin={isAdmin} onSelect={setSelectedBooking} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-3 text-center text-[12px] text-gray-300 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                        No bookings scheduled
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-sm text-gray-400">
              No bookings in the next 2 weeks.
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          rooms={rooms}
        />
      )}

      {/* Change schedule modal */}
      {changeBooking && (
        <ChangeScheduleModal
          isOpen={isChangeFormOpen}
          onClose={closeChangeForm}
          booking={changeBooking}
        />
      )}
    </div>
  );
}

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, CalendarDays, Clock, ChevronDown } from 'lucide-react';
import {
  format, addDays, subDays, isToday, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay,
} from 'date-fns';
import { useORRoomsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { DEPARTMENTS, BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptName, formatTime } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useBookingsStore } from '../stores/appStore';
import BookingDetailModal from '../components/booking/BookingDetailModal';
import ChangeScheduleModal from '../components/booking/ChangeScheduleModal';
import type { Booking } from '../lib/types';

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

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { isChangeFormOpen, changeBooking, closeChangeForm } = useBookingsStore();
  const { bookings } = useBookingsStore();
  const { rooms } = useORRoomsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const filtered = useMemo(() => {
    let result = bookings;

    // ── Scope to current date (daily pagination) ──
    result = result.filter((b) => b.date === dateStr);

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

    // ── Sort by start_time ascending ──
    return [...result].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings, search, statusFilter, deptFilter, isAdmin, user, dateStr]);

  const goTo = (dir: 'prev' | 'next') =>
    setCurrentDate((d) => (dir === 'next' ? addDays(d, 1) : subDays(d, 1)));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="page-header mb-0">
          <h1>Bookings</h1>
          <p>
            {isAdmin ? 'All department bookings' : `${getDeptName(user?.department_id as any)} bookings`}
          </p>
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
      </div>

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
        </div>
      </div>

      {/* Count summary */}
      <p className="text-[12px] text-gray-400 -mt-1">
        {filtered.length} booking{filtered.length !== 1 ? 's' : ''} on{' '}
        <span className="font-medium text-gray-600">{format(currentDate, 'MMMM d, yyyy')}</span>
      </p>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dateStr}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
        >
          {filtered.map((b, i) => {
            const room = rooms.find((r) => r.id === b.or_room_id);
            const submittedAt = new Date(b.created_at).toLocaleString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            });
            return (
              <motion.div
                key={b.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: Math.min(i * 0.03, 0.3) }}
                className="bg-white rounded-[10px] border border-gray-200 overflow-hidden hover:shadow-sm active:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setSelectedBooking(b)}
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
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-sm text-gray-400">
          No bookings for {format(currentDate, 'MMMM d, yyyy')}.
        </div>
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

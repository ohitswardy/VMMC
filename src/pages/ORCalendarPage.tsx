import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, AlertTriangle,
  Clock, User, MapPin, Printer
} from 'lucide-react';
import {
  format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths,
  subMonths, isSameMonth, isSameDay
} from 'date-fns';
import { useBookingsStore, useORRoomsStore, useORPriorityScheduleStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { getDeptColor, getDeptBg, getDeptName, formatTime, generateTimeSlots, getRoomPriorityForDay, getAllPrioritiesForDay, getWeekdayName } from '../lib/utils';
import type { RoomPriorityInfo } from '../lib/utils';
import type { Booking, ORRoom } from '../lib/types';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import BookingFormModal from '../components/booking/BookingFormModal';
import ChangeScheduleModal from '../components/booking/ChangeScheduleModal';
import BookingDetailModal from '../components/booking/BookingDetailModal';
import { generateSchedulePDF } from '../lib/generateSchedulePDF';

type ViewMode = 'day' | 'week' | 'month';

export default function ORCalendarPage() {
  const { user } = useAuthStore();
  const {
    selectedDate, setSelectedDate, isFormOpen, openForm, closeForm,
    isChangeFormOpen, closeChangeForm, changeBooking,
  } = useBookingsStore();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileRoomIdx, setMobileRoomIdx] = useState(0);

  // Always show today's date when the calendar page is first visited
  useEffect(() => {
    setSelectedDate(new Date());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { rooms } = useORRoomsStore();
  const { bookings } = useBookingsStore();
  const { schedule } = useORPriorityScheduleStore();

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const isDeptUser = user?.role === 'department_user';
  const canBook = isAdmin || isDeptUser;

  const handlePrintPDF = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await generateSchedulePDF(dateStr, bookings, rooms);
  };

  /* -- navigation -- */
  const navigate = (dir: 'prev' | 'next') => {
    const fwd = dir === 'next';
    if (viewMode === 'month') setSelectedDate(fwd ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
    else if (viewMode === 'week') setSelectedDate(fwd ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    else setSelectedDate(fwd ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };
  const goToToday = () => setSelectedDate(new Date());

  /* -- helpers -- */
  const getBookingsForDate = useCallback((date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.date === ds && !['cancelled', 'denied'].includes(b.status))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings]);

  const getBookingsForRoomDate = useCallback((roomId: string, date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.or_room_id === roomId && b.date === ds && !['cancelled', 'denied'].includes(b.status))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings]);

  const getRoomName = useCallback((id: string) => rooms.find(r => r.id === id)?.name ?? id, [rooms]);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleSlotClick = (roomId: string | null, date: Date) => {
    if (!canBook) return;
    useBookingsStore.getState().setSelectedRoom(roomId);
    setSelectedDate(date);
    openForm();
  };

  const handleDrillDown = (day: Date) => {
    setSelectedDate(day);
    setViewMode('day');
  };

  /* -- derived labels -- */
  const dateLabel = useMemo(() => {
    if (viewMode === 'month') return format(selectedDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d')} \u2013 ${format(e, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'EEEE, MMMM d, yyyy');
  }, [selectedDate, viewMode]);

  const mobileDateLabel = useMemo(() => {
    if (viewMode === 'month') return format(selectedDate, 'MMM yyyy');
    if (viewMode === 'week') {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d')} \u2013 ${format(e, 'd')}`;
    }
    return format(selectedDate, 'EEE, MMM d');
  }, [selectedDate, viewMode]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: s, end: e });
  }, [selectedDate]);

  const timeSlots = generateTimeSlots(30);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1>OR Schedule</h1>
          <p>Interactive operating room calendar</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />}
              className="hidden sm:inline-flex"
              onClick={handlePrintPDF}>
              Print PDF
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" icon={<AlertTriangle className="w-4 h-4" />}
              className="hidden sm:inline-flex"
              onClick={() => { useBookingsStore.getState().setSelectedRoom(null); openForm(); }}>
              Emergency
            </Button>
          )}
          {canBook && (
            <Button size="sm" icon={<Plus className="w-4 h-4" />}
              onClick={() => { useBookingsStore.getState().setSelectedRoom(null); openForm(); }}>
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">Book</span>
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 md:px-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <button onClick={() => navigate('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={goToToday}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors shrink-0">
              Today
            </button>
            <button onClick={() => navigate('next')}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-sm md:text-base font-semibold text-gray-900 ml-2 truncate">
              <span className="md:hidden">{mobileDateLabel}</span>
              <span className="hidden md:inline">{dateLabel}</span>
            </h2>
            {isToday(selectedDate) && viewMode === 'day' && (
              <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-accent-50 text-accent-700 text-[10px] font-bold border border-accent-100 shrink-0">
                TODAY
              </span>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-2.5 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {viewMode === 'day' && (
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {rooms.map((room, idx) => {
              const hasPriority = getRoomPriorityForDay(room, schedule, getWeekdayName(selectedDate)).length > 0;
              return (
                <button key={room.id} onClick={() => setMobileRoomIdx(idx)}
                  className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                    mobileRoomIdx === idx ? 'bg-accent-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}>
                  {room.name}
                  {hasPriority && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'month' && (
          <motion.div key="month" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <MonthView currentMonth={selectedDate} selectedDay={selectedDate}
              onSelectDay={setSelectedDate} onDrillDown={handleDrillDown}
              getBookingsForDate={getBookingsForDate} getRoomName={getRoomName}
              onBookingClick={handleBookingClick} onSlotClick={handleSlotClick} canBook={canBook} />
          </motion.div>
        )}
        {viewMode === 'week' && (
          <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <WeekView weekDays={weekDays} getBookingsForDate={getBookingsForDate}
              getRoomName={getRoomName} onBookingClick={handleBookingClick}
              onSlotClick={handleSlotClick} canBook={canBook} />
          </motion.div>
        )}
        {viewMode === 'day' && (
          <motion.div key="day" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <DayView rooms={rooms} date={selectedDate} timeSlots={timeSlots}
              getBookingsForRoomDate={getBookingsForRoomDate} onBookingClick={handleBookingClick}
              onSlotClick={(rid, d) => handleSlotClick(rid, d)} canBook={canBook}
              mobileRoomIdx={mobileRoomIdx} schedule={schedule} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <BookingFormModal isOpen={isFormOpen} onClose={closeForm} rooms={rooms} bookings={bookings} />
      {changeBooking && (
        <ChangeScheduleModal isOpen={isChangeFormOpen} onClose={closeChangeForm} booking={changeBooking} />
      )}
      {selectedBooking && (
        <BookingDetailModal isOpen={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedBooking(null); }}
          booking={selectedBooking} />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Month View
   ═══════════════════════════════════════════════════════════════════ */
function MonthView({
  currentMonth, selectedDay, onSelectDay, onDrillDown,
  getBookingsForDate, getRoomName, onBookingClick, onSlotClick, canBook,
}: {
  currentMonth: Date;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  onDrillDown: (d: Date) => void;
  getBookingsForDate: (d: Date) => Booking[];
  getRoomName: (id: string) => string;
  onBookingClick: (b: Booking) => void;
  onSlotClick: (roomId: string | null, d: Date) => void;
  canBook: boolean;
}) {
  const monthDays = useMemo(() => {
    const mStart = startOfMonth(currentMonth);
    const calStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDayBookings = getBookingsForDate(selectedDay);

  return (
    <div className="space-y-3">
      {/* Calendar Grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
            {dayHeaders.map(d => (
              <div key={d} className="py-2.5 text-center text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
                <span className="md:hidden">{d.charAt(0)}</span>
                <span className="hidden md:inline">{d}</span>
              </div>
            ))}
          </div>

          {/* Date Cells */}
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dayBookings = getBookingsForDate(day);
              const inMonth = isSameMonth(day, currentMonth);
              const selected = isSameDay(day, selectedDay);
              const today = isToday(day);
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onSelectDay(day)}
                  onDoubleClick={() => onDrillDown(day)}
                  className={`
                    relative flex flex-col items-center md:items-start
                    min-h-[54px] md:min-h-[100px] p-1.5 md:p-2
                    border-b border-r border-gray-100
                    transition-colors duration-100 text-left
                    ${selected ? 'bg-accent-50/60' : 'hover:bg-gray-50'}
                    ${!inMonth ? 'opacity-30' : ''}
                  `}
                >
                  {/* Date circle */}
                  <div className="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 mb-0.5 shrink-0">
                    {selected && (
                      <motion.div
                        layoutId="monthSelected"
                        className="absolute inset-0 bg-accent-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {today && !selected && (
                      <div className="absolute inset-0 border-2 border-accent-400 rounded-full" />
                    )}
                    <span className={`relative z-10 text-sm font-medium select-none ${
                      selected ? 'text-white font-semibold'
                      : today ? 'text-accent-700 font-bold'
                      : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Mobile: booking dots */}
                  {hasBookings && (
                    <div className="flex gap-[3px] md:hidden mt-0.5">
                      {dayBookings.slice(0, 3).map((b, i) => (
                        <span key={i} className="w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: getDeptColor(b.department_id) }} />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[7px] text-gray-400 leading-none self-center ml-px">
                          +{dayBookings.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Desktop: event chips */}
                  <div className="hidden md:flex flex-col gap-[3px] w-full mt-1 overflow-hidden flex-1">
                    {dayBookings.slice(0, 3).map(b => (
                      <div
                        key={b.id}
                        className="flex items-center gap-1 px-1.5 py-[3px] rounded text-[10px] cursor-pointer hover:brightness-95 transition-all truncate"
                        style={{
                          backgroundColor: getDeptBg(b.department_id),
                          borderLeft: `2px solid ${getDeptColor(b.department_id)}`,
                        }}
                        onClick={e => { e.stopPropagation(); onBookingClick(b); }}
                      >
                        <span className="font-semibold truncate" style={{ color: getDeptColor(b.department_id) }}>
                          {formatTime(b.start_time)}
                        </span>
                        <span className="text-gray-600 truncate">{b.procedure}</span>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-[10px] text-gray-400 px-1.5 font-medium">
                        +{dayBookings.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Selected Day Booking Panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canBook && (
              <button
                onClick={() => onSlotClick(null, selectedDay)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-700 bg-accent-50 hover:bg-accent-100 transition-colors"
              >
                + Add
              </button>
            )}
            <button
              onClick={() => onDrillDown(selectedDay)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              View Day
            </button>
          </div>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No bookings scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {selectedDayBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                onClick={() => onBookingClick(booking)}
              >
                <div className="shrink-0 w-[60px] pt-0.5">
                  <p className="text-xs font-semibold text-gray-900 tabular-nums">{formatTime(booking.start_time)}</p>
                  <p className="text-[11px] text-gray-400 tabular-nums">{formatTime(booking.end_time)}</p>
                </div>
                <div className="w-[3px] self-stretch rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: getDeptColor(booking.department_id) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold" style={{ color: getDeptColor(booking.department_id) }}>
                      {getDeptName(booking.department_id)}
                    </span>
                    <StatusBadge status={booking.status} size="sm" />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{booking.procedure}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 shrink-0" /> {booking.patient_name}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" /> {getRoomName(booking.or_room_id)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Week View
   ═══════════════════════════════════════════════════════════════════ */
function WeekView({
  weekDays, getBookingsForDate, getRoomName, onBookingClick, onSlotClick, canBook,
}: {
  weekDays: Date[];
  getBookingsForDate: (d: Date) => Booking[];
  getRoomName: (id: string) => string;
  onBookingClick: (b: Booking) => void;
  onSlotClick: (roomId: string | null, d: Date) => void;
  canBook: boolean;
}) {
  return (
    <div className="space-y-2">
      {/* Mobile: stacked day cards */}
      <div className="md:hidden space-y-2">
        {weekDays.map((day, di) => {
          const dayBookings = getBookingsForDate(day);
          const todayFlag = isToday(day);
          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.03, duration: 0.15 }}
              className={`bg-white rounded-xl border overflow-hidden ${
                todayFlag ? 'border-accent-200 ring-1 ring-accent-100' : 'border-gray-200'
              }`}
            >
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                todayFlag ? 'bg-accent-50 border-accent-100' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    todayFlag ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{format(day, 'EEEE')}</p>
                    <p className="text-[10px] text-gray-400">{format(day, 'MMMM yyyy')}</p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {dayBookings.length} case{dayBookings.length !== 1 ? 's' : ''}
                </span>
              </div>

              {dayBookings.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-gray-300">No bookings scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {dayBookings.map(b => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onBookingClick(b)}
                    >
                      <div className="w-[3px] h-10 rounded-full shrink-0"
                        style={{ backgroundColor: getDeptColor(b.department_id) }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                        <p className="text-[11px] text-gray-500">
                          {formatTime(b.start_time)} – {formatTime(b.end_time)} · {getRoomName(b.or_room_id)}
                        </p>
                      </div>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => {
            const todayFlag = isToday(day);
            return (
              <div key={day.toISOString()}
                className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${todayFlag ? 'bg-accent-50/60' : ''}`}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{format(day, 'EEE')}</p>
                <div className="flex items-center justify-center mt-1">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-base font-bold ${
                    todayFlag ? 'bg-accent-600 text-white' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 divide-x divide-gray-100" style={{ minHeight: 320 }}>
          {weekDays.map(day => {
            const dayBookings = getBookingsForDate(day);
            const todayFlag = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`p-1.5 space-y-1 ${todayFlag ? 'bg-accent-50/20' : ''}`}
                onClick={() => canBook && onSlotClick(null, day)}
                style={{ cursor: canBook ? 'pointer' : 'default' }}
              >
                {dayBookings.map(b => (
                  <div
                    key={b.id}
                    className="px-2 py-1.5 rounded-md text-[10px] cursor-pointer hover:brightness-95 transition-all"
                    style={{
                      backgroundColor: getDeptBg(b.department_id),
                      borderLeft: `2px solid ${getDeptColor(b.department_id)}`,
                    }}
                    onClick={e => { e.stopPropagation(); onBookingClick(b); }}
                  >
                    <span className="font-bold" style={{ color: getDeptColor(b.department_id) }}>
                      {formatTime(b.start_time)}
                    </span>
                    <p className="font-semibold text-gray-700 truncate mt-0.5">{b.procedure}</p>
                    <p className="text-gray-500 truncate">{b.patient_name} · {getRoomName(b.or_room_id)}</p>
                  </div>
                ))}
                {dayBookings.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center pt-8">No bookings</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Day View
   ═══════════════════════════════════════════════════════════════════ */
function DayView({
  rooms, date, timeSlots, getBookingsForRoomDate,
  onBookingClick, onSlotClick, canBook, mobileRoomIdx, schedule,
}: {
  rooms: ORRoom[];
  date: Date;
  timeSlots: string[];
  getBookingsForRoomDate: (roomId: string, d: Date) => Booking[];
  onBookingClick: (b: Booking) => void;
  onSlotClick: (roomId: string, d: Date) => void;
  canBook: boolean;
  mobileRoomIdx: number;
  schedule: Record<string, string>;
}) {
  const mobileRoom = rooms[mobileRoomIdx];
  const mobileBookings = mobileRoom ? getBookingsForRoomDate(mobileRoom.id, date) : [];
  const weekday = getWeekdayName(date);
  const dayPriorities = getAllPrioritiesForDay(schedule, weekday);

  const getBookingStyle = (booking: Booking) => {
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    const startMin = (sh - 7) * 60 + sm;
    const endMin = (eh - 7) * 60 + em;
    const top = (startMin / (12 * 60)) * 100;
    const height = ((endMin - startMin) / (12 * 60)) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
  };

  return (
    <>
      {/* Day Priority Summary */}
      {dayPriorities.length > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <p className="text-[11px] font-semibold text-amber-700 mb-1">📋 OR Priority Schedule — {weekday}</p>
          <div className="flex flex-wrap gap-1.5">
            {dayPriorities.map(p => (
              <span key={p.deptId} className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
                style={{ backgroundColor: p.bg, color: p.color }}>
                {p.deptName}: {p.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: single-room timeline */}
      <div className="md:hidden bg-white rounded-xl border border-gray-200 overflow-hidden">
        {mobileRoom && (() => {
          const roomPriorities = getRoomPriorityForDay(mobileRoom, schedule, weekday);
          return (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <p className="text-sm font-bold text-gray-900">{mobileRoom.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {mobileRoom.designation} · {mobileBookings.length} case{mobileBookings.length !== 1 ? 's' : ''}
              </p>
              {roomPriorities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {roomPriorities.map(p => (
                    <span key={p.deptId} className="inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: p.bg, color: p.color }}>
                      ★ {p.deptName} {p.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="relative">
          {timeSlots.map(slot => (
            <div
              key={slot}
              className="flex border-b border-gray-50 min-h-[52px]"
              onClick={() => canBook && mobileRoom && onSlotClick(mobileRoom.id, date)}
            >
              <div className="w-14 shrink-0 px-2 py-2 border-r border-gray-100 flex items-start">
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">{formatTime(slot)}</span>
              </div>
              <div className="flex-1 px-2 py-1.5 space-y-1">
                {mobileBookings
                  .filter(b => {
                    const [sh, sm] = b.start_time.split(':').map(Number);
                    const [slH, slM] = slot.split(':').map(Number);
                    return sh === slH && sm === slM;
                  })
                  .map(booking => {
                    const deptColor = getDeptColor(booking.department_id);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg px-3 py-2.5 cursor-pointer active:scale-[0.98] transition-transform ${
                          booking.status === 'ongoing' ? 'ring-2 ring-emerald-300' : ''
                        }`}
                        style={{ backgroundColor: getDeptBg(booking.department_id), borderLeft: `3px solid ${deptColor}` }}
                        onClick={e => { e.stopPropagation(); onBookingClick(booking); }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold" style={{ color: deptColor }}>
                            {getDeptName(booking.department_id)}
                          </span>
                          <StatusBadge status={booking.status} size="sm" />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-800">{booking.procedure}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {booking.patient_name} · {booking.surgeon.split('/')[0]}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                        </p>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: multi-room time grid */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div
          className="grid border-b border-gray-200"
          style={{ gridTemplateColumns: `72px repeat(${rooms.length}, 1fr)` }}
        >
          <div className="px-3 py-3 text-[11px] font-medium text-gray-400 border-r border-gray-100 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Time
          </div>
          {rooms.map(room => {
            const roomPriorities = getRoomPriorityForDay(room, schedule, weekday);
            return (
              <div key={room.id} className="px-2 py-3 text-center border-r border-gray-100 last:border-r-0">
                <p className="text-xs font-bold text-gray-900">{room.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{room.designation}</p>
                {roomPriorities.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                    {roomPriorities.map(p => (
                      <span key={p.deptId} className="inline-flex items-center text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: p.bg, color: p.color }}>
                        ★ {p.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="relative grid"
          style={{ gridTemplateColumns: `72px repeat(${rooms.length}, 1fr)` }}
        >
          <div className="border-r border-gray-100">
            {timeSlots.map(slot => (
              <div key={slot} className="h-14 px-3 flex items-start pt-1 border-b border-gray-50">
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">{formatTime(slot)}</span>
              </div>
            ))}
          </div>

          {rooms.map(room => {
            const roomBookings = getBookingsForRoomDate(room.id, date);
            return (
              <div
                key={room.id}
                className="relative border-r border-gray-100 last:border-r-0"
                onClick={() => canBook && onSlotClick(room.id, date)}
                style={{ cursor: canBook ? 'pointer' : 'default' }}
              >
                {timeSlots.map(slot => (
                  <div key={slot} className="h-14 border-b border-gray-50 hover:bg-accent-50/20 transition-colors" />
                ))}
                <div className="absolute inset-0">
                  {roomBookings.map(booking => {
                    const style = getBookingStyle(booking);
                    const deptColor = getDeptColor(booking.department_id);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute left-1 right-1 rounded-md px-2 py-1.5 cursor-pointer overflow-hidden
                          transition-shadow hover:shadow-md hover:z-10
                          ${booking.status === 'ongoing' ? 'ring-2 ring-emerald-300' : ''}
                        `}
                        style={{
                          ...style,
                          backgroundColor: getDeptBg(booking.department_id),
                          borderLeft: `3px solid ${deptColor}`,
                        }}
                        onClick={e => { e.stopPropagation(); onBookingClick(booking); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold truncate" style={{ color: deptColor }}>
                            {getDeptName(booking.department_id)}
                          </span>
                          <StatusBadge status={booking.status} size="sm" />
                        </div>
                        <p className="text-[11px] font-semibold text-gray-800 truncate mt-0.5">{booking.procedure}</p>
                        <p className="text-[10px] text-gray-500 truncate">{booking.patient_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

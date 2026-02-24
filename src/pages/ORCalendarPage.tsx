import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, AlertTriangle, Calendar as CalIcon,
  Clock, ChevronDown
} from 'lucide-react';
import {
  format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isToday, addWeeks, subWeeks
} from 'date-fns';
import { useBookingsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { MOCK_BOOKINGS, MOCK_OR_ROOMS } from '../lib/mockData';
import { getDeptColor, getDeptBg, getDeptName, formatTime, generateTimeSlots } from '../lib/utils';
import type { Booking } from '../lib/types';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import BookingFormModal from '../components/booking/BookingFormModal';
import ChangeScheduleModal from '../components/booking/ChangeScheduleModal';
import BookingDetailModal from '../components/booking/BookingDetailModal';

type ViewMode = 'day' | 'week';

export default function ORCalendarPage() {
  const { user } = useAuthStore();
  const {
    selectedDate, setSelectedDate, isFormOpen, openForm, closeForm,
    isChangeFormOpen, closeChangeForm, changeBooking
  } = useBookingsStore();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileRoomIdx, setMobileRoomIdx] = useState(0);

  const rooms = MOCK_OR_ROOMS;
  const bookings = MOCK_BOOKINGS;

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';
  const isDeptUser = user?.role === 'department_user';
  const canBook = isAdmin || isDeptUser;

  const navigate = (dir: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(dir === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
    } else {
      setSelectedDate(dir === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    }
  };

  const goToToday = () => setSelectedDate(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const timeSlots = generateTimeSlots(30);

  const getBookingsForRoomDate = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(
      (b) => b.or_room_id === roomId && b.date === dateStr && !['cancelled', 'denied'].includes(b.status)
    );
  };

  const getBookingStyle = (booking: Booking) => {
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    const startMinutes = (sh - 7) * 60 + sm;
    const endMinutes = (eh - 7) * 60 + em;
    const top = (startMinutes / (12 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (12 * 60)) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleSlotClick = (roomId: string, date: Date) => {
    if (!canBook) return;
    useBookingsStore.getState().setSelectedRoom(roomId);
    setSelectedDate(date);
    openForm();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="page-header">
            <h1>OR Schedule</h1>
            <p>Interactive operating room calendar</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="danger"
                size="sm"
                icon={<AlertTriangle className="w-4 h-4" />}
                className="hidden sm:inline-flex"
                onClick={() => { useBookingsStore.getState().setSelectedRoom(null); openForm(); }}
              >
                Emergency
              </Button>
            )}
            {canBook && (
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => { useBookingsStore.getState().setSelectedRoom(null); openForm(); }}
              >
                <span className="hidden sm:inline">New Booking</span>
                <span className="sm:hidden">Book</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col gap-3 bg-white rounded-[10px] border border-gray-200 px-3 py-3 md:px-4">
        {/* Date nav row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button onClick={() => navigate('prev')} className="p-2 rounded-[8px] hover:bg-gray-100 active:bg-gray-150 touch-target flex-shrink-0 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={goToToday} className="px-2.5 py-1.5 rounded-[8px] text-xs font-semibold bg-accent-50 text-accent-700 hover:bg-accent-100 active:bg-accent-150 flex-shrink-0 transition-colors">
              Today
            </button>
            <button onClick={() => navigate('next')} className="p-2 rounded-[8px] hover:bg-gray-100 active:bg-gray-150 touch-target flex-shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-sm md:text-lg font-semibold text-gray-900 ml-1.5 truncate">
              {viewMode === 'day'
                ? <>
                    <span className="md:hidden">{format(selectedDate, 'EEE, MMM d')}</span>
                    <span className="hidden md:inline">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </>
                : `${format(weekDays[0], 'MMM d')} — ${format(weekDays[6], 'MMM d, yyyy')}`
              }
            </h2>
            {isToday(selectedDate) && viewMode === 'day' && (
              <span className="hidden sm:inline px-2 py-0.5 rounded-[6px] bg-accent-50 text-accent-700 text-[10px] font-bold flex-shrink-0 border border-accent-100">TODAY</span>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-[8px] p-0.5 flex-shrink-0">
            {(['day', 'week'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-150 ${
                  viewMode === mode ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'day' ? 'Day' : 'Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile room selector (day view only) */}
        {viewMode === 'day' && (
          <div className="md:hidden flex items-center gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scroll-snap-x">
            {rooms.map((room, idx) => (
              <button
                key={room.id}
                onClick={() => setMobileRoomIdx(idx)}
                className={`flex-shrink-0 min-w-[80px] px-5 py-3 rounded-[8px] text-sm font-semibold transition-all duration-150 scroll-snap-start touch-target ${
                  mobileRoomIdx === idx
                    ? 'bg-accent-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      {viewMode === 'day' ? (
        <DayView
          rooms={rooms}
          date={selectedDate}
          timeSlots={timeSlots}
          getBookingsForRoomDate={getBookingsForRoomDate}
          getBookingStyle={getBookingStyle}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
          canBook={canBook}
          mobileRoomIdx={mobileRoomIdx}
        />
      ) : (
        <WeekView
          rooms={rooms}
          weekDays={weekDays}
          getBookingsForRoomDate={getBookingsForRoomDate}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
          canBook={canBook}
        />
      )}

      {/* Modals */}
      <BookingFormModal isOpen={isFormOpen} onClose={closeForm} rooms={rooms} bookings={bookings} />
      {changeBooking && (
        <ChangeScheduleModal isOpen={isChangeFormOpen} onClose={closeChangeForm} booking={changeBooking} />
      )}
      {selectedBooking && (
        <BookingDetailModal
          isOpen={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedBooking(null); }}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}

// ── Day View Component ──
function DayView({
  rooms, date, timeSlots, getBookingsForRoomDate, getBookingStyle,
  onBookingClick, onSlotClick, canBook, mobileRoomIdx
}: {
  rooms: typeof MOCK_OR_ROOMS;
  date: Date;
  timeSlots: string[];
  getBookingsForRoomDate: (roomId: string, date: Date) => Booking[];
  getBookingStyle: (booking: Booking) => { top: string; height: string };
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (roomId: string, date: Date) => void;
  canBook: boolean;
  mobileRoomIdx: number;
}) {
  const mobileRoom = rooms[mobileRoomIdx];
  const mobileBookings = mobileRoom ? getBookingsForRoomDate(mobileRoom.id, date) : [];

  return (
    <>
      {/* ─── Mobile: Single room vertical timeline ─── */}
      <div className="md:hidden bg-white rounded-[10px] border border-gray-200 overflow-hidden">
        {/* Room info header */}
        {mobileRoom && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-[15px] font-bold text-gray-900">{mobileRoom.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{mobileRoom.designation} · {mobileBookings.length} booking{mobileBookings.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {timeSlots.map((slot) => {
            const slotBookings = mobileBookings.filter((b) => {
              const [sh] = b.start_time.split(':').map(Number);
              const [slH, slM] = slot.split(':').map(Number);
              const [eh] = b.end_time.split(':').map(Number);
              const slotMin = slH * 60 + slM;
              const startMin = sh * 60;
              const endMin = eh * 60;
              return slotMin >= startMin && slotMin < endMin;
            });

            return (
              <div
                key={slot}
                className="flex border-b border-gray-50 min-h-[52px]"
                onClick={() => canBook && mobileRoom && onSlotClick(mobileRoom.id, date)}
              >
              <div className="w-16 flex-shrink-0 px-2 py-2 border-r border-gray-100 flex items-start">
                  <span className="text-[10px] text-gray-400 font-medium">{formatTime(slot)}</span>
                </div>
                <div className="flex-1 px-2 py-1.5 space-y-1">
                  {mobileBookings
                    .filter((b) => {
                      const [sh, sm] = b.start_time.split(':').map(Number);
                      const [slH, slM] = slot.split(':').map(Number);
                      return sh === slH && sm === slM;
                    })
                    .map((booking) => {
                      const deptColor = getDeptColor(booking.department_id);
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className={`rounded-[8px] px-3 py-2.5 cursor-pointer active:scale-[0.98] transition-transform ${
                            booking.status === 'ongoing' ? 'ring-2 ring-emerald-300' : ''
                          }`}
                          style={{ backgroundColor: getDeptBg(booking.department_id), borderLeft: `3px solid ${deptColor}` }}
                          onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold" style={{ color: deptColor }}>
                              {getDeptName(booking.department_id)}
                            </span>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                          <p className="text-[14px] font-semibold text-gray-800">{booking.procedure}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.patient_name} · {booking.surgeon.split('/')[0]}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
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

      {/* ─── Desktop: multi-room grid ─── */}
      <div className="hidden md:block bg-white rounded-[10px] border border-gray-200 overflow-hidden">
        {/* Room Headers */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `80px repeat(${rooms.length}, 1fr)` }}>
          <div className="px-3 py-3 text-xs font-medium text-gray-400 border-r border-gray-100 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" /> Time
          </div>
          {rooms.map((room) => (
            <div key={room.id} className="px-3 py-3 text-center border-r border-gray-100 last:border-r-0">
              <p className="text-[13px] font-bold text-gray-900">{room.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{room.designation}</p>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative grid" style={{ gridTemplateColumns: `80px repeat(${rooms.length}, 1fr)` }}>
          <div className="border-r border-gray-100">
            {timeSlots.map((slot) => (
              <div key={slot} className="h-14 px-3 flex items-start pt-1 border-b border-gray-50">
                <span className="text-[10px] text-gray-400 font-medium">{formatTime(slot)}</span>
              </div>
            ))}
          </div>

          {rooms.map((room) => {
            const roomBookings = getBookingsForRoomDate(room.id, date);
            return (
              <div
                key={room.id}
                className="relative border-r border-gray-100 last:border-r-0"
                onClick={() => canBook && onSlotClick(room.id, date)}
                style={{ cursor: canBook ? 'pointer' : 'default' }}
              >
                {timeSlots.map((slot) => (
                  <div key={slot} className="h-14 border-b border-gray-50 hover:bg-accent-50/30 transition-colors" />
                ))}
                <div className="absolute inset-0">
                  {roomBookings.map((booking) => {
                    const style = getBookingStyle(booking);
                    const deptColor = getDeptColor(booking.department_id);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className={`absolute left-1 right-1 rounded-[6px] px-2 py-1.5 cursor-pointer overflow-hidden
                          border-l-3 transition-shadow hover:shadow-sm hover:z-10
                          ${booking.status === 'ongoing' ? 'ring-2 ring-emerald-300' : ''}
                        `}
                        style={{ ...style, backgroundColor: getDeptBg(booking.department_id), borderLeftColor: deptColor, borderLeftWidth: '3px' }}
                        onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold truncate" style={{ color: deptColor }}>{getDeptName(booking.department_id)}</span>
                          <StatusBadge status={booking.status} size="sm" />
                        </div>
                        <p className="text-[11px] font-semibold text-gray-800 truncate mt-0.5">{booking.procedure}</p>
                        <p className="text-[10px] text-gray-500 truncate">{booking.patient_name} · {booking.surgeon.split('/')[0]}</p>
                        <p className="text-[10px] text-gray-400">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
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

// ── Week View Component ──
function WeekView({
  rooms, weekDays, getBookingsForRoomDate,
  onBookingClick, onSlotClick, canBook
}: {
  rooms: typeof MOCK_OR_ROOMS;
  weekDays: Date[];
  getBookingsForRoomDate: (roomId: string, date: Date) => Booking[];
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (roomId: string, date: Date) => void;
  canBook: boolean;
}) {
  return (
    <div className="space-y-3">
      {weekDays.map((day) => {
        // On mobile, flatten all bookings for the day across rooms
        const allDayBookings = rooms.flatMap((room) =>
          getBookingsForRoomDate(room.id, day).map((b) => ({
            ...b,
            roomName: room.name,
          }))
        );

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[10px] border border-gray-200 overflow-hidden"
          >
            {/* Day header */}
            <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center justify-between ${
              isToday(day) ? 'bg-accent-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-900">
                  <span className="md:hidden">{format(day, 'EEE, MMM d')}</span>
                  <span className="hidden md:inline">{format(day, 'EEEE, MMM d')}</span>
                </span>
                {isToday(day) && (
                  <span className="px-2 py-0.5 rounded-[6px] bg-accent-50 text-accent-700 text-[10px] font-bold border border-accent-100">TODAY</span>
                )}
              </div>
              <span className="text-[11px] text-gray-400">{allDayBookings.length} booking{allDayBookings.length !== 1 ? 's' : ''}</span>
            </div>

            {/* ─── Mobile: Stacked booking cards ─── */}
            <div className="md:hidden p-3 space-y-2">
              {allDayBookings.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No bookings</p>
              ) : (
                allDayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] active:bg-gray-50 transition-colors cursor-pointer"
                    style={{ backgroundColor: getDeptBg(b.department_id), borderLeft: `3px solid ${getDeptColor(b.department_id)}` }}
                    onClick={() => onBookingClick(b)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: getDeptColor(b.department_id) }}>{b.roomName}</span>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                      <p className="text-[14px] font-semibold text-gray-800 truncate">{b.procedure}</p>
                      <p className="text-[11px] text-gray-500">
                        {formatTime(b.start_time)} – {formatTime(b.end_time)} · {b.patient_name}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* ─── Desktop: Room columns grid ─── */}
            <div className="hidden md:grid gap-2 p-3" style={{ gridTemplateColumns: `repeat(${rooms.length}, 1fr)` }}>
              {rooms.map((room) => {
                const roomBookings = getBookingsForRoomDate(room.id, day);
                return (
                  <div
                    key={room.id}
                    className="min-h-[60px] rounded-[8px] border border-gray-100 p-2 hover:border-accent-200 transition-colors cursor-pointer"
                    onClick={() => canBook && onSlotClick(room.id, day)}
                  >
                    <p className="text-[10px] font-semibold text-gray-400 mb-1">{room.name}</p>
                    {roomBookings.length === 0 ? (
                      <p className="text-[10px] text-gray-300">Available</p>
                    ) : (
                      <div className="space-y-1">
                        {roomBookings.map((b) => (
                          <div
                            key={b.id}
                            className="px-2 py-1 rounded-md text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: getDeptBg(b.department_id), borderLeft: `2px solid ${getDeptColor(b.department_id)}` }}
                            onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                          >
                            <span className="font-medium" style={{ color: getDeptColor(b.department_id) }}>{formatTime(b.start_time)}</span>
                            {' '}{b.procedure.slice(0, 25)}{b.procedure.length > 25 ? '…' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

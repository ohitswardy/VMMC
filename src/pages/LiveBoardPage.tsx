import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, User, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingsStore, useORRoomsStore } from '../stores/appStore';
import { getDeptColor, getDeptName, formatTime, getRoomStatusInfo } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { notifyRoomStatusChange, notifyBookingCancelled } from '../lib/notificationHelper';
import { auditRoomStatusChange } from '../lib/auditHelper';
import type { ORRoomStatus } from '../lib/constants';
import type { Booking } from '../lib/types';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import PageHelpButton from '../components/ui/PageHelpButton';
import { LIVE_BOARD_HELP } from '../lib/helpContent';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Status options anesthesia admin can set per room
const STATUS_ACTIONS: { status: ORRoomStatus; label: string; style: string }[] = [
  { status: 'idle',       label: 'Idle',       style: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' },
  { status: 'in_transit', label: 'In Transit', style: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
  { status: 'ongoing',    label: 'Ongoing',    style: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
  { status: 'ended',      label: 'Ended',      style: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200' },
  { status: 'deferred',   label: 'Deferred',   style: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' },
];

// Context label styles for the featured case display
const CONTEXT_LABELS: Record<string, { text: string; color: string; bg: string; dotColor?: string }> = {
  ongoing:    { text: 'Ongoing',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500' },
  in_transit: { text: 'In Transit', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   dotColor: 'bg-amber-500' },
  up_next:    { text: 'Up Next',    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
};

export default function LiveBoardPage() {
  const { user } = useAuthStore();
  const { liveStatuses, setLiveStatus } = useORRoomsStore();
  const { updateBooking } = useBookingsStore();
  const isAnesthAdmin = user?.role === 'anesthesiology_admin';

  // Pending confirmation state
  const [pending, setPending] = useState<{
    roomId: string;
    roomName: string;
    from: ORRoomStatus;
    to: ORRoomStatus;
  } | null>(null);

  const requestStatusChange = (roomId: string, roomName: string, from: ORRoomStatus, to: ORRoomStatus) => {
    if (from === to) return;
    setPending({ roomId, roomName, from, to });
  };

  const { rooms } = useORRoomsStore();
  const { bookings } = useBookingsStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  // ── Helpers ──

  const sortByTime = (a: Booking, b: Booking) => a.start_time.localeCompare(b.start_time);

  /** Today's active bookings for a room (approved, ongoing, completed only), sorted by time */
  const getRoomTodayBookings = (roomId: string) =>
    bookings
      .filter((b) => b.or_room_id === roomId && b.date === today && ['approved', 'ongoing', 'completed'].includes(b.status))
      .sort(sortByTime);

  /** Currently ongoing booking for a room */
  const getOngoingBooking = (roomId: string) =>
    bookings.find((b) => b.or_room_id === roomId && b.date === today && b.status === 'ongoing');

  /** Next queued booking (approved, not yet started) */
  const getNextQueuedBooking = (roomId: string) =>
    bookings
      .filter((b) => b.or_room_id === roomId && b.date === today && b.status === 'approved')
      .sort(sortByTime)[0] || undefined;

  /** Derived room status from bookings as a fallback */
  const getComputedStatus = (roomId: string): ORRoomStatus => {
    const rb = getRoomTodayBookings(roomId);
    if (rb.find((b) => b.status === 'ongoing')) return 'ongoing';
    if (rb.length > 0 && rb.every((b) => b.status === 'completed')) return 'ended';
    return 'idle';
  };

  const getRoomLiveStatus = (roomId: string): ORRoomStatus =>
    (liveStatuses[roomId]?.status as ORRoomStatus) ?? getComputedStatus(roomId);

  /** Determine the featured booking and context label for a room card */
  const getCardDisplay = (roomId: string): {
    booking?: Booking;
    contextKey?: 'ongoing' | 'in_transit' | 'up_next';
    emptyMessage?: string;
  } => {
    const status = getRoomLiveStatus(roomId);

    switch (status) {
      case 'ongoing': {
        const ongoing = getOngoingBooking(roomId) ?? getNextQueuedBooking(roomId);
        return ongoing
          ? { booking: ongoing, contextKey: 'ongoing' }
          : { emptyMessage: 'No active case' };
      }
      case 'in_transit': {
        const ls = liveStatuses[roomId];
        const transitBooking = ls?.current_booking_id
          ? bookings.find((b) => b.id === ls.current_booking_id)
          : getNextQueuedBooking(roomId);
        return transitBooking
          ? { booking: transitBooking, contextKey: 'in_transit' }
          : { emptyMessage: 'No case assigned' };
      }
      case 'idle': {
        const next = getNextQueuedBooking(roomId);
        return next
          ? { booking: next, contextKey: 'up_next' }
          : { emptyMessage: 'No cases scheduled' };
      }
      case 'ended': {
        const next = getNextQueuedBooking(roomId);
        return next
          ? { booking: next, contextKey: 'up_next' }
          : { emptyMessage: 'All cases completed' };
      }
      case 'deferred':
        return { emptyMessage: 'Case deferred' };
      default:
        return { emptyMessage: 'No active case' };
    }
  };

  /** Contextual description of what a status change will do */
  const getPendingDescription = (): string => {
    if (!pending) return '';
    const { roomId, to } = pending;

    if (to === 'ongoing') {
      const next = getNextQueuedBooking(roomId);
      if (next) return `"${next.procedure}" for ${next.patient_name} will be marked as ongoing.`;
      return 'Room will be set to ongoing.';
    }
    if (to === 'in_transit') {
      const next = getNextQueuedBooking(roomId);
      if (next) return `Patient "${next.patient_name}" is being transported for "${next.procedure}".`;
      return 'Room will be set to in transit.';
    }
    if (to === 'ended') {
      const ongoing = getOngoingBooking(roomId);
      const next = getNextQueuedBooking(roomId);
      const parts: string[] = [];
      if (ongoing) parts.push(`"${ongoing.procedure}" will be marked as completed.`);
      if (next) parts.push(`Next up: "${next.procedure}".`);
      return parts.length > 0 ? parts.join(' ') : 'Room will be set to ended.';
    }
    if (to === 'deferred') {
      const ongoing = getOngoingBooking(roomId);
      if (ongoing) return `"${ongoing.procedure}" will be deferred.`;
      return 'Room will be set to deferred.';
    }
    return '';
  };

  // ── Enhanced status change handler — syncs booking statuses ──
  const confirmStatusChange = async () => {
    if (!pending) return;
    const { roomId, to, from } = pending;

    try {
      if (to === 'ongoing') {
        // Mark the next queued booking as ongoing
        const nextBooking = getNextQueuedBooking(roomId);
        if (nextBooking) {
          await updateBooking(nextBooking.id, { status: 'ongoing' });
          await setLiveStatus(roomId, to, nextBooking.id);
        } else {
          await setLiveStatus(roomId, to);
        }
      } else if (to === 'in_transit') {
        // Associate next booking with the room in transit
        const nextBooking = getNextQueuedBooking(roomId);
        if (nextBooking) {
          await setLiveStatus(roomId, to, nextBooking.id);
        } else {
          await setLiveStatus(roomId, to);
        }
      } else if (to === 'ended') {
        // Complete the currently ongoing booking
        const ongoingBooking = getOngoingBooking(roomId);
        if (ongoingBooking) {
          await updateBooking(ongoingBooking.id, { status: 'completed' });
        }
        await setLiveStatus(roomId, to);
      } else if (to === 'deferred') {
        // Cancel/defer the ongoing booking
        const ongoingBooking = getOngoingBooking(roomId);
        if (ongoingBooking) {
          await updateBooking(ongoingBooking.id, { status: 'cancelled' });
          notifyBookingCancelled(ongoingBooking, user?.full_name || 'Admin');
        }
        await setLiveStatus(roomId, to);
      } else {
        // idle — just set room status
        await setLiveStatus(roomId, to);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }

    notifyRoomStatusChange(pending.roomName, to, user?.full_name || 'Admin');
    if (user) auditRoomStatusChange(user.id, roomId, pending.roomName, from, to);
    setPending(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="page-header">
            <h1>Live Board</h1>
          <p>
            <span className="md:hidden">{format(new Date(), 'EEE, MMM d')}</span>
            <span className="hidden md:inline">Real-time status — {format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </p>
          </div>
          <PageHelpButton {...LIVE_BOARD_HELP} />
        </div>
        <div className="flex items-center gap-3 text-[11px] md:text-xs flex-shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Idle
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> In Transit
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ongoing
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Ended
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Deferred
          </span>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {rooms.map((room, i) => {
          const status = getRoomLiveStatus(room.id);
          const statusInfo = getRoomStatusInfo(status);
          const { booking: displayBooking, contextKey, emptyMessage } = getCardDisplay(room.id);
          const todayBookings = getRoomTodayBookings(room.id);
          const contextLabel = contextKey ? CONTEXT_LABELS[contextKey] : null;

          return (
            <motion.div
              key={room.id}
              {...fadeUp}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.04 }}
              className={`bg-white rounded-[10px] border overflow-hidden ${
                status === 'ongoing' ? 'border-emerald-200' :
                status === 'in_transit' ? 'border-amber-200' :
                status === 'deferred' ? 'border-red-200' :
                'border-gray-200'
              }`}
            >
              {/* Room header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">{room.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{room.designation}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {(status === 'ongoing' || status === 'in_transit') && (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      status === 'ongoing' ? 'bg-emerald-400' : 'bg-amber-400'
                    } animate-pulse mr-1 align-middle`} />
                  )}
                  {statusInfo.label}
                </div>
              </div>

              {/* Featured case display */}
              <div className="px-4 py-3">
                {displayBooking && contextLabel ? (
                  <div className="space-y-2.5">
                    {/* Context label pill */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${contextLabel.bg} ${contextLabel.color}`}>
                        {contextLabel.dotColor && (
                          <span className={`w-1.5 h-1.5 rounded-full ${contextLabel.dotColor} animate-pulse`} />
                        )}
                        {contextLabel.text}
                      </span>
                    </div>

                    {/* Case details */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getDeptColor(displayBooking.department_id) }} />
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">{displayBooking.procedure}</p>
                        <p className="text-[11px] font-medium" style={{ color: getDeptColor(displayBooking.department_id) }}>
                          {getDeptName(displayBooking.department_id)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[12px] pl-3.5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{displayBooking.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{displayBooking.surgeon.split('/')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{formatTime(displayBooking.start_time)} – {formatTime(displayBooking.end_time)}</span>
                      </div>
                    </div>
                  </div>
                ) : emptyMessage ? (
                  <div className="text-center py-5">
                    {status === 'deferred' ? (
                      <p className="text-[13px] text-red-400 font-medium">{emptyMessage}</p>
                    ) : status === 'ended' ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-1.5" />
                        <p className="text-[13px] text-gray-400">{emptyMessage}</p>
                      </>
                    ) : (
                      <>
                        <Activity className="w-8 h-8 text-gray-200 mx-auto mb-1.5" />
                        <p className="text-[13px] text-gray-400">{emptyMessage}</p>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Anesthesia admin: status controls */}
              {isAnesthAdmin && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Set Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_ACTIONS.map((action) => (
                      <button
                        key={action.status}
                        onClick={() => requestStatusChange(room.id, room.name, status, action.status)}
                        className={`px-2 py-0.5 rounded-[5px] text-[11px] font-semibold transition-colors ${
                          status === action.status
                            ? action.style + ' ring-1 ring-inset ring-current'
                            : action.style
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's queue */}
              {todayBookings.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Today's Queue ({todayBookings.length})
                  </p>
                  <div className="space-y-1.5">
                    {todayBookings.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className={`flex items-center justify-between ${
                          b.status === 'completed' ? 'opacity-60' : ''
                        }`}
                      >
                        <span
                          className={`text-[11px] truncate flex-1 mr-2 ${
                            b.status === 'completed'
                              ? 'text-gray-400 line-through'
                              : b.status === 'ongoing'
                              ? 'text-emerald-700 font-semibold'
                              : 'text-gray-600'
                          }`}
                        >
                          {formatTime(b.start_time)} {b.procedure.slice(0, 22)}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                    ))}
                    {todayBookings.length > 4 && (
                      <p className="text-[11px] text-gray-400">+{todayBookings.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Status change confirmation modal */}
      <AnimatePresence>
        {pending && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-gray-950/40" onClick={() => setPending(null)} />
            <motion.div
              className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-sm p-5 space-y-4"
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[8px] bg-amber-50 shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">Confirm Status Change</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{pending.roomName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-gray-50">
                <span className={`px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                  getRoomStatusInfo(pending.from).bgColor
                } ${getRoomStatusInfo(pending.from).color}`}>
                  {getRoomStatusInfo(pending.from).label}
                </span>
                <span className="text-gray-400 text-sm">→</span>
                <span className={`px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                  getRoomStatusInfo(pending.to).bgColor
                } ${getRoomStatusInfo(pending.to).color}`}>
                  {getRoomStatusInfo(pending.to).label}
                </span>
              </div>

              {/* Contextual description of what will happen */}
              {getPendingDescription() && (
                <p className="text-[13px] text-gray-600 bg-blue-50 border border-blue-100 rounded-[8px] px-3 py-2">
                  {getPendingDescription()}
                </p>
              )}

              <p className="text-sm text-gray-500">
                Are you sure you want to change the status of <span className="font-medium text-gray-700">{pending.roomName}</span> to{' '}
                <span className="font-medium text-gray-700">{getRoomStatusInfo(pending.to).label}</span>?
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" size="sm" type="button" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="button" onClick={confirmStatusChange}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

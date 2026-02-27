import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, User, Stethoscope, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingsStore, useORRoomsStore } from '../stores/appStore';
import { getDeptColor, getDeptName, formatTime, getRoomStatusInfo } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { notifyRoomStatusChange } from '../lib/notificationHelper';
import { auditRoomStatusChange } from '../lib/auditHelper';
import type { ORRoomStatus } from '../lib/constants';
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

export default function LiveBoardPage() {
  const { user } = useAuthStore();
  const { liveStatuses, setLiveStatus } = useORRoomsStore();
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

  const confirmStatusChange = () => {
    if (!pending) return;
    setLiveStatus(pending.roomId, pending.to);
    // Send notifications for significant status changes
    notifyRoomStatusChange(pending.roomName, pending.to, user?.full_name || 'Admin');
    if (user) auditRoomStatusChange(user.id, pending.roomId, pending.roomName, pending.from, pending.to);
    setPending(null);
  };

  const { rooms } = useORRoomsStore();
  const { bookings } = useBookingsStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Derive computed status from bookings as a fallback
  const getComputedStatus = (roomId: string): ORRoomStatus => {
    const roomBookings = bookings.filter(
      (b) => b.or_room_id === roomId && b.date === today && !['cancelled', 'denied'].includes(b.status)
    );
    if (roomBookings.find((b) => b.status === 'ongoing')) return 'ongoing';
    const completed = roomBookings.filter((b) => b.status === 'completed');
    if (completed.length === roomBookings.length && roomBookings.length > 0) return 'ended';
    return 'idle';
  };

  const getRoomLiveStatus = (roomId: string): ORRoomStatus => {
    return (liveStatuses[roomId]?.status as ORRoomStatus) ?? getComputedStatus(roomId);
  };

  const getCurrentBooking = (roomId: string) => {
    const status = getRoomLiveStatus(roomId);
    if (status === 'ongoing' || status === 'in_transit') {
      return bookings.find(
        (b) => b.or_room_id === roomId && b.date === today &&
          ['ongoing', 'approved'].includes(b.status)
      );
    }
    return undefined;
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
          const currentBooking = getCurrentBooking(room.id);
          const todayBookings = bookings.filter(
            (b) => b.or_room_id === room.id && b.date === today && !['cancelled', 'denied'].includes(b.status)
          );

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

              {/* Current case details */}
              <div className="px-4 py-3">
                {currentBooking ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getDeptColor(currentBooking.department_id) }} />
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">{currentBooking.procedure}</p>
                        <p className="text-[11px] font-medium" style={{ color: getDeptColor(currentBooking.department_id) }}>
                          {getDeptName(currentBooking.department_id)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[12px] pl-3.5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{currentBooking.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{currentBooking.surgeon.split('/')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{formatTime(currentBooking.start_time)} – {formatTime(currentBooking.end_time)}</span>
                      </div>
                    </div>
                  </div>
                ) : status === 'deferred' ? (
                  <div className="text-center py-5">
                    <p className="text-[13px] text-red-400 font-medium">Case deferred</p>
                  </div>
                ) : status === 'idle' ? (
                  <div className="text-center py-5">
                    <Activity className="w-8 h-8 text-gray-200 mx-auto mb-1.5" />
                    <p className="text-[13px] text-gray-400">No active case</p>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-[13px] text-gray-400">All cases completed</p>
                  </div>
                )}
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

              {/* Upcoming queue */}
              {todayBookings.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Today's Queue ({todayBookings.length})
                  </p>
                  <div className="space-y-1.5">
                    {todayBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-600 truncate flex-1 mr-2">
                          {formatTime(b.start_time)} {b.procedure.slice(0, 22)}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                      </div>
                    ))}
                    {todayBookings.length > 3 && (
                      <p className="text-[11px] text-gray-400">+{todayBookings.length - 3} more</p>
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

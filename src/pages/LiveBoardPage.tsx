import { motion } from 'framer-motion';
import { Activity, Clock, User, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { MOCK_BOOKINGS, MOCK_OR_ROOMS } from '../lib/mockData';
import { getDeptColor, getDeptName, formatTime, getRoomStatusInfo } from '../lib/utils';
import type { ORRoomStatus } from '../lib/constants';
import StatusBadge from '../components/ui/StatusBadge';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function LiveBoardPage() {
  const rooms = MOCK_OR_ROOMS;
  const bookings = MOCK_BOOKINGS;
  const today = format(new Date(), 'yyyy-MM-dd');

  const getRoomStatus = (roomId: string): { status: ORRoomStatus; currentBooking?: typeof bookings[0] } => {
    const roomBookings = bookings.filter(
      (b) => b.or_room_id === roomId && b.date === today && !['cancelled', 'denied'].includes(b.status)
    );
    const ongoing = roomBookings.find((b) => b.status === 'ongoing');
    if (ongoing) return { status: 'ongoing', currentBooking: ongoing };
    const completed = roomBookings.filter((b) => b.status === 'completed');
    if (completed.length === roomBookings.length && roomBookings.length > 0) return { status: 'ended' };
    return { status: 'idle' };
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="page-header">
          <h1>Live Board</h1>
          <p>
            <span className="md:hidden">{format(new Date(), 'EEE, MMM d')}</span>
            <span className="hidden md:inline">Real-time status — {format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] md:text-xs flex-shrink-0">
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Idle
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ongoing
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Ended
          </span>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {rooms.map((room, i) => {
          const { status, currentBooking } = getRoomStatus(room.id);
          const statusInfo = getRoomStatusInfo(status);
          const todayBookings = bookings.filter(
            (b) => b.or_room_id === room.id && b.date === today && !['cancelled', 'denied'].includes(b.status)
          );

          return (
            <motion.div
              key={room.id}
              {...fadeUp}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.04 }}
              className={`bg-white rounded-[10px] border overflow-hidden ${
                status === 'ongoing' ? 'border-emerald-200' : 'border-gray-200'
              }`}
            >
              {/* Room header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">{room.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{room.designation}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {status === 'ongoing' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 align-middle" />
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
    </div>
  );
}

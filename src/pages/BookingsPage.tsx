import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
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

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { openChangeForm, isChangeFormOpen, changeBooking, closeChangeForm } = useBookingsStore();
  const { bookings } = useBookingsStore();
  const { rooms } = useORRoomsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';

  const filtered = useMemo(() => {
    let result = bookings;
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
    return result;
  }, [bookings, search, statusFilter, deptFilter, isAdmin, user]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bookings</h1>
        <p>
          {isAdmin ? 'All department bookings' : `${getDeptName(user?.department_id as any)} bookings`}
        </p>
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

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((b, i) => {
          const room = rooms.find((r) => r.id === b.or_room_id);
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                    <p className="text-[13px] text-gray-500 mt-0.5">{b.patient_name} ({b.patient_age}/{b.patient_sex})</p>
                  </div>
                  <StatusBadge status={b.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                  <div>
                    <span className="text-gray-400">Dept</span>
                    <span className="ml-1.5 font-medium" style={{ color: getDeptColor(b.department_id) }}>{getDeptName(b.department_id)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Room</span>
                    <span className="ml-1.5 text-gray-600">{room?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date</span>
                    <span className="ml-1.5 text-gray-600">{b.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time</span>
                    <span className="ml-1.5 text-gray-600">{formatTime(b.start_time)}–{formatTime(b.end_time)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Surgeon</span>
                    <span className="ml-1.5 text-gray-600">{b.surgeon}</span>
                  </div>
                </div>

                {b.is_emergency && (
                  <div className="px-2.5 py-1.5 rounded-[6px] bg-red-50 border border-red-100 text-[11px] font-semibold text-red-600">
                    Emergency Case
                  </div>
                )}

                <p className="text-[12px] text-gray-400 pt-1 border-t border-gray-100">
                  Tap to view details{isAdmin && b.status === 'pending' ? ' · Approve / Edit' : ''}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-sm text-gray-400">No bookings found.</div>
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

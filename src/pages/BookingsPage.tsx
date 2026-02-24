import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { MOCK_BOOKINGS, MOCK_OR_ROOMS } from '../lib/mockData';
import { useAuthStore } from '../stores/authStore';
import { DEPARTMENTS, BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptName, formatTime } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import { useBookingsStore } from '../stores/appStore';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
};

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { openChangeForm } = useBookingsStore();
  const bookings = MOCK_BOOKINGS;
  const rooms = MOCK_OR_ROOMS;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

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
      <div className="bg-white rounded-[10px] border border-gray-200 px-4 py-3 flex flex-col sm:flex-row flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, procedure..."
            className="input-base !pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {isAdmin && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-base !w-auto flex-shrink-0"
            >
              <option value="all">All Depts</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base !w-auto flex-shrink-0"
          >
            <option value="all">All Status</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
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
              className="bg-white rounded-[10px] border border-gray-200 overflow-hidden hover:shadow-sm active:shadow-sm transition-shadow"
            >
              {/* Dept color bar — 2px, not 6px */}
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

                {(user?.department_id === b.department_id || isAdmin) &&
                 !['completed', 'cancelled', 'denied', 'ongoing'].includes(b.status) && (
                  <button
                    onClick={() => openChangeForm(b)}
                    className="w-full text-center text-[13px] text-accent-600 hover:text-accent-700 active:text-accent-800 font-semibold transition-colors pt-2 border-t border-gray-100 touch-target"
                  >
                    Request Change
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-sm text-gray-400">No bookings found.</div>
      )}
    </div>
  );
}

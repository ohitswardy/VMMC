import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, Calendar, CheckCircle,
  Search, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { MOCK_BOOKINGS, MOCK_OR_ROOMS } from '../lib/mockData';
import { BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptBg, getDeptName, formatTime } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const bookings = MOCK_BOOKINGS;
  const rooms = MOCK_OR_ROOMS;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'anesthesiology_admin';

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

  const statCards = [
    { label: "Today's Cases", value: stats.total, icon: Calendar, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ongoing', value: stats.ongoing, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          {isAdmin ? 'Anesthesiology admin overview' : `${getDeptName(user?.department_id as any)} department`}
        </p>
      </div>

      {/* Stats — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 scroll-snap-x">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="flex-shrink-0 w-[148px] md:w-auto bg-white rounded-[10px] border border-gray-200 p-4 md:p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-[8px] ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight leading-none">{card.value}</p>
              <p className="text-[11px] md:text-xs font-medium text-gray-400 mt-1.5">{card.label}</p>
            </motion.div>
          );
        })}
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
              {bookings.filter((b) => b.status === 'pending').map((b) => (
                <div key={b.id} className="px-4 md:px-5 py-3.5 hover:bg-gray-50 active:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-10 md:h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: getDeptColor(b.department_id) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{b.procedure}</p>
                      <p className="text-[13px] text-gray-500 mt-0.5">
                        {getDeptName(b.department_id)} · {b.patient_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(b.start_time)}–{formatTime(b.end_time)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="accent" size="sm">Approve</Button>
                      <Button variant="outline" size="sm">Deny</Button>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="input-base !pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-base !w-auto flex-shrink-0"
              >
                <option value="all">All</option>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile: Card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {filtered.map((b) => {
              const room = rooms.find((r) => r.id === b.or_room_id);
              return (
                <div key={b.id} className="px-4 py-3.5 active:bg-gray-50 transition-colors">
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
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const room = rooms.find((r) => r.id === b.or_room_id);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
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
        </div>
      </motion.div>
    </div>
  );
}

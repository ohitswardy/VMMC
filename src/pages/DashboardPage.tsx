import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, Calendar, CheckCircle,
  Search, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useBookingsStore, useORRoomsStore } from '../stores/appStore';
import { BOOKING_STATUSES } from '../lib/constants';
import { getDeptColor, getDeptBg, getDeptName, formatTime } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { bookings, updateBooking } = useBookingsStore();
  const { rooms } = useORRoomsStore();

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await updateBooking(id, { status: 'approved' });
      toast.success('Booking approved');
    } catch { toast.error('Failed to approve'); }
    finally { setApprovingId(null); }
  };

  const handleDeny = async (id: string) => {
    setDenyingId(id);
    try {
      await updateBooking(id, { status: 'denied' });
      toast.success('Booking denied');
    } catch { toast.error('Failed to deny'); }
    finally { setDenyingId(null); }
  };

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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          {isAdmin ? 'Anesthesiology admin overview' : `${getDeptName(user?.department_id as any)} department`}
        </p>
      </div>

      {/* ── UntitledUI-style Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Card 1 — Today's Cases (mini bar chart) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Today's Cases</p>
            <Calendar className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" /> 8%
            </span>
            <span className="text-[10px] text-gray-400">vs yesterday</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <BarChart data={[
                { d: 'M', v: 5 }, { d: 'T', v: 7 }, { d: 'W', v: 4 }, { d: 'T', v: 6 },
                { d: 'F', v: 8 }, { d: 'S', v: 3 }, { d: 'S', v: stats.total },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="v" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 2 — Pending (area sparkline, amber) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Pending</p>
            <Clock className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
              <ArrowUpRight className="w-3 h-3" /> 2
            </span>
            <span className="text-[10px] text-gray-400">new today</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={[
                { d: 1, v: 3 }, { d: 2, v: 5 }, { d: 3, v: 2 }, { d: 4, v: 4 },
                { d: 5, v: 3 }, { d: 6, v: 1 }, { d: 7, v: stats.pending },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2}
                  fill="url(#pendingFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 3 — Ongoing (line chart, emerald) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Ongoing</p>
            <ClipboardList className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.ongoing}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" /> 1
            </span>
            <span className="text-[10px] text-gray-400">active now</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={[
                { d: 1, v: 1 }, { d: 2, v: 2 }, { d: 3, v: 3 }, { d: 4, v: 2 },
                { d: 5, v: 4 }, { d: 6, v: 3 }, { d: 7, v: stats.ongoing },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ongoingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2}
                  fill="url(#ongoingFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 4 — Completed (area sparkline, blue) */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Completed</p>
            <CheckCircle className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.completed}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700">
              <ArrowUpRight className="w-3 h-3" /> 15%
            </span>
            <span className="text-[10px] text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={[
                { d: 1, v: 4 }, { d: 2, v: 6 }, { d: 3, v: 5 }, { d: 4, v: 7 },
                { d: 5, v: 8 }, { d: 6, v: 6 }, { d: 7, v: stats.completed || 1 },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#completedFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
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
                      <Button variant="accent" size="sm" loading={approvingId === b.id} onClick={() => handleApprove(b.id)}>Approve</Button>
                      <Button variant="outline" size="sm" loading={denyingId === b.id} onClick={() => handleDeny(b.id)}>Deny</Button>
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
          <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full py-2.5 md:py-2 input-base"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'all', label: 'All' },
                  ...BOOKING_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
                ]}
                className="shrink-0 min-w-[120px]"
              />
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

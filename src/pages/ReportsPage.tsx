import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, TrendingUp, AlertTriangle, Calendar,
  PieChart, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { MOCK_BOOKINGS, MOCK_OR_ROOMS } from '../lib/mockData';
import { getDeptColor, getDeptName, calcUtilization } from '../lib/utils';
import type { DepartmentId } from '../lib/constants';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

export default function ReportsPage() {
  const bookings = MOCK_BOOKINGS;
  const rooms = MOCK_OR_ROOMS;

  // OR Utilization per room
  const utilizationData = useMemo(() => {
    return rooms.map((room) => {
      const roomBookings = bookings.filter(
        (b) => b.or_room_id === room.id && !['cancelled', 'denied'].includes(b.status)
      );
      return {
        name: room.name,
        utilization: calcUtilization(roomBookings),
        cases: roomBookings.length,
      };
    });
  }, [bookings, rooms]);

  // Department distribution
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      counts[b.department_id] = (counts[b.department_id] || 0) + 1;
    });
    return Object.entries(counts).map(([dept, count]) => ({
      name: getDeptName(dept as DepartmentId),
      value: count,
      color: getDeptColor(dept as DepartmentId),
    }));
  }, [bookings]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [bookings]);

  // Duration variance
  const durationData = useMemo(() => {
    return bookings
      .filter((b) => b.actual_duration_minutes)
      .map((b) => ({
        procedure: b.procedure.slice(0, 20),
        estimated: b.estimated_duration_minutes,
        actual: b.actual_duration_minutes || 0,
      }));
  }, [bookings]);

  // Summary stats
  const stats = useMemo(() => {
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const emergency = bookings.filter((b) => b.is_emergency);
    const avgUtil = utilizationData.reduce((sum, u) => sum + u.utilization, 0) / utilizationData.length;

    return {
      avgUtilization: Math.round(avgUtil),
      cancellationRate: bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0,
      emergencyRatio: bookings.length > 0 ? Math.round((emergency.length / bookings.length) * 100) : 0,
      totalCases: bookings.length,
    };
  }, [bookings, utilizationData]);

  return (
    <div className="page-container">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">OR performance insights and statistics</p>
      </div>

      {/* Summary Cards */}
      {/* Stats — horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 scroll-snap-x">
        {[
          { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, icon: TrendingUp, color: 'text-accent-500', bg: 'bg-accent-50' },
          { label: 'Total Cases', value: stats.totalCases, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Cancellation', value: `${stats.cancellationRate}%`, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Emergency', value: `${stats.emergencyRatio}%`, icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex-shrink-0 w-[140px] md:w-auto bg-white rounded-[10px] border border-gray-200 p-4 md:p-5 scroll-snap-start"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-[8px] ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-[10px] md:text-[11px] text-gray-500">{card.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* OR Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6"
        >
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-500" />
            OR Utilization (%)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="utilization" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6"
        >
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent-500" />
            By Department
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RePieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Estimated vs Actual Duration */}
        {durationData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6 lg:col-span-2"
          >
            <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Est. vs. Actual Duration (min)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="procedure" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="estimated" name="Estimated" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6 lg:col-span-2"
        >
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RePieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

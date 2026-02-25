import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, ChartLine,
  PieChart, ArrowUpRight, ArrowDownRight, Siren, Ban, BriefcaseMedical
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line
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

      {/* ── UntitledUI-style Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Card 1 — Avg Utilization (area sparkline) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Avg Utilization</p>
<ChartLine className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.avgUtilization}%</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" /> 4.2%
            </span>
            <span className="text-[10px] text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={utilizationData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="utilizationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="utilization" stroke="#6366f1" strokeWidth={2}
                  fill="url(#utilizationFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 2 — Total Cases (mini bar chart) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Total Cases</p>
<BriefcaseMedical className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.totalCases}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" /> 12%
            </span>
            <span className="text-[10px] text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <BarChart data={utilizationData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="cases" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 3 — Cancellation Rate (line sparkline) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Cancellation</p>
<Ban className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.cancellationRate}%</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-3 h-3" /> 2.1%
            </span>
            <span className="text-[10px] text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={[
                { d: 1, v: 5 }, { d: 2, v: 3 }, { d: 3, v: 4 }, { d: 4, v: 2 },
                { d: 5, v: 3 }, { d: 6, v: 1 }, { d: 7, v: 0 },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cancelFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2}
                  fill="url(#cancelFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 4 — Emergency Ratio (stepped line) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">Emergency</p>
<Siren className="w-5 h-5 text-teal-900 shrink-0" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{stats.emergencyRatio}%</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-500">
              — 0%
            </span>
            <span className="text-[10px] text-gray-400">no change</span>
          </div>
          <div className="mt-3 -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height={48}>
              <LineChart data={[
                { d: 1, v: 0 }, { d: 2, v: 1 }, { d: 3, v: 0 }, { d: 4, v: 0 },
                { d: 5, v: 1 }, { d: 6, v: 0 }, { d: 7, v: 0 },
              ]} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Line type="stepAfter" dataKey="v" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
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
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                wrapperStyle={{ fontSize: 11, lineHeight: '20px' }}
                iconSize={10}
                formatter={(value) => <span className="text-[11px] text-gray-600">{value}</span>}
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
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="45%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${value}`}
                labelLine={false}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                wrapperStyle={{ fontSize: 11, lineHeight: '20px' }}
                iconSize={10}
              />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

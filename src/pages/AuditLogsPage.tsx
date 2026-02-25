import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search } from 'lucide-react';
import { DatePicker } from '../components/ui/DatePicker';
import { CustomSelect } from '../components/ui/CustomSelect';
import { MOCK_AUDIT_LOGS, MOCK_USERS } from '../lib/mockData';

export default function AuditLogsPage() {
  const logs = MOCK_AUDIT_LOGS;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = useMemo(() => {
    let result = logs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) => l.action.toLowerCase().includes(term) || l.entity_type.toLowerCase().includes(term)
      );
    }
    if (dateFilter) result = result.filter((l) => l.created_at.startsWith(dateFilter));
    if (userFilter) result = result.filter((l) => l.user_id === userFilter);
    if (actionFilter) result = result.filter((l) => l.action.startsWith(actionFilter));
    return result;
  }, [logs, searchTerm, dateFilter, userFilter, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('create')) return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (action.includes('approve')) return { bg: 'bg-blue-50', text: 'text-blue-700' };
    if (action.includes('deny') || action.includes('cancel')) return { bg: 'bg-red-50', text: 'text-red-700' };
    if (action.includes('login') || action.includes('logout')) return { bg: 'bg-purple-50', text: 'text-purple-700' };
    return { bg: 'bg-gray-50', text: 'text-gray-700' };
  };

  const getUserName = (userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user?.full_name || userId;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Immutable record of all system actions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-amber-50 border border-amber-200 self-start">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] md:text-xs font-medium text-amber-700">Tamper-proof</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[10px] border border-gray-200 px-3 md:px-4 py-3 space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-3">
        <div className="relative flex-1 min-w-0 md:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actions..."
            className="w-full py-2.5 md:py-2 input-base"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <DatePicker
            value={dateFilter}
            onChange={(val) => setDateFilter(val)}
            placeholder="Filter by date"
          />
          <CustomSelect
            value={userFilter}
            onChange={(val) => setUserFilter(val)}
            options={[
              { value: '', label: 'All Users' },
              ...MOCK_USERS.map((u) => ({ value: u.id, label: u.full_name })),
            ]}
            className="shrink-0"
          />
          <CustomSelect
            value={actionFilter}
            onChange={(val) => setActionFilter(val)}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'booking', label: 'Booking' },
              { value: 'user', label: 'User' },
              { value: 'room', label: 'Room' },
            ]}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
        {/* ─── Mobile: Card list ─── */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((log, i) => {
            const badge = getActionBadge(log.action);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {getUserName(log.user_id).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{getUserName(log.user_id)}</span>
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium flex-shrink-0 ${badge.bg} ${badge.text}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    {(log.old_values || log.new_values) && (
                      <div className="mt-1.5 text-[10px] bg-gray-50 rounded-[6px] p-2 space-y-0.5">
                        {log.old_values && <p className="text-red-500 truncate">- {JSON.stringify(log.old_values)}</p>}
                        {log.new_values && <p className="text-emerald-500 truncate">+ {JSON.stringify(log.new_values)}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Desktop: Table ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Timestamp</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Entity</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log, i) => {
                const badge = getActionBadge(log.action);
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center text-white text-[9px] font-bold">
                          {getUserName(log.user_id).charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{getUserName(log.user_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-[6px] text-xs font-medium ${badge.bg} ${badge.text}`}>{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="px-6 py-3 text-xs text-gray-500 max-w-[300px]">
                      {log.old_values && <span className="text-red-500">- {JSON.stringify(log.old_values)}</span>}
                      {log.new_values && <span className="text-emerald-500 block">+ {JSON.stringify(log.new_values)}</span>}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">No log entries found.</div>
        )}
      </div>
    </div>
  );
}

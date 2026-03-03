import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker } from '../components/ui/DatePicker';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useAuditLogsStore } from '../stores/appStore';
import PageHelpButton from '../components/ui/PageHelpButton';
import PageLoader from '../components/ui/PageLoader';
import { AUDIT_LOGS_HELP } from '../lib/helpContent';

const PAGE_SIZE = 25;

/** Human-readable field name */
function humanField(key: string): string {
  return key.replace(/_/g, ' ').replace(/\bid\b/g, 'ID').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Render a human-readable diff from old/new value objects */
function renderDiff(oldVals: Record<string, unknown> | null, newVals: Record<string, unknown> | null) {
  const allKeys = new Set<string>([
    ...Object.keys(oldVals || {}),
    ...Object.keys(newVals || {}),
  ]);
  if (allKeys.size === 0) return null;
  return (
    <div className="space-y-1">
      {Array.from(allKeys).map((key) => {
        const oldV = oldVals?.[key];
        const newV = newVals?.[key];
        if (oldV === newV) return null;
        return (
          <div key={key} className="text-xs">
            <span className="font-medium text-gray-600">{humanField(key)}: </span>
            {oldV !== undefined && <span className="text-red-500 line-through mr-1">{String(oldV)}</span>}
            {newV !== undefined && <span className="text-emerald-600">{String(newV)}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditLogsPage() {
  const { logs, isLoading } = useAuditLogsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateEndFilter, setDateEndFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // Build user options from joined profile data in logs
  const userOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of logs) {
      if (!seen.has(l.user_id)) {
        seen.set(l.user_id, l.user_profile?.full_name || l.user_id);
      }
    }
    return [{ value: '', label: 'All Users' }, ...Array.from(seen.entries()).map(([id, name]) => ({ value: id, label: name }))];
  }, [logs]);

  const filtered = useMemo(() => {
    let result = logs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) => l.action.toLowerCase().includes(term) || l.entity_type.toLowerCase().includes(term)
      );
    }
    if (dateFilter) {
      if (dateEndFilter) {
        result = result.filter((l) => l.created_at.slice(0, 10) >= dateFilter && l.created_at.slice(0, 10) <= dateEndFilter);
      } else {
        result = result.filter((l) => l.created_at.startsWith(dateFilter));
      }
    }
    if (userFilter) result = result.filter((l) => l.user_id === userFilter);
    if (actionFilter) result = result.filter((l) => l.action.startsWith(actionFilter));
    return result;
  }, [logs, searchTerm, dateFilter, dateEndFilter, userFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [searchTerm, dateFilter, dateEndFilter, userFilter, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('create')) return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (action.includes('approve')) return { bg: 'bg-blue-50', text: 'text-blue-700' };
    if (action.includes('deny') || action.includes('cancel')) return { bg: 'bg-red-50', text: 'text-red-700' };
    if (action.includes('login') || action.includes('logout')) return { bg: 'bg-purple-50', text: 'text-purple-700' };
    return { bg: 'bg-gray-50', text: 'text-gray-700' };
  };

  const getUserName = (log: typeof logs[0]) => {
    return log.user_profile?.full_name || log.user_id;
  };

  if (isLoading && logs.length === 0) {
    return <PageLoader label="Loading audit logs…" />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Immutable record of all system actions</p>
          </div>
          <PageHelpButton {...AUDIT_LOGS_HELP} />
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
            placeholder="From date"
          />
          <DatePicker
            value={dateEndFilter}
            onChange={(val) => setDateEndFilter(val)}
            placeholder="To date"
          />
          <CustomSelect
            value={userFilter}
            onChange={(val) => setUserFilter(val)}
            options={userOptions}
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
          {paginated.map((log, i) => {
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
                    {getUserName(log).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{getUserName(log)}</span>
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium flex-shrink-0 ${badge.bg} ${badge.text}`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    {(log.old_values || log.new_values) && (
                      <div className="mt-1.5 text-[10px] bg-gray-50 rounded-[6px] p-2">
                        {renderDiff(log.old_values as Record<string, unknown> | null, log.new_values as Record<string, unknown> | null)}
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
              {paginated.map((log, i) => {
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
                          {getUserName(log).charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{getUserName(log)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-[6px] text-xs font-medium ${badge.bg} ${badge.text}`}>{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="px-6 py-3 max-w-[300px]">
                      {renderDiff(log.old_values as Record<string, unknown> | null, log.new_values as Record<string, unknown> | null)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

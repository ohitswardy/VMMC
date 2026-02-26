import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotificationsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const [filterType, setFilterType] = useState('all');

  const unread = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    if (filterType === 'all') return notifications;
    if (filterType === 'unread') return notifications.filter((n) => !n.is_read);
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const handleMarkAllRead = () => {
    if (user) markAllAsRead(user.id);
  };

  const handleMarkRead = (id: string) => {
    markAsRead(id);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'new_request': return '📋';
      case 'approval': return '✅';
      case 'denial': return '❌';
      case 'schedule_change': return '🔄';
      case 'emergency_alert': return '🚨';
      case 'reminder_24h': case 'reminder_2h': return '⏰';
      case 'case_ending_soon': return '⏳';
      default: return '🔔';
    }
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={filterType}
            onChange={(val) => setFilterType(val)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'new_request', label: 'Requests' },
              { value: 'approval', label: 'Approvals' },
              { value: 'emergency_alert', label: 'Emergencies' },
            ]}
          />
          {unread > 0 && (
            <Button variant="secondary" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`px-4 md:px-6 py-3 md:py-4 flex items-start gap-3 cursor-pointer active:bg-gray-50 transition-colors ${
                !n.is_read ? 'bg-accent-50/40' : ''
              }`}
              onClick={() => handleMarkRead(n.id)}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

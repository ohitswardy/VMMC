import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Bell, CheckCheck, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';
import PageHelpButton from '../components/ui/PageHelpButton';
import { NOTIFICATIONS_HELP } from '../lib/helpContent';
import type { Notification } from '../lib/types';

/** Map a notification type → the app route the user should be taken to */
function getNotificationRoute(n: Notification): string {
  switch (n.type) {
    case 'new_request':
    case 'approval':
    case 'denial':
    case 'booking_confirmation':
    case 'schedule_change':
    case 'cancellation':
      return '/bookings';
    case 'emergency_alert':
    case 'case_ending_soon':
      return '/live-board';
    case 'reminder_24h':
    case 'reminder_2h':
      return '/calendar';
    case 'purge_warning':
      return '/documents';
    default:
      return '/bookings';
  }
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'new_request': return '📋';
    case 'approval': return '✅';
    case 'denial': return '❌';
    case 'schedule_change': return '🔄';
    case 'emergency_alert': return '🚨';
    case 'reminder_24h': case 'reminder_2h': return '⏰';
    case 'case_ending_soon': return '⏳';
    case 'booking_confirmation': return '✅';
    case 'cancellation': return '🚫';
    case 'purge_warning': return '🗑️';
    default: return '🔔';
  }
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotificationsStore();
  const navigate = useNavigate();
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

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    navigate(getNotificationRoute(n));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
          </div>
          <PageHelpButton {...NOTIFICATIONS_HELP} />
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
          <AnimatePresence initial={false}>
            {filtered.map((n, i) => (
              <SwipeableNotificationRow
                key={n.id}
                n={n}
                index={i}
                onNavigate={handleNotificationClick}
                onDelete={(id) => removeNotification(id)}
                onDeleteClick={(e, id) => handleDelete(e, id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Swipeable row — swipe left to reveal red delete action.
   On desktop the hover × button is used instead.
───────────────────────────────────────────────────────────── */
const SWIPE_THRESHOLD = 80; // px needed to confirm delete
const REVEAL_WIDTH    = 72; // px wide of the red delete strip

function SwipeableNotificationRow({
  n, index, onNavigate, onDelete, onDeleteClick,
}: {
  n: Notification;
  index: number;
  onNavigate: (n: Notification) => void;
  onDelete: (id: string) => void;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  const x = useMotionValue(0);
  // Reveal opacity tied to how far left the row has been dragged
  const revealOpacity = useTransform(x, [-REVEAL_WIDTH, 0], [1, 0]);
  const revealScale   = useTransform(x, [-REVEAL_WIDTH * 1.5, -REVEAL_WIDTH], [1.15, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Complete the swipe off-screen then delete
      animate(x, -500, { duration: 0.25, ease: 'easeIn' }).then(() => {
        onDelete(n.id);
      });
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      className="relative overflow-hidden"
    >
      {/* Red delete strip (revealed on swipe, mobile only) */}
      <motion.div
        className="md:hidden absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
        style={{ width: REVEAL_WIDTH, opacity: revealOpacity }}
      >
        <motion.div style={{ scale: revealScale }}>
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -REVEAL_WIDTH * 1.5, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative px-4 md:px-6 py-3 md:py-4 flex items-start gap-3 cursor-pointer
          hover:bg-gray-50 active:bg-gray-100 transition-colors group select-none
          ${!n.is_read ? 'bg-accent-50/40' : 'bg-white'}
        `}
        onClick={() => onNavigate(n)}
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
        {/* Desktop-only hover delete button */}
        <button
          onClick={(e) => onDeleteClick(e, n.id)}
          className="flex-shrink-0 mt-0.5 p-1 rounded-full text-gray-300
            hover:text-red-500 hover:bg-red-50
            opacity-0 group-hover:opacity-100 focus:opacity-100
            transition-all hidden md:block"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

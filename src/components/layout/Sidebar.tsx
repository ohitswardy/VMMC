import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar, LayoutDashboard, Building2, ClipboardList, Bell,
  FileText, BarChart3, Shield, Users, Settings, LogOut,
  Activity, X, Menu
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationsStore } from '../../stores/appStore';

/**
 * Neo-Skeuomorphism Sidebar & Mobile Navigation
 * - Desktop: raised sidebar panel with inner light rim
 * - Nav items: tactile raised surfaces on hover, pressed on active
 * - Active indicator: glowing accent bar
 * - Mobile bottom bar: raised surface with physical tab feel
 * - Mobile drawer: frosted glass bottom sheet
 */

const navItems = [
  { to: '/calendar',      icon: Calendar,       label: 'Calendar',  roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'nurse', 'viewer'] },
  { to: '/dashboard',     icon: LayoutDashboard,label: 'Dashboard', roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/live-board',    icon: Activity,       label: 'Live Board',roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'nurse', 'viewer'] },
  { to: '/bookings',      icon: ClipboardList,  label: 'Bookings',  roles: ['super_admin', 'anesthesiology_admin', 'department_user'] },
  { to: '/or-rooms',      icon: Building2,      label: 'OR Rooms',  roles: ['super_admin', 'anesthesiology_admin', 'nurse'] },
  { to: '/notifications', icon: Bell,           label: 'Alerts',    roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'nurse', 'viewer'] },
  { to: '/reports',       icon: BarChart3,      label: 'Reports',   roles: ['super_admin'] },
  { to: '/documents',     icon: FileText,       label: 'Docs',      roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/audit-logs',    icon: Shield,         label: 'Audit',     roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/users',         icon: Users,          label: 'Users',     roles: ['super_admin'] },
  { to: '/settings',      icon: Settings,       label: 'Settings',  roles: ['super_admin', 'anesthesiology_admin'] },
];

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const location = useLocation();

  const userRole = user?.role || 'viewer';
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
  const bottomBarItems = visibleItems.slice(0, 4);

  return (
    <>
      {/* ─── Mobile Bottom Navigation — raised tactile bar ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom
        bg-white/92 backdrop-blur-xl border-t border-white/50
        shadow-[0_-4px_16px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.60)]">
        {(() => {
          const totalCols = bottomBarItems.length + 1;
          const activeIdx = bottomBarItems.findIndex((item) => location.pathname === item.to);
          return (
            <div className="relative">
              {activeIdx >= 0 && (
                <motion.div
                  className="absolute top-0 h-[3px] rounded-b-full bg-accent-600
                    shadow-[0_0_8px_oklch(0.55_0.24_270/0.40)]"
                  initial={false}
                  animate={{
                    left: `calc(${(activeIdx / totalCols) * 100}% + ${100 / totalCols / 2}% - 16px)`,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.8 }}
                  style={{ width: '32px' }}
                />
              )}

              <div className="flex items-stretch">
                {bottomBarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      aria-label={item.label}
                      className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 touch-target"
                    >
                      <div className="relative">
                        <Icon
                          className={`w-6 h-6 transition-all duration-[120ms] ${
                            isActive ? 'text-accent-600 drop-shadow-[0_0_4px_oklch(0.55_0.24_270/0.30)]' : 'text-gray-500'
                          }`}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {item.to === '/notifications' && unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] text-white flex items-center justify-center font-bold
                            bg-accent-600 shadow-[0_1px_4px_oklch(0.3_0.15_270/0.30)]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] leading-none font-semibold transition-all duration-[120ms] ${
                        isActive ? 'text-accent-600' : 'text-gray-400'
                      }`}>{item.label}</span>
                    </NavLink>
                  );
                })}
                <button
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 touch-target"
                >
                  <Menu className="w-6 h-6 text-gray-500" strokeWidth={1.8} />
                  <span className="text-[10px] leading-none font-semibold text-gray-400">More</span>
                </button>
              </div>
            </div>
          );
        })()}
      </nav>

      {/* ─── Mobile Drawer Overlay — frosted ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Mobile Bottom Sheet — frosted glass ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto
              bg-white/92 backdrop-blur-xl backdrop-saturate-150
              rounded-t-[18px] border-t border-white/50"
            style={{
              boxShadow: '0 -8px 40px oklch(0.15 0.01 75 / 0.15), inset 0 1px 0 oklch(1 0 0 / 0.50)',
            }}
          >
            <div className="swipe-indicator" />

            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/60">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                bg-accent-600 border border-accent-700
                shadow-[0_2px_6px_oklch(0.3_0.15_270/0.25),inset_0_1px_0_oklch(1_0_0/0.12)]">
                {user?.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize font-medium">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2.5 rounded-[10px] touch-target
                  bg-gray-100 border border-gray-200
                  shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
                  hover:bg-gray-150 active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.12)] active:scale-[0.95]
                  transition-all duration-[120ms]"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Nav items */}
            <div className="px-3 py-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-[15px] touch-target
                      transition-all duration-[120ms] ${
                      isActive
                        ? 'bg-accent-50 text-accent-700 font-bold border border-accent-100 shadow-[inset_0_1px_3px_oklch(0.3_0.15_270/0.06),0_1px_0_oklch(1_0_0/0.30)]'
                        : 'text-gray-600 active:bg-gray-50 active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.08)]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.2 : 1.5} />
                      {item.to === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full text-[8px] text-white flex items-center justify-center font-bold
                          bg-accent-600 shadow-[0_1px_3px_oklch(0.3_0.15_270/0.25)]">
                          {unreadCount > 9 ? '!' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Logout */}
            <div className="px-3 pb-8 pt-2 border-t border-gray-200/60">
              <button
                onClick={() => { logout(); setDrawerOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 rounded-[10px] text-[15px] text-gray-500 w-full touch-target
                  active:bg-gray-50 active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.08)]
                  transition-all duration-[120ms]"
              >
                <LogOut className="w-[20px] h-[20px]" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar — raised neo-skeu surface ─── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[232px] lg:w-[256px] flex-col
        bg-white/95 backdrop-blur-md border-r border-white/50"
        style={{
          boxShadow: [
            '4px 0 20px oklch(0.15 0.01 75 / 0.06)',
            '1px 0 4px oklch(0.15 0.01 75 / 0.04)',
            'inset -1px 0 0 oklch(1 0 0 / 0.30)',
          ].join(', '),
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0">
          <img
            src="/VMMClogo.png"
            alt="VMMC"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <div className="overflow-hidden">
            <h1 className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">VMMC OR</h1>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5 font-medium">Booking System</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-gray-200/60" />

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`
                  group relative flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13.5px]
                  transition-all duration-[120ms]
                  ${isActive
                    ? 'bg-accent-50 text-accent-700 font-bold border border-accent-100 shadow-[inset_0_1px_3px_oklch(0.3_0.15_270/0.06),0_1px_0_oklch(1_0_0/0.30)]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white hover:shadow-[0_1px_3px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)] active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.10)]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent-600 rounded-r-full
                      shadow-[0_0_6px_oklch(0.55_0.24_270/0.40)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative flex-shrink-0">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.5} />
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] text-white flex items-center justify-center font-bold
                      bg-accent-600 shadow-[0_1px_3px_oklch(0.3_0.15_270/0.25)]">
                      {unreadCount > 9 ? '!' : unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200/60 px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white text-xs font-bold flex-shrink-0
              bg-gray-900 border border-gray-800
              shadow-[0_2px_4px_oklch(0.15_0.01_75/0.25),inset_0_1px_0_oklch(1_0_0/0.08)]">
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-gray-400 capitalize font-medium">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] text-gray-400
              hover:text-gray-700 hover:bg-white hover:shadow-[0_1px_3px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
              active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.10)]
              transition-all duration-[120ms]"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

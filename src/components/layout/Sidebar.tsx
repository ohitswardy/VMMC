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

const navItems = [
  { to: '/calendar', icon: Calendar, label: 'Calendar', roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'viewer'] },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/live-board', icon: Activity, label: 'Live Board', roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'viewer'] },
  { to: '/bookings', icon: ClipboardList, label: 'Bookings', roles: ['super_admin', 'anesthesiology_admin', 'department_user'] },
  { to: '/or-rooms', icon: Building2, label: 'OR Rooms', roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/notifications', icon: Bell, label: 'Alerts', roles: ['super_admin', 'anesthesiology_admin', 'department_user', 'viewer'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/documents', icon: FileText, label: 'Docs', roles: ['super_admin', 'anesthesiology_admin', 'department_user'] },
  { to: '/audit-logs', icon: Shield, label: 'Audit', roles: ['super_admin', 'anesthesiology_admin'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['super_admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'anesthesiology_admin'] },
];

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const location = useLocation();

  const userRole = user?.role || 'viewer';
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
  // Mobile bottom nav: first 4 items + hamburger
  const bottomBarItems = visibleItems.slice(0, 4);

  return (
    <>
      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
        {/* Total columns = nav items + 1 hamburger */}
        {(() => {
          const totalCols = bottomBarItems.length + 1;
          const activeIdx = bottomBarItems.findIndex((item) => location.pathname === item.to);
          return (
            <div className="relative">
              {/* Sliding indicator */}
              {activeIdx >= 0 && (
                <motion.div
                  className="absolute top-0 h-[3px] rounded-b-full bg-accent-600"
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
                      className="flex-1 flex items-center justify-center py-3 touch-target"
                    >
                      <div className="relative">
                        <Icon
                          className={`w-7 h-7 transition-colors duration-150 ${
                            isActive ? 'text-accent-600' : 'text-gray-600'
                          }`}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {item.to === '/notifications' && unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-accent-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
                {/* Menu toggle */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex-1 flex items-center justify-center py-3 touch-target"
                >
                  <Menu className="w-7 h-7 text-gray-600" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          );
        })()}
      </nav>

      {/* ─── Mobile Drawer Overlay ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-50 bg-gray-950/40"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Mobile Bottom Sheet ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[16px] max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
          >
            <div className="swipe-indicator" />

            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-[10px] bg-accent-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user?.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2.5 rounded-[10px] hover:bg-gray-100 active:bg-gray-150 touch-target transition-colors"
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
                    className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-[15px] transition-all duration-150 touch-target ${
                      isActive
                        ? 'bg-accent-50 text-accent-700 font-semibold'
                        : 'text-gray-600 active:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.2 : 1.5} />
                      {item.to === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-accent-600 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
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
            <div className="px-3 pb-8 pt-2 border-t border-gray-100">
              <button
                onClick={() => { logout(); setDrawerOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 rounded-[10px] text-[15px] text-gray-500 active:bg-gray-50 w-full touch-target transition-colors"
              >
                <LogOut className="w-[20px] h-[20px]" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[232px] lg:w-[256px] bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0">
          <img
            src="/VMMClogo.png"
            alt="VMMC"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <div className="overflow-hidden">
            <h1 className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">VMMC OR</h1>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Booking System</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gray-100" />

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
                  group relative flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13.5px]
                  transition-all duration-150
                  ${isActive
                    ? 'bg-accent-50 text-accent-700 font-semibold'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative flex-shrink-0">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.5} />
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-accent-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
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
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-[8px] bg-gray-900 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

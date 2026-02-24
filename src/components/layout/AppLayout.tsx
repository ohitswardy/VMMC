import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [showTopBar, setShowTopBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTopBar(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* ─── Scroll-triggered top bar with VMMC logo (mobile only) ─── */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-center bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-transform duration-300 ${
          showTopBar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <img
          src="/VMMClogo.png"
          alt="VMMC"
          className="h-10 w-auto object-contain"
        />
      </header>

      <Sidebar />
      {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
      <main className="min-h-[100dvh] pb-[76px] md:pb-0 md:pl-[232px] lg:pl-[256px]">
        <div className="px-4 pt-6 pb-8 sm:px-6 md:px-8 lg:px-10 max-w-[1280px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

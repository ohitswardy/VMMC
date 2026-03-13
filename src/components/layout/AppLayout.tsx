import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Neo-Skeuomorphism App Layout
 * - Warm ambient background with subtle radial gradients (set on body in CSS)
 * - Frosted top bar on mobile scroll
 * - Main content area with natural depth
 */
export default function AppLayout() {
  const [showTopBar, setShowTopBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTopBar(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* ─── Scroll-triggered top bar — frosted glass (mobile only) ─── */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-center
          bg-white/85 backdrop-blur-xl backdrop-saturate-150
          border-b border-white/50
          shadow-[0_2px_8px_oklch(0.15_0.01_75/0.06),inset_0_-1px_0_oklch(1_0_0/0.30)]
          transition-transform duration-300 ${
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

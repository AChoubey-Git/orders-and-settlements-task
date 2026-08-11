import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeSwitcher from './ThemeSwitcher';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full themed-bg themed-text-main overflow-hidden font-sans relative">
      {/* Mobile Header / Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b themed-border border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            O
          </div>
          <span className="font-bold text-lg">Orders</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 rounded-lg bg-black/5 dark:bg-white/10"
          >
            {mobileMenuOpen ? '✖' : '☰'}
          </button>
        </div>
      </div>

      {/* Floating Theme Switcher (Desktop) */}
      <div className="hidden lg:block absolute top-6 right-6 z-40">
        <ThemeSwitcher />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full z-20 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto lg:pt-0 pt-16 scroll-smooth bg-slate-50/30 dark:bg-slate-950/20">
        <Outlet />
      </div>
    </div>
  );
}

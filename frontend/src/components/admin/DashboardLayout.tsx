import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Topbar from './Topbar';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Page title shown in the mobile header bar */
  pageTitle?: string;
  /** Show the desktop top bar (bell, help, avatar) */
  showTopbar?: boolean;
}

/**
 * DashboardLayout
 * ──────────────────────────────────────────────────────────────
 * Desktop  → fixed 240px sidebar + optional topbar + scrollable content
 * Tablet   → sidebar collapsible (handled inside AdminSidebar)
 * Mobile   → hamburger opens sidebar as Drawer overlay
 */
export default function DashboardLayout({ children, pageTitle, showTopbar }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={drawerOpen} onClose={closeDrawer} />
      </div>

      {/* ── Page wrapper ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[240px]">
        {/* Mobile top bar (always shown on mobile) */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 lg:hidden">
          <Button
            id="mobile-menu-toggle"
            variant="ghost"
            size="icon"
            onClick={openDrawer}
            aria-label="Open navigation menu"
            className="h-9 w-9 text-slate-600"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {pageTitle && (
            <span className="truncate text-base font-semibold text-slate-900">{pageTitle}</span>
          )}
        </div>

        {/* Desktop topbar (optional) */}
        {showTopbar && (
          <div className="hidden lg:block">
            <Topbar title={pageTitle} />
          </div>
        )}

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  BarChart3,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { id: 'users',     label: 'Users',     icon: Users,           to: '/admin/users' },
  { id: 'sessions',  label: 'Sessions',  icon: History,         to: '/admin/sessions' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3,       to: '/admin/analytics' },
  { id: 'models',    label: 'Models',    icon: Cpu,             to: '/admin/models' },
  { id: 'settings',  label: 'Settings',  icon: Settings,        to: '/admin/settings' },
];

interface AdminSidebarProps {
  /** Controlled from parent for mobile drawer behaviour */
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function AdminSidebar({ isOpen, onClose, className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen !== undefined && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          // Mobile: slide in/out via transform
          'lg:translate-x-0',
          isOpen !== undefined
            ? isOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0',
          className
        )}
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <div className={cn(
          'relative flex items-center border-b border-[#E5E7EB] py-5 transition-all duration-300',
          collapsed ? 'justify-center px-3' : 'justify-between px-5'
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Blue circular icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] shadow-md shadow-blue-200">
              <Stethoscope className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="truncate text-[13.5px] font-semibold text-slate-900 leading-tight">
                  MedVQA Admin
                </div>
                <div className="truncate text-[11px] text-slate-400 leading-tight mt-0.5">
                  AI Medical Assistant
                </div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700',
              collapsed ? 'absolute -right-3 top-1/2 -translate-y-1/2' : ''
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronLeft className="h-3 w-3" />
            }
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-200'
                    : 'text-slate-700 hover:bg-[#F3F4F6] hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-2 z-50 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom Section ────────────────────────────────────── */}
        <div className="border-t border-[#E5E7EB] px-3 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/chat')}
            className={cn(
              'w-full justify-start gap-3 rounded-lg text-slate-600 hover:bg-[#F3F4F6] hover:text-slate-900 transition-colors',
              collapsed ? 'px-3' : ''
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Back to Chat</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}

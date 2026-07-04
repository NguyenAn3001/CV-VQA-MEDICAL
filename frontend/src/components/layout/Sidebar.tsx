import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  UserCircle2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
  );

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const createSession = useChatStore((state) => state.createSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const setActiveSession = useChatStore((state) => state.setActiveSession);

  const handleNewChat = async () => {
    const id = await createSession();
    if (!id) {
      return;
    }

    setActiveSession(id);
    navigate(`/chat/${id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onSessionClick = (id: string) => {
    setActiveSession(id);
    navigate(`/chat/${id}`);
  };

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-[#f9fafb] lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link to="/chat" className="block">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">MedVQA</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">Clinical Clarity</div>
          <p className="mt-1 text-sm text-slate-500">Medical-grade chat and review workflows.</p>
        </Link>
        <Button className="mt-5 w-full justify-start rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8]" onClick={handleNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-3 pt-4">
        <div className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Workspace</div>
        <nav className="mt-2 space-y-1">
          <NavLink to="/chat" end className={sidebarLinkClass}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </NavLink>
          <NavLink to="/profile" className={sidebarLinkClass}>
            <UserCircle2 className="h-4 w-4" />
            Profile
          </NavLink>
          {user?.role === 'admin' ? (
            <>
              <NavLink to="/admin/users" className={sidebarLinkClass}>
                <Users className="h-4 w-4" />
                Users
              </NavLink>
              <NavLink to="/admin/analytics" className={sidebarLinkClass}>
                <Activity className="h-4 w-4" />
                Analytics
              </NavLink>
              <NavLink to="/admin/sessions" className={sidebarLinkClass}>
                <Shield className="h-4 w-4" />
                Sessions
              </NavLink>
              <NavLink to="/admin/settings" className={sidebarLinkClass}>
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
            </>
          ) : null}
        </nav>
      </div>

      <div className="mt-4 px-5 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Recent sessions</div>
      <ScrollArea className="mt-2 flex-1 px-3">
        <div className="space-y-1 pb-4">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
              No sessions yet. Start a new review to begin.
            </div>
          ) : null}
          {sessions.map((session) => {
            const isActive =
              activeSessionId === session.id || location.pathname === `/chat/${session.id}`;

            return (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
                  isActive
                    ? 'border-slate-900 bg-white'
                    : 'border-transparent hover:border-slate-200 hover:bg-white'
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSessionClick(session.id)}
                >
                  <div className="truncate text-sm font-medium text-slate-800">{session.title || 'New Chat'}</div>
                  <div className="truncate text-xs text-slate-500">{session.message_count} messages</div>
                </button>
                <button
                  type="button"
                  className="ml-3 rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => deleteSession(session.id)}
                  aria-label={`Delete ${session.title}`}
                >
                  <ChevronRight className="h-4 w-4 rotate-45" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-sm font-medium text-slate-900">{user?.username ?? 'User'}</div>
          <div className="mt-1 text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Clinical user'}</div>
        </div>
        <Button variant="ghost" className="w-full justify-start rounded-lg text-slate-600 hover:bg-white hover:text-slate-900" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

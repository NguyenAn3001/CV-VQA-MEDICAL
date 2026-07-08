import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Pin, PinOff, Verified, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

const sidebarLinkClass = ({ isActive, isCollapsed }: { isActive: boolean; isCollapsed: boolean }) =>
  cn(
    'flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg group',
    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
    isActive ? 'bg-secondary-container text-on-secondary-container scale-[0.99] transition-transform duration-150' : ''
  );

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const setActiveSession = useChatStore((state) => state.setActiveSession);
  const togglePin = useChatStore((state) => state.togglePin);
  const isCollapsed = useChatStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);
  const setSidebarCollapsed = useChatStore((state) => state.setSidebarCollapsed);
  
  // Manage responsive collapse
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, [setSidebarCollapsed]);

  const handleNewChat = () => {
    setActiveSession(null);
    navigate(`/chat`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onSessionClick = (id: string) => {
    setActiveSession(id);
    navigate(`/chat/${id}`);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const pinnedSessions = sessions.filter((s) => s.is_pinned);
  const otherSessions = sessions.filter((s) => !s.is_pinned);

  const handlePinClick = (e: React.MouseEvent, id: string, isPinned: boolean) => {
    e.stopPropagation();
    togglePin(id, !isPinned);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.nav 
        initial={false}
        animate={{ 
          width: isCollapsed ? (isMobile ? 0 : 72) : 280,
          opacity: isCollapsed && isMobile ? 0 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={cn(
          "bg-sidebar-bg border-r border-border-subtle h-screen flex flex-col p-4 gap-2 z-20 shrink-0 overflow-hidden",
          isMobile && "fixed left-0 top-0 bottom-0 shadow-2xl"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center mb-6 px-1", isCollapsed ? "justify-center flex-col gap-4" : "justify-between")}>
          <div 
            className={cn("flex items-center gap-3 cursor-pointer overflow-hidden", isCollapsed && "justify-center")} 
            onClick={() => navigate('/chat')}
          >
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0">
              <span className="material-symbols-outlined icon-fill">medical_services</span>
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-headline-sm font-headline-sm font-bold text-on-surface">MedVQA</h1>
                <p className="text-label-xs font-label-xs text-on-surface-variant">AI Medical Assistant</p>
              </motion.div>
            )}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors shrink-0 hidden md:block"
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[100]">
              {isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* CTA */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className={cn(
                "bg-surface-white border border-border-subtle hover:bg-surface-container-low text-on-surface font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 mb-6 transition-colors shadow-sm shrink-0",
                isCollapsed ? "px-0 w-10 h-10 mx-auto rounded-full" : "px-4 w-full"
              )}
              onClick={handleNewChat}
            >
              <Plus className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">New Chat</span>}
            </button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">New Chat</TooltipContent>}
        </Tooltip>

        {/* History Lists */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6 scrollbar-hide"
            >
              <div>
                {pinnedSessions.length > 0 && (
                  <>
                    <h3 className="text-label-xs font-label-xs text-on-surface-variant px-3 mb-2 uppercase tracking-wider whitespace-nowrap">
                      Pinned
                    </h3>
                    <ul className="flex flex-col gap-1 mb-4">
                      {pinnedSessions.map((session) => {
                        const isActive = activeSessionId === session.id || location.pathname === `/chat/${session.id}`;
                        return (
                          <li key={session.id} className="flex items-center group">
                            <button
                              type="button"
                              className={sidebarLinkClass({ isActive, isCollapsed: false }) + ' flex-1 min-w-0'}
                              onClick={() => onSessionClick(session.id)}
                            >
                              <MessageSquare className="h-5 w-5 shrink-0" />
                              <span className="text-label-md font-label-md truncate flex-1 text-left">
                                {session.title || 'New Chat'}
                              </span>
                              <span className={cn(
                                "text-label-xs font-label-xs transition-opacity whitespace-nowrap",
                                isActive ? "opacity-70" : "opacity-0 group-hover:opacity-70"
                              )}>
                                {session.message_count} msg
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handlePinClick(e, session.id, session.is_pinned)}
                              className="p-2 hover:bg-surface-container-high rounded text-primary shrink-0 ml-1 transition-colors"
                              aria-label="Unpin session"
                            >
                              <Pin className="h-4 w-4" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                <h3 className="text-label-xs font-label-xs text-on-surface-variant px-3 mb-2 uppercase tracking-wider whitespace-nowrap">
                  Recent Sessions
                </h3>
                <ul className="flex flex-col gap-1">
                  {otherSessions.length === 0 && pinnedSessions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500 whitespace-nowrap">
                      No sessions yet.
                    </li>
                  ) : otherSessions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-500 whitespace-nowrap">
                      No other sessions.
                    </li>
                  ) : null}
                  {otherSessions.map((session) => {
                    const isActive = activeSessionId === session.id || location.pathname === `/chat/${session.id}`;

                    return (
                      <li key={session.id} className="flex items-center group">
                        <button
                          type="button"
                          className={sidebarLinkClass({ isActive, isCollapsed: false }) + ' flex-1 min-w-0'}
                          onClick={() => onSessionClick(session.id)}
                        >
                          <MessageSquare className="h-5 w-5 shrink-0" />
                          <span className="text-label-md font-label-md truncate flex-1 text-left">
                            {session.title || 'New Chat'}
                          </span>
                          <span className={cn(
                            "text-label-xs font-label-xs transition-opacity whitespace-nowrap",
                            isActive ? "opacity-70" : "opacity-0 group-hover:opacity-70"
                          )}>
                            {session.message_count} msg
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handlePinClick(e, session.id, session.is_pinned)}
                          className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
                          aria-label="Pin session"
                        >
                          <PinOff className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && <div className="flex-1" /> /* Spacer when collapsed */}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border-subtle flex flex-col gap-2 shrink-0 overflow-hidden">
          {user?.role === 'admin' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={cn(
                    "flex items-center text-primary hover:bg-surface-container-high transition-colors rounded-lg",
                    isCollapsed ? "justify-center p-2 mx-auto w-10 h-10" : "gap-3 px-3 py-2 w-full text-left"
                  )} 
                  onClick={() => navigate('/admin/users')}
                >
                  <Verified className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="text-label-md font-label-md font-medium whitespace-nowrap">Admin Panel</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Admin Panel</TooltipContent>}
            </Tooltip>
          ) : null}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center rounded-lg",
                isCollapsed ? "justify-center mx-auto w-10" : "gap-1 w-full"
              )}>
                <button
                  className={cn(
                    "flex items-center hover:bg-surface-container-high transition-colors rounded-lg cursor-pointer",
                    isCollapsed
                      ? "justify-center p-2 w-10 h-10"
                      : "gap-3 px-3 py-2 flex-1 min-w-0",
                    location.pathname === '/profile' && !isCollapsed
                      ? 'bg-secondary-container text-on-secondary-container scale-[0.99] transition-transform duration-150'
                      : ''
                  )}
                  onClick={() => navigate('/profile')}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-label-md font-label-md text-on-surface font-medium truncate">{user?.username ?? 'User'}</p>
                      <p className="text-label-xs font-label-xs text-on-surface-variant truncate">{user?.role === 'admin' ? 'Administrator' : 'Clinical user'}</p>
                    </div>
                  )}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors shrink-0"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Profile</TooltipContent>}
          </Tooltip>
        </div>
      </motion.nav>
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm" 
            onClick={() => setSidebarCollapsed(true)} 
          />
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

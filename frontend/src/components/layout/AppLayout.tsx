import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightSidebar from '../chat/RightSidebar';
import { useChatStore } from '../../store/chatStore';
import { useEffect } from 'react';

export default function AppLayout() {
  const toggleSidebar = useChatStore(state => state.toggleSidebar);
  const fetchSessions = useChatStore(state => state.fetchSessions);

  // Fetch sessions on mount so Sidebar always has data regardless of page
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Global keyboard shortcut to toggle sidebar (Ctrl+B / Cmd+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="bg-surface text-on-surface h-screen w-screen overflow-hidden flex bg-surface-white relative">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative bg-surface-white min-w-0 transition-all duration-250 ease-in-out">
        <Outlet />
      </main>
      <RightSidebar />
    </div>
  );
}

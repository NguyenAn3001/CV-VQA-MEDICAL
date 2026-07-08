import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { List, X } from 'lucide-react';
import type { ChatMessage } from '../../types/models';

interface RightSidebarProps {
  messages: ChatMessage[];
}

export default function RightSidebar({ messages }: RightSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const userQuestions = messages.filter(m => m.role === 'user');

  const handleQuestionClick = (messageId?: string, index?: number) => {
    const id = messageId || `msg-user-${index}`;
    document.querySelector(`[data-message-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (isMobile) setIsMobileOpen(false);
  };

  if (userQuestions.length === 0) return null;

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center"
          aria-label="Show questions"
        >
          <List className="h-5 w-5" />
        </button>
      )}

      <aside
        className={cn(
          'border-l border-border-subtle bg-surface-white flex flex-col shrink-0',
          isMobile
            ? 'fixed inset-y-0 right-0 z-40 w-80 shadow-2xl translate-x-0 transition-transform duration-250 ease-in-out'
            : 'w-72',
          isMobile && !isMobileOpen && 'translate-x-full'
        )}
      >
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <h3 className="text-label-md font-label-md font-semibold text-on-surface">Questions</h3>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="p-3 border-b border-border-subtle">
          <h3 className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider">
            Questions ({userQuestions.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {userQuestions.map((msg, idx) => (
            <button
              key={msg.id || `user-msg-${idx}`}
              onClick={() => handleQuestionClick(msg.id, msg.id ? undefined : idx)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors line-clamp-2"
            >
              {msg.content || '(Image)'}
            </button>
          ))}
        </div>
      </aside>

      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

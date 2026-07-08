import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageSquare, List, X, Pen, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';

export default function RightSidebar() {
  const location = useLocation();
  const isOpen = useChatStore((s) => s.isRightSidebarOpen);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessionDetail = useChatStore((s) => activeSessionId ? s.sessionDetailsById[activeSessionId] : undefined);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const updateSessionTitle = useChatStore((s) => s.updateSessionTitle);
  const messages = sessionDetail?.messages ?? [];

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname.startsWith('/sessions');

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (sessionDetail) setTitleDraft(sessionDetail.title || '');
  }, [sessionDetail]);

  const userQuestions = messages.filter(m => m.role === 'user');

  const attachedImages = messages
    ?.filter((msg) => msg.role === 'user' && msg.image_url)
    .map((msg) => msg.image_url as string) || [];

  const handleClick = useCallback((messageId?: string, index?: number) => {
    const id = messageId || `msg-user-${index}`;
    setActiveId(id);
    document.querySelector(`[data-message-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim() && sessionDetail && titleDraft !== sessionDetail.title && activeSessionId) {
      updateSessionTitle(activeSessionId, titleDraft.trim());
    }
  };

  const handleDelete = () => {
    if (activeSessionId) {
      deleteSession(activeSessionId);
      setShowDeleteConfirm(false);
    }
  };

  if (!isChatRoute) return null;

  const isVisible = isOpen || isMobileOpen;

  return (
    <>
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center"
          aria-label="Show questions"
        >
          <List className="h-5 w-5" />
        </button>
      )}

      <AnimatePresence>
        {isVisible && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? 320 : 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'bg-sidebar-bg border-l border-border-subtle h-screen flex flex-col shrink-0 overflow-hidden',
              isMobile ? 'fixed inset-y-0 right-0 shadow-2xl z-40' : 'z-20'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0">
                  <span className="material-symbols-outlined icon-fill">help_outline</span>
                </div>
                <div className="overflow-hidden whitespace-nowrap">
                  <h1 className="text-headline-sm font-headline-sm font-bold text-on-surface">Session</h1>
                  <p className="text-label-xs font-label-xs text-on-surface-variant">Session details</p>
                </div>
              </div>

              {isMobile && (
                <button onClick={() => setIsMobileOpen(false)} className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {sessionDetail && (
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {/* Session Info */}
                <div className="px-4 pb-3 space-y-3 border-b border-border-subtle">
                  {/* Title */}
                  <div className="flex items-center gap-1">
                    {isEditingTitle ? (
                      <input
                        className="flex-1 bg-transparent border-b border-primary px-0 py-0.5 text-label-md font-label-md text-on-surface focus:outline-none"
                        type="text"
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="flex-1 truncate text-label-md font-label-md text-on-surface">{sessionDetail.title || 'New Chat'}</span>
                        <button onClick={() => setIsEditingTitle(true)} className="p-0.5 hover:bg-surface-container-high rounded text-on-surface-variant shrink-0">
                          <Pen className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-[72px_1fr] gap-y-1.5 text-label-xs font-label-xs">
                    <span className="text-on-surface-variant">Created</span>
                    <span className="text-on-surface">
                      {sessionDetail.created_at
                        ? new Date(sessionDetail.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        : 'Unknown'}
                    </span>
                    <span className="text-on-surface-variant">Model</span>
                    <span className="text-on-surface">{sessionDetail.model ?? 'GPT-4o + ViT-PubMedBERT'}</span>
                  </div>

                  {/* Attached Images */}
                  {attachedImages.length > 0 && (
                    <div>
                      <label className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider block mb-1.5">
                        Images ({attachedImages.length})
                      </label>
                      <div className="flex flex-col gap-1">
                        {attachedImages.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 border border-border-subtle rounded-lg hover:bg-surface-container-low transition-colors group">
                            <div className="h-8 w-8 rounded bg-black shrink-0 overflow-hidden border border-border-subtle">
                              <img alt="" className="h-full w-full object-cover opacity-80" src={url} />
                            </div>
                            <span className="flex-1 truncate text-label-xs font-label-xs text-on-surface-variant">image_{idx + 1}</span>
                            <a href={url} download={`image_${idx + 1}.png`} target="_blank" rel="noreferrer" className="p-1 text-on-surface-variant hover:text-primary rounded shrink-0 transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions */}
                {userQuestions.length > 0 && (
                  <div className="px-4 py-3">
                    <h3 className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider mb-2">
                      Questions ({userQuestions.length})
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      {userQuestions.map((msg, idx) => {
                        const msgId = msg.id || `user-msg-${idx}`;
                        const isActive = activeId === msgId;
                        return (
                          <button
                            key={msgId}
                            type="button"
                            onClick={() => handleClick(msg.id, msg.id ? undefined : idx)}
                            className={cn(
                              'flex items-center w-full text-left gap-3 px-3 py-2 rounded-lg transition-colors',
                              'text-label-md font-label-md text-on-surface-variant',
                              'hover:bg-surface-container-high',
                              isActive && 'bg-secondary-container text-on-secondary-container scale-[0.99] transition-transform duration-150'
                            )}
                          >
                            <MessageSquare className="h-5 w-5 shrink-0" />
                            <span className="truncate flex-1">{msg.content || '(Image)'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            {activeSessionId && (
              <div className="p-4 border-t border-border-subtle shrink-0">
                {showDeleteConfirm ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-label-xs font-label-xs text-on-surface-variant">Delete this session?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-3 py-1.5 rounded-lg text-label-md font-label-md text-white bg-error hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-label-md font-label-md text-on-surface-variant border border-border-subtle hover:bg-surface-container-high transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-label-md font-label-md text-error hover:bg-error-container transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Session
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

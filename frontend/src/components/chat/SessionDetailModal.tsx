import { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { X, Pen, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SessionDetailModal() {
  const { 
    detailModalSessionId, 
    closeDetailModal, 
    sessionDetailsById, 
    fetchSessionDetail,
    deleteSession,
    updateSessionTitle
  } = useChatStore();
  
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (detailModalSessionId) {
      // Ensure we have the latest details
      fetchSessionDetail(detailModalSessionId).then((detail) => {
        if (detail) setTitle(detail.title || 'New Chat');
      });
    } else {
      setIsEditingTitle(false);
    }
  }, [detailModalSessionId, fetchSessionDetail]);

  if (!detailModalSessionId) return null;

  const detail = sessionDetailsById[detailModalSessionId];
  if (!detail) return null; // Or render a skeleton loader

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== detail.title) {
      updateSessionTitle(detailModalSessionId, title.trim());
    }
  };

  const handleDelete = () => {
    deleteSession(detailModalSessionId);
    closeDetailModal();
  };

  // Extract attached images from messages
  const attachedImages = detail.messages
    ?.filter((msg) => msg.role === 'user' && msg.image_url)
    .map((msg) => msg.image_url as string) || [];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={closeDetailModal}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
          className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col z-[101]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <header className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-on-surface">Session Details</h2>
            <button 
              onClick={closeDetailModal}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Modal Content */}
          <main className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
            {/* Title Field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-on-surface-variant">Title</label>
              <div className="flex items-center">
                {isEditingTitle ? (
                  <input 
                    className="w-full bg-transparent border-0 border-b border-primary focus:ring-0 px-0 py-1 font-medium text-on-surface transition-colors focus:outline-none"
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    autoFocus
                  />
                ) : (
                  <>
                    <input 
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-outline-variant px-0 py-1 font-medium text-on-surface transition-colors cursor-text focus:outline-none"
                      type="text" 
                      value={title}
                      readOnly
                      onClick={() => setIsEditingTitle(true)}
                    />
                    <button 
                      className="text-on-surface-variant ml-2 hover:text-primary transition-colors focus:outline-none"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-y-4 text-sm">
              {/* Created Info */}
              <div className="text-on-surface-variant font-medium">Created</div>
              <div className="text-on-surface">
                {detail.created_at ? new Date(detail.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
              </div>
              
              {/* Model Info */}
              <div className="text-on-surface-variant font-medium">Model</div>
              <div className="text-on-surface">GPT-4o + Medical</div>
              
              {/* Messages Count */}
              <div className="text-on-surface-variant font-medium">Messages</div>
              <div className="text-on-surface">{detail.message_count || 0}</div>
            </div>

            {/* Attached Image Section */}
            {attachedImages.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-on-surface-variant">Attached Images ({attachedImages.length})</h3>
                <div className="flex flex-col gap-2">
                  {attachedImages.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-border-subtle rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-12 w-12 rounded bg-black flex-shrink-0 overflow-hidden relative border border-border-subtle">
                          <img alt="Thumbnail" className="h-full w-full object-cover object-center opacity-80" src={url} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-on-surface truncate">attachment_{idx + 1}.png</span>
                          <span className="text-xs text-on-surface-variant">Image</span>
                        </div>
                      </div>
                      <a 
                        href={url} 
                        download={`attachment_${idx + 1}.png`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-on-surface-variant hover:text-primary p-2 rounded-full transition-colors shrink-0" 
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Modal Footer */}
          <footer className="p-4 border-t border-border-subtle bg-surface-container-low flex justify-center">
            <button 
              onClick={handleDelete}
              className="w-full max-w-[200px] text-error hover:bg-error-container hover:text-on-error-container font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete Session
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
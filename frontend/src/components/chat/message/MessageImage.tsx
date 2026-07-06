import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageImageProps {
  url: string;
}

export default function MessageImage({ url }: MessageImageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div 
        className="relative group cursor-zoom-in inline-block"
        onClick={() => setIsExpanded(true)}
      >
        <img
          src={url}
          alt="Attachment"
          onLoad={() => {
            // Trigger a resize event to ensure the chat window updates its scroll height
            window.dispatchEvent(new Event('resize'));
          }}
          className="rounded-xl border border-slate-200 object-cover max-h-[260px] max-w-[320px] shadow-sm hover:shadow-md transition-shadow"
        />
        <div className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <Maximize2 className="h-4 w-4" />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={url}
              alt="Enlarged attachment"
              className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
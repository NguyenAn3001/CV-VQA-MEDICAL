import { useEffect, useRef, useState, UIEvent, useLayoutEffect, useCallback } from 'react';
import type { ChatMessage as ChatMessageType, ChatToolCall } from '../../types/models';
import ChatMessage from './message/ChatMessage';
import ToolChips from './tools/ToolChips';
import EmptyChat from './EmptyChat';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  messages: ChatMessageType[];
  streamingContent: string;
  activeTools: ChatToolCall[];
  isGenerating: boolean;
  isEmptyState: boolean;
  onSuggestionClick: (text: string) => void;
}

export default function ChatWindow({
  messages,
  streamingContent,
  activeTools,
  isGenerating,
  isEmptyState,
  onSuggestionClick
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAutoScrollEnabled = useRef(true);
  const previousMessageCount = useRef(messages.length);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAutoScrollEnabled.current) {
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (!container) return;

        container.scrollTo({
          top: container.scrollHeight + 500, // Extra offset to guarantee absolute bottom
          behavior: isGenerating && !force ? 'auto' : 'smooth'
        });
      });
    }
  }, [isGenerating]);

  // Force scroll down exactly when a new message starts
  useEffect(() => {
    if (messages.length > previousMessageCount.current || isGenerating) {
      isAutoScrollEnabled.current = true;
      setShowScrollButton(false);
      scrollToBottom(true);
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, isGenerating, scrollToBottom]);

  // Handle scroll events to detect manual scrolling
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Tolerance of 120px to consider user is at bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 120;
    
    if (isAtBottom) {
      isAutoScrollEnabled.current = true;
      setShowScrollButton(false);
    } else {
      isAutoScrollEnabled.current = false;
      setShowScrollButton(true);
    }
  };

  // Scroll to bottom effect triggered on ANY content change
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, activeTools, scrollToBottom]);

  const handleJumpToLatest = () => {
    isAutoScrollEnabled.current = true;
    setShowScrollButton(false);
    scrollToBottom(true);
  };

  if (isEmptyState) {
    return <EmptyChat onSuggestionClick={onSuggestionClick} />;
  }

  const activeToolNames = activeTools.map(t => t.name);

  return (
    <div 
      className="flex-1 overflow-y-auto w-full relative" 
      ref={scrollRef}
      onScroll={handleScroll}
    >
      {/* 
        Padding bottom is extremely important here.
        We need enough padding to clear the absolute positioned ChatInput (which is around 120-150px tall).
      */}
      <div className="mx-auto w-full max-w-[850px] px-4 pt-8 pb-48 flex flex-col min-h-full">
        {messages.map((message, index) => {
          const msgId = message.id || `msg-${message.role}-${index}`;
          return (
            <div key={msgId} data-message-id={msgId}>
              <ChatMessage
                message={message}
              />
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex flex-col w-full">
            <ToolChips activeTools={activeToolNames} completedTools={[]} />
            
            <ChatMessage
              message={{ role: 'assistant', content: streamingContent }}
              isStreaming
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleJumpToLatest}
            className="fixed bottom-36 right-1/2 translate-x-1/2 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 shadow-md rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors z-30 text-sm font-medium"
          >
            <ArrowDown className="h-4 w-4" />
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { ActivitySquare, Sparkles } from 'lucide-react';
import type { ChatMessage, ChatToolCall } from '../../types/models';
import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  streamingContent: string;
  activeTools: ChatToolCall[];
  isGenerating: boolean;
  sessionTitle?: string;
  isEmptyState: boolean;
}

export default function ChatWindow({
  messages,
  streamingContent,
  activeTools,
  isGenerating,
  sessionTitle,
  isEmptyState,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, activeTools]);

  if (isEmptyState) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
            <ActivitySquare className="h-10 w-10" />
          </div>
          <h2 className="mt-8 text-4xl font-semibold tracking-tight text-slate-900">Start a new diagnostic conversation</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
            Upload a medical image, ask a follow-up clinical question, or continue a prior discussion with the assistant.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              'Summarize findings in this MRI scan',
              'Describe this CT image for a patient handoff',
              'List differential considerations from the uploaded X-ray',
              'Explain the assistant tool usage for this session',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm text-slate-600 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center overflow-y-auto px-4 pb-40 pt-8">
      <div className="w-full max-w-3xl space-y-6">
        {sessionTitle ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{sessionTitle}</div> : null}
        {messages.map((message, index) => (
          <ChatBubble key={message.id || `${message.role}-${index}`} message={message} />
        ))}

        {activeTools.length > 0 ? (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Sparkles className="h-4 w-4 text-[#2563eb]" />
            Running tools: {activeTools.map((tool) => tool.name).join(', ')}
          </div>
        ) : null}

        {isGenerating ? (
          <ChatBubble
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming
          />
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

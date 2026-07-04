import { Bot, Stethoscope, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../../types/models';

interface ChatBubbleProps {
  message: ChatMessage;
  timestamp?: string;
  isStreaming?: boolean;
}

export default function ChatBubble({ message, timestamp, isStreaming = false }: ChatBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className="flex gap-4">
      <div
        className={cn(
          'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
          isAssistant ? 'border-slate-200 bg-white text-[#2563eb]' : 'border-[#2563eb] bg-[#2563eb] text-white'
        )}
      >
        {isAssistant ? <Stethoscope className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">{isAssistant ? 'MedVQA Assistant' : 'You'}</span>
          {timestamp ? <span className="text-xs text-slate-400">{timestamp}</span> : null}
        </div>
        {message.image_url ? (
          <img
            src={message.image_url}
            alt="Medical upload"
            className="mb-3 max-w-xs rounded-2xl border border-slate-200 object-cover"
          />
        ) : null}
        <div className="space-y-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
          {message.content || isStreaming ? <p>{message.content}{isStreaming ? <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded bg-slate-400 align-middle" /> : null}</p> : null}
        </div>
        {message.toolsUsed?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.toolsUsed.map((tool) => (
              <span
                key={`${tool.name}-${JSON.stringify(tool.args)}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
              >
                <Bot className="h-3.5 w-3.5" />
                {tool.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

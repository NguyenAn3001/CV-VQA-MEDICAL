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
      {isAssistant ? (
        <div className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-primary shrink-0 mt-1 bg-surface-white">
          <span className="material-symbols-outlined text-[18px]">medical_services</span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-semibold shrink-0 mt-1">
          U
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-label-md text-label-md font-semibold text-on-surface">{isAssistant ? 'MedVQA Assistant' : 'You'}</span>
          {timestamp ? <span className="text-label-xs font-label-xs text-on-surface-variant">{timestamp}</span> : null}
        </div>
        
        <div className="text-body-base font-body-base text-on-surface space-y-3">
          {message.content || isStreaming ? (
            <p>
              {message.content}
              {isStreaming ? <span className="inline-block w-2 h-4 bg-primary ml-1 align-middle animate-pulse"></span> : null}
            </p>
          ) : null}
        </div>

        {message.image_url ? (
          <div className="mt-3">
            <img
              src={message.image_url}
              alt="Medical upload"
              className="rounded-lg border border-border-subtle w-64 h-auto object-cover"
            />
          </div>
        ) : null}

        {message.toolsUsed?.length ? (
          <div className="mt-3 flex items-center gap-2 text-label-xs font-label-xs text-on-surface-variant italic">
            <span>Used tools: {message.toolsUsed.map(t => t.name).join(', ')}</span>
            <span>•</span>
            <button className="flex items-center hover:text-on-surface transition-colors">
              Sources <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

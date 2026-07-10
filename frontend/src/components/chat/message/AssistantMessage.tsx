import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReasoningSection from '../tools/ReasoningSection';
import { ToolExecutionData } from '../tools/ToolExecutionCard';
import TypingIndicator from './TypingIndicator';
import { Bot, Copy, Check } from 'lucide-react';
import { formatTimestamp, formatTimestampFull } from '../../../lib/format';

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}

// Regex to extract standard backend tool return format: *[Tool name returned: result]*
const TOOL_RETURN_REGEX = /\*\[Tool (.*?) returned: ([\s\S]*?)\]\*/g;

export default function AssistantMessage({ content, isStreaming, createdAt }: AssistantMessageProps) {
  const { cleanText, tools } = useMemo(() => {
    let cleanText = content;
    const tools: ToolExecutionData[] = [];
    
    // Extract tool calls from the text stream
    const matches = Array.from(content.matchAll(TOOL_RETURN_REGEX));
    
    for (const match of matches) {
      const fullMatch = match[0];
      const toolName = match[1];
      const result = match[2];
      
      tools.push({
        toolName,
        status: 'completed',
        result: result.trim(),
      });
      
      // Remove the exact matched string from the clean text
      cleanText = cleanText.replace(fullMatch, '');
    }
    
    // Clean up any remaining double newlines created by removing the tool blocks
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
    
    return { cleanText, tools };
  }, [content]);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const showTyping = isStreaming && !cleanText && tools.length === 0;
  
  // Append a unique block character for the streaming cursor to render safely inside markdown
  const textWithCursor = isStreaming && cleanText ? `${cleanText} ▋` : cleanText;

  return (
    <div className="flex w-full mb-6">
      <div className="flex gap-4 max-w-full md:max-w-[85%] w-full">
        <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-blue-600 shrink-0 mt-1">
          <Bot className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 mb-1">Assistant</div>
          
          <ReasoningSection tools={tools} defaultExpanded={false} />
          
          {showTyping ? (
            <TypingIndicator />
          ) : (
            <div className="text-[15px] leading-7 text-slate-800 prose prose-slate prose-sm sm:prose-base max-w-none break-words">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p(props) {
                    const { children, ...rest } = props;
                    // Check if the last child contains our cursor character
                    if (Array.isArray(children)) {
                      return (
                        <p {...rest}>
                          {children.map((child: any, i: number) => {
                            if (typeof child === 'string' && child.includes('▋')) {
                              return (
                                <span key={i}>
                                  {child.replace('▋', '')}
                                  <span className="streaming-cursor"></span>
                                </span>
                              );
                            }
                            return <span key={i}>{child}</span>;
                          })}
                        </p>
                      );
                    }
                    
                    if (typeof children === 'string' && children.includes('▋')) {
                      return (
                        <p {...rest}>
                          {children.replace('▋', '')}
                          <span className="streaming-cursor"></span>
                        </p>
                      );
                    }
                    
                    return <p {...rest}>{children}</p>;
                  },
                }}
              >
                {textWithCursor}
              </ReactMarkdown>
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            {createdAt && (
              <span
                className="text-xs text-slate-400"
                title={formatTimestampFull(createdAt)}
              >
                {formatTimestamp(createdAt)}
              </span>
            )}
            {!isStreaming && cleanText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
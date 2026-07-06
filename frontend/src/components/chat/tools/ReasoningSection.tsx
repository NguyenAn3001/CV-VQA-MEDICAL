import { useState } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolExecutionCard, { ToolExecutionData } from './ToolExecutionCard';

interface ReasoningSectionProps {
  tools: ToolExecutionData[];
  defaultExpanded?: boolean;
}

export default function ReasoningSection({ tools, defaultExpanded = false }: ReasoningSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!tools || tools.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600 group"
      >
        <div className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 text-slate-500 group-hover:bg-slate-300 transition-colors">
          <Terminal className="h-3 w-3" />
        </div>
        Reasoning
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
            // When reasoning animates open, it changes DOM height.
            // React layouts will catch this if we emit a resize or rely on ChatWindow's effect.
            onAnimationComplete={() => {
              window.dispatchEvent(new Event('resize')); // Hack to trigger any layout observers
            }}
          >
            <div className="pt-3 pl-2 pr-2 border-l-2 border-slate-100 ml-5">
              {tools.map((tool, idx) => (
                <ToolExecutionCard key={`${tool.toolName}-${idx}`} data={tool} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
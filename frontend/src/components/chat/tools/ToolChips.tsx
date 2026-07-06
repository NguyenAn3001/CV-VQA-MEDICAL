import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolChipsProps {
  activeTools: string[];
  completedTools: string[];
}

export default function ToolChips({ activeTools, completedTools }: ToolChipsProps) {
  if (activeTools.length === 0 && completedTools.length === 0) return null;

  const allTools = Array.from(new Set([...activeTools, ...completedTools]));

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
        <span className="material-symbols-outlined text-[18px] text-[#2563eb]">magic_button</span>
        Running tools...
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {allTools.map((toolName) => {
            const isCompleted = completedTools.includes(toolName) && !activeTools.includes(toolName);
            
            return (
              <motion.div
                key={toolName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isCompleted 
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {toolName}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
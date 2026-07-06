import { Sparkles, Image as ImageIcon, FileText, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const SUGGESTIONS = [
  {
    icon: ImageIcon,
    title: 'Analyze a medical image',
    description: 'Upload an MRI, CT, or X-ray for AI review',
  },
  {
    icon: FileText,
    title: 'Summarize a report',
    description: 'Extract key findings from clinical text',
  },
  {
    icon: Search,
    title: 'Explain a diagnosis',
    description: 'Get details on symptoms and treatments',
  }
];

interface EmptyChatProps {
  onSuggestionClick: (text: string) => void;
}

export default function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 h-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full max-w-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight mb-8">
          How can I help you today?
        </h2>
        
        <div className="grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                onClick={() => onSuggestionClick(item.title)}
                className="group flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="mb-3 p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm text-slate-800 mb-1">{item.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{item.description}</div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
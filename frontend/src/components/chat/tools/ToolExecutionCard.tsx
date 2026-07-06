import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolExecutionData {
  toolName: string;
  status: 'running' | 'completed';
  result?: string;
  args?: Record<string, any>;
  duration?: string;
}

interface ToolExecutionCardProps {
  data: ToolExecutionData;
}

export default function ToolExecutionCard({ data }: ToolExecutionCardProps) {
  const isCompleted = data.status === 'completed';

  return (
    <Card className="mb-3 overflow-hidden shadow-sm border-slate-200 text-sm">
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b",
        isCompleted ? "bg-slate-50 border-slate-100" : "bg-blue-50/50 border-blue-100"
      )}>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          )}
          <span className="font-medium text-slate-700 font-mono text-xs">{data.toolName}</span>
        </div>
        {data.duration && (
          <span className="text-xs text-slate-400">{data.duration}</span>
        )}
      </div>
      
      <div className="p-3 space-y-3 bg-white">
        {data.args && Object.keys(data.args).length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Arguments</div>
            <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md overflow-x-auto font-mono">
              {JSON.stringify(data.args, null, 2)}
            </pre>
          </div>
        )}
        
        {data.result && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Result</div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {data.result}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
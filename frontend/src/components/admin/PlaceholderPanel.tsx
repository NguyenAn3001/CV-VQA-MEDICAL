import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderPanelProps {
  tabId: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPanel({ tabId, title, description, icon: Icon }: PlaceholderPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`settings-panel-${tabId}`}
      aria-labelledby={`settings-tab-${tabId}`}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400 leading-relaxed">{description}</p>
      <div className={cn(
        'mt-5 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        'bg-blue-50 text-[#2563EB] ring-1 ring-blue-200'
      )}>
        Coming soon
      </div>
    </div>
  );
}

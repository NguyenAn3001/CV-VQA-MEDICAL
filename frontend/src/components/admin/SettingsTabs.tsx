import { cn } from '@/lib/utils';

export type SettingsTabId = 'general' | 'models' | 'security' | 'notifications' | 'integrations';

interface Tab {
  id: SettingsTabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'general',       label: 'General' },
  { id: 'models',        label: 'Models' },
  { id: 'security',      label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations',  label: 'Integrations' },
];

interface SettingsTabsProps {
  activeTab: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
}

export default function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="flex gap-0 border-b border-[#E5E7EB]" role="tablist" aria-label="Settings sections">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`settings-panel-${tab.id}`}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-colors duration-150 select-none whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-0',
              isActive
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {tab.label}
            {/* Active underline */}
            <span
              className={cn(
                'absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#2563EB] transition-all duration-200',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

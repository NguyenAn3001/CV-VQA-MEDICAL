import { useChatStore } from '../../store/chatStore';
import { Menu, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Navbar({ title }: NavbarProps) {
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);
  const isSidebarCollapsed = useChatStore((state) => state.isSidebarCollapsed);
  const isRightSidebarOpen = useChatStore((state) => state.isRightSidebarOpen);
  const toggleRightSidebar = useChatStore((state) => state.toggleRightSidebar);

  return (
    <header className="bg-surface flex justify-between items-center w-full px-inner-padding border-b border-border-subtle h-14 shrink-0 z-10">
      <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-high rounded-md px-2 py-1 transition-colors">
        {isSidebarCollapsed && (
          <button 
            className="p-1 -ml-1 mr-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-headline-sm font-headline-sm font-semibold text-on-surface truncate max-w-[200px] sm:max-w-[400px]">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-surface-container-low border border-border-subtle rounded-full px-3 py-1 text-label-md font-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">magic_button</span>
          GPT-4o + Medical
        </div>
        <button
          onClick={toggleRightSidebar}
          className={cn(
            'p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors',
            isRightSidebarOpen && 'bg-surface-container-high text-primary'
          )}
          aria-label={isRightSidebarOpen ? 'Hide session panel' : 'Show session panel'}
        >
          {isRightSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}

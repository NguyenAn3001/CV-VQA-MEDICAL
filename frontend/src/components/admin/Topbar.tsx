import { Bell, HelpCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      {/* Page title (mobile) */}
      {title && (
        <span className="text-sm font-semibold text-slate-800 lg:hidden">{title}</span>
      )}
      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <Button
          id="topbar-notifications"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-[#F3F4F6] hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          id="topbar-help"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-[#F3F4F6] hover:text-slate-700"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-5" />

        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-[#DBEAFE] text-xs font-semibold text-[#2563EB]">
            AD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

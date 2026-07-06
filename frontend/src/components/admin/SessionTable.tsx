import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MockSession } from './sessionsData';

interface SessionTableProps {
  sessions: MockSession[];
  onViewSession?: (session: MockSession) => void;
}

export default function SessionTable({ sessions, onViewSession }: SessionTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">No sessions found</p>
        <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" role="table">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            {['Session Title', 'User', 'Messages', 'Created', 'Last Active', 'Actions'].map((col) => (
              <th
                key={col}
                className={cn(
                  'px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400',
                  col === 'Actions' ? 'text-right' : ''
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="group border-b border-[#E5E7EB] transition-colors duration-100 last:border-b-0 hover:bg-[#F9FAFB]"
            >
              {/* Session Title & Model Badge */}
              <td className="px-6 py-[18px]">
                <div className="font-medium text-slate-900">{session.title}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {session.model}
                  </span>
                  {session.status === 'archived' && (
                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                      Archived
                    </span>
                  )}
                </div>
              </td>

              {/* User */}
              <td className="px-6 py-[18px]">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      session.user.avatarColor
                    )}
                    aria-hidden="true"
                  >
                    {session.user.initials}
                  </div>
                  <span className="font-medium text-slate-700">{session.user.name}</span>
                </div>
              </td>

              {/* Messages */}
              <td className="px-6 py-[18px]">
                <span className="font-medium text-slate-900">{session.messageCount}</span>
              </td>

              {/* Created */}
              <td className="px-6 py-[18px]">
                <div className="text-slate-900">{session.createdAt}</div>
                <div className="text-xs text-slate-400">{session.createdTime}</div>
              </td>

              {/* Last Active */}
              <td className="px-6 py-[18px]">
                <div className="text-slate-900">{session.lastActive}</div>
                <div className="text-xs text-slate-400">{session.lastActiveTime}</div>
              </td>

              {/* Actions */}
              <td className="px-6 py-[18px] text-right">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        id={`view-session-${session.id}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewSession?.(session)}
                        className="h-8 w-8 rounded-lg text-slate-400 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#E0E7FF] hover:text-[#4338CA]"
                        aria-label={`View session ${session.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>View Session</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

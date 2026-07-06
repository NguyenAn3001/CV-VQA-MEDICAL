import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MockUser } from './types';

interface UserTableProps {
  users: MockUser[];
  onEdit?: (user: MockUser) => void;
  onDelete?: (user: MockUser) => void;
}

/** Colour set for avatar circles — cycles through these */
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
];

function getAvatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function RoleBadge({ role }: { role: MockUser['role'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        role === 'admin'
          ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
      )}
    >
      {role}
    </span>
  );
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">No users found</p>
        <p className="mt-1 text-xs text-slate-400">Try adjusting your search filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" role="table">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            {['User', 'Email', 'Role', 'Joined Date', 'Actions'].map((col) => (
              <th
                key={col}
                className={cn(
                  'px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400',
                  col === 'Actions' ? 'text-right' : ''
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {users.map((user, idx) => (
            <tr
              key={user.id}
              className="group border-b border-[#E5E7EB] transition-colors duration-100 last:border-b-0 hover:bg-[#F9FAFB]"
            >
              {/* User */}
              <td className="px-6 py-[18px]">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      getAvatarColor(idx)
                    )}
                    aria-hidden="true"
                  >
                    {user.initials}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-400">@{user.username}</div>
                  </div>
                </div>
              </td>

              {/* Email */}
              <td className="px-6 py-[18px] text-slate-500">{user.email}</td>

              {/* Role */}
              <td className="px-6 py-[18px]">
                <RoleBadge role={user.role} />
              </td>

              {/* Joined Date */}
              <td className="px-6 py-[18px] text-slate-500">{user.joinedDate}</td>

              {/* Actions */}
              <td className="px-6 py-[18px] text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    id={`edit-user-${user.id}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(user)}
                    aria-label={`Edit ${user.name}`}
                    className="h-8 w-8 rounded-lg text-slate-400 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    id={`delete-user-${user.id}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.(user)}
                    aria-label={`Delete ${user.name}`}
                    className="h-8 w-8 rounded-lg text-slate-400 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

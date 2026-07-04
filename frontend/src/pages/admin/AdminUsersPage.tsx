import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '../../lib/axios';
import type { User } from '../../types/models';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<User[]>('/admin/users/');
        setUsers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const term = search.toLowerCase();
    return users.filter((user) => {
      return user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    });
  }, [search, users]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f9fb]">
      <Navbar title="User Management" subtitle="Manage hospital staff access, roles, and system permissions." />
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users..."
                    className="border-0 bg-slate-100 pl-9 shadow-none ring-0"
                  />
                </div>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </div>

              {error ? <div className="px-6 py-4 text-sm text-red-600">{error}</div> : null}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-500">
                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.16em]">User</th>
                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.16em]">Email</th>
                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.16em]">Role</th>
                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.16em]">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-[0.16em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    ) : null}

                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-900">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={roleBadgeClass(user.role)}>{user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusBadgeClass(user.is_active)}>{user.is_active ? 'active' : 'inactive'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
                <span>Showing {filteredUsers.length} users</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button size="sm" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                    1
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function roleBadgeClass(role: User['role']) {
  return role === 'admin'
    ? 'inline-flex rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900'
    : 'inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600';
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? 'inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'
    : 'inline-flex rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700';
}

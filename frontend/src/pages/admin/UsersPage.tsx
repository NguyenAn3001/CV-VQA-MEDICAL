import { useMemo, useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import SearchBar from '../../components/admin/SearchBar';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PAGE_SIZE } from '../../components/admin/mockData';
import type { MockUser } from '../../components/admin/types';
import api from '../../lib/axios';

// Backend response mapping type
interface ApiUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers]             = useState<MockUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [search, setSearch]           = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /* ─── Fetch Data ─────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;

    async function fetchUsers() {
      try {
        setLoading(true);
        // Using limit=1000 to pull all users and perform client-side filtering/pagination
        const response = await api.get<ApiUser[]>('/admin/users?limit=1000');
        
        if (!mounted) return;
        
        // Map backend UserResponse to our UI MockUser (display type)
        const mappedUsers: MockUser[] = response.data.map(u => ({
          id: u.id,
          initials: u.username.substring(0, 2).toUpperCase(),
          name: u.username, // Using username as name since backend doesn't have a name field
          username: u.username,
          email: u.email,
          role: u.role,
          joinedDate: new Date(u.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }));

        setUsers(mappedUsers);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.response?.data?.detail || err.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUsers();

    return () => { mounted = false; };
  }, []);

  /* ─── Filtered + paginated data ──────────────────────────── */
  const filteredUsers = useMemo<MockUser[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [search, users]);

  const isSearching      = search.trim().length > 0;
  const effectiveTotal   = isSearching ? filteredUsers.length : users.length;
  const totalPages       = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));
  const safePage         = Math.min(currentPage, totalPages);

  const pageUsers = useMemo<MockUser[]>(() => {
    if (isSearching) return filteredUsers;
    const start = (safePage - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [isSearching, filteredUsers, safePage, users]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // reset to page 1 on new search
  };

  const handleEdit   = (user: MockUser) => console.info('[UsersPage] edit:', user);
  const handleDelete = (user: MockUser) => console.info('[UsersPage] delete:', user);

  return (
    <DashboardLayout pageTitle="User Management">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage hospital staff access, roles, and system permissions.
        </p>
      </div>

      {/* ── Error State ───────────────────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          <strong>Error loading users:</strong> {error}
        </div>
      )}

      {/* ── Users Card ────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              id="users-search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="w-full sm:w-[260px]"
            />

            <Button
              id="add-user-btn"
              className="gap-2 rounded-lg bg-[#2563EB] text-white shadow-sm shadow-blue-200 hover:bg-[#1d4ed8] active:bg-[#1e40af] transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Table Area */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600">Loading users...</p>
            </div>
          ) : (
            <>
              <UserTable
                users={pageUsers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={effectiveTotal}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

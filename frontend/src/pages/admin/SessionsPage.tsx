import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import SessionToolbar from '../../components/admin/SessionToolbar';
import SessionTable from '../../components/admin/SessionTable';
import Pagination from '../../components/admin/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_SESSIONS } from '../../components/admin/sessionsData';

const PAGE_SIZE = 4;

export default function SessionsPage() {
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Derive filtered data
  const filteredSessions = useMemo(() => {
    let result = MOCK_SESSIONS;

    // 1. Search
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.user.name.toLowerCase().includes(term)
      );
    }

    // 2. User Filter (by initials in this mock example)
    if (userFilter !== 'all') {
      result = result.filter((s) => s.user.initials === userFilter);
    }

    // 3. Time filter mock logic (In a real app, parse and compare dates)
    if (timeFilter !== 'all') {
      // Just returning result here for demo purposes as all mock data is very recent
    }

    return result;
  }, [search, userFilter, timeFilter]);

  // Derive pagination
  const totalItems = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedSessions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, safePage]);

  // Handlers
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleUserFilterChange = (val: string) => {
    setUserFilter(val);
    setCurrentPage(1);
  };
  const handleTimeFilterChange = (val: string) => {
    setTimeFilter(val);
    setCurrentPage(1);
  };
  const handleViewSession = (session: any) => {
    console.info('[SessionsPage] View session:', session.id);
  };

  return (
    <DashboardLayout pageTitle="Sessions" showTopbar>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor all chat sessions</p>
      </div>

      {/* ── Main Card ─────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          <SessionToolbar
            searchQuery={search}
            onSearchChange={handleSearchChange}
            userFilter={userFilter}
            onUserFilterChange={handleUserFilterChange}
            timeFilter={timeFilter}
            onTimeFilterChange={handleTimeFilterChange}
          />

          <SessionTable
            sessions={paginatedSessions}
            onViewSession={handleViewSession}
          />

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

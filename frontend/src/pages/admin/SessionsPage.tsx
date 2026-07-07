import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import SessionToolbar from '../../components/admin/SessionToolbar';
import SessionTable from '../../components/admin/SessionTable';
import Pagination from '../../components/admin/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import api from '../../lib/axios';
import type { MockSession } from '../../components/admin/sessionsData';

const PAGE_SIZE = 10;

// Backend response type
interface ApiSession {
  id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string | null;
}

interface ApiSessionsResponse {
  total: number;
  skip: number;
  limit: number;
  sessions: ApiSession[];
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

function toMockSession(s: ApiSession, idx: number): MockSession {
  const created = new Date(s.created_at);
  const updated = new Date(s.updated_at);
  const username = s.username ?? 'Unknown';

  return {
    id: s.id,
    title: s.title ?? 'Untitled Session',
    model: 'MedVQA AI',
    status: 'active',
    messageCount: s.message_count,
    createdAt: created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdTime: created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    lastActive: updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    lastActiveTime: updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    user: {
      name: username,
      initials: username.substring(0, 2).toUpperCase(),
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    },
  };
}

export default function SessionsPage() {
  const [sessions, setSessions]       = useState<MockSession[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [search, setSearch]           = useState('');
  const [userFilter, setUserFilter]   = useState('all');
  const [timeFilter, setTimeFilter]   = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch all sessions from backend ──────────────────────────
  useEffect(() => {
    let mounted = true;
    async function fetchSessions() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ApiSessionsResponse>('/admin/sessions?limit=1000');
        if (!mounted) return;
        const mapped = res.data.sessions.map((s, i) => toMockSession(s, i));
        setSessions(mapped);
        setTotal(res.data.total);
      } catch (err: any) {
        if (!mounted) return;
        const rawDetail = err.response?.data?.detail;
        let errorMsg: string;
        if (typeof rawDetail === 'string') {
          errorMsg = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          // Pydantic validation errors → [{loc, msg, ...}]
          errorMsg = rawDetail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
        } else if (rawDetail) {
          errorMsg = JSON.stringify(rawDetail);
        } else {
          errorMsg = err.message || 'Failed to load sessions';
        }
        setError(errorMsg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSessions();
    return () => { mounted = false; };
  }, []);

  // ── Client-side filtering ─────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.user.name.toLowerCase().includes(term)
      );
    }

    if (userFilter !== 'all') {
      result = result.filter((s) => s.user.name === userFilter);
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDays = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 0;
      if (cutoffDays > 0) {
        const cutoff = new Date(now.getTime() - cutoffDays * 86400_000);
        result = result.filter((s) => new Date(s.createdAt) >= cutoff);
      }
    }

    return result;
  }, [search, userFilter, timeFilter, sessions]);

  // ── Pagination ────────────────────────────────────────────────
  const totalItems  = filteredSessions.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);

  const paginatedSessions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, safePage]);

  const handleSearchChange     = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleUserFilterChange = (val: string) => { setUserFilter(val); setCurrentPage(1); };
  const handleTimeFilterChange = (val: string) => { setTimeFilter(val); setCurrentPage(1); };
  const handleViewSession      = (session: MockSession) => {
    console.info('[SessionsPage] View session:', session.id);
  };

  return (
    <DashboardLayout pageTitle="Sessions" showTopbar>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor all chat sessions
          {!loading && <span className="ml-1 text-slate-400">({total} total)</span>}
        </p>
      </div>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          <strong>Error loading sessions:</strong> {error}
        </div>
      )}

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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="mb-4 h-8 w-8 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Loading sessions...</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

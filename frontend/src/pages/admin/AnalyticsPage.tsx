import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import AnalyticsHeader from '../../components/admin/AnalyticsHeader';
import StatCard from '../../components/admin/StatCard';
import SessionChart from '../../components/admin/SessionChart';
import type { DateRange } from '@/components/ui/calendar';
import type { StatCardData, DailyDataPoint } from '../../components/admin/analyticsData';
import { DEFAULT_DATE_RANGE } from '../../components/admin/analyticsData';
import api from '../../lib/axios';

// Backend response types
interface OverviewStats {
  total_users: number;
  active_users: number;
  total_sessions: number;
  total_messages: number;
  total_predictions: number;
  new_users_today: number;
  new_sessions_today: number;
}

interface DailySessionStat {
  date: string;
  sessions: number;
  messages: number;
}

interface ApiAnalyticsResponse {
  overview: OverviewStats;
  sessions_over_time: DailySessionStat[];
  top_users: { user_id: string; username: string; session_count: number; message_count: number }[];
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange]   = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statCards, setStatCards]   = useState<StatCardData[]>([]);
  const [chartData, setChartData]   = useState<DailyDataPoint[]>([]);

  useEffect(() => {
    let mounted = true;

    // Calculate days from dateRange
    let days = 30;
    if (dateRange.from && dateRange.to) {
      const diff = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / 86400_000
      );
      days = Math.max(7, Math.min(90, diff || 30));
    }

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ApiAnalyticsResponse>(
          `/admin/analytics/overview?days=${days}`
        );
        if (!mounted) return;

        const { overview, sessions_over_time } = res.data;

        // Build stat cards from real data
        const cards: StatCardData[] = [
          {
            id: 'sessions',
            label: 'Total Sessions',
            value: overview.total_sessions,
            formatted: overview.total_sessions.toLocaleString(),
            trend: 0,
          },
          {
            id: 'messages',
            label: 'Total Messages',
            value: overview.total_messages,
            formatted: overview.total_messages.toLocaleString(),
            trend: 0,
          },
          {
            id: 'users',
            label: 'Active Users',
            value: overview.active_users,
            formatted: overview.active_users.toLocaleString(),
            trend: 0,
          },
          {
            id: 'predictions',
            label: 'AI Predictions',
            value: overview.total_predictions,
            formatted: overview.total_predictions.toLocaleString(),
            trend: 0,
          },
        ];
        setStatCards(cards);

        // Build chart data — convert "YYYY-MM-DD" → "Mon DD" label
        const chart: DailyDataPoint[] = sessions_over_time.map((d) => {
          const dt = new Date(d.date + 'T00:00:00');
          const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            date: label,
            sessions: d.sessions,
            users: d.messages, // repurpose "users" channel as messages
          };
        });
        setChartData(chart);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.response?.data?.detail || err.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { mounted = false; };
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) setDateRange(range);
  };

  return (
    <DashboardLayout pageTitle="Analytics" showTopbar>
      {/* ── Header ──────────────────────────────────────────── */}
      <AnalyticsHeader dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          <strong>Error loading analytics:</strong> {error}
        </div>
      )}

      {/* ── Loading Overlay ──────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-600">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ───────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.id} data={card} />
            ))}
          </div>

          {/* ── Chart ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4">
            <SessionChart data={chartData} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

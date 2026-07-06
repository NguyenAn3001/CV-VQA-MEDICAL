import { useState } from 'react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import AnalyticsHeader from '../../components/admin/AnalyticsHeader';
import StatCard from '../../components/admin/StatCard';
import SessionChart from '../../components/admin/SessionChart';
import ModelUsageChart from '../../components/admin/ModelUsageChart';
import type { DateRange } from '@/components/ui/calendar';
import {
  STAT_CARDS,
  DAILY_DATA,
  MODEL_USAGE_DATA,
  DEFAULT_DATE_RANGE,
} from '../../components/admin/analyticsData';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) setDateRange(range);
  };

  return (
    <DashboardLayout pageTitle="Analytics" showTopbar>
      {/* ── Header ──────────────────────────────────────────── */}
      <AnalyticsHeader dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.id} data={card} />
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        {/* Left — area chart (70%) */}
        <SessionChart data={DAILY_DATA} />

        {/* Right — donut chart (30%) */}
        <ModelUsageChart data={MODEL_USAGE_DATA} />
      </div>
    </DashboardLayout>
  );
}

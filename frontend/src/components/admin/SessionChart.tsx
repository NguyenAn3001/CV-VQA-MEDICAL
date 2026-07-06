import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { DailyDataPoint } from './analyticsData';

interface SessionChartProps {
  data: DailyDataPoint[];
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="font-medium text-slate-700 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-900">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function SessionChart({ data }: SessionChartProps) {
  return (
    <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Sessions Over Time</h2>
            <p className="mt-0.5 text-xs text-slate-400">Daily activity for the selected range</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              Sessions
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
              Users
            </span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            />

            {/* Users area (behind) */}
            <Area
              type="monotone"
              dataKey="users"
              stroke="#94a3b8"
              strokeWidth={2}
              fill="url(#usersGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Sessions area (front) */}
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#sessionsGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

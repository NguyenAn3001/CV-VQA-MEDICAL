import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { ModelUsagePoint } from './analyticsData';

interface ModelUsageChartProps {
  data: ModelUsagePoint[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ModelUsagePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: item.payload.color }}
        />
        <span className="font-medium text-slate-700">{item.name}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-slate-900">{item.value}%</p>
    </div>
  );
}

export default function ModelUsageChart({ data }: ModelUsageChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Model Usage</h2>
          <p className="mt-0.5 text-xs text-slate-400">Distribution across AI models</p>
        </div>

        {/* Donut */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{total}%</span>
            <span className="text-xs text-slate-400">of queries</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-slate-600 leading-tight">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini bar */}
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-slate-700">
                  {item.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatCardData } from './analyticsData';

interface StatCardProps {
  data: StatCardData;
  loading?: boolean;
}

/** Animate from 0 to `target` over ~800ms */
function useCounter(target: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(id);
  }, [target, active]);
  return count;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />
  );
}

export default function StatCard({ data, loading = false }: StatCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const count = useCounter(data.value, mounted && !loading);

  // Format with commas
  const display = count.toLocaleString();

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white',
        'shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : (
          <>
            {/* Label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {data.label}
            </p>

            {/* Value */}
            <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
              {display}
            </p>

            {/* Trend */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                ↑ {data.trend}%
              </span>
              <span className="text-xs text-slate-400">vs last 7 days</span>
            </div>

            {/* Subtle corner accent */}
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[#2563EB]/5 transition-all duration-300 group-hover:bg-[#2563EB]/10" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar, type DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AnalyticsHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export default function AnalyticsHeader({ dateRange, onDateRangeChange }: AnalyticsHeaderProps) {
  const [open, setOpen] = useState(false);

  const label = dateRange.from && dateRange.to
    ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
    : dateRange.from
    ? format(dateRange.from, 'MMM d, yyyy')
    : 'Pick a date range';

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics Overview</h1>
        <p className="mt-1 text-sm text-slate-500">System usage statistics and insights</p>
      </div>

      {/* Date range picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker-trigger"
            variant="outline"
            className={cn(
              'h-9 gap-2 self-start rounded-lg border-[#E5E7EB] bg-white text-sm font-medium text-slate-700',
              'hover:bg-[#F3F4F6] hover:text-slate-900 transition-colors',
              'focus-visible:ring-[#2563EB]/30'
            )}
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

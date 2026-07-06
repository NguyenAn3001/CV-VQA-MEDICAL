import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SessionToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  userFilter: string;
  onUserFilterChange: (val: string) => void;
  timeFilter: string;
  onTimeFilterChange: (val: string) => void;
}

export default function SessionToolbar({
  searchQuery,
  onSearchChange,
  userFilter,
  onUserFilterChange,
  timeFilter,
  onTimeFilterChange,
}: SessionToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Search */}
      <div className="relative w-full lg:w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search sessions..."
          className="h-9 w-full rounded-lg border-[#E5E7EB] bg-white pl-9 pr-4 text-sm placeholder:text-slate-400 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30 shadow-none"
        />
      </div>

      {/* Right: Filters & Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* User Filter */}
        <Select value={userFilter} onValueChange={onUserFilterChange}>
          <SelectTrigger className="h-9 w-full sm:w-[160px]">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="JS">Dr. John Smith</SelectItem>
            <SelectItem value="JD">Jane Doe</SelectItem>
            <SelectItem value="ML">Michael Lee</SelectItem>
            <SelectItem value="SW">Sarah Wang</SelectItem>
          </SelectContent>
        </Select>

        {/* Time Filter */}
        <Select value={timeFilter} onValueChange={onTimeFilterChange}>
          <SelectTrigger className="h-9 w-full sm:w-[140px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button variant="outline" className="h-9 gap-2 whitespace-nowrap text-slate-700 hover:bg-[#F3F4F6] hover:text-slate-900 border-[#E5E7EB]">
          <Download className="h-4 w-4 text-slate-500" />
          Export
        </Button>
      </div>
    </div>
  );
}

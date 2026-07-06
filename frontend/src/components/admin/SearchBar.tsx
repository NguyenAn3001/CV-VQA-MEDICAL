import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  id = 'admin-search',
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-4 text-sm',
          'placeholder:text-slate-400 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]',
          'transition-shadow duration-150 shadow-none focus-visible:shadow-sm'
        )}
      />
    </div>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  /** Build the visible page buttons with ellipsis */
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col items-start justify-between gap-3 border-t border-[#E5E7EB] px-6 py-4 sm:flex-row sm:items-center">
      {/* Left: count */}
      <p className="text-xs text-slate-500">
        Showing{' '}
        <span className="font-medium text-slate-700">{startItem}</span>
        {' '}to{' '}
        <span className="font-medium text-slate-700">{endItem}</span>
        {' '}of{' '}
        <span className="font-medium text-slate-700">{totalItems}</span>{' '}
        users
      </p>

      {/* Right: page controls */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        {/* Previous */}
        <Button
          id="pagination-prev"
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 gap-1 border-[#E5E7EB] px-2.5 text-xs text-slate-600 hover:bg-[#F3F4F6] disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs text-slate-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={page}
              id={`pagination-page-${page}`}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={cn(
                'h-8 min-w-[32px] rounded-lg px-2.5 text-xs transition-colors',
                currentPage === page
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-200 hover:bg-[#1d4ed8] border-[#2563EB]'
                  : 'border-[#E5E7EB] text-slate-600 hover:bg-[#F3F4F6]'
              )}
              aria-current={currentPage === page ? 'page' : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          id="pagination-next"
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 gap-1 border-[#E5E7EB] px-2.5 text-xs text-slate-600 hover:bg-[#F3F4F6] disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

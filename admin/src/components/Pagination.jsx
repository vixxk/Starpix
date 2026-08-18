import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function Pagination({ page, totalPages, totalItems, limit = 10, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers array with ellipses if totalPages > 7
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="panel p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
      <div className="text-ink-mute font-semibold">
        Showing <span className="font-bold text-ink">{startItem}</span> –{' '}
        <span className="font-bold text-ink">{endItem}</span> of{' '}
        <span className="font-bold text-ink">{totalItems}</span> entries (Page <span className="font-bold text-ink">{page}</span> of <span className="font-bold text-ink">{totalPages}</span>)
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 border-2 border-ink bg-paper-50 rounded-[2px] font-bold text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper-100 transition-colors flex items-center justify-center"
          title="Previous Page"
        >
          <CaretLeft className="w-4 h-4" weight="bold" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pNum, index) =>
            pNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-1.5 text-ink-mute font-bold">
                …
              </span>
            ) : (
              <button
                key={pNum}
                type="button"
                onClick={() => onPageChange(pNum)}
                className={`w-8 h-8 rounded-[2px] border-2 font-bold text-xs transition-all ${
                  page === pNum
                    ? 'border-ink bg-flame-500 text-white shadow-hard-sm'
                    : 'border-ink/20 bg-white text-ink hover:border-ink hover:bg-paper-100'
                }`}
              >
                {pNum}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 border-2 border-ink bg-paper-50 rounded-[2px] font-bold text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper-100 transition-colors flex items-center justify-center"
          title="Next Page"
        >
          <CaretRight className="w-4 h-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}

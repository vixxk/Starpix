import React from 'react';

/**
 * Base shimmer block. Pass width/height via className (Tailwind utilities).
 */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

/** Responsive skeleton for table-heavy pages (desktop) + card list (mobile). */
export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div className="panel overflow-hidden">
      {/* Mobile: stacked card skeletons */}
      <div className="p-4 space-y-3 sm:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-2 border-ink/15">
            <Skeleton className="w-12 h-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-14 h-5" />
          </div>
        ))}
      </div>

      {/* Desktop: table skeleton */}
      <div className="hidden sm:block min-w-[720px] overflow-x-auto">
        <div className="flex items-center gap-6 px-5 py-3.5 bg-paper-100 border-b-2 border-ink">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-32' : 'w-20'}`} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-ink/15 last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={j === 0 ? 'h-4 w-36' : j === 1 ? 'h-4 w-28' : 'h-4 w-16'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Responsive skeleton for card-grid pages (categories, frames, effects, campaigns). */
export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel p-4 space-y-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-14" />
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the dashboard: hero + metric cards + two panels. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-ink border-2 border-ink shadow-hard-flame p-6 space-y-4">
        <Skeleton className="h-6 w-56 !bg-paper-50/20" />
        <Skeleton className="h-3.5 w-80 max-w-full !bg-paper-50/20" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((p) => (
          <div key={p} className="panel p-6 space-y-4">
            <Skeleton className="h-5 w-44" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-11 h-12 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

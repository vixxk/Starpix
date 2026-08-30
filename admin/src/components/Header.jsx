import React from 'react';
import { useLocation } from 'react-router-dom';
import { List, CalendarDot, ArrowClockwise } from '@phosphor-icons/react';

const pathTitles = {
  '/': { title: 'Overview', desc: 'Live pulse of the Starpix platform' },
  '/templates': { title: 'Templates', desc: 'Design, curate & publish status templates' },
  '/categories': { title: 'Categories', desc: 'Organize content into browsable groups' },
  '/filters': { title: 'Video Filters', desc: 'Animated video footers & overlay filters' },
  '/campaigns': { title: 'Campaigns', desc: 'Opening experience & seasonal drives' },
  '/purchases': { title: 'Purchases', desc: 'Revenue & entitlement transaction log' },
  '/reports': { title: 'Revenue Report', desc: 'Monthly totals & per-template performance' },
  '/users': { title: 'Users', desc: 'Mobile community directory' },
  '/pricing': { title: 'Pricing', desc: 'Paywall & unlock configuration' },
};

function formatDate() {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { title, desc } = pathTitles[location.pathname] || { title: 'Console', desc: 'Starpix administration' };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper-50 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1.5 text-ink hover:bg-ink hover:text-paper-50 rounded-[2px] transition-colors"
          aria-label="Open navigation"
        >
          <List className="w-5 h-5" weight="bold" />
        </button>
        <div className="min-w-0">
          <h2 className="display-hero text-xl sm:text-2xl text-ink tracking-wide truncate">{title}</h2>
          <p className="font-mono text-[10px] sm:text-[11px] text-ink-mute font-medium uppercase tracking-wider truncate hidden sm:block">
            {desc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Refresh Button */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="sm:hidden p-2 bg-flame-500 border-2 border-ink text-ink rounded-[2px] shadow-hard-sm hover:bg-flame-400 active:scale-95 transition-all flex items-center justify-center"
          title="Refresh Page"
          aria-label="Refresh Page"
        >
          <ArrowClockwise className="w-4 h-4" weight="bold" />
        </button>

        {/* Desktop Header Badges */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border-2 border-ink bg-white text-[11px] font-bold text-ink">
          <CalendarDot className="w-3.5 h-3.5 text-flame-600" weight="bold" />
          <span className="font-mono uppercase">{formatDate()}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[2px] border-2 border-ink bg-flame-500 text-ink text-[11px] font-bold uppercase tracking-wider shadow-hard-sm">
          <span className="w-2 h-2 bg-ink animate-pulse-dot" />
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
}

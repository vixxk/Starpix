import React from 'react';
import { useLocation } from 'react-router-dom';
import { List, CalendarDot } from '@phosphor-icons/react';

const pathTitles = {
  '/': { title: 'Overview', desc: 'Live pulse of the Statuzzz platform' },
  '/templates': { title: 'Templates', desc: 'Design, curate & publish status templates' },
  '/categories': { title: 'Categories', desc: 'Organize content into browsable groups' },
  '/frames': { title: 'Frames', desc: 'PNG overlays & placement slots' },
  '/effects': { title: 'Effects', desc: 'Animation & particle effect library' },
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
  const { title, desc } = pathTitles[location.pathname] || { title: 'Console', desc: 'Statuzzz administration' };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper-50 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
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
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border-2 border-ink bg-white text-[11px] font-bold text-ink">
          <CalendarDot className="w-3.5 h-3.5 text-flame-600" weight="bold" />
          <span className="font-mono uppercase">{formatDate()}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] border-2 border-ink bg-flame-500 text-ink text-[11px] font-bold uppercase tracking-wider shadow-hard-sm">
          <span className="w-2 h-2 bg-ink animate-pulse-dot" />
          <span className="hidden sm:inline">System Online</span>
        </div>
      </div>
    </header>
  );
}

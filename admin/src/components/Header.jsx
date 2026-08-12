import React from 'react';
import { useLocation } from 'react-router-dom';
import { List, CalendarDot, BellSimple } from '@phosphor-icons/react';

const pathTitles = {
  '/': { title: 'Overview', desc: 'Live pulse of the Statuzzz platform' },
  '/templates': { title: 'Templates', desc: 'Design, curate & publish status templates' },
  '/categories': { title: 'Categories', desc: 'Organize content into browsable groups' },
  '/frames': { title: 'Frames', desc: 'PNG overlays & placement slots' },
  '/effects': { title: 'Effects', desc: 'Animation & particle effect library' },
  '/campaigns': { title: 'Campaigns', desc: 'Opening experience & seasonal drives' },
  '/purchases': { title: 'Purchases', desc: 'Revenue & entitlement transaction log' },
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
    <header className="sticky top-0 z-30 border-b border-night-600/60 bg-night-900/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1.5 text-night-200 hover:text-white hover:bg-night-700 rounded-xl transition-colors"
          aria-label="Open navigation"
        >
          <List className="w-5 h-5" weight="bold" />
        </button>
        <div className="min-w-0">
          <h2 className="display text-lg sm:text-xl font-bold text-white tracking-tight truncate">{title}</h2>
          <p className="text-[11px] sm:text-xs text-night-300 font-medium truncate hidden sm:block">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-night-800 border border-night-600 text-[11px] font-medium text-night-200">
          <CalendarDot className="w-3.5 h-3.5 text-glow-400" weight="duotone" />
          <span>{formatDate()}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glow-500/10 border border-glow-500/30 text-glow-300 text-[11px] font-semibold">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-glow-400 animate-ping opacity-60" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-glow-400" />
          </span>
          <span className="hidden sm:inline">System Online</span>
        </div>

        <span className="chip-divider hidden md:block" />

        <div className="relative p-2 rounded-xl text-night-200 hover:text-white hover:bg-night-700 transition-colors cursor-not-allowed" title="Notifications">
          <BellSimple className="w-[18px] h-[18px]" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-glow-400" />
        </div>
      </div>
    </header>
  );
}
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import {
  UsersThree,
  Sparkle,
  CreditCard,
  CurrencyInr,
  Flame,
  CrownSimple,
  CaretUp,
} from '@phosphor-icons/react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/analytics/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-night-300">Loading dashboard metrics…</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {
    totalUsers: 0,
    activeUsers: 0,
    totalTemplates: 0,
    premiumTemplates: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0,
  };

  const cards = [
    {
      label: 'Total Users',
      value: metrics.totalUsers,
      caption: `${metrics.activeUsers} active`,
      icon: UsersThree,
      accent: 'text-glow-300',
      chip: 'bg-glow-500/10 border-glow-500/25',
    },
    {
      label: 'Templates Live',
      value: metrics.totalTemplates,
      caption: `${metrics.premiumTemplates} premium`,
      icon: Sparkle,
      accent: 'text-violet-300',
      chip: 'bg-violet-500/10 border-violet-500/25',
    },
    {
      label: 'Purchases',
      value: metrics.totalPurchases,
      caption: `${metrics.conversionRate}% conversion`,
      icon: CreditCard,
      accent: 'text-sky-300',
      chip: 'bg-sky-500/10 border-sky-500/25',
    },
    {
      label: 'Estimated Revenue',
      value: `₹${metrics.totalRevenue.toLocaleString('en-IN')}`,
      caption: 'simulated dev sales',
      icon: CurrencyInr,
      accent: 'text-amber-300',
      chip: 'bg-amber-500/10 border-amber-500/25',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="panel p-6 bg-gradient-to-r from-night-800 to-night-850 border-glow-500/15 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-glow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="display text-2xl font-bold text-white tracking-tight">Platform Pulse</h2>
            <p className="text-sm text-night-300 mt-1">Everything running smooth — here’s today’s snapshot.</p>
          </div>
          <span className="badge-success w-max">▲ Stable · All systems nominal</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {cards.map((c) => (
          <div key={c.label} className="panel panel-hover p-5 flex items-start justify-between">
            <div className="min-w-0">
              <p className="label">{c.label}</p>
              <h3 className="display text-2xl font-bold text-white mt-1.5 truncate">{c.value}</h3>
              <p className="text-xs text-night-300 font-medium mt-1.5 flex items-center gap-1">
                <CaretUp className="w-3 h-3 text-glow-400" weight="bold" />
                {c.caption}
              </p>
            </div>
            <div className={`icon-chip ${c.chip} rounded-xl ${c.accent}`}>
              <c.icon className="w-6 h-6" weight="duotone" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top templates */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="display font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" weight="fill" /> Top Templates
            </h3>
            <span className="label">By usage</span>
          </div>

          <div className="space-y-4">
            {stats?.topTemplates?.map((t) => (
              <div key={t._id} className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-11 h-14 rounded-lg object-cover border border-night-600 group-hover:border-glow-500/50 transition-colors"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{t.name}</h4>
                    <span className={`badge mt-1 ${t.accessType === 'premium' ? 'badge-amber' : 'badge-success'}`}>
                      {t.accessType}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{t.uses} <span className="text-[10px] font-medium text-night-300">uses</span></p>
                  <p className="text-[11px] text-night-400">{t.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent purchases */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="display font-bold text-white flex items-center gap-2">
              <CrownSimple className="w-5 h-5 text-glow-400" weight="fill" /> Recent Purchases
            </h3>
            <span className="label">Entitlements</span>
          </div>

          {stats?.recentPurchases?.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="w-8 h-8 text-night-500 mx-auto mb-2" />
              <p className="text-xs text-night-400">No purchases recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recentPurchases?.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 py-2 border-b border-night-600/40 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.templateId?.thumbnail || 'https://via.placeholder.com/40'}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover border border-night-600"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{p.userId?.name || 'User'}</h4>
                      <p className="text-[11px] text-night-400 truncate">{p.templateId?.name || 'Template'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-glow-300">₹{p.amount}</p>
                    <span className="badge-success text-[10px] px-1.5 py-0.5">Successful</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
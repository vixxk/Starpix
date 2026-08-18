import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import Skeleton from '../components/Skeleton';
import { printDocument } from '../utils/print';
import {
  ChartPieSlice,
  CurrencyInr,
  Receipt,
  Printer,
  TrendUp,
  CrownSimple,
  CalendarBlank,
  WarningCircle,
} from '@phosphor-icons/react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const iso = (d) => d.toISOString().slice(0, 10);

const PRESETS = [
  { label: 'This Month', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) }; } },
  { label: 'Last 3 Months', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth() - 2, 1)), to: iso(n) }; } },
  { label: 'Last 6 Months', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth() - 5, 1)), to: iso(n) }; } },
  { label: 'This Year', get: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), 0, 1)), to: iso(n) }; } },
  { label: 'All Time', get: () => ({ from: '', to: '' }) },
];

const monthLabel = (m) => `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`;

const rangeText = (from, to) => {
  if (!from && !to) return 'All Time';
  if (from && to) return `${from} → ${to}`;
  return from ? `From ${from}` : `Until ${to}`;
};

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState('Last 6 Months');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await API.get('/admin/reports/revenue', { params });
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    const { from: f, to: t } = preset.get();
    setFrom(f);
    setTo(t);
  };

  const summary = data?.summary || {};
  const monthly = data?.monthly || [];
  const byTemplate = data?.byTemplate || [];
  const maxMonthRevenue = monthly.reduce((m, x) => Math.max(m, x.revenue), 0);
  const totalRevenue = summary.totalRevenue || 0;

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Header & Filters — hidden when printing */}
      <div className="print:hidden space-y-3.5 sm:space-y-5">
        <PageHead
          icon={<ChartPieSlice className="w-6 h-6" weight="duotone" />}
          title="Revenue Report"
          subtitle="Monthly totals & per-template performance"
          actions={
            <button
              onClick={() => printDocument()}
              disabled={loading || !data}
              className="btn-secondary w-full sm:w-auto"
            >
              <Printer className="w-4 h-4" weight="bold" /> Print Report
            </button>
          }
        />

        {/* Filters */}
        <div className="panel p-2.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 sm:gap-4">
            {/* Presets */}
            <div className="flex-1">
              <p className="label mb-1.5 sm:mb-2 text-[9px] sm:text-[10px]">Quick Range</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`border-2 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${
                      activePreset === p.label
                        ? 'bg-flame-500 border-ink text-ink shadow-hard-sm'
                        : 'bg-paper-50 border-ink/40 text-ink-mute hover:bg-paper-100 hover:text-ink'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom range */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="label mb-1 sm:mb-1.5 block text-[9px] sm:text-[10px]">From</label>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => { setActivePreset(''); setFrom(e.target.value); }}
                  className="input py-2 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="label mb-1 sm:mb-1.5 block text-[9px] sm:text-[10px]">To</label>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => { setActivePreset(''); setTo(e.target.value); }}
                  className="input py-2 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-3 sm:p-4 flex items-center gap-2.5 bg-red-50 border-2 border-red-600 text-red-800 text-xs font-semibold">
          <WarningCircle className="w-4 h-4 text-red-700 shrink-0" weight="duotone" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel p-3 sm:p-5 space-y-2 sm:space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="panel p-4 sm:p-6 space-y-3">
            <Skeleton className="h-5 w-44" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div id="report-print-area" className="space-y-3.5 sm:space-y-5">
          {/* Masthead (prints, hidden on mobile screen UI) */}
          <div className="bg-ink border-2 border-ink px-3.5 py-3 sm:px-6 sm:py-5 hidden sm:flex print:flex items-center justify-between print:shadow-none">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-flame-500 border-2 border-paper-100 flex items-center justify-center shrink-0">
                <ChartPieSlice className="w-4 h-4 sm:w-5 sm:h-5 text-ink" weight="fill" />
              </div>
              <div>
                <h4 className="display text-lg sm:text-xl text-white leading-none tracking-wide">REVENUE REPORT</h4>
                <p className="font-mono text-[9px] text-flame-400 font-bold tracking-[0.22em] uppercase mt-0.5 sm:mt-1">
                  {rangeText(from, to)}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 bg-paper-50 text-ink border-2 border-ink px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">
              <CalendarBlank className="w-3.5 h-3.5" weight="bold" /> Generated {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
            <div className="panel px-2.5 py-2 sm:p-5 border-2 border-ink shadow-hard-flame">
              <p className="label text-[8px] sm:text-[10px]">Total Revenue</p>
              <h3 className="display text-lg sm:text-2xl text-ink mt-0 sm:mt-1.5 tabular-nums">{inr(summary.totalRevenue)}</h3>
              <p className="text-[9px] sm:text-[11px] text-ink-mute font-medium mt-0 sm:mt-1 flex items-center gap-1">
                <TrendUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-flame-600 shrink-0" weight="bold" /> {rangeText(from, to)}
              </p>
            </div>
            <div className="panel panel-hover px-2.5 py-2 sm:p-5">
              <p className="label text-[8px] sm:text-[10px]">Unlocks</p>
              <h3 className="display text-lg sm:text-2xl text-ink mt-0 sm:mt-1.5 tabular-nums">{summary.totalUnlocks || 0}</h3>
              <p className="text-[9px] sm:text-[11px] text-ink-mute font-medium mt-0 sm:mt-1">successful purchases</p>
            </div>
            <div className="panel panel-hover px-2.5 py-2 sm:p-5">
              <p className="label text-[8px] sm:text-[10px]">Months Covered</p>
              <h3 className="display text-lg sm:text-2xl text-ink mt-0 sm:mt-1.5 tabular-nums">{summary.monthCount || 0}</h3>
              <p className="text-[9px] sm:text-[11px] text-ink-mute font-medium mt-0 sm:mt-1">with activity</p>
            </div>
            <div className="panel panel-hover px-2.5 py-2 sm:p-5">
              <p className="label text-[8px] sm:text-[10px]">Top Template</p>
              <h3 className="display text-xs sm:text-xl text-ink mt-0.5 sm:mt-2 truncate" title={byTemplate[0]?.template?.name}>
                {byTemplate[0]?.template?.name || '—'}
              </h3>
              <p className="text-[9px] sm:text-[11px] text-ink-mute font-medium mt-0 sm:mt-1 truncate">
                {byTemplate[0] ? `${inr(byTemplate[0].revenue)} · ${byTemplate[0].count} unlocks` : 'no sales yet'}
              </p>
            </div>
          </div>

          {/* Monthly breakdown (hidden on mobile screen UI, shown on desktop and print) */}
          <div className="panel p-3.5 sm:p-6 hidden sm:block print:block">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-5 gap-1 sm:gap-2">
              <h3 className="display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-flame-600 shrink-0" weight="duotone" /> Monthly Revenue
              </h3>
              <span className="label text-[9px] sm:text-[10px]">By calendar month</span>
            </div>

            {monthly.length === 0 ? (
              <div className="py-10 text-center">
                <Receipt className="w-8 h-8 text-paper-400 mx-auto mb-2" />
                <p className="text-xs text-ink-mute font-medium">No revenue in this range.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthly.map((m) => (
                  <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-mono text-[11px] font-bold text-ink uppercase">
                      {monthLabel(m)}
                    </span>
                    <div className="flex-1 h-8 bg-paper-100 border-2 border-ink relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-flame-500 border-r-2 border-ink"
                        style={{ width: `${maxMonthRevenue > 0 ? Math.max((m.revenue / maxMonthRevenue) * 100, 4) : 0}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-ink uppercase">
                        {m.count} unlock{m.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <span className="w-24 shrink-0 text-right font-bold text-ink tabular-nums text-sm">
                      {inr(m.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-template table */}
          <div className="panel overflow-hidden">
            <div className="px-3.5 py-3 sm:px-6 sm:pt-6 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <h3 className="display font-bold text-ink text-sm sm:text-base flex items-center gap-2 whitespace-nowrap">
                <CrownSimple className="w-4 h-4 sm:w-5 sm:h-5 text-glow-600 shrink-0" weight="duotone" /> Revenue by Template
              </h3>
              <span className="label text-[9px] sm:text-[10px]">Share of total</span>
            </div>

            {byTemplate.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-ink-mute font-medium">No template sales in this range.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Unlocks</th>
                      <th>Revenue</th>
                      <th className="w-56">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byTemplate.map((t) => {
                      const share = totalRevenue > 0 ? (t.revenue / totalRevenue) * 100 : 0;
                      return (
                        <tr key={t._id || t.template?._id}>
                          <td>
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={t.template?.thumbnail || t.template?.previewAsset || t.template?.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                                alt={t.template?.name || ''}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                                }}
                                className="w-10 h-12 object-cover border-2 border-ink/20 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-ink line-clamp-1">
                                  {t.template?.name || 'Deleted Template'}
                                </p>
                                <p className="text-[10px] text-ink-mute font-mono">{t._id || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="font-semibold text-ink tabular-nums">{t.count}</td>
                          <td className="font-bold text-glow-700 tabular-nums">{inr(t.revenue)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-4 bg-paper-100 border-2 border-ink relative overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-ink"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="w-12 text-right font-mono text-[11px] font-bold text-ink tabular-nums">
                                {share.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer (prints) */}
          <div className="flex items-center justify-between border-2 border-ink bg-paper-50 px-5 py-3.5">
            <p className="text-[10px] text-ink-mute">
              Statuzzz Digital Status Platform · Revenue Report · {rangeText(from, to)}
            </p>
            <p className="font-mono text-[10px] font-bold text-ink-mute uppercase tracking-wider">
              Total {inr(totalRevenue)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

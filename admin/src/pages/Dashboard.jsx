import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import {
  UsersThree,
  Sparkle,
  CreditCard,
  CurrencyInr,
  Flame,
  CrownSimple,
  CaretUp,
  Square,
  Confetti,
  Megaphone,
  ChartLineUp,
  DownloadSimple,
  Eye,
  ShareNetwork,
  Image,
  FilmStrip,
  ChatDots,
  ArrowSquareOut,
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
    return <DashboardSkeleton />;
  }

  const metrics = stats?.metrics || {};
  const eventCounts = metrics.eventCounts || {};

  const cards = [
    {
      label: 'Registered Users',
      value: metrics.totalUsers || 0,
      caption: `${metrics.vipUsers || 0} VIP Members · ${metrics.freeUsers || 0} Free`,
      icon: UsersThree,
      accent: 'text-flame-400',
    },
    {
      label: 'Templates Live',
      value: metrics.totalTemplates || 0,
      caption: `${metrics.premiumTemplates || 0} Premium · ${metrics.freeTemplates || 0} Free`,
      icon: Sparkle,
      accent: 'text-flame-400',
    },
    {
      label: 'Purchases Completed',
      value: metrics.totalPurchases || 0,
      caption: `${metrics.conversionRate || 0}% user conversion`,
      icon: CreditCard,
      accent: 'text-flame-400',
    },
    {
      label: 'Total Platform Revenue',
      value: `₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`,
      caption: 'Direct template unlocks',
      icon: CurrencyInr,
      accent: 'text-flame-400',
    },
  ];

  const subCards = [
    { label: 'Categories', value: metrics.totalCategories || 0, icon: Square, color: 'text-flame-600', href: '/categories' },
    { label: 'Footers & Frames', value: (metrics.totalEffects || 0) + (metrics.totalFrames || 0) || 4, icon: FilmStrip, color: 'text-flame-600', href: '/templates' },
    {
      label: 'Issues & Feedbacks',
      value: metrics.totalReports || 0,
      badge: metrics.pendingReports ? `${metrics.pendingReports} pending` : null,
      icon: ChatDots,
      color: 'text-amber-600',
      href: '/user-reports',
    },
    { label: 'Active Campaigns', value: metrics.totalCampaigns || 0, icon: Megaphone, color: 'text-flame-600', href: '/campaigns' },
  ];

  const telemetry = [
    { label: 'Template Views', value: eventCounts.template_view || 0, icon: Eye, color: 'text-sky-700' },
    { label: 'HD Downloads', value: eventCounts.template_download || 0, icon: DownloadSimple, color: 'text-emerald-700' },
    { label: 'Photo Uploads', value: eventCounts.photo_upload || 0, icon: Image, color: 'text-amber-700' },
    { label: 'Shares', value: eventCounts.template_share || 0, icon: ShareNetwork, color: 'text-violet-700' },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-6">
      {/* Hero Banner — solid ink workbench slab */}
      <div className="relative overflow-hidden bg-ink border-2 border-ink shadow-hard-flame">
        {/* Flame corner block */}
        <div className="absolute -right-10 -top-10 w-24 h-24 sm:w-36 sm:h-36 bg-flame-500 pointer-events-none" />
        <div className="relative p-3.5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="label !text-flame-300 mb-0.5 sm:mb-1.5 text-[9px] sm:text-[10px]">Control Room · Live</p>
            <h2 className="display text-lg sm:text-2xl text-paper-50 tracking-tight flex items-center gap-2">
              Platform Analytics Pulse
            </h2>
            <p className="text-xs sm:text-sm text-paper-100/70 mt-0.5 sm:mt-1">Users, purchases, templates & event telemetry — all in one glance.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-flame-500 text-white border-2 border-ink px-2.5 py-1 sm:px-3.5 sm:py-2 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] shadow-hard-sm w-max">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white animate-pulse-dot" />
            Operational · All systems live
          </span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        {cards.map((c) => (
          <div key={c.label} className="panel panel-hover p-2.5 sm:p-5 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="label text-[9px] sm:text-[10px] truncate">{c.label}</p>
              <h3 className="display text-lg sm:text-2xl font-bold text-ink mt-0.5 sm:mt-1.5 truncate tabular-nums">{c.value}</h3>
              <p className="text-[9px] sm:text-xs text-ink-mute font-medium mt-0.5 sm:mt-1.5 flex items-center gap-0.5 sm:gap-1 truncate">
                <CaretUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-glow-600 shrink-0" weight="bold" />
                <span className="truncate">{c.caption}</span>
              </p>
            </div>
            <div className="hidden sm:flex icon-chip w-11 h-11 bg-ink shadow-hard-sm shrink-0">
              <c.icon className={`w-6 h-6 ${c.accent}`} weight="duotone" />
            </div>
          </div>
        ))}
      </div>

      {/* Entity Sub-metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
        {subCards.map((sc) => {
          const inner = (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-paper-100 border-2 border-ink flex items-center justify-center shrink-0">
                <sc.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${sc.color}`} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[10px] sm:text-[11px] text-ink-mute font-medium leading-tight truncate">{sc.label}</p>
                  {sc.badge && (
                    <span className="badge-amber text-[9px] px-1 py-0 font-bold shrink-0">{sc.badge}</span>
                  )}
                </div>
                <p className="text-base sm:text-lg font-bold text-ink tabular-nums">{sc.value}</p>
              </div>
            </div>
          );

          return sc.href ? (
            <Link key={sc.label} to={sc.href} className="panel panel-hover p-2.5 sm:p-4 block">
              {inner}
            </Link>
          ) : (
            <div key={sc.label} className="panel panel-hover p-2.5 sm:p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Event Telemetry Activity Bar */}
      <div className="panel p-3 sm:p-5">
        <h3 className="display font-bold text-ink text-xs sm:text-sm flex items-center gap-2 mb-2.5 sm:mb-4">
          <ChartLineUp className="w-4 h-4 sm:w-5 sm:h-5 text-glow-600" weight="duotone" /> Real-Time Event Telemetry
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {telemetry.map((t) => (
            <div key={t.label} className="bg-paper-100 border-2 border-ink/20 p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
              <t.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${t.color}`} weight="duotone" />
              <div>
                <p className="text-[9px] sm:text-[10px] text-ink-mute uppercase font-semibold">{t.label}</p>
                <p className="text-sm sm:text-base font-bold text-ink tabular-nums">{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top templates */}
        <div className="panel p-3.5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-5 gap-1 sm:gap-2">
            <h3 className="display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" weight="fill" /> Top Templates Overview
            </h3>
            <span className="label text-[9px] sm:text-[10px]">By usage & views</span>
          </div>

          <div className="space-y-4">
            {stats?.topTemplates?.map((t) => (
              <div key={t._id} className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={t.thumbnail || t.previewAsset || t.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                    alt={t.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                    }}
                    className="w-11 h-14 object-cover border-2 border-ink/20 group-hover:border-flame-500 transition-colors"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-ink truncate">{t.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${t.accessType === 'free' ? 'badge-success' : 'badge-amber'}`}>
                        {t.accessType === 'free' ? 'Free' : t.accessType === 'vip' ? 'VIP' : `₹${t.price}`}
                      </span>
                      {t.categoryId?.name && (
                        <span className="text-[10px] text-ink-mute">{t.categoryId.icon} {t.categoryId.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink tabular-nums">{t.uses} <span className="text-[10px] font-medium text-ink-mute">uses</span></p>
                  <p className="text-[11px] text-ink-mute tabular-nums">{t.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent purchases */}
        <div className="panel p-3.5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-5 gap-1 sm:gap-2">
            <h3 className="display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
              <CrownSimple className="w-4 h-4 sm:w-5 sm:h-5 text-glow-600 shrink-0" weight="fill" /> Live Purchase Transactions
            </h3>
            <span className="label text-[9px] sm:text-[10px]">Entitlements</span>
          </div>

          {stats?.recentPurchases?.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="w-8 h-8 text-paper-400 mx-auto mb-2" />
              <p className="text-xs text-ink-mute">No purchases recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recentPurchases?.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 py-2 border-b border-paper-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.templateId ? (
                      <img
                        src={p.templateId?.thumbnail || p.finalAssetUrl || p.templateId?.previewAsset || p.templateId?.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                        alt={p.templateId?.name || 'Template'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                        }}
                        className="w-11 h-11 object-cover border-2 border-ink/20 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-ink border-2 border-ink flex items-center justify-center text-amber-400 shrink-0">
                        <CrownSimple className="w-5 h-5" weight="fill" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ink truncate">
                        {p.userId?.name && p.userId.name !== 'Trial Name'
                          ? p.userId.name
                          : p.userId?.phoneNumber
                          ? p.userId.phoneNumber
                          : p.userId?.email
                          ? p.userId.email
                          : 'User'}
                      </h4>
                      <p className="text-[11px] text-ink-mute truncate">{p.templateId?.name || p.planName || 'VIP Subscription Pass'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-glow-700 tabular-nums">₹{p.amount}</p>
                    <span className="badge-success text-[10px] px-1.5 py-0.5">Successful</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Issues & Feedbacks Section */}
      <div className="panel p-3.5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-5 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[2px] bg-amber-100 border-2 border-ink flex items-center justify-center text-amber-700 shrink-0 shadow-hard-sm">
              <ChatDots className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
                Recent Issues & Feedbacks
                {metrics.pendingReports > 0 && (
                  <span className="badge-amber text-[10px] py-0.5 px-2">
                    {metrics.pendingReports} Pending Review
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-ink-mute">Live user feedback tickets, bug reports & support requests</p>
            </div>
          </div>
          <Link
            to="/user-reports"
            className="btn-secondary text-xs py-1.5 px-3 w-fit flex items-center gap-1.5"
          >
            <span>Manage All Issues & Feedbacks ({metrics.totalReports || 0})</span>
            <ArrowSquareOut className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentReports?.length === 0 ? (
          <div className="py-10 text-center bg-paper-50 border-2 border-dashed border-paper-300 rounded-[2px]">
            <ChatDots className="w-8 h-8 text-paper-400 mx-auto mb-2" />
            <p className="text-xs text-ink-mute font-medium">No user issues or feedbacks submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats?.recentReports?.map((rep) => {
              const u = rep.userId;
              const isFeedback = rep.type === 'feedback';
              const isTemplate = rep.type === 'template';

              return (
                <Link
                  key={rep._id}
                  to="/user-reports"
                  className="p-3.5 bg-white border-2 border-ink rounded-[2px] hover:border-flame-500 hover:shadow-hard-sm transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider border ${
                          isFeedback
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isTemplate
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isFeedback ? 'User Feedback' : isTemplate ? 'Template Issue' : 'Bug Report'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rep.status === 'in_progress'
                            ? 'bg-sky-50 text-sky-700'
                            : rep.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-100 text-amber-900 border border-amber-400'
                        }`}
                      >
                        {rep.status === 'resolved'
                          ? 'Resolved'
                          : rep.status === 'in_progress'
                          ? 'In Progress'
                          : rep.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-ink truncate group-hover:text-flame-600 transition-colors">
                      {rep.reason || 'User report'}
                    </p>

                    {rep.description ? (
                      <p className="text-[11px] text-ink-mute line-clamp-2 mt-1 leading-snug">
                        {rep.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-ink-mute mt-3 pt-2 border-t border-paper-100">
                    <span className="font-semibold text-ink truncate max-w-[130px]">
                      {u?.name || u?.phoneNumber || 'User'}
                    </span>
                    <span className="font-mono">
                      {new Date(rep.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

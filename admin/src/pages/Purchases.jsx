import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import { TableSkeleton } from '../components/Skeleton';
import InvoiceModal from '../components/InvoiceModal';
import { printDocument } from '../utils/print';
import {
  CreditCard,
  CheckCircle,
  Receipt,
  Fingerprint,
  CurrencyInr,
  MagnifyingGlass,
  FunnelSimple,
  Calendar,
} from '@phosphor-icons/react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [metrics, setMetrics] = useState({ totalCount: 0, successfulCount: 0, totalRevenue: 0, avgOrderValue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoicePurchase, setInvoicePurchase] = useState(null);

  const handleInvoiceClick = (p) => {
    setInvoicePurchase(p);
    if (window.innerWidth < 640) {
      setTimeout(() => {
        printDocument(() => {
          setInvoicePurchase(null);
        });
      }, 150);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await API.get('/admin/purchases', { params });
      if (res.data.success) {
        setPurchases(res.data.data.purchases || []);
        setMetrics(res.data.data.metrics || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, statusFilter]);

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<CreditCard className="w-6 h-6" weight="duotone" />}
        title="Purchases & Financial Ledger"
        subtitle="Complete revenue transactions, unlocked templates & payment history"
      />

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        <div className="panel p-1.5 sm:p-4 flex items-center justify-between border-amber-500/20 bg-amber-500/5">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wide truncate">
              <span className="hidden sm:inline">Total </span>Revenue
            </p>
            <h3 className="text-xs sm:text-2xl font-bold text-ink mt-0.5 sm:mt-1 tabular-nums truncate">
              ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="hidden sm:flex p-3 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
            <CurrencyInr className="w-6 h-6" weight="bold" />
          </div>
        </div>

        <div className="panel p-1.5 sm:p-4 flex items-center justify-between border-glow-500/20 bg-glow-500/5">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-xs font-semibold text-glow-600 uppercase tracking-wide truncate">
              <span className="hidden sm:inline">Successful </span>Unlocks
            </p>
            <h3 className="text-xs sm:text-2xl font-bold text-ink mt-0.5 sm:mt-1 tabular-nums truncate">
              {metrics.successfulCount || 0}
            </h3>
          </div>
          <div className="hidden sm:flex p-3 bg-ink rounded-[2px] text-flame-400 shrink-0">
            <Receipt className="w-6 h-6" weight="duotone" />
          </div>
        </div>

        <div className="panel p-1.5 sm:p-4 flex items-center justify-between border-sky-500/20 bg-sky-500/5">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-xs font-semibold text-sky-600 uppercase tracking-wide truncate">
              <span className="sm:hidden">Avg Order</span>
              <span className="hidden sm:inline">Avg Order Value (AOV)</span>
            </p>
            <h3 className="text-xs sm:text-2xl font-bold text-ink mt-0.5 sm:mt-1 tabular-nums truncate">
              ₹{metrics.avgOrderValue || 0}
            </h3>
          </div>
          <div className="hidden sm:flex p-3 bg-sky-500/10 rounded-xl text-sky-600 shrink-0">
            <CreditCard className="w-6 h-6" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search transaction ID, user name, phone, or template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select pl-10 sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : purchases.length === 0 ? (
        <div className="panel p-12 text-center">
          <Receipt className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No transactions recorded yet.</p>
        </div>
      ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User Details</th>
                  <th>Template Unlocked</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-ink flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-glow-600" weight="duotone" />
                        {p.transactionId}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-ink">{p.userId?.name || 'Statuzzz User'}</p>
                      <p className="text-[11px] text-ink-mute font-mono">{p.userId?.phoneNumber || 'N/A'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <img
                          src={p.templateId?.thumbnail || p.finalAssetUrl || p.templateId?.previewAsset || p.templateId?.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                          alt={p.templateId?.name || 'Template'}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                          }}
                          className="w-7 h-9 rounded object-cover border border-paper-200 shrink-0"
                        />
                        <div>
                          <p className="font-medium text-ink-soft line-clamp-1">{p.templateId?.name || 'Template'}</p>
                          <span className="text-[10px] text-ink-mute uppercase">
                            {{
                              free: 'Free',
                              premium: 'Premium',
                              paid: 'Paid',
                              vip: 'VIP',
                            }[p.templateId?.accessType] || 'Premium'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-glow-700 tabular-nums">
                      {p.templateId?.accessType === 'free' ? (
                        <span className="text-ink-mute font-medium">—</span>
                      ) : (p.userId?.isPremium || p.productId === 'statuzzz_vip_unlock') ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 uppercase">PASS</span>
                      ) : (
                        <>
                          ₹{p.amount} <span className="text-[10px] font-medium text-ink-mute">{p.currency || 'INR'}</span>
                        </>
                      )}
                    </td>
                    <td className="capitalize text-ink-soft font-medium">
                      <span className="badge-muted">{p.paymentProvider || 'UPI'}</span>
                    </td>
                    <td>
                      {p.status === 'successful' ? (
                        <span className="badge-success flex items-center gap-1 w-max">
                          <CheckCircle className="w-3 h-3" weight="fill" /> Successful
                        </span>
                      ) : p.status === 'pending' ? (
                        <span className="badge-amber flex items-center gap-1 w-max">Pending</span>
                      ) : (
                        <span className="badge-danger flex items-center gap-1 w-max">Failed</span>
                      )}
                    </td>
                    <td className="text-ink-mute text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ink-mute" />
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleInvoiceClick(p)}
                          title="View / print invoice"
                          className="inline-flex items-center gap-1.5 border-2 border-ink bg-paper-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-flame-500 hover:shadow-hard-sm transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5" weight="duotone" /> Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Print-friendly invoice view */}
      {invoicePurchase && (
        <InvoiceModal purchase={invoicePurchase} onClose={() => setInvoicePurchase(null)} />
      )}
    </div>
  );
}
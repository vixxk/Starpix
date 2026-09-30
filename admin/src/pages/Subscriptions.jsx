import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '../components/PageHead';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import GrantVipModal from '../components/GrantVipModal';
import ModalPortal from '../components/ModalPortal';
import { resolveMediaUrl } from '../utils/media';
import {
  Crown,
  MagnifyingGlass,
  FunnelSimple,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  CurrencyInr,
  ShoppingBag,
  Calendar,
  Phone,
  UserCircle,
  ShieldCheck,
  ArrowSquareOut,
  X,
  Sparkle,
} from '@phosphor-icons/react';

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({ totalSubscriptions: 0, activeSubscriptions: 0, totalSubRevenue: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [selectedPhotoUser, setSelectedPhotoUser] = useState(null);

  const fetchSubscriptions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get('/admin/subscriptions', {
        params: {
          page: p,
          limit: 10,
          status: statusFilter,
          search,
        },
      });

      if (res.data && res.data.success) {
        setSubscriptions(res.data.data || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page || p,
            totalPages: res.data.pagination.pages || 1,
            totalItems: res.data.pagination.total || (res.data.data || []).length,
            limit: res.data.pagination.limit || 10,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      toast.error('Failed to load user subscriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, toast]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSubscriptions(page);
  }, [page, fetchSubscriptions]);

  const handleOpenVipModal = (user) => {
    setSelectedUser(user);
    setVipModalOpen(true);
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Page Header */}
      <PageHead
        icon={<Crown className="w-6 h-6 text-amber-500" weight="duotone" />}
        title="User Subscriptions"
        subtitle={`Showing page ${pagination.page} of ${pagination.totalPages} (${summary.totalSubscriptions} total subscribers)`}
        actions={
          <button
            onClick={() => fetchSubscriptions(page)}
            className="btn-secondary w-full sm:w-auto"
          >
            <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-ink-mute">
            <span className="label">Total Subscribers</span>
            <Crown className="w-4 h-4 text-amber-500" weight="fill" />
          </div>
          <p className="display text-2xl sm:text-3xl text-ink mt-2">{summary.totalSubscriptions}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="label text-emerald-800">Active VIP Members</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-emerald-600 mt-2">{summary.activeSubscriptions}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-glow-700">
            <span className="label text-glow-800">Subscription Earnings</span>
            <CurrencyInr className="w-4 h-4 text-glow-600" weight="bold" />
          </div>
          <p className="display text-2xl sm:text-3xl text-glow-700 mt-2">
            ₹{(summary.totalSubRevenue || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribed user by name or phone number..."
            className="input pl-10"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select pl-10 sm:w-48 font-bold text-xs uppercase"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active VIP</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : subscriptions.length === 0 ? (
        <div className="panel p-12 text-center">
          <Crown className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No user subscriptions found matching your query.</p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscribed User</th>
                  <th>VIP Status</th>
                  <th>Subscribed Date</th>
                  <th>Total Purchases / Spent</th>
                  <th>Latest Transaction</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((u) => {
                  const isActive = u.isPremium && u.subscriptionStatus === 'active';
                  const tx = u.latestTransaction;

                  return (
                    <tr key={u._id}>
                      {/* User Column */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar shrink-0">
                            {u.profilePhoto ? (
                              <img
                                src={resolveMediaUrl(u.profilePhoto)}
                                alt={u.name || 'User'}
                                onClick={() => setSelectedPhotoUser({
                                  name: u.name,
                                  phone: u.phoneNumber,
                                  photo: resolveMediaUrl(u.profilePhoto),
                                })}
                                title="Click to view full photo"
                                className="w-10 h-10 rounded-full object-cover border border-paper-300 shadow-sm shrink-0 bg-ink cursor-pointer hover:ring-2 hover:ring-flame-500 hover:scale-105 transition-all"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: u.profilePhoto ? 'none' : 'flex' }}
                              className="w-10 h-10 rounded-full bg-ink text-amber-400 border border-ink flex items-center justify-center font-display font-bold shrink-0 shadow-sm"
                            >
                              {(u.name || 'U').substring(0, 1).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-ink leading-snug">{u.name || 'Starpix User'}</p>
                            <p className="font-mono text-xs text-ink-mute">
                              {String(u.phoneNumber || '').startsWith('+') ? u.phoneNumber : `${u.countryCode || '+91'} ${u.phoneNumber}`}
                            </p>
                            {u.isDeleted && (
                              <span className="badge-red text-[9px] mt-0.5">Account Deleted</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        {isActive ? (
                          <div>
                            <span className="badge-amber flex items-center gap-1 w-max">
                              <Crown className="w-3.5 h-3.5" weight="fill" /> Active VIP
                            </span>
                            <p className="text-[10px] font-mono font-bold text-amber-700 mt-1">
                              {u.subscriptionPlan === '7days' ? '7 Days Pass' :
                               u.subscriptionPlan === '30days' ? '30 Days Pass' :
                               u.subscriptionPlan === '1year' ? '1 Year Pass' :
                               u.subscriptionPlan === 'lifetime' ? 'Lifetime VIP' :
                               u.subscriptionPlan || 'Active VIP'}
                            </p>
                            {u.subscriptionExpiresAt && (
                              <p className="text-[9px] font-mono text-ink-mute">
                                Exp: {new Date(u.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        ) : u.subscriptionStatus === 'expired' ? (
                          <span className="badge-red flex items-center gap-1 w-max">
                            <XCircle className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : (
                          <span className="badge-muted flex items-center gap-1 w-max">
                            Cancelled / Inactive
                          </span>
                        )}
                      </td>

                      {/* Subscribed Date */}
                      <td className="font-mono text-xs text-ink-mute">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-ink-mute" />
                          {u.subscribedAt ? new Date(u.subscribedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </td>

                      {/* Total Purchases / Spent */}
                      <td>
                        <div>
                          <p className="font-bold text-glow-700 tabular-nums text-sm">₹{u.totalSpent || 0}</p>
                          <p className="text-[11px] text-ink-mute font-mono flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" /> {u.totalPurchases || 0} order(s)
                          </p>
                        </div>
                      </td>

                      {/* Latest Transaction */}
                      <td>
                        {tx ? (
                          <div>
                            <p className="font-mono text-xs font-semibold text-ink">ID: {tx.transactionId || tx._id}</p>
                            <p className="text-[11px] text-ink-mute">
                              ₹{tx.amount} · {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-mute italic">Manual Grant</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="text-right">
                        <button
                          onClick={() => handleOpenVipModal(u)}
                          className={`btn-xs ${isActive ? 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20' : 'btn-primary'}`}
                        >
                          {isActive ? 'Revoke VIP' : 'Grant VIP'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Grant / Revoke VIP Modal */}
      <GrantVipModal
        isOpen={vipModalOpen}
        user={selectedUser}
        onClose={() => {
          setVipModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          fetchSubscriptions(page);
        }}
      />

      {/* User Profile Photo Preview Lightbox Modal */}
      {selectedPhotoUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedPhotoUser(null)}
          >
            <div
              className="bg-paper-50 border-2 border-ink shadow-hard-lg max-w-sm w-full overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3.5 border-b-2 border-ink bg-paper-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-ink text-amber-400 border border-ink flex items-center justify-center font-display font-bold text-xs shrink-0">
                    {(selectedPhotoUser.name || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-xs truncate">
                      {selectedPhotoUser.name || 'User Profile Photo'}
                    </p>
                    {selectedPhotoUser.phone && (
                      <p className="font-mono text-[10px] text-ink-mute truncate">{selectedPhotoUser.phone}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoUser(null)}
                  className="p-1 text-ink hover:bg-paper-200 border-2 border-transparent hover:border-ink transition-all"
                  title="Close preview"
                >
                  <X className="w-4 h-4" weight="bold" />
                </button>
              </div>

              <div className="p-3 bg-ink/5 flex items-center justify-center">
                <img
                  src={selectedPhotoUser.photo}
                  alt={selectedPhotoUser.name || 'User Profile Photo'}
                  className="max-h-[60vh] max-w-full object-contain border-2 border-ink bg-ink shadow-hard-sm"
                />
              </div>

              <div className="p-2.5 bg-paper-100 border-t-2 border-ink flex items-center justify-between">
                <span className="label text-[9px]">Full Resolution Preview</span>
                <a
                  href={selectedPhotoUser.photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                >
                  <ArrowSquareOut className="w-3.5 h-3.5" />
                  <span>Open Original</span>
                </a>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

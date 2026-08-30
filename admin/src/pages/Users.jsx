import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import {
  UsersThree,
  CrownSimple,
  Phone,
  UserCircle,
  MagnifyingGlass,
  FunnelSimple,
  CheckCircle,
  XCircle,
  CurrencyInr,
  ShoppingBag,
  Calendar,
} from '@phosphor-icons/react';

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = API.defaults.baseURL || '';
  const rootHost = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${rootHost}${cleanPath}`;
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVip, setFilterVip] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'deleted'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });

  const [userToRestore, setUserToRestore] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [userToToggleVip, setUserToToggleVip] = useState(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [togglingVip, setTogglingVip] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filterVip === 'vip') params.isPremium = 'true';
      if (filterVip === 'free') params.isPremium = 'false';
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await API.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.data || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page || page,
            totalPages: res.data.pagination.pages || 1,
            totalItems: res.data.pagination.total || (res.data.data || []).length,
            limit: res.data.pagination.limit || 10,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, filterVip, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [page, search, filterVip, filterStatus]);

  const handleOpenVipModal = (user) => {
    setUserToToggleVip(user);
    setVipModalOpen(true);
  };

  const handleConfirmToggleVip = async () => {
    if (!userToToggleVip) return;
    setTogglingVip(true);
    try {
      const res = await API.put(`/admin/users/${userToToggleVip._id}/toggle-vip`);
      if (res.data.success) {
        toast.success(res.data.message || 'VIP status updated');
        setVipModalOpen(false);
        setUserToToggleVip(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update VIP status');
    } finally {
      setTogglingVip(false);
    }
  };

  const handleOpenRestoreModal = (user) => {
    setUserToRestore(user);
    setRestoreModalOpen(true);
  };

  const handleConfirmRestoreUser = async () => {
    if (!userToRestore) return;
    setRestoring(true);
    try {
      const res = await API.put(`/admin/users/${userToRestore._id}/restore`);
      if (res.data.success) {
        toast.success('Account restored successfully');
        setRestoreModalOpen(false);
        setUserToRestore(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore user account');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<UsersThree className="w-6 h-6" weight="duotone" />}
        title="User Directory & Entitlements"
        subtitle={`Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} registered mobile app users)`}
      />

      {/* Toolbar */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by user name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={filterVip}
            onChange={(e) => setFilterVip(e.target.value)}
            className="select pl-10 sm:w-44"
          >
            <option value="all">All VIP Types</option>
            <option value="vip">VIP Premium Only</option>
            <option value="free">Free Users Only</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select font-bold uppercase text-xs sm:w-44"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Members</option>
            <option value="deleted">Deleted Accounts</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : users.length === 0 ? (
        <div className="panel p-12 text-center">
          <UsersThree className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No users match your criteria.</p>
        </div>
      ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Phone Number</th>
                  <th>Membership / Account</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                  <th>Joined Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={u.isDeleted ? 'bg-red-500/5' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.profilePhoto ? (
                          <img
                            src={resolveMediaUrl(u.profilePhoto)}
                            alt={u.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover border border-paper-300 shadow-sm shrink-0 bg-ink"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: u.profilePhoto ? 'none' : 'flex' }}
                          className="w-10 h-10 rounded-full bg-ink text-flame-400 border border-ink flex items-center justify-center font-display font-bold shrink-0 shadow-sm"
                        >
                          {(u.name || 'S').substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-ink flex items-center gap-2">
                            {u.name || 'Starpix Mobile User'}
                            {u.isDeleted && (
                              <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 uppercase">
                                Account Deleted
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-mute flex items-center gap-1 font-mono">
                            <UserCircle className="w-3 h-3" /> {u._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-glow-600" weight="duotone" />
                        {String(u.phoneNumber || '').startsWith('+') ? u.phoneNumber : `${u.countryCode || '+91'} ${u.phoneNumber}`}
                      </div>
                    </td>
                    <td>
                      {u.isDeleted ? (
                        <div>
                          <span className="badge-red flex items-center gap-1 w-max">
                            <XCircle className="w-3.5 h-3.5" /> Account Deleted
                          </span>
                          {u.deletedAt && (
                            <p className="text-[10px] font-mono text-rose-600 mt-1">
                              {new Date(u.deletedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : u.isPremium ? (
                        <span className="badge-amber flex items-center gap-1 w-max">
                          <CrownSimple className="w-3 h-3" weight="fill" /> VIP Premium
                        </span>
                      ) : (
                        <span className="badge-muted flex items-center gap-1 w-max">Free Member</span>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-ink flex items-center gap-1 tabular-nums">
                        <ShoppingBag className="w-3.5 h-3.5 text-ink-mute" /> {u.totalPurchases || 0}
                      </span>
                    </td>
                    <td className="font-bold text-glow-700 tabular-nums">
                      ₹{u.totalSpent || 0}
                    </td>
                    <td className="text-ink-mute text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ink-mute" />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {u.isDeleted ? (
                          <button
                            onClick={() => handleOpenRestoreModal(u)}
                            className="btn-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 font-bold"
                          >
                            Restore Account
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenVipModal(u)}
                            className={`btn-xs ${u.isPremium ? 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20' : 'btn-secondary'}`}
                          >
                            {u.isPremium ? 'Revoke VIP' : 'Grant VIP'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Pagination component with page numbers */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Restore User Confirmation Modal */}
      <ConfirmModal
        isOpen={restoreModalOpen}
        title="Restore Account?"
        message={`Are you sure you want to restore the account for ${userToRestore?.name || userToRestore?.phoneNumber || 'this user'}?`}
        confirmText="Restore"
        cancelText="Cancel"
        danger={false}
        loading={restoring}
        onClose={() => {
          setRestoreModalOpen(false);
          setUserToRestore(null);
        }}
        onConfirm={handleConfirmRestoreUser}
      />

      {/* Grant / Revoke VIP Confirmation Modal */}
      <ConfirmModal
        isOpen={vipModalOpen}
        title={userToToggleVip?.isPremium ? 'Revoke VIP Entitlement?' : 'Grant VIP Entitlement?'}
        message={
          userToToggleVip?.isPremium
            ? `Are you sure you want to revoke VIP status for ${userToToggleVip?.name || userToToggleVip?.phoneNumber}? They will lose access to VIP templates.`
            : `Are you sure you want to grant full VIP access to ${userToToggleVip?.name || userToToggleVip?.phoneNumber}?`
        }
        confirmText={userToToggleVip?.isPremium ? 'Revoke VIP' : 'Grant VIP'}
        cancelText="Cancel"
        danger={Boolean(userToToggleVip?.isPremium)}
        loading={togglingVip}
        onClose={() => {
          setVipModalOpen(false);
          setUserToToggleVip(null);
        }}
        onConfirm={handleConfirmToggleVip}
      />
    </div>
  );
}
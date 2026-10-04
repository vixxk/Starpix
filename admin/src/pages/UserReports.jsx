import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/Skeleton';
import TableScroll from '../components/TableScroll';
import {
  Flag,
  MagnifyingGlass,
  FunnelSimple,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Clock,
  Gear,
  ChatText,
  Trash,
  Image as ImageIcon,
  Sparkle,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { resolveMediaUrl } from '../utils/media';
import {
  ReportStatusBadge,
  ReplyModal,
  TemplatePreviewModal,
  UserProfilePhotoModal,
} from '../modules/userReports';

export default function UserReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ totalAll: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedReport, setSelectedReport] = useState(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [replyMessage, setReplyMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const [selectedPhotoUser, setSelectedPhotoUser] = useState(null);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get('/admin/reports', {
        params: {
          page,
          limit: 10,
          status: statusFilter,
          type: typeFilter,
          search,
        },
      });

      if (res.data && res.data.success) {
        setReports(res.data.data || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handleOpenReplyModal = (report) => {
    setSelectedReport(report);
    setReplyStatus(report.status || 'in_progress');
    setReplyMessage(report.adminResponse || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = async () => {
    if (!selectedReport) return;
    setSaving(true);
    try {
      const res = await API.put(`/admin/reports/${selectedReport._id}`, {
        status: replyStatus,
        adminResponse: replyMessage,
      });

      if (res.data && res.data.success) {
        toast.success('Report updated successfully');
        setReplyModalOpen(false);
        fetchReports(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (report) => {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      const res = await API.delete(`/admin/reports/${reportToDelete._id}`);
      if (res.data && res.data.success) {
        toast.success('Report deleted successfully');
        setDeleteModalOpen(false);
        setReportToDelete(null);
        fetchReports(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <PageHead
        icon={<Flag className="w-6 h-6" weight="duotone" />}
        title="User Reports & Issues"
        subtitle={`Tracking ${summary.totalAll} user submitted issues, offensive reports & inquiries`}
        actions={
          <button
            onClick={() => fetchReports(pagination.page)}
            className="btn-secondary w-full sm:w-auto"
          >
            <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        }
      />

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-ink-mute">
            <span className="label">Total Reports</span>
            <Flag className="w-4 h-4 text-flame-500" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-ink mt-2">{summary.totalAll}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-amber-700">
            <span className="label text-amber-800">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-amber-600 mt-2">{summary.pending}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-sky-700">
            <span className="label text-sky-800">Working On It</span>
            <Gear className="w-4 h-4 text-sky-600 animate-spin-slow" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-sky-600 mt-2">{summary.in_progress}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="label text-emerald-800">Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-emerald-600 mt-2">{summary.resolved}</p>
        </div>

        <div className="panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-red-700">
            <span className="label text-red-800">Rejected</span>
            <XCircle className="w-4 h-4 text-red-600" weight="duotone" />
          </div>
          <p className="display text-2xl sm:text-3xl text-red-600 mt-2">{summary.rejected}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reason, notes, or admin response..."
            className="input pl-10"
          />
        </div>

        <div className="relative">
          <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select pl-10 sm:w-44 font-bold text-xs uppercase"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="in_progress">Working On It</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select sm:w-44 font-bold text-xs uppercase"
          >
            <option value="all">All Types</option>
            <option value="template">Template Reports</option>
            <option value="issue">General Issues</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : reports.length === 0 ? (
        <div className="panel p-12 text-center">
          <Flag className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No reports match your criteria.</p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <TableScroll className="anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reporter User</th>
                  <th>Type & Target</th>
                  <th>Reason & Details</th>
                  <th>Status</th>
                  <th>Admin Response</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const u = report.userId;
                  const tObj = report.templateId;

                  return (
                    <tr key={report._id}>
                      {/* User details */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {u?.profilePhoto ? (
                              <img
                                src={resolveMediaUrl(u.profilePhoto)}
                                alt={u?.name || 'User'}
                                className="w-10 h-10 rounded-full object-cover border border-paper-300 shadow-sm shrink-0 bg-ink cursor-pointer hover:ring-2 hover:ring-flame-500 hover:scale-105 transition-all"
                                title="Click to view full photo"
                                onClick={() =>
                                  setSelectedPhotoUser({
                                    name: u?.name || 'User',
                                    photo: resolveMediaUrl(u.profilePhoto),
                                    phone: u?.phoneNumber,
                                  })
                                }
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: u?.profilePhoto ? 'none' : 'flex' }}
                              className="w-10 h-10 rounded-full bg-ink text-flame-400 border border-ink flex items-center justify-center font-display font-bold shrink-0 shadow-sm"
                            >
                              {(u?.name || 'U').substring(0, 1).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-ink leading-snug">{u?.name || 'Unknown User'}</p>
                            <p className="font-mono text-xs text-ink-mute">{u?.phoneNumber || 'No phone'}</p>
                            {u?.isDeleted && (
                              <span className="badge-red text-[9px] mt-0.5">Account Deleted</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type & Target */}
                      <td>
                        {report.type === 'template' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (tObj) {
                                setSelectedTemplateForModal(tObj);
                                setTemplateModalOpen(true);
                              }
                            }}
                            disabled={!tObj}
                            title={tObj ? 'Click to open template preview modal' : 'Template no longer exists'}
                            className={`flex items-center gap-2.5 text-left p-1.5 rounded-[3px] border transition-all ${
                              tObj
                                ? 'cursor-pointer hover:bg-paper-100/80 hover:border-flame-400 group shadow-sm active:translate-y-[1px]'
                                : 'border-transparent opacity-60'
                            }`}
                          >
                            {tObj?.thumbnail || tObj?.previewAsset ? (
                              <img
                                src={tObj.thumbnail || tObj.previewAsset}
                                alt={tObj.name}
                                className="w-9 h-11 object-cover border border-ink rounded-[2px] shrink-0 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-9 h-11 bg-paper-100 border border-ink flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-ink-mute" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="badge-amber text-[9px] mb-0.5 inline-flex items-center gap-1">
                                <Sparkle className="w-2.5 h-2.5 text-flame-600" /> Template
                              </span>
                              <p className="text-xs font-bold text-ink max-w-[140px] truncate group-hover:text-flame-600 transition-colors">
                                {tObj?.name || 'Deleted Template'}
                              </p>
                              {tObj && (
                                <p className="text-[10px] font-mono text-ink-mute flex items-center gap-0.5 mt-0.5">
                                  <span>View details</span>
                                  <ArrowSquareOut className="w-2.5 h-2.5" />
                                </p>
                              )}
                            </div>
                          </button>
                        ) : (
                          <span className="badge-muted flex items-center gap-1 w-max">
                            <ChatText className="w-3.5 h-3.5 text-sky-600" /> General Issue
                          </span>
                        )}
                      </td>

                      {/* Reason & Description */}
                      <td className="max-w-[280px] whitespace-normal">
                        <p className="font-bold text-ink text-xs">{report.reason}</p>
                        {report.description && (
                          <p className="text-xs text-ink-mute mt-0.5 line-clamp-2">{report.description}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <ReportStatusBadge status={report.status} />
                      </td>

                      {/* Admin Response */}
                      <td className="max-w-[220px] whitespace-normal">
                        {report.adminResponse ? (
                          <div className="bg-paper-100 border border-ink/20 p-2 rounded-[2px]">
                            <p className="text-xs text-ink font-medium line-clamp-2">"{report.adminResponse}"</p>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-mute italic">No reply sent</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="font-mono text-xs text-ink-mute">
                        {new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReplyModal(report)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Review & Reply
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(report)}
                            className="btn-ghost text-red-600 hover:bg-red-50 p-1.5"
                            title="Delete Report"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-3 border-t-2 border-ink bg-paper-50 flex items-center justify-between font-mono text-xs text-ink-mute">
              <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReports(pagination.page - 1)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchReports(pagination.page + 1)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reply & Status Modal */}
      <ReplyModal
        isOpen={replyModalOpen}
        report={selectedReport}
        replyStatus={replyStatus}
        setReplyStatus={setReplyStatus}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        saving={saving}
        onClose={() => setReplyModalOpen(false)}
        onSave={handleSaveReply}
        onOpenTemplate={(tmpl) => {
          setSelectedTemplateForModal(tmpl);
          setTemplateModalOpen(true);
        }}
        onOpenUserPhoto={(photoData) => setSelectedPhotoUser(photoData)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Report?"
        message="Are you sure you want to delete this user report record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
        loading={deleting}
        onClose={() => {
          setDeleteModalOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={handleConfirmDeleteReport}
      />

      {/* Template Details & Preview Popup Modal */}
      <TemplatePreviewModal
        isOpen={templateModalOpen}
        template={selectedTemplateForModal}
        onClose={() => {
          setTemplateModalOpen(false);
          setSelectedTemplateForModal(null);
        }}
      />

      {/* Profile Photo Preview Modal */}
      <UserProfilePhotoModal
        selectedPhotoUser={selectedPhotoUser}
        onClose={() => setSelectedPhotoUser(null)}
      />
    </div>
  );
}

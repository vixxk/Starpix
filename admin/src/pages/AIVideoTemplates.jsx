import React, { useEffect, useState, useMemo } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import {
  VideoCamera,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  Plus,
  Sparkle,
} from '@phosphor-icons/react';

import {
  DEFAULT_PROMPT,
  initialForm,
  TemplateModal,
  CreationsTable,
  MediaPreviewModal,
} from '../modules/aiVideoTemplates';

export default function AIVideoTemplates() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'creations'

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  // User AI Generated Creations state
  const [creations, setCreations] = useState([]);
  const [creationLoading, setCreationLoading] = useState(false);
  const [creationSearch, setCreationSearch] = useState('');
  const [creationTypeFilter, setCreationTypeFilter] = useState('all');
  const [creationPage, setCreationPage] = useState(1);
  const [creationPagination, setCreationPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [previewMedia, setPreviewMedia] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await API.get('/ai-video/admin/templates');
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Error loading AI Studio templates:', err);
      toast.error('Failed to load AI Studio templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreations = async () => {
    setCreationLoading(true);
    try {
      const params = { page: creationPage, limit: 10 };
      if (creationSearch) params.search = creationSearch;
      if (creationTypeFilter !== 'all') params.mediaType = creationTypeFilter;

      const res = await API.get('/admin/creations', { params });
      if (res.data.success) {
        setCreations(res.data.data || []);
        if (res.data.pagination) {
          setCreationPagination({
            page: res.data.pagination.page || creationPage,
            totalPages: res.data.pagination.pages || 1,
            totalItems: res.data.pagination.total || (res.data.data || []).length,
            limit: res.data.pagination.limit || 10,
          });
        }
      }
    } catch (err) {
      console.error('Error loading generated AI creations:', err);
    } finally {
      setCreationLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'creations') {
      fetchCreations();
    }
  }, [activeTab, creationPage, creationSearch, creationTypeFilter]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = mediaTypeFilter === 'all' ? true : t.mediaType === mediaTypeFilter;
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'published' ? t.isActive : !t.isActive;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [templates, search, mediaTypeFilter, statusFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedTemplates = filteredTemplates.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      title: t.title,
      titleTranslations: t.titleTranslations || {},
      category: t.category || "Retro 80's",
      mediaType: t.mediaType || 'video',
      requiredPhotos: t.requiredPhotos || 1,
      videoUrl: t.videoUrl,
      thumbnailUrl: t.thumbnailUrl || '',
      sampleSourceImageUrl: t.sampleSourceImageUrl || '',
      sampleSourceImageUrls: t.sampleSourceImageUrls && t.sampleSourceImageUrls.length > 0 ? t.sampleSourceImageUrls : (t.sampleSourceImageUrl ? [t.sampleSourceImageUrl] : []),
      sampleResultVideoUrl: t.sampleResultVideoUrl || '',
      durationSeconds: t.durationSeconds !== undefined ? t.durationSeconds : 10,
      creditsRequired: t.creditsRequired || 0,
      prompt: t.prompt || DEFAULT_PROMPT,
      sortOrder: t.sortOrder || 0,
      isActive: t.isActive !== undefined ? t.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Template Title is required');
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.error('Main Video/Image S3 URL is required');
      return;
    }

    try {
      const payload = {
        ...formData,
        sampleSourceImageUrl: (formData.sampleSourceImageUrls && formData.sampleSourceImageUrls[0]) || formData.sampleSourceImageUrl || '',
      };
      if (editingTemplate) {
        await API.put(`/ai-video/admin/templates/${editingTemplate._id}`, payload);
        toast.success('AI Template updated successfully');
      } else {
        await API.post('/ai-video/admin/templates', payload);
        toast.success('New AI Template created');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/ai-video/admin/templates/${deleteTarget._id}`);
      toast.success('AI Template deleted');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return;
    setTogglingStatus(true);
    try {
      await API.put(`/ai-video/admin/templates/${statusTarget._id}`, {
        isActive: !statusTarget.isActive,
      });
      toast.success(`Template ${!statusTarget.isActive ? 'activated' : 'hidden'}`);
      setStatusTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<VideoCamera className="w-6 h-6" weight="duotone" />}
        title="AI Video Studio & Content Management"
        subtitle={
          activeTab === 'templates'
            ? `Manage ${templates.length} AI face swap templates for video & image generation`
            : `Viewing page ${creationPagination.page} of ${creationPagination.totalPages} (${creationPagination.totalItems} AI face-swap creations logged)`
        }
        actions={
          activeTab === 'templates' && (
            <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" weight="bold" /> Add AI Template
            </button>
          )
        }
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b-2 border-ink gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 font-bold uppercase text-xs border-2 border-b-0 rounded-t-[2px] flex items-center gap-2 transition-all ${
            activeTab === 'templates'
              ? 'bg-ink text-paper-100 border-ink shadow-hard-sm'
              : 'bg-paper-100 text-ink-mute border-transparent hover:text-ink'
          }`}
        >
          <VideoCamera className="w-4 h-4" />
          <span>AI Studio Templates ({templates.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('creations')}
          className={`px-4 py-2.5 font-bold uppercase text-xs border-2 border-b-0 rounded-t-[2px] flex items-center gap-2 transition-all ${
            activeTab === 'creations'
              ? 'bg-flame-500 text-ink border-ink shadow-hard-sm'
              : 'bg-paper-100 text-ink-mute border-transparent hover:text-ink'
          }`}
        >
          <Sparkle className="w-4 h-4" />
          <span>User Generated AI Content</span>
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Filters Toolbar */}
          <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search AI templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value)}
                  className="select w-full sm:w-36 text-xs sm:text-sm font-semibold"
                >
                  <option value="all">All Media</option>
                  <option value="video">Videos Only</option>
                  <option value="image">Images Only</option>
                </select>
              </div>
              <div className="relative">
                <Eye className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select pl-8 sm:pl-10 w-full sm:w-40 text-xs sm:text-sm font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Active Only</option>
                  <option value="unpublished">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data table */}
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : paginatedTemplates.length === 0 ? (
            <div className="panel p-12 text-center">
              <Sparkle className="w-8 h-8 text-paper-400 mx-auto mb-2" />
              <p className="text-sm text-ink-mute font-medium">No AI templates found</p>
              <p className="text-xs text-ink-mute mt-1">Upload video or image assets to S3 to get started.</p>
            </div>
          ) : (
            <div className="table-scroll anim">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>AI Template</th>
                    <th>Type</th>
                    <th>Credits Required (Price)</th>
                    <th>S3 Asset URL</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTemplates.map((t) => (
                    <tr key={t._id} className="anim">
                      <td>
                        <span className="font-mono font-bold text-xs bg-paper-100 border border-ink/20 px-2 py-1 rounded-[2px] text-ink whitespace-nowrap">
                          #{t.sortOrder || 0}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {t.mediaType === 'image' ? (
                            <img
                              src={t.videoUrl || t.thumbnailUrl}
                              alt={t.title}
                              className="w-12 aspect-[9/16] object-cover border-2 border-ink/20 shrink-0 rounded-[2px] bg-black"
                            />
                          ) : (
                            <video
                              src={t.videoUrl}
                              poster={t.thumbnailUrl}
                              className="w-12 aspect-[9/16] object-cover border-2 border-ink/20 shrink-0 rounded-[2px] bg-black"
                              muted
                              loop
                              onMouseOver={(e) => e.target.play().catch(() => {})}
                              onMouseOut={(e) => e.target.pause()}
                            />
                          )}
                          <div>
                            <p className="font-semibold text-ink line-clamp-1">{t.title}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider inline-block w-fit ${t.mediaType === 'image' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-orange-100 text-orange-700 border border-orange-300'}`}>
                            {t.mediaType || 'video'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-semibold bg-paper-100 text-ink-soft border border-ink/15 inline-flex items-center gap-1 w-fit">
                            {t.requiredPhotos > 1 ? `👥 ${t.requiredPhotos} Faces` : '👤 1 Face'}
                          </span>
                        </div>
                      </td>
                      <td className="font-mono text-xs font-bold text-flame-600">
                        {t.creditsRequired || 0} Credits
                      </td>
                      <td className="max-w-[180px] truncate text-xs text-ink-mute font-mono">
                        <a href={t.videoUrl} target="_blank" rel="noreferrer" className="text-flame-600 hover:underline">
                          {t.videoUrl}
                        </a>
                      </td>
                      <td>
                        <button
                          onClick={() => setStatusTarget(t)}
                          className={`badge transition-all cursor-pointer ${t.isActive ? 'badge-success hover:opacity-75' : 'badge-muted hover:opacity-75'}`}
                        >
                          {t.isActive ? <Eye className="w-3 h-3" weight="fill" /> : <EyeSlash className="w-3 h-3" weight="fill" />}
                          {t.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 sm:p-2 border border-ink bg-white text-ink hover:text-flame-600 hover:border-flame-500 hover:bg-paper-100 rounded-[2px] shadow-sm transition-all active:translate-y-[1px]"
                            title="Edit AI Template"
                          >
                            <PencilSimple className="w-5 h-5" weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 sm:p-2 border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-500 rounded-[2px] shadow-sm transition-all active:translate-y-[1px]"
                            title="Delete AI Template"
                          >
                            <Trash className="w-5 h-5" weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <CreationsTable
          creations={creations}
          loading={creationLoading}
          search={creationSearch}
          setSearch={setCreationSearch}
          typeFilter={creationTypeFilter}
          setTypeFilter={setCreationTypeFilter}
          page={creationPage}
          setPage={setCreationPage}
          pagination={creationPagination}
          onPreview={setPreviewMedia}
        />
      )}

      {/* Full Screen Media Preview Modal */}
      <MediaPreviewModal
        previewMedia={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {/* Create / Edit Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        editingTemplate={editingTemplate}
        formData={formData}
        setFormData={setFormData}
        isLangModalOpen={isLangModalOpen}
        setIsLangModalOpen={setIsLangModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete AI Studio Template?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.isActive ? 'Hide AI Template?' : 'Publish AI Template?'}
        message={statusTarget?.isActive ? `Hide "${statusTarget?.title}" from mobile user app?` : `Make "${statusTarget?.title}" active for mobile users?`}
        confirmText={statusTarget?.isActive ? 'Hide Template' : 'Publish Template'}
        cancelText="Cancel"
        danger={statusTarget?.isActive}
        loading={togglingStatus}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}

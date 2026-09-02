import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import ModalPortal from '../components/ModalPortal';
import MediaUploadZone from '../components/MediaUploadZone';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import {
  VideoCamera,
  MagnifyingGlass,
  FunnelSimple,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  Plus,
  X,
  FloppyDisk,
  Sparkle,
  Globe,
  DownloadSimple,
  Phone,
  Clock,
  Play,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import MultilingualNameModal from '../components/MultilingualNameModal';

const DEFAULT_PROMPT = 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.';

const initialForm = {
  title: '',
  titleTranslations: {},
  mediaType: 'video',
  videoUrl: '',
  thumbnailUrl: '',
  sampleSourceImageUrl: '',
  sampleResultVideoUrl: '',
  durationSeconds: 10,
  creditsRequired: 0,
  prompt: DEFAULT_PROMPT,
  sortOrder: 0,
  isActive: true,
};

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

  const filteredTemplates = React.useMemo(() => {
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
      mediaType: t.mediaType || 'video',
      videoUrl: t.videoUrl,
      thumbnailUrl: t.thumbnailUrl || '',
      sampleSourceImageUrl: t.sampleSourceImageUrl || '',
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
      if (editingTemplate) {
        await API.put(`/ai-video/admin/templates/${editingTemplate._id}`, formData);
        toast.success('AI Template updated successfully');
      } else {
        await API.post('/ai-video/admin/templates', formData);
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
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${t.mediaType === 'image' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-orange-100 text-orange-700 border border-orange-300'}`}>
                          {t.mediaType || 'video'}
                        </span>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="btn-xs border-ink hover:bg-paper-200"
                            title="Edit AI Template"
                          >
                            <PencilSimple className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="btn-xs border-red-300 text-red-600 hover:bg-red-50"
                            title="Delete AI Template"
                          >
                            <Trash className="w-3.5 h-3.5" />
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
        <>
          {/* User Generated AI Content Toolbar */}
          <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search AI creations by template title or format..."
                value={creationSearch}
                onChange={(e) => setCreationSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <select
                value={creationTypeFilter}
                onChange={(e) => setCreationTypeFilter(e.target.value)}
                className="select font-bold uppercase text-xs sm:w-44"
              >
                <option value="all">All AI Media Types</option>
                <option value="video">AI Videos (.mp4)</option>
                <option value="image">AI Photos (.png/.jpg)</option>
              </select>
            </div>
          </div>

          {/* User AI Generated Creations Grid / Table */}
          {creationLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : creations.length === 0 ? (
            <div className="panel p-12 text-center">
              <Sparkle className="w-8 h-8 text-paper-400 mx-auto mb-2" />
              <p className="text-sm text-ink-mute font-medium">No user-generated AI content found.</p>
            </div>
          ) : (
            <div className="table-scroll anim">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Generated Media Asset</th>
                    <th>Template / Title</th>
                    <th>Created By User</th>
                    <th>Type & Format</th>
                    <th>Created Date & Time</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creations.map((c) => {
                    const isVideo = c.format === 'mp4' || c.mediaType === 'video' || (c.imageUrl && c.imageUrl.toLowerCase().includes('.mp4'));
                    const userPhone = c.userId?.phoneNumber || 'N/A';
                    const userName = c.userId?.name || 'Starpix Mobile User';
                    const title = c.templateTitle || c.aiTemplateId?.title || c.templateId?.name || 'AI Face Swap';

                    return (
                      <tr key={c._id}>
                        <td>
                          <div className="relative w-14 aspect-[9/16] bg-ink border-2 border-ink rounded-[2px] overflow-hidden group cursor-pointer" onClick={() => setPreviewMedia({ url: c.imageUrl, isVideo, title })}>
                            {isVideo ? (
                              <video
                                src={c.imageUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                onMouseOver={(e) => e.target.play().catch(() => {})}
                                onMouseOut={(e) => e.target.pause()}
                              />
                            ) : (
                              <img
                                src={c.imageUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white" weight="fill" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="font-bold text-ink text-sm line-clamp-1">{title}</p>
                          <p className="text-[11px] text-ink-mute font-mono truncate max-w-[200px]">
                            ID: {c._id}
                          </p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-ink text-flame-400 font-bold text-xs flex items-center justify-center border border-ink">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-xs">{userName}</p>
                              <p className="font-mono text-xs text-ink-soft flex items-center gap-1">
                                <Phone className="w-3 h-3 text-glow-600" />
                                {userPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${isVideo ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}`}>
                            {isVideo ? 'AI Video (.mp4)' : 'AI Photo (.png)'}
                          </span>
                        </td>
                        <td className="text-ink-mute text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-ink-mute" />
                            {new Date(c.downloadedAt || c.createdAt).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewMedia({ url: c.imageUrl, isVideo, title })}
                              className="btn-xs border-ink bg-paper-100 hover:bg-paper-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <a
                              href={c.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-xs bg-flame-500 text-ink border-ink hover:bg-flame-400 flex items-center gap-1"
                            >
                              <ArrowSquareOut className="w-3.5 h-3.5" /> Open S3
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Creations Pagination */}
          <Pagination
            page={creationPagination.page}
            totalPages={creationPagination.totalPages}
            totalItems={creationPagination.totalItems}
            limit={creationPagination.limit}
            onPageChange={(p) => setCreationPage(p)}
          />
        </>
      )}

      {/* Full Screen Media Preview Modal */}
      {previewMedia && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] bg-ink/80 flex items-center justify-center p-4">
            <div className="panel max-w-lg w-full bg-paper-50 p-4 border-2 border-ink shadow-hard-lg">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
                <h3 className="font-bold text-ink text-sm uppercase flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-flame-600" /> {previewMedia.title}
                </h3>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 hover:bg-paper-200 rounded border border-ink"
                >
                  <X className="w-5 h-5 text-ink" />
                </button>
              </div>
              <div className="w-full aspect-[9/16] bg-black rounded border-2 border-ink overflow-hidden flex items-center justify-center">
                {previewMedia.isVideo ? (
                  <video src={previewMedia.url} className="w-full h-full object-contain" controls autoPlay loop />
                ) : (
                  <img src={previewMedia.url} alt={previewMedia.title} className="w-full h-full object-contain" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                >
                  <DownloadSimple className="w-4 h-4" /> Download Original Media
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="btn-secondary !py-2 !px-4 !text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="panel max-w-2xl w-full bg-paper-50 p-6 space-y-4 my-8">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                <h3 className="display text-xl text-ink">
                  {editingTemplate ? 'Edit AI Studio Template' : 'Add New AI Studio Template'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-mute hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1">Title (English) *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input flex-1"
                        placeholder="e.g. Heroic Warrior AI Video"
                      />
                      <button
                        type="button"
                        onClick={() => setIsLangModalOpen(true)}
                        className="btn-secondary px-2.5"
                        title="Configure Title Translations"
                      >
                        <Globe className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label mb-1">Media Type *</label>
                    <select
                      value={formData.mediaType}
                      onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                      className="select w-full"
                    >
                      <option value="video">Video (.mp4)</option>
                      <option value="image">Image (.png / .jpg)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <MediaUploadZone
                    label="Main Template Video / Target Image (S3 URL) *"
                    value={formData.videoUrl}
                    onChange={(url) => setFormData({ ...formData, videoUrl: url })}
                    folder="ai-templates"
                    accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="label mb-1">Credits Required</label>
                    <input
                      type="number"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData({ ...formData, creditsRequired: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-ink flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <FloppyDisk className="w-4 h-4" /> {editingTemplate ? 'Save Changes' : 'Create AI Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Multilingual Title Modal */}
      <MultilingualNameModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        baseName={formData.title}
        translations={formData.titleTranslations}
        onSave={(updatedTranslations) => setFormData({ ...formData, titleTranslations: updatedTranslations })}
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

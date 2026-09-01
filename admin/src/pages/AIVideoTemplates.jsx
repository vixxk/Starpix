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
} from '@phosphor-icons/react';

const DEFAULT_PROMPT = 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.';

const initialForm = {
  title: '',
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
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [formData, setFormData] = useState(initialForm);

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

  useEffect(() => {
    fetchTemplates();
  }, []);

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

    if (!formData.videoUrl) {
      toast.error('Target Media Asset (Video or Image) is required (Upload to AWS S3)');
      return;
    }

    try {
      if (editingTemplate) {
        await API.put(`/ai-video/admin/templates/${editingTemplate._id}`, formData);
        toast.success('AI Studio Template updated successfully');
      } else {
        await API.post('/ai-video/admin/templates', formData);
        toast.success('AI Studio Template created successfully');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving template');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/ai-video/admin/templates/${deleteTarget._id}`);
      toast.success('AI Studio Template deleted');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting template');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return;
    setTogglingStatus(true);
    try {
      const nextState = !statusTarget.isActive;
      await API.put(`/ai-video/admin/templates/${statusTarget._id}`, { isActive: nextState });
      toast.success(nextState ? `Published "${statusTarget.title}"` : `Hidden "${statusTarget.title}"`);
      setStatusTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publication status');
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<VideoCamera className="w-6 h-6 text-flame-500" weight="duotone" />}
        title="AI Content Templates"
        subtitle={`Manage AI Content Face-Swap templates (${filteredTemplates.length} templates)`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> Upload AI Content Template
          </button>
        }
      />

      {/* Toolbar */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search AI templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
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
                      <button onClick={() => handleOpenEdit(t)} className="p-2 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors">
                        <PencilSimple className="w-4 h-4" weight="duotone" />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} className="p-2 text-ink-mute hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors">
                        <Trash className="w-4 h-4" weight="duotone" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredTemplates.length}
        limit={itemsPerPage}
        onPageChange={(p) => setPage(p)}
      />

      {/* Upload & Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
            <div className="modal-card max-w-3xl my-auto w-full">
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
                <h3 className="display font-bold text-ink flex items-center gap-2 text-sm sm:text-base">
                  <VideoCamera className="w-5 h-5 text-flame-500 shrink-0" weight="duotone" />
                  {editingTemplate ? 'Edit AI Content Template' : 'Upload AI Content Template to S3'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]">
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Media Type</label>
                    <select
                      value={formData.mediaType}
                      onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                      className="select font-bold"
                    >
                      <option value="video">Video (MP4)</option>
                      <option value="image">Image (HD Photo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Template Title (Required *)</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      placeholder="e.g. Royal Maharaja AI Portrait"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Credits Required (Price)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData({ ...formData, creditsRequired: Number(e.target.value) })}
                      className="input font-mono font-bold text-flame-600"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="field-label">Display Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* S3 Media Upload Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MediaUploadZone
                    label={formData.mediaType === 'image' ? "Target Image Asset (AWS S3 Upload *)" : "Target ~10s MP4 Video Asset (AWS S3 Upload *)"}
                    value={formData.videoUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, videoUrl: url }))}
                    folder="ai-video-templates"
                    accept={formData.mediaType === 'image' ? "image/*" : "video/mp4,video/webm,video/mov"}
                  />

                  <MediaUploadZone
                    label="Poster Thumbnail Image (S3 Upload)"
                    value={formData.thumbnailUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl: url }))}
                    folder="ai-video-thumbnails"
                    accept="image/*"
                  />
                </div>

                {/* AI Face Swap Prompt (Editable) */}
                <div>
                  <label className="field-label flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkle className="w-4 h-4 text-flame-500" weight="fill" /> AI Generation Prompt (Editable *)
                    </span>
                    <span className="text-[10px] text-ink-mute font-normal">Used to generate high quality videos/photos for users</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    className="input text-xs font-mono leading-relaxed"
                    placeholder="Write detailed AI prompt for face swap quality, lighting, and facial identity..."
                  />
                </div>

                {/* Optional Sample Showcase Assets */}
                <div className="p-3 bg-paper-100 border border-ink/20 rounded-[2px] space-y-3">
                  <h4 className="font-bold text-xs text-ink flex items-center gap-1.5">
                    <Sparkle className="w-4 h-4 text-glow-600" weight="fill" /> Demo Onboarding Carousel Preview Assets (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MediaUploadZone
                      label="Sample Uploaded Face Image"
                      value={formData.sampleSourceImageUrl}
                      onChange={(url) => setFormData((prev) => ({ ...prev, sampleSourceImageUrl: url }))}
                      folder="ai-demo-samples"
                      accept="image/*"
                    />
                    <MediaUploadZone
                      label="Sample AI Swapped Output Media"
                      value={formData.sampleResultVideoUrl}
                      onChange={(url) => setFormData((prev) => ({ ...prev, sampleResultVideoUrl: url }))}
                      folder="ai-demo-samples"
                      accept={formData.mediaType === 'image' ? "image/*" : "video/mp4,video/webm"}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-ink cursor-pointer">
                    Active & Published to Mobile App
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <FloppyDisk className="w-4 h-4" weight="fill" /> Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete AI Template"
        message={`Are you sure you want to permanently delete AI template "${deleteTarget?.title}"?`}
        confirmText="Delete Template"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={statusTarget !== null}
        title={statusTarget?.isActive ? 'Hide AI Template' : 'Publish AI Template'}
        message={
          statusTarget?.isActive
            ? `Are you sure you want to hide "${statusTarget?.title}" from mobile users?`
            : `Are you sure you want to publish "${statusTarget?.title}" to mobile users?`
        }
        confirmText={statusTarget?.isActive ? 'Hide Template' : 'Publish Template'}
        danger={statusTarget?.isActive}
        loading={togglingStatus}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
}

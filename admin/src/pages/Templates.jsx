import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../services/api';
import CanvasEditor from '../components/CanvasEditor';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import ModalPortal from '../components/ModalPortal';
import MediaUploadZone from '../components/MediaUploadZone';
import { TableSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import {
  Sparkle,
  MagnifyingGlass,
  FunnelSimple,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  Plus,
  X,
  FloppyDisk,
  PushPin,
  CrownSimple,
} from '@phosphor-icons/react';

const initialForm = (firstCategoryId) => ({
  name: '',
  description: '',
  categoryId: firstCategoryId || '',
  type: 'image',
  accessType: 'free',
  price: 0,
  thumbnail: '',
  previewAsset: '',
  mainMedia: '',
  footers: [],
  order: 0,
  sortOrder: 0,
  isPinned: false,
  active: true,
  canvasConfig: {
    aspectRatio: 0.5625,
    backgroundColor: '#07140B',
    backgroundImage: '',
    layers: [
      { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.65, height: 0.42, zIndex: 15 },
      { id: 'l2', type: 'text', x: 0.5, y: 0.8, width: 0.8, height: 0.1, defaultValue: 'User Name', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 20 },
    ],
  },
});

export default function Templates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'unpublished'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [formData, setFormData] = useState(initialForm());

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (statusFilter !== 'all') params.active = statusFilter;

      const [resT, resC] = await Promise.all([
        API.get('/templates', { params }),
        API.get('/categories'),
      ]);

      setTemplates(resT.data.data || []);
      setCategories(resC.data.data || []);
      if (resT.data.pagination) {
        setPagination({
          page: resT.data.pagination.page || page,
          totalPages: resT.data.pagination.pages || 1,
          totalItems: resT.data.pagination.total || (resT.data.data || []).length,
          limit: resT.data.pagination.limit || 10,
        });
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, statusFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [page, search, selectedCategory, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(initialForm(''));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name,
      description: t.description || '',
      categoryId: t.categoryId?._id || t.categoryId,
      type: t.type || 'image',
      accessType: t.accessType || 'free',
      price: t.price || 0,
      thumbnail: t.thumbnail,
      previewAsset: t.previewAsset,
      mainMedia: t.mainMedia,
      footers: t.footers || [],
      order: t.order !== undefined ? t.order : (t.sortOrder !== undefined ? t.sortOrder : 0),
      sortOrder: t.sortOrder !== undefined ? t.sortOrder : (t.order !== undefined ? t.order : 0),
      isPinned: t.isPinned || false,
      active: t.active !== undefined ? t.active : true,
      canvasConfig: t.canvasConfig || {
        aspectRatio: 0.5625,
        backgroundColor: '#07140B',
        layers: [],
      },
    });
    setIsModalOpen(true);
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return Boolean(url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || url.includes('/video/') || url.includes('.mp4'));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.categoryId || formData.categoryId === '') {
      toast.error('Selecting a Category is mandatory.');
      return;
    }

    if (formData.accessType === 'paid' && (!formData.price || Number(formData.price) < 1)) {
      toast.error('Unlock price must be at least ₹1 for single paid purchase templates.');
      return;
    }

    if (!formData.thumbnail || isVideoUrl(formData.thumbnail)) {
      toast.error('Card Thumbnail Image is required and must be an image file (not a video).');
      return;
    }

    if (!formData.mainMedia && !formData.previewAsset) {
      toast.error('Template Media Asset is required.');
      return;
    }

    try {
      if (editingTemplate) {
        await API.put(`/templates/${editingTemplate._id}`, formData);
      } else {
        await API.post('/templates', formData);
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
      await API.delete(`/templates/${deleteTarget._id}`);
      toast.success('Template deleted permanently');
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
      const nextState = !statusTarget.active;
      await API.put(`/templates/${statusTarget._id}`, { active: nextState });
      toast.success(nextState ? `Published "${statusTarget.name}"` : `Unpublished "${statusTarget.name}"`);
      setStatusTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publication status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const TIER_BADGE = {
    free: <span className="badge-success">Free</span>,
    premium: (
      <span className="badge-amber">
        <PushPin className="w-3 h-3" weight="fill" /> Premium
      </span>
    ),
    paid: (
      <span className="badge-amber">
        <PushPin className="w-3 h-3" weight="fill" /> Paid
      </span>
    ),
    vip: (
      <span className="badge bg-violet-100 text-violet-900 border-violet-700">
        <CrownSimple className="w-3 h-3" weight="fill" /> VIP Only
      </span>
    ),
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<Sparkle className="w-6 h-6" weight="duotone" />}
        title="Template Studio"
        subtitle={`Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} total templates)`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> New Template
          </button>
        }
      />

      {/* Toolbar with Search, Category filter, and Status filter */}
      <div className="panel p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <div className="relative">
            <FunnelSimple className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select pl-8 sm:pl-10 w-full sm:w-48 text-xs sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Eye className="w-4 h-4 text-ink-mute absolute left-3 sm:left-3.5 top-3 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select pl-8 sm:pl-10 w-full sm:w-48 text-xs sm:text-sm font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="unpublished">Unpublished / Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : templates.length === 0 ? (
          <div className="panel p-12 text-center">
            <Sparkle className="w-8 h-8 text-paper-400 mx-auto mb-2" />
            <p className="text-sm text-ink-mute font-medium">No templates found</p>
            <p className="text-xs text-ink-mute mt-1">
              {statusFilter === 'unpublished'
                ? 'No unpublished/hidden templates found.'
                : 'Adjust your search, category or status filters, or create a new template.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Template</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Access</th>
                  <th>Price</th>
                  <th>Uses / Views</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t._id} className="anim">
                    <td>
                      <span className="font-mono font-bold text-xs bg-paper-100 border border-ink/20 px-2 py-1 rounded-[2px] text-ink whitespace-nowrap">
                        #{t.order !== undefined ? t.order : (t.sortOrder !== undefined ? t.sortOrder : 0)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={t.thumbnail || t.previewAsset || t.mainMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                          alt={t.name || ''}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                          }}
                          className="w-10 aspect-[9/16] object-cover border-2 border-ink/20 shrink-0 rounded-[2px]"
                        />
                        <div>
                          <p className="font-semibold text-ink line-clamp-1">{t.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-ink-soft">{t.categoryId?.name || 'Uncategorized'}</td>
                    <td className="capitalize text-ink-soft">{t.type}</td>
                    <td>{TIER_BADGE[t.accessType] || TIER_BADGE.free}</td>
                    <td className="font-semibold text-ink">
                      {['premium', 'paid'].includes(t.accessType) ? `₹${t.price}` : '—'}
                    </td>
                    <td className="text-ink-mute">
                      <span className="font-semibold text-ink tabular-nums">{t.uses}</span> uses / {t.views} views
                    </td>
                    <td>
                      <button
                        onClick={() => setStatusTarget(t)}
                        className={`badge transition-all cursor-pointer ${t.active ? 'badge-success hover:opacity-75' : 'badge-muted hover:opacity-75'}`}
                        title="Click to toggle published status"
                      >
                        {t.active ? <Eye className="w-3 h-3" weight="fill" /> : <EyeSlash className="w-3 h-3" weight="fill" />}
                        {t.active ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {t.isPinned && <span className="badge-amber" title="Pinned"><PushPin className="w-3 h-3" weight="fill" /></span>}
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

      {/* Pagination component with page numbers */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="modal-card max-w-5xl my-auto w-full">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
              <h3 className="display font-bold text-ink flex items-center gap-2 text-sm sm:text-base">
                <Sparkle className="w-4 h-4 sm:w-5 sm:h-5 text-glow-600 shrink-0" weight="duotone" />
                {editingTemplate ? 'Edit Template' : 'Create New Status Template'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Template Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Royal Golden Status"
                  />
                </div>

                <div>
                  <label className="field-label">Category (Required *)</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="select"
                  >
                    <option value="">-- Select Category (Required) --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="field-label">Access Tier</label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                    className="select"
                  >
                    <option value="free">Free for All</option>
                    <option value="vip">VIP Subscription Only</option>
                    <option value="paid">Single Paid Purchase</option>
                  </select>
                </div>

                {formData.accessType === 'paid' && (
                  <div>
                    <label className="field-label">Unlock Price (₹ INR)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, price: cleaned === '' ? 0 : Number(cleaned) });
                      }}
                      className="input"
                      placeholder="e.g. 49"
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Template Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="select"
                  >
                    <option value="image">Photo Template</option>
                    <option value="video">Video Template</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Display Order (Lower = First)</label>
                  <input
                    type="number"
                    value={formData.order ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, order: val, sortOrder: val });
                    }}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Upload media files to S3 (or paste a URL as a fallback) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MediaUploadZone
                  label="Template Media Asset (Image / Video)"
                  value={formData.mainMedia || formData.previewAsset}
                  onChange={(url) =>
                    setFormData((prev) => {
                      const isVid = isVideoUrl(url);
                      return {
                        ...prev,
                        mainMedia: url,
                        previewAsset: url,
                        // If it's a video, don't set video URL as thumbnail; if thumbnail was a video URL, clear it.
                        thumbnail: isVid
                          ? (isVideoUrl(prev.thumbnail) ? '' : prev.thumbnail)
                          : (prev.thumbnail || url),
                        canvasConfig: {
                          ...prev.canvasConfig,
                          backgroundImage: url || prev.canvasConfig?.backgroundImage || '',
                        },
                      };
                    })
                  }
                  folder="templates"
                  accept="image/*,video/mp4,video/webm"
                />

                <MediaUploadZone
                  label="Card Thumbnail Image (Required *)"
                  value={formData.thumbnail}
                  onChange={(url) => setFormData((prev) => ({ ...prev, thumbnail: url }))}
                  folder="templates"
                  accept="image/*"
                />
              </div>

              {/* Canvas Configuration Block */}
              <div className="p-4 bg-paper-100 border-2 border-ink rounded-[2px]">
                <h4 className="font-semibold text-sm text-ink mb-3">Photo Layer Layout Configuration</h4>
                <CanvasEditor
                  value={formData.canvasConfig}
                  mainMedia={formData.mainMedia}
                  previewAsset={formData.previewAsset}
                  thumbnail={formData.thumbnail}
                  footers={formData.footers}
                  onFootersChange={(nextFooters) => setFormData((prev) => ({ ...prev, footers: nextFooters }))}
                  onChange={(config) => setFormData((prev) => ({ ...prev, canvasConfig: config }))}
                />
              </div>

              {/* Template Specific Footers */}
              <div className="p-4 bg-paper-100 border-2 border-ink rounded-[2px] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-ink">Template Footers</h4>
                    <p className="text-[11px] text-ink-mute">Upload image or video footers specific to this template (e.g. clouds, smoke, glowing waves, overlays)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        footers: [
                          ...(formData.footers || []),
                          {
                            name: `Footer ${(formData.footers || []).length + 1}`,
                            videoAsset: '',
                            thumbnail: '',
                            heightPercent: 40,
                            objectFit: 'contain',
                          },
                        ],
                      })
                    }
                    className="btn-secondary text-xs"
                  >
                    + Add Footer
                  </button>
                </div>

                {(formData.footers || []).length === 0 ? (
                  <p className="text-xs text-ink-mute italic">No footers added for this template yet.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.footers.map((footerItem, idx) => (
                      <div key={idx} className="p-3 bg-white border border-ink/20 rounded-[2px] space-y-3 relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={footerItem.name}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].name = e.target.value;
                                setFormData({ ...formData, footers: next });
                              }}
                              placeholder="Footer Name (e.g. Cloud Footer)"
                              className="input py-1 text-xs font-bold"
                            />
                            {footerItem.userNamePosition && (
                              <span className="badge bg-amber-100 text-amber-900 border-amber-300 text-[10px] whitespace-nowrap">
                                📍 Custom Name Position
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.footers.filter((_, i) => i !== idx);
                              setFormData({ ...formData, footers: next });
                            }}
                            className="text-red-600 text-xs hover:underline font-bold"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <MediaUploadZone
                            label="Footer Overlay Asset (.png / .mp4)"
                            value={footerItem.videoAsset}
                            onChange={(url) => {
                              const next = [...formData.footers];
                              next[idx].videoAsset = url;
                              setFormData({ ...formData, footers: next });
                            }}
                            folder="footers"
                            accept="image/*,video/mp4,video/webm"
                          />
                          <MediaUploadZone
                            label="Footer Thumbnail Image (App Box Selector)"
                            value={footerItem.thumbnail}
                            onChange={(url) => {
                              const next = [...formData.footers];
                              next[idx].thumbnail = url;
                              setFormData({ ...formData, footers: next });
                            }}
                            folder="footer-thumbnails"
                            accept="image/*"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="field-label text-[10px]">Height Coverage (%)</label>
                            <input
                              type="number"
                              min={10}
                              max={100}
                              value={footerItem.heightPercent || 40}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].heightPercent = Number(e.target.value);
                                setFormData({ ...formData, footers: next });
                              }}
                              className="input text-xs py-1"
                            />
                          </div>
                          <div>
                            <label className="field-label text-[10px]">Object Fit</label>
                            <select
                              value={footerItem.objectFit || 'contain'}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].objectFit = e.target.value;
                                setFormData({ ...formData, footers: next });
                              }}
                              className="select text-xs py-1"
                            >
                              <option value="contain">Contain (Leaves sides visible)</option>
                              <option value="cover">Cover (Full stretch)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Pin to Top of Category
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Published (Visible to Mobile App)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
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

      {/* Themed Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Status Template"
        message={`Are you sure you want to permanently delete template "${deleteTarget?.name || 'this item'}"?`}
        confirmText="Delete Template"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Themed Confirm Status Change Modal */}
      <ConfirmModal
        isOpen={statusTarget !== null}
        title={statusTarget?.active ? 'Unpublish Status Template' : 'Publish Status Template'}
        message={
          statusTarget?.active
            ? `Are you sure you want to unpublish "${statusTarget?.name || 'this template'}"? It will be hidden from mobile app users.`
            : `Are you sure you want to publish "${statusTarget?.name || 'this template'}"? It will immediately become visible to mobile app users.`
        }
        confirmText={statusTarget?.active ? 'Unpublish' : 'Publish Template'}
        danger={statusTarget?.active}
        loading={togglingStatus}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
}
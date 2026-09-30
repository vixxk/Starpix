import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import ModalPortal from '../components/ModalPortal';
import MediaUploadZone from '../components/MediaUploadZone';
import { GridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  FrameCorners,
  Plus,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  ArrowClockwise,
} from '@phosphor-icons/react';

const TAG_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'festival', label: 'Festival & Celebrations' },
  { value: 'morning', label: 'Good Morning' },
  { value: 'night', label: 'Good Night' },
  { value: 'devotional', label: 'Devotional & Bhakti' },
  { value: 'love', label: 'Love & Romance' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'attitude', label: 'Attitude' },
  { value: 'business', label: 'Business & Branding' },
];

export default function Footers() {
  const { toast } = useToast();
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    thumbnail: '',
    asset: '',
    contentTag: 'festival',
    sortOrder: 0,
    active: true,
  });

  const fetchFrames = async () => {
    setLoading(true);
    try {
      const res = await API.get('/frames');
      setFrames(res.data.data || []);
    } catch (err) {
      console.error('Failed to load footers:', err);
      toast.error('Failed to load footers from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  const handleOpenCreate = () => {
    setEditingFrame(null);
    setFormData({
      name: '',
      thumbnail: '',
      asset: '',
      contentTag: 'festival',
      sortOrder: frames.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (frame) => {
    setEditingFrame(frame);
    setFormData({
      name: frame.name || '',
      thumbnail: frame.thumbnail || '',
      asset: frame.asset || '',
      contentTag: frame.contentTag || 'festival',
      sortOrder: frame.sortOrder || 0,
      active: frame.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Footer name is required');
      return;
    }
    if (!formData.thumbnail && !formData.asset) {
      toast.error('Footer thumbnail image is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        thumbnail: formData.thumbnail || formData.asset,
        asset: formData.asset || formData.thumbnail,
        contentTag: formData.contentTag,
        sortOrder: Number(formData.sortOrder) || 0,
        active: formData.active,
      };

      if (editingFrame) {
        await API.put(`/frames/${editingFrame._id}`, payload);
        toast.success('Footer updated successfully');
      } else {
        await API.post('/frames', payload);
        toast.success('Footer created successfully');
      }

      setIsModalOpen(false);
      fetchFrames();
    } catch (err) {
      console.error('Failed to save footer:', err);
      toast.error(err.response?.data?.message || 'Failed to save footer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (frame) => {
    try {
      const updated = !frame.active;
      await API.put(`/frames/${frame._id}`, { active: updated });
      toast.success(updated ? 'Footer enabled' : 'Footer hidden');
      setFrames((prev) => prev.map((f) => (f._id === frame._id ? { ...f, active: updated } : f)));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/frames/${deleteTarget._id}`);
      toast.success('Footer removed permanently');
      setDeleteTarget(null);
      fetchFrames();
    } catch (err) {
      toast.error('Failed to delete footer');
    } finally {
      setDeleting(false);
    }
  };

  const filteredFrames = frames.filter((f) => {
    const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = tagFilter === 'all' || f.contentTag === tagFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      <PageHead
        icon={<FrameCorners className="w-6 h-6 text-flame-500" weight="duotone" />}
        title="Template Footers & Overlays"
        subtitle="Manage the small footer overlays, golden rings, and decorative borders that users select at the bottom of the Home screen."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFrames}
              disabled={loading}
              className="btn-secondary flex items-center gap-1.5"
            >
              <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary flex items-center gap-1.5 bg-flame-500 text-ink border-2 border-ink"
            >
              <Plus className="w-4 h-4" weight="bold" />
              New Footer
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="panel p-3 border-2 border-ink bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full relative">
          <MagnifyingGlass className="w-4 h-4 text-ink-mute absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search footers by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input-field text-xs font-semibold"
          >
            <option value="all">All Tags / Occasions</option>
            {TAG_OPTIONS.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Footers */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : filteredFrames.length === 0 ? (
        <div className="panel p-12 text-center border-2 border-ink bg-white">
          <FrameCorners className="w-10 h-10 text-paper-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-ink">No Footers Found</p>
          <p className="text-xs text-ink-mute mt-1">Click "New Footer" to add decorative footers for mobile users.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFrames.map((frame) => (
            <div
              key={frame._id}
              className="panel p-3 border-2 border-ink bg-white flex flex-col justify-between hover:shadow-hard transition-all group"
            >
              <div>
                {/* Thumbnail Preview with Dark Background */}
                <div className="w-full aspect-square bg-ink rounded-[2px] mb-2.5 overflow-hidden flex items-center justify-center p-2 relative">
                  {frame.thumbnail ? (
                    <img
                      src={frame.thumbnail}
                      alt={frame.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FrameCorners className="w-8 h-8 text-paper-400" />
                  )}

                  {!frame.active && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[1px] uppercase">
                      Hidden
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-ink truncate mb-1" title={frame.name}>
                  {frame.name}
                </h4>

                <span className="inline-block text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-paper-100 text-ink-mute rounded-[1px]">
                  {frame.contentTag}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-paper-200">
                <button
                  type="button"
                  onClick={() => handleToggleActive(frame)}
                  className="text-xs text-ink-mute hover:text-ink"
                  title={frame.active ? 'Hide Footer' : 'Show Footer'}
                >
                  {frame.active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeSlash className="w-4 h-4 text-gray-400" />}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(frame)}
                    className="p-1 text-ink-mute hover:text-ink"
                    title="Edit Footer"
                  >
                    <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(frame)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete Footer"
                  >
                    <Trash className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Footer */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
            <div className="panel p-5 border-2 border-ink bg-white max-w-md w-full shadow-hard-lg space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                <h3 className="font-bold text-sm text-ink uppercase tracking-wide">
                  {editingFrame ? 'Edit Footer Overlay' : 'Create New Footer'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-ink-mute hover:text-ink"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                    Footer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Durga Puja Golden Mandala"
                    className="input-field text-xs font-bold w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                      Content Tag / Theme
                    </label>
                    <select
                      value={formData.contentTag}
                      onChange={(e) => setFormData({ ...formData, contentTag: e.target.value })}
                      className="input-field text-xs font-semibold w-full"
                    >
                      {TAG_OPTIONS.map((tag) => (
                        <option key={tag.value} value={tag.value}>
                          {tag.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                      className="input-field text-xs font-bold w-full"
                    />
                  </div>
                </div>

                {/* Upload Thumbnail / Asset */}
                <div>
                  <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                    Footer Image / Asset URL
                  </label>
                  <input
                    type="text"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value, asset: e.target.value })}
                    placeholder="https://..."
                    className="input-field text-xs w-full mb-1.5"
                  />
                  <MediaUploadZone
                    folder="frames"
                    accept="image"
                    currentUrl={formData.thumbnail}
                    onUploadComplete={(url) => setFormData({ ...formData, thumbnail: url, asset: url })}
                    label="Upload Footer PNG/Asset"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="frameActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="accent-flame-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="frameActive" className="text-xs font-bold text-ink cursor-pointer">
                    Visible to mobile users
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs bg-flame-500 text-ink border-2 border-ink flex items-center gap-1.5"
                  >
                    <FloppyDisk className="w-4 h-4" weight="bold" />
                    {saving ? 'Saving...' : 'Save Footer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Footer Overlay"
        message={`Are you sure you want to permanently delete footer "${deleteTarget?.name || ''}"?`}
        confirmText="Delete Footer"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

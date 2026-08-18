import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import ModalPortal from '../components/ModalPortal';
import MediaUploadZone from '../components/MediaUploadZone';
import { GridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  Sliders,
  Plus,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  FilmStrip,
  Sparkle,
} from '@phosphor-icons/react';

export default function Filters() {
  const { toast } = useToast();
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'video',
    asset: '',
    thumbnail: '',
    duration: 5,
    loop: true,
    intensity: 1,
    configuration: {
      blendMode: 'screen',
      position: 'bottom',
      heightPercent: 40,
      objectFit: 'contain',
    },
    active: true,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const res = await API.get('/effects');
      setFilters(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load video filters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleOpenCreate = () => {
    setEditingFilter(null);
    setFormData({
      name: '',
      type: 'video',
      asset: '',
      thumbnail: '',
      duration: 5,
      loop: true,
      intensity: 1,
      configuration: {
        blendMode: 'screen',
        position: 'bottom',
        heightPercent: 40,
        objectFit: 'contain',
      },
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (filterItem) => {
    setEditingFilter(filterItem);
    setFormData({
      name: filterItem.name,
      type: filterItem.type || 'video',
      asset: filterItem.asset || '',
      thumbnail: filterItem.thumbnail || '',
      duration: filterItem.duration || 5,
      loop: filterItem.loop !== undefined ? filterItem.loop : true,
      intensity: filterItem.intensity || 1,
      configuration: {
        blendMode: filterItem.configuration?.blendMode || 'screen',
        position: filterItem.configuration?.position || 'bottom',
        heightPercent: filterItem.configuration?.heightPercent || 40,
        objectFit: filterItem.configuration?.objectFit || 'contain',
      },
      active: filterItem.active !== undefined ? filterItem.active : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.asset) {
      toast.error('Filter name and video asset are required');
      return;
    }
    // If thumbnail isn't provided, use asset as thumbnail fallback
    const payload = {
      ...formData,
      thumbnail: formData.thumbnail || formData.asset,
    };

    try {
      if (editingFilter) {
        await API.put(`/effects/${editingFilter._id}`, payload);
        toast.success('Video filter updated successfully');
      } else {
        await API.post('/effects', payload);
        toast.success('New video filter uploaded');
      }
      setIsModalOpen(false);
      fetchFilters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving video filter');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/effects/${deleteTarget._id}`);
      toast.success('Video filter deleted');
      setDeleteTarget(null);
      fetchFilters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting filter');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<Sliders className="w-6 h-6" weight="duotone" />}
        title="Video Filters & Footers"
        subtitle={`${filters.length} animated video footers & filters for templates`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> Upload Video Filter
          </button>
        }
      />

      {loading ? (
        <GridSkeleton count={6} />
      ) : filters.length === 0 ? (
        <div className="panel p-12 text-center">
          <FilmStrip className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No video filters uploaded yet</p>
          <p className="text-xs text-ink-soft mt-1">Upload video footers (such as clouds, smoke, glowing waves) for user status templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {filters.map((filterItem) => (
            <div key={filterItem._id} className="panel panel-hover p-4 flex flex-col justify-between anim">
              <div>
                <div className="relative aspect-video bg-ink rounded-[2px] overflow-hidden mb-3 border border-ink/20">
                  {filterItem.asset && (filterItem.asset.endsWith('.mp4') || filterItem.asset.endsWith('.webm') || filterItem.asset.includes('/video/')) ? (
                    <video
                      src={filterItem.asset}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={filterItem.thumbnail || filterItem.asset}
                      alt={filterItem.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 badge badge-amber font-mono text-[9px]">
                    <Sparkle className="w-3 h-3" weight="fill" />
                    {filterItem.configuration?.position || 'bottom'} footer
                  </span>
                </div>

                <h4 className="display font-bold text-ink text-base truncate">{filterItem.name}</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="badge badge-muted text-[10px]">
                    Blend: {filterItem.configuration?.blendMode || 'screen'}
                  </span>
                  <span className="badge badge-muted text-[10px]">
                    Height: {filterItem.configuration?.heightPercent || 40}%
                  </span>
                  <span className="badge badge-muted text-[10px]">
                    Fit: {filterItem.configuration?.objectFit || 'contain'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-paper-200 flex items-center justify-between">
                <span className={`text-[11px] font-bold ${filterItem.active ? 'text-emerald-600' : 'text-ink-mute'}`}>
                  {filterItem.active ? '● Active' : '○ Inactive'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(filterItem)}
                    className="p-2 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors"
                  >
                    <PencilSimple className="w-4 h-4" weight="duotone" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(filterItem)}
                    className="p-2 text-ink-mute hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors"
                  >
                    <Trash className="w-4 h-4" weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating / Editing Video Filter */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="modal-card max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
              <h3 className="display font-bold text-ink">
                {editingFilter ? 'Edit Video Filter' : 'Upload New Video Filter'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="field-label">Filter / Footer Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Clouds Footer, Smoke Overlay, Sparkle Waves"
                />
              </div>

              <MediaUploadZone
                label="Video Asset (.mp4 / .webm)"
                value={formData.asset}
                onChange={(url) => setFormData({ ...formData, asset: url })}
                folder="effects"
                accept="video/*"
              />

              <MediaUploadZone
                label="Thumbnail Preview Image (Optional)"
                value={formData.thumbnail}
                onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                folder="effects"
                accept="image/*"
              />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="field-label">Placement Position</label>
                  <select
                    value={formData.configuration.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, position: e.target.value },
                      })
                    }
                    className="select"
                  >
                    <option value="bottom">Bottom Footer (Default)</option>
                    <option value="top">Top Header</option>
                    <option value="full">Full Canvas Overlay</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Height Coverage (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={formData.configuration.heightPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, heightPercent: Number(e.target.value) },
                      })
                    }
                    className="input"
                  />
                  <p className="text-[10px] text-ink-mute mt-1">Bottom height % covered by cloud/footer</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Blend Mode</label>
                  <select
                    value={formData.configuration.blendMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, blendMode: e.target.value },
                      })
                    }
                    className="select"
                  >
                    <option value="screen">Screen (Transparency for clouds/smoke)</option>
                    <option value="normal">Normal</option>
                    <option value="overlay">Overlay</option>
                    <option value="lighten">Lighten</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Object Fit</label>
                  <select
                    value={formData.configuration.objectFit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, objectFit: e.target.value },
                      })
                    }
                    className="select"
                  >
                    <option value="contain">Contain (Leaves cloud ends visible)</option>
                    <option value="cover">Cover (Full width stretch)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Active & Available in App
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FloppyDisk className="w-4 h-4" weight="fill" /> Save Filter
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Video Filter"
        message={`Are you sure you want to delete filter "${deleteTarget?.name || 'this item'}"?`}
        confirmText="Delete Filter"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

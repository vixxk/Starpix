import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import MediaUploadZone from '../components/MediaUploadZone';
import { GridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  MegaphoneSimple,
  Plus,
  Trash,
  PencilSimple,
  X,
  FloppyDisk,
  DeviceMobile,
  ArrowRight,
} from '@phosphor-icons/react';

export default function Campaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    heroBackground: '',
    heroImage: '',
    ctaText: 'Explore Campaign',
    ctaDestination: 'festival',
    showOnAppOpening: false,
    priority: 1,
    active: true,
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await API.get('/campaigns');
      setCampaigns(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      heroBackground: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
      ctaText: 'Explore Campaign',
      ctaDestination: 'festival',
      showOnAppOpening: true,
      priority: 10,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCampaign(c);
    setFormData({
      name: c.name || '',
      description: c.description || '',
      heroBackground: c.heroBackground || '',
      heroImage: c.heroImage || '',
      ctaText: c.ctaText || 'Explore Campaign',
      ctaDestination: c.ctaDestination || 'festival',
      showOnAppOpening: c.showOnAppOpening || false,
      priority: c.priority || 1,
      active: c.active !== undefined ? c.active : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await API.put(`/campaigns/${editingCampaign._id}`, formData);
      } else {
        await API.post('/campaigns', formData);
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving campaign');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/campaigns/${deleteTarget._id}`);
      toast.success('Campaign deleted successfully');
      setDeleteTarget(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting campaign');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<MegaphoneSimple className="w-6 h-6" weight="duotone" />}
        title="Campaigns"
        subtitle="Opening experience & seasonal drives"
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> New Campaign
          </button>
        }
      />

      {loading ? (
        <GridSkeleton count={4} />
      ) : campaigns.length === 0 ? (
        <div className="panel p-12 text-center">
          <MegaphoneSimple className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No campaigns launched</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => (
            <div key={c._id} className="panel overflow-hidden panel-hover anim">
              <div className="h-44 relative bg-night-950">
                <img
                  src={c.heroBackground || c.heroImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'}
                  alt={c.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80';
                  }}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {c.showOnAppOpening && (
                    <span className="badge !bg-ink !text-paper-50 !border-paper-50/50">
                      <DeviceMobile className="w-3 h-3" weight="fill" /> App Opening
                    </span>
                  )}
                  <span className="badge-dark">
                    Priority · #{c.priority}
                  </span>
                </div>
                <div className="absolute bottom-3.5 left-4 right-4">
                  <h4 className="display text-lg font-bold text-white">{c.name}</h4>
                  <p className="text-xs text-glow-300 font-medium mt-0.5 flex items-center gap-1.5">
                    {c.ctaText} <ArrowRight className="w-3 h-3" weight="bold" />
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-3 border-t border-paper-200">
                <p className="text-xs text-ink-soft line-clamp-1 flex-1 min-w-0">{c.description || 'No description provided.'}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleOpenEdit(c)} className="p-2 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors">
                    <PencilSimple className="w-4 h-4" weight="duotone" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-2 text-ink-mute hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors">
                    <Trash className="w-4 h-4" weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
          <div className="modal-card max-w-md">
            <div className="px-6 py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
              <h3 className="display font-bold text-ink">
                {editingCampaign ? 'Edit Campaign' : 'Launch Campaign'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="field-label">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Diwali Campaign 2026"
                />
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea"
                />
              </div>

              <MediaUploadZone
                label="Hero Image / Background Image"
                value={formData.heroBackground}
                onChange={(url) => setFormData({ ...formData, heroBackground: url, heroImage: url })}
                folder="campaigns"
                accept="image/*"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">CTA Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="field-label">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                    className="input"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-paper-100 border-2 border-ink rounded-[2px]">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink-soft font-medium">
                  <input
                    type="checkbox"
                    checked={formData.showOnAppOpening}
                    onChange={(e) => setFormData({ ...formData, showOnAppOpening: e.target.checked })}
                    className="w-4 h-4 rounded accent-glow-500"
                  />
                  <span className="flex items-center gap-1.5"><DeviceMobile className="w-4 h-4" weight="duotone" /> Show on app launch</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FloppyDisk className="w-4 h-4" weight="fill" /> Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Themed Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${deleteTarget?.name || 'this item'}"?`}
        confirmText="Delete Campaign"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
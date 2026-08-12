import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
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
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

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
      alert(err.response?.data?.message || 'Error saving campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await API.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert('Error deleting campaign');
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
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-night-400">Loading campaigns…</p>
        </div>
      ) :campaigns.length === 0 ? (
        <div className="panel p-12 text-center">
          <MegaphoneSimple className="w-8 h-8 text-night-500 mx-auto mb-2" />
          <p className="text-sm text-night-300 font-medium">No campaigns launched</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => (
            <div key={c._id} className="panel overflow-hidden panel-hover anim">
              <div className="h-44 relative bg-night-950">
                <img src={c.heroBackground || c.heroImage} alt={c.name} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {c.showOnAppOpening && (
                    <span className="badge-amber backdrop-blur-sm !bg-amber-950/40">
                      <DeviceMobile className="w-3 h-3" weight="fill" /> App Opening
                    </span>
                  )}
                  <span className="badge-success backdrop-blur-sm !bg-night-950/40">
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

              <div className="p-4 flex items-center justify-between gap-3 border-t border-night-600/50">
                <p className="text-xs text-night-300 line-clamp-1 flex-1 min-w-0">{c.description || 'No description provided.'}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleOpenEdit(c)} className="p-2 text-night-300 hover:text-glow-300 hover:bg-glow-500/10 rounded-lg transition-colors">
                    <PencilSimple className="w-4 h-4" weight="duotone" />
                  </button>
                  <button onClick={() => handleDelete(c._id)} className="p-2 text-night-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash className="w-4 h-4" weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-night-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="modal-card max-w-md">
            <div className="px-6 py-4 border-b border-night-600 flex items-center justify-between bg-night-850/40">
              <h3 className="display font-bold text-white">
                {editingCampaign ? 'Edit Campaign' : 'Launch Campaign'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg">
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

              <div>
                <label className="field-label">Hero Image / Background URL</label>
                <input
                  type="text"
                  required
                  value={formData.heroBackground}
                  onChange={(e) => setFormData({ ...formData, heroBackground: e.target.value })}
                  className="input"
                />
              </div>

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

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-amber-200 font-medium">
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
    </div>
  );
}
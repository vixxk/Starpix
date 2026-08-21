import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import ModalPortal from '../components/ModalPortal';
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
  MagnifyingGlass,
  CheckCircle,
  Layout,
  Star,
  Image as ImageIcon,
} from '@phosphor-icons/react';

export default function Campaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    heroBackground: '',
    featuredTemplates: [],
    active: true,
    showOnAppOpening: false,
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

  const fetchAvailableTemplates = async () => {
    try {
      const res = await API.get('/templates', { params: { limit: 100 } });
      setAvailableTemplates(res.data.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchAvailableTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setTemplateSearch('');
    setFormData({
      name: '',
      description: '',
      heroBackground: '',
      featuredTemplates: [],
      active: true,
      showOnAppOpening: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCampaign(c);
    setTemplateSearch('');
    setFormData({
      name: c.name || '',
      description: c.description || '',
      heroBackground: c.heroBackground || c.heroImage || '',
      featuredTemplates: (c.featuredTemplates || []).map((t) => (typeof t === 'object' ? t._id : t)),
      active: c.active !== undefined ? c.active : true,
      showOnAppOpening: Boolean(c.showOnAppOpening),
    });
    setIsModalOpen(true);
  };

  const toggleTemplateSelection = (templateId) => {
    setFormData((prev) => {
      const current = prev.featuredTemplates || [];
      const exists = current.includes(templateId);
      const nextTemplates = exists
        ? current.filter((id) => id !== templateId)
        : [...current, templateId];
      return { ...prev, featuredTemplates: nextTemplates };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    try {
      if (editingCampaign) {
        await API.put(`/campaigns/${editingCampaign._id}`, formData);
        toast.success('Campaign updated');
      } else {
        await API.post('/campaigns', formData);
        toast.success('Campaign created');
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving campaign');
    }
  };

  const handleToggleAutoOpen = async (c) => {
    try {
      await API.put(`/campaigns/${c._id}`, { ...c, active: true, showOnAppOpening: true });
      toast.success(`"${c.name}" set as single auto-opening campaign on app launch`);
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to update campaign');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await API.put(`/campaigns/${c._id}`, { ...c, active: !c.active });
      toast.success(`"${c.name}" status updated`);
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to update campaign status');
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

  const filteredTemplates = availableTemplates.filter((t) =>
    (t.name || '').toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <PageHead
        icon={<MegaphoneSimple className="w-6 h-6" weight="duotone" />}
        title="Campaigns"
        subtitle="App launch experiences & featured template collections"
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
          <p className="text-sm text-ink-mute font-medium">No campaigns created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          {campaigns.map((c) => {
            const templates = c.featuredTemplates || [];
            const coverImage = c.heroBackground || c.heroImage;
            return (
              <div key={c._id} className="panel p-3 sm:p-5 space-y-2.5 sm:space-y-4 panel-hover anim flex flex-col justify-between overflow-hidden">
                <div className="space-y-2 sm:space-y-3">
                  {/* Cover Background Preview Banner */}
                  {coverImage ? (
                    <div className="relative h-28 sm:h-36 rounded overflow-hidden border border-paper-300 bg-night-900">
                      <img src={coverImage} alt={c.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 flex flex-col justify-end">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate">{c.name}</h4>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      {!coverImage && <h4 className="display text-sm sm:text-lg font-bold text-ink truncate">{c.name}</h4>}
                      {c.description ? (
                        <p className="text-xs text-ink-mute line-clamp-1 mt-0.5">{c.description}</p>
                      ) : null}
                      <p className="text-[10px] sm:text-xs text-ink-soft flex items-center gap-1 sm:gap-1.5 mt-0.5">
                        <Layout className="w-3 h-3 sm:w-4 sm:h-4 text-flame-500 shrink-0" weight="duotone" />
                        <span>{templates.length} {templates.length === 1 ? 'Template' : 'Templates'} Attached</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.active ? (
                        <span className="badge !bg-emerald-600 !text-white !border-emerald-500 text-[9px] sm:text-xs px-1.5 py-0.5">
                          Active
                        </span>
                      ) : (
                        <span className="badge !bg-night-800 !text-night-300 !border-night-700 text-[9px] sm:text-xs px-1.5 py-0.5">
                          Inactive
                        </span>
                      )}

                      {c.showOnAppOpening && (
                        <span className="badge !bg-flame-600 !text-white !border-flame-500 text-[9px] sm:text-xs px-1.5 py-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3" weight="fill" /> Auto-Opens
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Template previews list */}
                  {templates.length > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-0.5 sm:pt-1 pb-1 sm:pb-2">
                      {templates.map((t, idx) => {
                        const preview = typeof t === 'object' ? t.previewUrl : null;
                        const title = typeof t === 'object' ? t.name : 'Template';
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-paper-100 border border-paper-300 rounded p-1 sm:p-1.5 shrink-0 max-w-[130px] sm:max-w-[160px]"
                          >
                            {preview ? (
                              <img src={preview} alt="" className="w-5 h-5 sm:w-7 sm:h-7 rounded object-cover border border-paper-300 shrink-0" />
                            ) : (
                              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded bg-night-800 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shrink-0">
                                #{idx + 1}
                              </div>
                            )}
                            <span className="text-[10px] sm:text-xs font-semibold text-ink line-clamp-1">{title}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-ink-mute italic">No templates attached to this campaign.</p>
                  )}
                </div>

                <div className="pt-2 sm:pt-3 border-t border-paper-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${
                        c.active
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>

                    {!c.showOnAppOpening && (
                      <button
                        onClick={() => handleToggleAutoOpen(c)}
                        className="px-2 py-1 text-[10px] sm:text-xs font-bold text-flame-600 bg-flame-500/10 border border-flame-500/30 hover:bg-flame-500/20 rounded transition-colors flex items-center gap-1"
                        title="Set as single auto-open campaign on launch"
                      >
                        <Star className="w-3 h-3" weight="fill" /> Set Auto-Open
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 sm:p-2 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors"
                      title="Edit Campaign"
                    >
                      <PencilSimple className="w-3.5 h-3.5 sm:w-4 sm:h-4" weight="duotone" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1 sm:p-2 text-ink-mute hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash className="w-3.5 h-3.5 sm:w-4 sm:h-4" weight="duotone" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Campaign */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="modal-card max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50 shrink-0">
              <h3 className="display font-bold text-ink">
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
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
                <label className="field-label">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Diwali Special 2026"
                />
              </div>

              <div>
                <label className="field-label">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="e.g. Celebrate Diwali with custom festival templates!"
                />
              </div>

              {/* Cover Image Upload */}
              <MediaUploadZone
                label="Campaign Cover Background Image"
                value={formData.heroBackground}
                onChange={(url) => setFormData({ ...formData, heroBackground: url })}
                folder="campaigns"
                accept="image/*"
              />

              {/* Template Multi-Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="field-label !mb-0">Attach Templates</label>
                  <span className="text-xs font-bold text-flame-600">
                    {formData.featuredTemplates?.length || 0} Selected
                  </span>
                </div>

                <div className="relative">
                  <MagnifyingGlass className="w-4 h-4 absolute left-3 top-3 text-ink-mute" />
                  <input
                    type="text"
                    placeholder="Search available templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="input !pl-9 text-xs"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border-2 border-paper-200 rounded-[2px] p-2 space-y-1.5 bg-paper-50">
                  {filteredTemplates.length === 0 ? (
                    <p className="text-xs text-ink-mute p-3 text-center">No templates match your search</p>
                  ) : (
                    filteredTemplates.map((t) => {
                      const isSelected = formData.featuredTemplates?.includes(t._id);
                      return (
                        <div
                          key={t._id}
                          onClick={() => toggleTemplateSelection(t._id)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors border ${
                            isSelected
                              ? 'bg-flame-500/10 border-flame-500/40 text-flame-700'
                              : 'bg-white border-paper-200 hover:bg-paper-100 text-ink'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-glow-500"
                          />
                          {t.previewUrl ? (
                            <img
                              src={t.previewUrl}
                              alt=""
                              className="w-10 h-10 rounded object-cover border border-paper-300 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-night-900 shrink-0 flex items-center justify-center text-xs text-paper-200">
                              📷
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{t.name}</p>
                            <p className="text-[10px] text-ink-mute truncate">
                              Category: {t.categoryId?.name || t.category || 'General'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-paper-100 border border-paper-300 rounded-[2px]">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded accent-glow-500 shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-ink text-xs leading-tight">Active Campaign</span>
                      <span className="text-[10px] text-ink-mute mt-0.5 leading-tight">Available in home feed</span>
                    </div>
                  </label>
                </div>

                <div className="p-3 bg-flame-500/10 border border-flame-500/30 rounded-[2px]">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.showOnAppOpening}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showOnAppOpening: e.target.checked,
                          active: e.target.checked ? true : formData.active,
                        })
                      }
                      className="w-4 h-4 rounded accent-glow-500 shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-flame-700 text-xs leading-tight">Auto-Open on Launch</span>
                      <span className="text-[10px] text-flame-600 mt-0.5 leading-tight">(Only 1 active at a time)</span>
                    </div>
                  </label>
                </div>
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
        </ModalPortal>
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
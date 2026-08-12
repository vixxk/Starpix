import React, { useEffect, useState } from 'react';
import API from '../services/api';
import CanvasEditor from '../components/CanvasEditor';
import PageHead from '../components/PageHead';
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
} from '@phosphor-icons/react';

const initialForm = (firstCategoryId) => ({
  name: '',
  description: '',
  categoryId: firstCategoryId || '',
  type: 'image',
  accessType: 'free',
  price: 0,
  thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
  previewAsset: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
  mainMedia: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
  isPinned: false,
  active: true,
  canvasConfig: {
    aspectRatio: 0.5625,
    backgroundColor: '#07140B',
    backgroundImage: '',
    layers: [
      { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.65, height: 0.42, zIndex: 1 },
      { id: 'l2', type: 'text', x: 0.5, y: 0.8, width: 0.8, height: 0.1, defaultValue: 'Your Name', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 2 },
    ],
  },
});

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState(initialForm());

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;

      const [resT, resC] = await Promise.all([
        API.get('/templates', { params }),
        API.get('/categories'),
      ]);

      setTemplates(resT.data.data);
      setCategories(resC.data.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [search, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData(initialForm(categories[0]?._id));
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await API.put(`/templates/${editingTemplate._id}`, formData);
      } else {
        await API.post('/templates', formData);
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template permanently?')) return;
    try {
      await API.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting template');
    }
  };

  const toggleActiveStatus = async (t) => {
    try {
      await API.put(`/templates/${t._id}`, { active: !t.active });
      fetchTemplates();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<Sparkle className="w-6 h-6" weight="duotone" />}
        title="Template Studio"
        subtitle={`${templates.length} templates in rotation`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> New Template
          </button>
        }
      />

      {/* Toolbar */}
      <div className="panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlass className="w-4 h-4 text-night-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <FunnelSimple className="w-4 h-4 text-night-400 absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select pl-10 sm:w-56"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-night-400">Loading templates…</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkle className="w-8 h-8 text-night-500 mx-auto mb-2" />
            <p className="text-sm text-night-300 font-medium">No templates found</p>
            <p className="text-xs text-night-400 mt-1">Adjust your filters or create a new one.</p>
          </div>
        ) : (
          <div className="table-scroll anim">
            <table className="data-table">
              <thead>
                <tr>
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
                      <div className="flex items-center gap-3">
                        <img src={t.thumbnail} alt="" className="w-12 h-14 rounded-lg object-cover border border-night-600" />
                        <div>
                          <p className="font-semibold text-white line-clamp-1">{t.name}</p>
                          <p className="text-[11px] text-night-400 line-clamp-1 max-w-[180px]">{t.description || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-night-200">{t.categoryId?.name || 'Uncategorized'}</td>
                    <td className="capitalize text-night-200">{t.type}</td>
                    <td>
                      {t.accessType === 'premium' ? (
                        <span className="badge-amber">
                          <PushPin className="w-3 h-3" weight="fill" /> Premium
                        </span>
                      ) : (
                        <span className="badge-success">Free</span>
                      )}
                    </td>
                    <td className="font-semibold text-white">{t.accessType === 'premium' ? `₹${t.price}` : '—'}</td>
                    <td className="text-night-300">
                      <span className="font-semibold text-white">{t.uses}</span> uses / {t.views} views
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActiveStatus(t)}
                        className={`badge transition-all ${t.active ? 'badge-success hover:opacity-70' : 'badge-muted hover:opacity-70'}`}
                      >
                        {t.active ? <Eye className="w-3 h-3" weight="fill" /> : <EyeSlash className="w-3 h-3" weight="fill" />}
                        {t.active ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {t.isPinned && <span className="badge-amber" title="Pinned"><PushPin className="w-3 h-3" weight="fill" /></span>}
                        <button onClick={() => handleOpenEdit(t)} className="p-2 text-night-300 hover:text-glow-300 hover:bg-glow-500/10 rounded-lg transition-colors">
                          <PencilSimple className="w-4 h-4" weight="duotone" />
                        </button>
                        <button onClick={() => handleDelete(t._id)} className="p-2 text-night-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-night-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-card max-w-5xl border-glow-500/20">
            <div className="px-6 py-4 border-b border-night-600 flex items-center justify-between bg-night-850/40">
              <h3 className="display font-bold text-white flex items-center gap-2.5">
                <Sparkle className="w-5 h-5 text-glow-400" weight="duotone" />
                {editingTemplate ? 'Edit Template' : 'Create New Status Template'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Template Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Golden Hour Frame"
                  />
                </div>

                <div>
                  <label className="field-label">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="select"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Access Type</label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                    className="select"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {formData.accessType === 'premium' && (
                  <div>
                    <label className="field-label">Price (₹)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) })}
                      className="input"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="field-label">Thumbnail Media URL</label>
                  <input
                    type="text"
                    required
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="field-label">Main Media URL</label>
                  <input
                    type="text"
                    required
                    value={formData.mainMedia}
                    onChange={(e) => setFormData({ ...formData, mainMedia: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <h4 className="label mb-3">Visual Layer Layout Configuration</h4>
                <CanvasEditor
                  canvasConfig={formData.canvasConfig}
                  onChange={(config) => setFormData({ ...formData, canvasConfig: config })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
      )}
    </div>
  );
}
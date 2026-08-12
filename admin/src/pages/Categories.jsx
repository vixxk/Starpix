import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import {
  FolderSimple,
  Plus,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  Star,
  HashStraight,
} from '@phosphor-icons/react';

// Preset emoji set for category icons — matches the categories used across the app
const CATEGORY_ICONS = [
  '✨', '🔥', '❤️', '💖', '🕉️', '🙏', '🎂', '🎁',
  '💬', '🎉', '🎊', '🎄', '🪔', '😂', '⭐', '🌟',
  '🌅', '☀️', '🌙', '🌈', '😎', '😍', '💪', '🚀',
  '🌸', '🌺', '🌹', '🍀', '👑', '💎', '🏆', '⚡',
];

// Strip the FE0F variation selector so '❤' matches the '❤️' preset when comparing
const normalizeEmoji = (s) => (s || '').replace(/\uFE0F/g, '');

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '✨',
    thumbnail: '',
    description: '',
    sortOrder: 0,
    featured: false,
    active: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '✨',
      thumbnail: '',
      description: '',
      sortOrder: categories.length + 1,
      featured: false,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      icon: c.icon || '✨',
      thumbnail: c.thumbnail || '',
      description: c.description || '',
      sortOrder: c.sortOrder || 0,
      featured: c.featured || false,
      active: c.active !== undefined ? c.active : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await API.put(`/categories/${editingCategory._id}`, formData);
      } else {
        await API.post('/categories', formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting category');
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<FolderSimple className="w-6 h-6" weight="duotone" />}
        title="Categories"
        subtitle={`${categories.length} content groupings`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> Add Category
          </button>
        }
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-night-400">Loading categories…</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="panel p-12 text-center">
          <FolderSimple className="w-8 h-8 text-night-500 mx-auto mb-2" />
          <p className="text-sm text-night-300 font-medium">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((c) => (
            <div key={c._id} className="panel panel-hover p-5 flex flex-col justify-between anim">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-12 h-12 rounded-2xl bg-night-700/70 border border-night-600 flex items-center justify-center text-2xl">
                    {c.icon}
                  </span>
                  <span className={`badge ${c.featured ? 'badge-amber' : 'badge-muted'}`}>
                    {c.featured ? <Star className="w-3 h-3" weight="fill" /> : null}
                    {c.featured ? 'Featured' : 'Standard'}
                  </span>
                </div>
                <h4 className="display font-bold text-white text-base">{c.name}</h4>
                <p className="text-[11px] text-night-400 font-mono mt-0.5 flex items-center gap-1">
                  <HashStraight className="w-3 h-3" /> {c.slug}
                </p>
                <p className="text-xs text-night-300 mt-2.5 line-clamp-2 min-h-[2rem]">{c.description || 'No description'}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-night-600/50 flex items-center justify-between">
                <span className="text-[11px] font-medium text-night-400">Order · #{c.sortOrder}</span>
                <div className="flex items-center gap-1.5">
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
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="field-label">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Motivation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Icon Emoji</label>
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-night-700/70 border border-night-600 flex items-center justify-center text-xl">
                      {formData.icon || '✨'}
                    </span>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input text-center"
                      placeholder="🔥"
                      maxLength={8}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Preset Icons</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {CATEGORY_ICONS.map((emoji) => {
                    const selected = normalizeEmoji(formData.icon) === normalizeEmoji(emoji);
                    return (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          selected
                            ? 'bg-glow-500/15 border border-glow-500/70 ring-2 ring-glow-500/30'
                            : 'bg-night-700/50 border border-night-600 hover:bg-night-600/60 hover:border-night-500'
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
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

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-night-200 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-glow-500"
                  />
                  Featured pill
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-night-200 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-glow-500"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-night-600/60">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FloppyDisk className="w-4 h-4" weight="fill" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
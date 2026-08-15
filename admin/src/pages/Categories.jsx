import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import ConfirmModal from '../components/ConfirmModal';
import MediaUploadZone from '../components/MediaUploadZone';
import { GridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
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
  const { toast } = useToast();
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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.error(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/categories/${deleteTarget._id}`);
      toast.success('Category deleted successfully');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category');
    } finally {
      setDeleting(false);
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
        <GridSkeleton count={8} />
      ) : categories.length === 0 ? (
        <div className="panel p-12 text-center">
          <FolderSimple className="w-8 h-8 text-paper-400 mx-auto mb-2" />
          <p className="text-sm text-ink-mute font-medium">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((c) => (
            <div key={c._id} className="panel panel-hover p-5 flex flex-col justify-between anim">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-12 h-12 bg-paper-100 border-2 border-ink flex items-center justify-center text-2xl">
                    {c.icon}
                  </span>
                  <span className={`badge ${c.featured ? 'badge-amber' : 'badge-muted'}`}>
                    {c.featured ? <Star className="w-3 h-3" weight="fill" /> : null}
                    {c.featured ? 'Featured' : 'Standard'}
                  </span>
                </div>
                <h4 className="display font-bold text-ink text-base">{c.name}</h4>
                <p className="text-[11px] text-ink-mute font-mono mt-0.5 flex items-center gap-1">
                  <HashStraight className="w-3 h-3" /> {c.slug}
                </p>
                <p className="text-xs text-ink-soft mt-2.5 line-clamp-2 min-h-[2rem]">{c.description || 'No description'}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-paper-200 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-mute">Order · #{c.sortOrder}</span>
                <div className="flex items-center gap-1.5">
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
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]">
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
                    <span className="w-10 h-10 shrink-0 bg-paper-100 border-2 border-ink flex items-center justify-center text-xl">
                      {formData.icon || '✨'}
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Display Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Quick Preset Icon</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-paper-100 border-2 border-ink rounded-[2px] max-h-28 overflow-y-auto">
                  {CATEGORY_ICONS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`w-7 h-7 flex items-center justify-center text-base rounded-[2px] transition-transform active:scale-95 ${
                        normalizeEmoji(formData.icon) === normalizeEmoji(emoji)
                          ? 'bg-flame-500 border border-ink text-white'
                          : 'hover:bg-paper-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea"
                  placeholder="Brief summary of this content grouping..."
                />
              </div>

              <MediaUploadZone
                label="Category Header / Cover Image"
                value={formData.thumbnail}
                onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                folder="categories"
                accept="image/*"
              />

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Featured Section
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
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

      {/* Themed Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteTarget?.name || 'this item'}"?`}
        confirmText="Delete Category"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
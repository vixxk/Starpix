import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import {
  FrameCorners,
  Plus,
  Trash,
  PencilSimple,
  X,
  FloppyDisk,
  TagSimple,
  Target,
} from '@phosphor-icons/react';

export default function Frames() {
  const [frames, setFrames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    thumbnail: '',
    asset: '',
    category: '',
    contentTag: 'general',
    placement: { x: 0.5, y: 0.5, width: 1.0, height: 1.0, zIndex: 10 },
    sortOrder: 0,
    active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resF, resC] = await Promise.all([API.get('/frames'), API.get('/categories')]);
      setFrames(resF.data.data);
      setCategories(resC.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingFrame(null);
    setFormData({
      name: '',
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80',
      asset: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80',
      category: categories[0]?._id || '',
      contentTag: 'general',
      placement: { x: 0.5, y: 0.5, width: 1.0, height: 1.0, zIndex: 10 },
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
      category: frame.category?._id || frame.category || '',
      contentTag: frame.contentTag || 'general',
      placement: frame.placement || { x: 0.5, y: 0.5, width: 1.0, height: 1.0, zIndex: 10 },
      sortOrder: frame.sortOrder || 0,
      active: frame.active !== undefined ? frame.active : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingFrame) {
        await API.put(`/frames/${editingFrame._id}`, formData);
      } else {
        await API.post('/frames', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving frame');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this frame?')) return;
    try {
      await API.delete(`/frames/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting frame');
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<FrameCorners className="w-6 h-6" weight="duotone" />}
        title="Photo Frames"
        subtitle="PNG overlays & placement slots"
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> Add Frame
          </button>
        }
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-night-400">Loading frames…</p>
        </div>
      ) :frames.length === 0 ? (
        <div className="panel p-12 text-center">
          <FrameCorners className="w-8 h-8 text-night-500 mx-auto mb-2" />
          <p className="text-sm text-night-300 font-medium">No frames in the library yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {frames.map((f) => (
            <div key={f._id} className="panel panel-hover p-4 anim">
              <div className="relative aspect-[9/16] w-full bg-night-950 rounded-xl overflow-hidden mb-3 border border-night-600 flex items-center justify-center">
                <img src={f.thumbnail || f.asset} alt={f.name} className="w-full h-full object-cover opacity-60" />
                {f.asset && (
                  <div
                    className="absolute border-2 border-glow-400 bg-glow-500/15 rounded flex items-center justify-center"
                    style={{
                      left: `${(f.placement?.x || 0.5) * 100 - ((f.placement?.width || 1) * 100) / 2}%`,
                      top: `${(f.placement?.y || 0.5) * 100 - ((f.placement?.height || 1) * 100) / 2}%`,
                      width: `${(f.placement?.width || 1) * 100}%`,
                      height: `${(f.placement?.height || 1) * 100}%`,
                    }}
                  >
                    <span className="bg-night-950/80 text-glow-300 px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1">
                      <Target className="w-2.5 h-2.5" weight="fill" /> Slot
                    </span>
                  </div>
                )}
                <span className={`absolute top-2.5 right-2.5 badge ${f.active ? 'badge-success' : 'badge-muted'}`}>
                  {f.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h4 className="font-semibold text-sm text-white truncate">{f.name}</h4>
              <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                <span className="badge badge-success !text-[10px] px-2 py-1">
                  <TagSimple className="w-3 h-3" weight="fill" /> {f.contentTag || 'general'}
                </span>
                {f.category && (
                  <span className="badge badge-muted truncate !text-[10px] px-2 py-1 max-w-[110px]">
                    {f.category.name || 'Category'}
                  </span>
                )}
              </div>

              <div className="mt-3.5 pt-3 border-t border-night-600/50 flex items-center justify-between">
                <span className="text-[11px] font-medium text-night-400">Order · #{f.sortOrder}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(f)} className="p-2 text-night-300 hover:text-glow-300 hover:bg-glow-500/10 rounded-lg transition-colors">
                    <PencilSimple className="w-4 h-4" weight="duotone" />
                  </button>
                  <button onClick={() => handleDelete(f._id)} className="p-2 text-night-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash className="w-4 h-4" weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-night-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-card max-w-xl my-8">
            <div className="px-6 py-4 border-b border-night-600 flex items-center justify-between bg-night-850/40">
              <h3 className="display font-bold text-white">
                {editingFrame ? 'Edit Photo Frame' : 'Add Content Photo Frame'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Frame Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Diwali Golden Lights"
                  />
                </div>

                <div>
                  <label className="field-label">Content Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select"
                  >
                    <option value="">All Categories (General)</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Content Type Tag</label>
                  <select
                    value={formData.contentTag}
                    onChange={(e) => setFormData({ ...formData, contentTag: e.target.value })}
                    className="select"
                  >
                    <option value="general">General</option>
                    <option value="morning">Good Morning</option>
                    <option value="festival">Festival & Celebrations</option>
                    <option value="motivation">Motivation</option>
                    <option value="devotional">Devotional</option>
                    <option value="love">Love & Romantic</option>
                    <option value="birthday">Birthday</option>
                    <option value="quotes">Quotes</option>
                  </select>
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
                <label className="field-label">Thumbnail Image URL</label>
                <input
                  type="text"
                  required
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="field-label">Frame Asset PNG URL (Transparent)</label>
                <input
                  type="text"
                  required
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                  className="input"
                />
              </div>

              <div className="p-4 bg-night-900/70 border border-night-600 rounded-2xl space-y-3">
                <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-glow-400" weight="duotone" /> Placement Coordinates (0..1)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Center X', key: 'x', min: 0, max: 1, step: 0.05 },
                    { label: 'Center Y', key: 'y', min: 0, max: 1, step: 0.05 },
                    { label: 'Width', key: 'width', min: 0.1, max: 1, step: 0.05 },
                    { label: 'Height', key: 'height', min: 0.1, max: 1, step: 0.05 },
                  ].map((p) => (
                    <div key={p.key}>
                      <label className="field-label">
                        {p.label} <span className="text-night-400 font-mono">({formData.placement?.[p.key]})</span>
                      </label>
                      <input
                        type="number"
                        step={p.step}
                        min={p.min}
                        max={p.max}
                        value={formData.placement?.[p.key]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            placement: { ...formData.placement, [p.key]: parseFloat(e.target.value) },
                          })
                        }
                        className="input text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FloppyDisk className="w-4 h-4" weight="fill" /> Save Frame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
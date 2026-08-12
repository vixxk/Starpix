import React, { useEffect, useState } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import {
  Confetti,
  Plus,
  Trash,
  PencilSimple,
  X,
  FloppyDisk,
  Clock,
} from '@phosphor-icons/react';

export default function Effects() {
  const [effects, setEffects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEffect, setEditingEffect] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'particle',
    thumbnail: '',
    asset: '',
    duration: 5,
    active: true,
  });

  const fetchEffects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/effects');
      setEffects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEffects();
  }, []);

  const handleOpenCreate = () => {
    setEditingEffect(null);
    setFormData({
      name: '',
      type: 'particle',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
      asset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
      duration: 5,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e) => {
    setEditingEffect(e);
    setFormData({
      name: e.name || '',
      type: e.type || 'particle',
      thumbnail: e.thumbnail || '',
      asset: e.asset || '',
      duration: e.duration || 5,
      active: e.active !== undefined ? e.active : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingEffect) {
        await API.put(`/effects/${editingEffect._id}`, formData);
      } else {
        await API.post('/effects', formData);
      }
      setIsModalOpen(false);
      fetchEffects();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving effect');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this effect?')) return;
    try {
      await API.delete(`/effects/${id}`);
      fetchEffects();
    } catch (err) {
      alert('Error deleting effect');
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        icon={<Confetti className="w-6 h-6" weight="duotone" />}
        title="Animation Effects"
        subtitle={`${effects.length} overlays in the library`}
        actions={
          <button onClick={handleOpenCreate} className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" weight="bold" /> Add Effect
          </button>
        }
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-night-400">Loading effects…</p>
        </div>
      ) : effects.length === 0 ? (
        <div className="panel p-12 text-center">
          <Confetti className="w-8 h-8 text-night-500 mx-auto mb-2" />
          <p className="text-sm text-night-300 font-medium">No effects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
          {effects.map((e) => (
            <div key={e._id} className="panel panel-hover p-3.5 anim">
              <div className="relative rounded-xl overflow-hidden border border-night-600 mb-3 h-28 sm:h-32">
                <img src={e.thumbnail} alt={e.name} className="w-full h-full object-cover opacity-70" />
                <span className="absolute inset-0 bg-gradient-to-t from-night-950/70 to-transparent" />
                <span className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] font-semibold text-glow-300">
                  <Confetti className="w-3 h-3" weight="fill" /> {e.type}
                </span>
              </div>

              <h4 className="font-semibold text-sm text-white truncate">{e.name}</h4>
              <p className="text-[11px] text-night-400 mt-0.5 flex items-center gap-1 capitalize">
                <Clock className="w-3 h-3" /> {e.duration}s loop
              </p>

              <div className="mt-3 flex items-center justify-between pt-3 border-t border-night-600/50">
                <span className={`badge ${e.active ? 'badge-success' : 'badge-muted'}`}>{e.active ? 'Active' : 'Inactive'}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(e)} className="p-1.5 text-night-300 hover:text-glow-300 hover:bg-glow-500/10 rounded-lg transition-colors">
                    <PencilSimple className="w-4 h-4" weight="duotone" />
                  </button>
                  <button onClick={() => handleDelete(e._id)} className="p-1.5 text-night-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
                {editingEffect ? 'Edit Animation Effect' : 'Add Animation Effect'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="field-label">Effect Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Emerald Sparkles"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="select"
                  >
                    <option value="particle">Particle</option>
                    <option value="overlay">Overlay</option>
                    <option value="lottie">Lottie</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Duration (seconds)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Thumbnail URL</label>
                <input
                  type="text"
                  required
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="field-label">Asset URL</label>
                <input
                  type="text"
                  required
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FloppyDisk className="w-4 h-4" weight="fill" /> Save Effect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
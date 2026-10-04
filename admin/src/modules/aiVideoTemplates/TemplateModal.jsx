import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import ModalPortal from '../../components/ModalPortal';
import MediaUploadZone from '../../components/MediaUploadZone';
import MultilingualNameModal from '../../components/MultilingualNameModal';
import { X, FloppyDisk, Globe } from '@phosphor-icons/react';

export default function TemplateModal({
  isOpen,
  editingTemplate,
  formData,
  setFormData,
  isLangModalOpen,
  setIsLangModalOpen,
  onClose,
  onSave,
}) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    API.get('/categories')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        }
      })
      .catch((err) => console.log('Error loading categories:', err));
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="modal-card max-w-2xl w-full my-auto max-h-[92vh] flex flex-col bg-paper-50 border-2 border-ink shadow-hard-lg rounded-[2px] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b-2 border-ink flex items-center justify-between bg-paper-100 shrink-0">
              <h3 className="display text-lg sm:text-xl text-ink">
                {editingTemplate ? 'Edit AI Studio Template' : 'Add New AI Studio Template'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-ink-mute hover:text-ink hover:bg-paper-200 rounded-[2px] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body and pinned footer */}
            <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1">Title (English) *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input flex-1"
                        placeholder="e.g. Heroic Warrior AI Video"
                      />
                      <button
                        type="button"
                        onClick={() => setIsLangModalOpen(true)}
                        className="btn-secondary px-2.5"
                        title="Configure Title Translations"
                      >
                        <Globe className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label mb-1">Media Type *</label>
                    <select
                      value={formData.mediaType}
                      onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                      className="select w-full"
                    >
                      <option value="video">Video (.mp4)</option>
                      <option value="image">Image (.png / .jpg)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="select w-full"
                    >
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <option key={c._id || c.slug} value={c.name}>
                            {c.icon ? `${c.icon} ` : ''}{c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Retro 80's">Retro 80's</option>
                          <option value="Today's Special">Today's Special</option>
                          <option value="Dance Video">Dance Video</option>
                          <option value="Bappa in 80's">Bappa in 80's</option>
                          <option value="Ganesh Chaturthi">Ganesh Chaturthi</option>
                          <option value="Devotional">Devotional</option>
                          <option value="Photography Video">Photography Video</option>
                          <option value="Motivation">Motivation</option>
                          <option value="Love">Love</option>
                          <option value="Birthday">Birthday</option>
                          <option value="Trending">Trending</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="label mb-1">Required Faces / People *</label>
                    <select
                      value={formData.requiredPhotos}
                      onChange={(e) => {
                        const count = parseInt(e.target.value, 10) || 1;
                        const curr = [...(formData.sampleSourceImageUrls || [])];
                        while (curr.length < count) curr.push('');
                        setFormData({
                          ...formData,
                          requiredPhotos: count,
                          sampleSourceImageUrls: curr.slice(0, count),
                        });
                      }}
                      className="select w-full font-semibold"
                    >
                      <option value={1}>👤 1 Person (Single Face)</option>
                      <option value={2}>👥 2 People (Couple / Duo Faces)</option>
                      <option value={3}>👥 3 People (Trio)</option>
                      <option value={4}>👥 4 People (Group)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <MediaUploadZone
                    label={`Main Template ${formData.mediaType === 'image' ? 'Image' : 'Video'} (After Result Asset) *`}
                    value={formData.videoUrl}
                    onChange={(url) => setFormData({ ...formData, videoUrl: url })}
                    folder="ai-templates"
                    accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'}
                  />
                </div>

                {/* Multi-Person Sample Before Faces Uploads */}
                <div className="p-3.5 bg-paper-100 rounded border border-ink/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      {formData.requiredPhotos > 1 ? '👥 Sample Before Face Photos' : '👤 Sample Before Face Photo'}
                    </span>
                    <span className="text-[11px] text-ink-mute">
                      {formData.requiredPhotos > 1 ? `Upload ${formData.requiredPhotos} sample faces` : 'Upload 1 sample face'}
                    </span>
                  </div>

                  {Array.from({ length: formData.requiredPhotos || 1 }).map((_, idx) => {
                    const currentUrl = (formData.sampleSourceImageUrls && formData.sampleSourceImageUrls[idx]) || (idx === 0 ? formData.sampleSourceImageUrl : '');
                    return (
                      <MediaUploadZone
                        key={idx}
                        label={`Sample Before Face #${idx + 1} ${formData.requiredPhotos === 2 ? (idx === 0 ? '(e.g. Man)' : '(e.g. Woman)') : ''}`}
                        value={currentUrl}
                        onChange={(url) => {
                          const updated = [...(formData.sampleSourceImageUrls || [])];
                          while (updated.length < (formData.requiredPhotos || 1)) updated.push('');
                          updated[idx] = url;
                          setFormData({
                            ...formData,
                            sampleSourceImageUrls: updated,
                            sampleSourceImageUrl: updated[0] || '',
                          });
                        }}
                        folder="ai-sample-faces"
                        accept="image/*"
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label mb-1">Credits Required</label>
                    <input
                      type="number"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData({ ...formData, creditsRequired: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="label mb-1">Duration (Secs)</label>
                    <input
                      type="number"
                      value={formData.durationSeconds}
                      onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="label mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-paper-100 border-t-2 border-ink flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <FloppyDisk className="w-4 h-4" /> {editingTemplate ? 'Save Changes' : 'Create AI Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* Multilingual Title Modal */}
      <MultilingualNameModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        initialName={formData.title}
        initialTranslations={formData.titleTranslations}
        title="AI Studio Template Title - Multilingual Settings"
        onSave={(updatedName, updatedTranslations) => {
          setFormData((prev) => ({
            ...prev,
            title: updatedName,
            titleTranslations: updatedTranslations,
          }));
        }}
      />
    </>
  );
}

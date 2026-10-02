import React from 'react';
import ModalPortal from '../../components/ModalPortal';
import CanvasEditor from '../../components/CanvasEditor';
import MediaUploadZone from '../../components/MediaUploadZone';
import MultilingualNameModal from '../../components/MultilingualNameModal';
import { X, FloppyDisk, Globe } from '@phosphor-icons/react';
import { isVideoUrl } from './constants';

export default function TemplateEditModal({
  isOpen,
  editingTemplate,
  formData,
  setFormData,
  categories,
  isLangModalOpen,
  setIsLangModalOpen,
  onClose,
  onSave,
}) {
  if (!isOpen) return null;

  return (
    <>
      <ModalPortal>
        <div className="modal-backdrop">
          <div className="modal-card max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-6">
              <h3 className="display text-xl text-ink">
                {editingTemplate ? 'EDIT STATUS TEMPLATE' : 'CREATE NEW STATUS TEMPLATE'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost p-1 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Template Title (English) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input flex-1"
                      placeholder="e.g. Mahadev Divine Blessings"
                    />
                    <button
                      type="button"
                      onClick={() => setIsLangModalOpen(true)}
                      className="btn-secondary px-3 py-2 flex items-center justify-center"
                      title="Configure Title Translations"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="field-label">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="select"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="field-label">Access Tier</label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                    className="select"
                  >
                    <option value="free">Free for All</option>
                    <option value="vip">VIP Subscription Only</option>
                    <option value="paid">Single Paid Purchase</option>
                  </select>
                </div>

                {formData.accessType === 'paid' && (
                  <div>
                    <label className="field-label">Unlock Price (₹ INR)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, price: cleaned === '' ? 0 : Number(cleaned) });
                      }}
                      className="input"
                      placeholder="e.g. 49"
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Template Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="select"
                  >
                    <option value="image">Photo Template</option>
                    <option value="video">Video Template</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Display Order (Lower = First)</label>
                  <input
                    type="number"
                    value={formData.order ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, order: val, sortOrder: val });
                    }}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Template Media Asset & Thumbnail Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <MediaUploadZone
                    label="Template Media Asset (Image / Video) *"
                    value={formData.mainMedia || formData.previewAsset}
                    onChange={(url) =>
                      setFormData((prev) => {
                        const isVid = isVideoUrl(url);
                        return {
                          ...prev,
                          mainMedia: url,
                          previewAsset: url,
                          thumbnail: prev.thumbnail || (isVid ? '' : url),
                          type: isVid ? 'video' : prev.type,
                          canvasConfig: {
                            ...prev.canvasConfig,
                            backgroundImage: url || prev.canvasConfig?.backgroundImage || '',
                          },
                        };
                      })
                    }
                    folder="templates"
                    accept="image/*,video/mp4,video/webm"
                  />
                </div>

                <div>
                  <MediaUploadZone
                    label="Template Thumbnail (Image)"
                    value={formData.thumbnail}
                    onChange={(url) =>
                      setFormData((prev) => ({
                        ...prev,
                        thumbnail: url,
                      }))
                    }
                    folder="templates"
                    accept="image/*"
                  />
                  <p className="text-xs text-ink-muted mt-1 font-mono">
                    Shown on the mobile Downloads page and in the Admin panel.
                  </p>
                </div>
              </div>

              {/* Canvas Configuration Block */}
              <div className="p-4 bg-paper-100 border-2 border-ink rounded-[2px]">
                <h4 className="font-semibold text-sm text-ink mb-3">Photo Layer Layout Configuration</h4>
                <CanvasEditor
                  value={formData.canvasConfig}
                  mainMedia={formData.mainMedia}
                  previewAsset={formData.previewAsset}
                  thumbnail={formData.thumbnail}
                  footers={formData.footers}
                  onFootersChange={(nextFooters) => setFormData((prev) => ({ ...prev, footers: nextFooters }))}
                  onChange={(config) => setFormData((prev) => ({ ...prev, canvasConfig: config }))}
                />
              </div>

              {/* Template Specific Footers */}
              <div className="p-4 bg-paper-100 border-2 border-ink rounded-[2px] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-ink">Template Footers</h4>
                    <p className="text-[11px] text-ink-mute">Upload image or video footers specific to this template (e.g. clouds, smoke, glowing waves, overlays)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        footers: [
                          ...(formData.footers || []),
                          {
                            name: `Footer ${(formData.footers || []).length + 1}`,
                            videoAsset: '',
                            thumbnail: '',
                            heightPercent: 40,
                            objectFit: 'contain',
                          },
                        ],
                      })
                    }
                    className="btn-secondary text-xs"
                  >
                    + Add Footer
                  </button>
                </div>

                {(formData.footers || []).length === 0 ? (
                  <p className="text-xs text-ink-mute italic">No footers added for this template yet.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.footers.map((footerItem, idx) => (
                      <div key={idx} className="p-3 bg-white border border-ink/20 rounded-[2px] space-y-3 relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={footerItem.name}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].name = e.target.value;
                                setFormData({ ...formData, footers: next });
                              }}
                              placeholder="Footer Name (e.g. Cloud Footer)"
                              className="input py-1 text-xs font-bold"
                            />
                            {footerItem.userNamePosition && (
                              <span className="badge bg-amber-100 text-amber-900 border-amber-300 text-[10px] whitespace-nowrap">
                                📍 Custom Name Position
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.footers.filter((_, i) => i !== idx);
                              setFormData({ ...formData, footers: next });
                            }}
                            className="text-red-600 text-xs hover:underline font-bold"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <MediaUploadZone
                            label="Footer Overlay Asset (.png / .mp4)"
                            value={footerItem.videoAsset || footerItem.asset}
                            onChange={(url) => {
                              const next = [...formData.footers];
                              next[idx].videoAsset = url;
                              next[idx].asset = url;
                              if (!next[idx].thumbnail && !isVideoUrl(url)) {
                                next[idx].thumbnail = url;
                              }
                              setFormData({ ...formData, footers: next });
                            }}
                            folder="footers"
                            accept="image/*,video/mp4,video/webm"
                          />
                          <MediaUploadZone
                            label="Footer Thumbnail Image (App Box Selector)"
                            value={footerItem.thumbnail}
                            onChange={(url) => {
                              const next = [...formData.footers];
                              next[idx].thumbnail = url;
                              setFormData({ ...formData, footers: next });
                            }}
                            folder="footer-thumbnails"
                            accept="image/*"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="field-label text-[10px]">Height Coverage (%)</label>
                            <input
                              type="number"
                              min={10}
                              max={100}
                              value={footerItem.heightPercent || 40}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].heightPercent = Number(e.target.value);
                                setFormData({ ...formData, footers: next });
                              }}
                              className="input text-xs py-1"
                            />
                          </div>
                          <div>
                            <label className="field-label text-[10px]">Object Fit</label>
                            <select
                              value={footerItem.objectFit || 'contain'}
                              onChange={(e) => {
                                const next = [...formData.footers];
                                next[idx].objectFit = e.target.value;
                                setFormData({ ...formData, footers: next });
                              }}
                              className="select text-xs py-1"
                            >
                              <option value="contain">Contain (Leaves sides visible)</option>
                              <option value="cover">Cover (Full stretch)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Pin to Top of Category
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-flame-500 rounded-[2px]"
                  />
                  Published (Visible to Mobile App)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
                <button
                  type="button"
                  onClick={onClose}
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
      </ModalPortal>

      {/* Multilingual Title Modal */}
      <MultilingualNameModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        initialName={formData.name}
        initialTranslations={formData.nameTranslations}
        title="Status Template Title - Multilingual Settings"
        onSave={(updatedName, updatedTranslations) => {
          setFormData((prev) => ({
            ...prev,
            name: updatedName,
            nameTranslations: updatedTranslations,
          }));
        }}
      />
    </>
  );
}

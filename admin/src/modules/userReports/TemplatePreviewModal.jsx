import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModalPortal from '../../components/ModalPortal';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Sparkle,
  Image as ImageIcon,
  Crown,
  Copy,
  ArrowSquareOut,
} from '@phosphor-icons/react';

export default function TemplatePreviewModal({ isOpen, template, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!isOpen || !template) return null;

  return (
    <ModalPortal>
      <div className="modal-backdrop">
        <div className="modal-card max-w-2xl p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-flame-500 border-2 border-ink flex items-center justify-center shadow-hard-sm">
                <Sparkle className="w-5 h-5 text-white" weight="fill" />
              </div>
              <div>
                <h2 className="display text-lg text-ink">TEMPLATE DETAILS & PREVIEW</h2>
                <p className="font-mono text-[10px] text-ink-mute font-bold uppercase tracking-wider">
                  ID: {template._id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-1 text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Image Preview Box */}
            <div className="relative border-2 border-ink bg-paper-100 p-2 shadow-hard-sm rounded-[3px] text-center">
              {template.thumbnail || template.previewAsset || template.mainMedia ? (
                <img
                  src={template.thumbnail || template.previewAsset || template.mainMedia}
                  alt={template.name}
                  className="w-full h-72 object-contain bg-night-950 rounded-[2px] border border-ink/20"
                />
              ) : (
                <div className="w-full h-72 bg-paper-200 flex flex-col items-center justify-center text-ink-mute gap-2">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs font-bold">No Image Available</span>
                </div>
              )}

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                {template.accessType === 'vip' ? (
                  <span className="badge bg-amber-400 text-ink font-bold border-ink flex items-center gap-1 shadow-sm text-[10px]">
                    <Crown className="w-3 h-3 text-ink" weight="fill" /> VIP
                  </span>
                ) : template.accessType === 'paid' ? (
                  <span className="badge bg-emerald-500 text-white font-bold border-ink shadow-sm text-[10px]">
                    PAID ₹{template.price || 0}
                  </span>
                ) : (
                  <span className="badge bg-sky-400 text-ink font-bold border-ink shadow-sm text-[10px]">
                    FREE
                  </span>
                )}

                {template.isPinned && (
                  <span className="badge bg-flame-500 text-white font-bold border-ink shadow-sm text-[10px]">
                    PINNED
                  </span>
                )}
              </div>
            </div>

            {/* Details Column */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="label block mb-0.5">Template Name</span>
                <h3 className="display text-xl text-ink leading-snug">{template.name}</h3>
              </div>

              {template.description && (
                <div>
                  <span className="label block mb-0.5">Description</span>
                  <p className="text-ink bg-paper-100 p-2.5 border border-ink/20 font-medium">
                    {template.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-paper-100 border border-ink/20 rounded-[2px]">
                  <span className="label block text-[9px]">Access Tier</span>
                  <span className="font-bold text-ink uppercase text-xs">
                    {template.accessType || 'FREE'}
                  </span>
                </div>
                <div className="p-2.5 bg-paper-100 border border-ink/20 rounded-[2px]">
                  <span className="label block text-[9px]">Status</span>
                  <span className={`font-bold text-xs uppercase ${template.active !== false ? 'text-emerald-700' : 'text-red-700'}`}>
                    {template.active !== false ? 'Published' : 'Unpublished'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-paper-100 border border-ink/20 rounded-[2px]">
                  <span className="label block text-[9px]">Total Uses</span>
                  <span className="font-mono font-bold text-ink text-sm">
                    {template.usageCount || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-paper-100 border border-ink/20 rounded-[2px]">
                  <span className="label block text-[9px]">Downloads</span>
                  <span className="font-mono font-bold text-ink text-sm">
                    {template.downloadsCount || 0}
                  </span>
                </div>
              </div>

              {template.canvasConfig?.layers && (
                <div className="p-2.5 bg-paper-100 border border-ink/20 rounded-[2px]">
                  <span className="label block text-[9px]">Canvas Layers</span>
                  <span className="font-semibold text-ink">
                    {template.canvasConfig.layers.length} interactive layers ({template.canvasConfig.layers.filter(l => l.type === 'photo').length} photo box, {template.canvasConfig.layers.filter(l => l.type === 'text').length} text)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-ink">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(template._id);
                toast.success('Template ID copied to clipboard!');
              }}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy ID</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/templates?search=${encodeURIComponent(template.name)}`);
                }}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <span>Manage in Templates</span>
                <ArrowSquareOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

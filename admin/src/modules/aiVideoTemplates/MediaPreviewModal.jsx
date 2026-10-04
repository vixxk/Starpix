import React, { useEffect } from 'react';
import ModalPortal from '../../components/ModalPortal';
import {
  Sparkle,
  X,
  DownloadSimple,
  ArrowSquareOut,
  VideoCamera,
  Image as ImageIcon,
  User as UserIcon,
  Clock,
  Phone,
} from '@phosphor-icons/react';

export default function MediaPreviewModal({ previewMedia, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!previewMedia) return null;

  const isVideo = Boolean(previewMedia.isVideo || previewMedia.url?.match(/\.(mp4|webm|mov)(\?.*)?$/i));

  return (
    <ModalPortal>
      {/* Scrollable Backdrop Container */}
      <div
        className="fixed inset-0 z-[120] bg-ink/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-center justify-center min-h-screen"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Window: constrained height with internal flex scrolling */}
        <div className="panel max-w-md w-full bg-paper-50 border-2 border-ink shadow-hard-lg rounded-[2px] max-h-[92vh] flex flex-col overflow-hidden my-auto anim">
          {/* Sticky Header */}
          <div className="shrink-0 bg-paper-100 border-b-2 border-ink px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-[2px] bg-flame-500 text-ink flex items-center justify-center border border-ink shrink-0">
                <Sparkle className="w-4 h-4" weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-ink text-sm uppercase truncate leading-tight">
                  {previewMedia.title || 'AI Face Swap Creation'}
                </h3>
                <span className="font-mono text-[10px] text-ink-mute uppercase font-semibold flex items-center gap-1">
                  {isVideo ? (
                    <>
                      <VideoCamera className="w-3 h-3 text-flame-600" weight="bold" /> AI Video (.mp4)
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 text-purple-600" weight="bold" /> AI Photo (.png)
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-paper-200 rounded-[2px] border border-ink text-ink transition-colors shrink-0"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-paper-50/50">
            {/* Visual Media Canvas: constrained height so it always fits perfectly */}
            <div className="w-full h-[50vh] sm:h-[54vh] max-h-[520px] bg-black rounded-[2px] border-2 border-ink overflow-hidden flex items-center justify-center relative shadow-sm">
              {isVideo ? (
                <video
                  src={previewMedia.url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Creation Metadata & User Details */}
            {(previewMedia.userName || previewMedia.createdAt || previewMedia.creationId) && (
              <div className="bg-white border border-ink/20 rounded-[2px] p-3 space-y-1.5 text-xs">
                {previewMedia.userName && (
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-ink-mute" weight="bold" /> Created By:
                    </span>
                    <span className="font-medium text-ink">{previewMedia.userName}</span>
                  </div>
                )}
                {previewMedia.userPhone && (
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-ink-mute" weight="bold" /> Phone:
                    </span>
                    <span className="font-mono text-ink-soft">{previewMedia.userPhone}</span>
                  </div>
                )}
                {previewMedia.createdAt && (
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ink-mute" weight="bold" /> Generated At:
                    </span>
                    <span className="font-mono text-ink-soft">
                      {new Date(previewMedia.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {previewMedia.creationId && (
                  <div className="flex items-center justify-between text-ink-soft pt-1 border-t border-ink/10">
                    <span className="font-mono text-[10.5px] text-ink-mute">ID:</span>
                    <span className="font-mono text-[10.5px] text-ink-mute truncate max-w-[200px]">
                      {previewMedia.creationId}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 bg-paper-100 border-t-2 border-ink px-4 py-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <a
                href={previewMedia.url}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-primary !py-2 !px-3.5 !text-xs flex items-center gap-1.5 bg-flame-500 text-ink border-2 border-ink font-bold shadow-sm"
              >
                <DownloadSimple className="w-4 h-4" weight="bold" /> Download Media
              </a>
              <a
                href={previewMedia.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-ink bg-white text-ink hover:text-flame-600 rounded-[2px] transition-colors"
                title="Open in new browser tab"
              >
                <ArrowSquareOut className="w-4 h-4" weight="bold" />
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary !py-2 !px-4 !text-xs font-bold border-2 border-ink"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

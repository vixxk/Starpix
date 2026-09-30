import React from 'react';
import ModalPortal from '../../components/ModalPortal';
import { Sparkle, X, DownloadSimple } from '@phosphor-icons/react';

export default function MediaPreviewModal({ previewMedia, onClose }) {
  if (!previewMedia) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] bg-ink/80 flex items-center justify-center p-4">
        <div className="panel max-w-lg w-full bg-paper-50 p-4 border-2 border-ink shadow-hard-lg">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
            <h3 className="font-bold text-ink text-sm uppercase flex items-center gap-2">
              <Sparkle className="w-4 h-4 text-flame-600" /> {previewMedia.title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-paper-200 rounded border border-ink"
            >
              <X className="w-5 h-5 text-ink" />
            </button>
          </div>
          <div className="w-full aspect-[9/16] bg-black rounded border-2 border-ink overflow-hidden flex items-center justify-center">
            {previewMedia.isVideo ? (
              <video src={previewMedia.url} className="w-full h-full object-contain" controls autoPlay loop />
            ) : (
              <img src={previewMedia.url} alt={previewMedia.title} className="w-full h-full object-contain" />
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <a
              href={previewMedia.url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
            >
              <DownloadSimple className="w-4 h-4" /> Download Original Media
            </a>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary !py-2 !px-4 !text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

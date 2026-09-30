import React from 'react';
import ModalPortal from '../../components/ModalPortal';
import { X, ArrowSquareOut } from '@phosphor-icons/react';

export default function UserProfilePhotoModal({ selectedPhotoUser, onClose }) {
  if (!selectedPhotoUser) return null;

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card max-w-sm p-5 space-y-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ink text-flame-400 border border-ink flex items-center justify-center font-bold text-xs font-display">
                {(selectedPhotoUser.name || 'U').substring(0, 1).toUpperCase()}
              </div>
              <div className="text-left">
                <h3 className="display text-sm text-ink truncate max-w-[200px]">
                  {selectedPhotoUser.name || 'User Photo'}
                </h3>
                {selectedPhotoUser.phone && (
                  <p className="font-mono text-[10px] text-ink-mute">{selectedPhotoUser.phone}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost p-1 text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2 bg-paper-100 border-2 border-ink shadow-hard-sm rounded flex items-center justify-center overflow-hidden">
            <img
              src={selectedPhotoUser.photo}
              alt={selectedPhotoUser.name || 'User Profile Photo'}
              className="max-h-72 w-full object-contain rounded bg-night-950"
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-mono text-[11px] text-ink-mute">Profile Picture</span>
            <a
              href={selectedPhotoUser.photo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-flame-600 hover:underline flex items-center gap-1 font-bold"
            >
              Open Original <ArrowSquareOut className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

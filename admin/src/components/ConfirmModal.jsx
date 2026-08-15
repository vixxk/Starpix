import React from 'react';
import { Warning, Trash } from '@phosphor-icons/react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
      <div className="max-w-sm w-full p-6 text-center rounded-[2px] bg-white border-2 border-ink shadow-hard-lg anim">
        <div
          className={`w-12 h-12 rounded-[2px] border-2 border-ink flex items-center justify-center mx-auto mb-4 shadow-hard-sm ${
            danger ? 'bg-red-500 text-white' : 'bg-flame-500 text-ink'
          }`}
        >
          {danger ? <Trash className="w-6 h-6" weight="duotone" /> : <Warning className="w-6 h-6" weight="duotone" />}
        </div>
        <h3 className="display text-xl text-ink mb-1.5">{title}</h3>
        <p className="text-xs text-ink-mute mb-6 leading-relaxed font-medium">{message}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex-1 py-2.5 text-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1 py-2.5 text-xs`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

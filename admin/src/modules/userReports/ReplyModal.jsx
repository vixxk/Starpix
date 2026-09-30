import React from 'react';
import ModalPortal from '../../components/ModalPortal';
import { resolveMediaUrl } from '../../utils/media';
import {
  X,
  Sparkle,
  ArrowSquareOut,
  ArrowClockwise,
  PaperPlaneRight,
} from '@phosphor-icons/react';

export default function ReplyModal({
  isOpen,
  report,
  replyStatus,
  setReplyStatus,
  replyMessage,
  setReplyMessage,
  saving,
  onClose,
  onSave,
  onOpenTemplate,
  onOpenUserPhoto,
}) {
  if (!isOpen || !report) return null;

  return (
    <ModalPortal>
      <div className="modal-backdrop">
        <div className="modal-card max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <h3 className="display text-base text-ink">REPORT DETAILS & ACTION</h3>
            <button
              onClick={onClose}
              className="btn-ghost p-1 text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details summary */}
          <div className="p-3 bg-paper-100 border border-ink/20 text-xs space-y-2 rounded-[2px]">
            <div className="flex items-center justify-between">
              <span className="label">Submitted By</span>
              <div className="flex items-center gap-2">
                {report.userId?.profilePhoto ? (
                  <img
                    src={resolveMediaUrl(report.userId.profilePhoto)}
                    alt={report.userId?.name || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-paper-300 shadow-sm shrink-0 bg-ink cursor-pointer hover:ring-2 hover:ring-flame-500 transition-all"
                    title="Click to view full photo"
                    onClick={() =>
                      onOpenUserPhoto({
                        name: report.userId?.name || 'User',
                        photo: resolveMediaUrl(report.userId.profilePhoto),
                        phone: report.userId?.phoneNumber,
                      })
                    }
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  style={{ display: report.userId?.profilePhoto ? 'none' : 'flex' }}
                  className="w-7 h-7 rounded-full bg-ink text-flame-400 border border-ink flex items-center justify-center font-display text-[10px] font-bold shrink-0 shadow-sm"
                >
                  {(report.userId?.name || 'U').substring(0, 1).toUpperCase()}
                </div>
                <span className="font-bold text-ink">
                  {report.userId?.name || 'Unknown'} ({report.userId?.phoneNumber || 'N/A'})
                </span>
              </div>
            </div>
            {report.type === 'template' && report.templateId && (
              <div className="flex items-center justify-between pt-1 border-t border-ink/10">
                <span className="label">Target Template</span>
                <button
                  type="button"
                  onClick={() => onOpenTemplate(report.templateId)}
                  className="font-bold text-flame-600 hover:underline flex items-center gap-1"
                >
                  <Sparkle className="w-3 h-3 text-flame-600" />
                  <span>{report.templateId.name || 'View Template'}</span>
                  <ArrowSquareOut className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-ink/10">
              <span className="label">Reason</span>
              <span className="font-bold text-flame-600">{report.reason}</span>
            </div>
            {report.description && (
              <div>
                <span className="label block mb-1">User Note</span>
                <p className="text-ink bg-white p-2.5 border border-ink/20 font-medium">
                  {report.description}
                </p>
              </div>
            )}
          </div>

          {/* Status Selector */}
          <div>
            <label className="field-label uppercase font-mono text-[10px] tracking-wider text-ink-mute mb-1.5">
              Update Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'pending', label: 'Pending Review' },
                { key: 'in_progress', label: 'Working On It' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'rejected', label: 'Rejected' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setReplyStatus(st.key)}
                  className={`btn py-2 text-xs transition-all ${
                    replyStatus === st.key
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Reply Input */}
          <div>
            <label className="field-label uppercase font-mono text-[10px] tracking-wider text-ink-mute mb-1.5">
              Admin Response Message (Optional)
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              placeholder="Enter response or explanation visible to the user..."
              className="textarea"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-ink">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="btn-primary"
            >
              {saving ? (
                <ArrowClockwise className="w-4 h-4 animate-spin" />
              ) : (
                <PaperPlaneRight className="w-4 h-4" weight="fill" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

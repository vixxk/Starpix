import React, { useState, useCallback, useRef } from 'react';
import API from '../services/api';
import {
  UploadSimple,
  VideoCamera,
  CheckCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react';

export default function MediaUploadZone({ label, value, onChange, folder = 'uploads', accept }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const isVideo = value && (value.endsWith('.mp4') || value.endsWith('.mov') || value.endsWith('.webm') || value.includes('video'));
  const hasPreview = value && typeof value === 'string' && value.startsWith('http');

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await API.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      if (res.data?.success && res.data?.data?.url) {
        onChange(res.data.data.url);
      } else {
        setError('Upload failed – unexpected response');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="field-label">{label}</label>}

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[2px] cursor-pointer transition-all duration-150
          ${dragOver ? 'border-flame-500 bg-flame-500/10' : 'border-ink/30 hover:border-ink/60 hover:bg-paper-50'}
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept || 'image/*,video/mp4,video/webm'}
          onChange={handleFileSelect}
          className="hidden"
        />

        {hasPreview ? (
          /* Preview state */
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-14 h-14 rounded-[2px] border-2 border-ink/20 overflow-hidden bg-paper-100 flex-shrink-0">
              {isVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-ink/10">
                  <VideoCamera className="w-6 h-6 text-ink-mute" weight="duotone" />
                </div>
              ) : (
                <img src={value} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" weight="fill" />
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Uploaded to S3</span>
              </div>
              <p className="text-[10px] text-ink-mute font-medium truncate mt-0.5" title={value}>
                {value.split('/').pop()?.substring(0, 40)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="p-1.5 text-ink-mute hover:text-flame-600 hover:bg-flame-500/10 rounded-[2px] transition-colors flex-shrink-0"
              title="Replace file"
            >
              <ArrowsClockwise className="w-4 h-4" weight="bold" />
            </button>
          </div>
        ) : uploading ? (
          /* Uploading state */
          <div className="p-4 text-center">
            <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-flame-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
              Uploading to S3… {progress}%
            </p>
          </div>
        ) : (
          /* Empty state */
          <div className="p-4 text-center">
            <UploadSimple className="w-6 h-6 text-ink/30 mx-auto mb-1" weight="duotone" />
            <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
              Drop image file or click to upload
            </p>
            <p className="text-[10px] text-ink-faint mt-0.5">JPG, PNG, WEBP, GIF · Uploads directly to S3</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-[10px] font-bold text-red-600">{error}</p>}

      {/* Fallback URL input */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste image URL directly"
        className="input !py-1.5 !text-[11px] !text-ink-mute !font-mono"
      />
    </div>
  );
}

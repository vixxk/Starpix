import React, { useState, useCallback, useRef } from 'react';
import API from '../services/api';
import {
  UploadSimple,
  VideoCamera,
  MusicNote,
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
  const isAudio = value && (value.endsWith('.mp3') || value.endsWith('.wav') || value.endsWith('.ogg') || value.endsWith('.m4a') || value.endsWith('.aac') || value.endsWith('.flac') || value.includes('audio'));
  const hasPreview = value && typeof value === 'string' && value.startsWith('http');

  const [aspectNotice, setAspectNotice] = useState(null);

  const checkAspectRatio = (file) => {
    return new Promise((resolve) => {
      if (file.type && file.type.startsWith('video/')) {
        const v = document.createElement('video');
        v.preload = 'metadata';
        const url = URL.createObjectURL(file);
        v.src = url;
        v.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve({ width: v.videoWidth, height: v.videoHeight, isVideo: true });
        };
        v.onerror = () => resolve(null);
      } else if (file.type && file.type.startsWith('image/')) {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.naturalWidth, height: img.naturalHeight, isVideo: false });
        };
        img.onerror = () => resolve(null);
      } else {
        resolve(null);
      }
    });
  };

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    if (folder === 'templates' || folder === 'reels') {
      const meta = await checkAspectRatio(file);
      if (meta && meta.width && meta.height) {
        const ratio = meta.width / meta.height;
        const is916 = Math.abs(ratio - 9 / 16) < 0.04;
        if (is916) {
          setAspectNotice({ type: 'success', text: `✓ 9:16 Vertical Ratio Verified (${meta.width}×${meta.height})` });
        } else {
          setAspectNotice({
            type: 'info',
            text: `ℹ️ Uploading (${meta.width}×${meta.height}) · Backend will standardize to exact 9:16 (1080×1920) ratio for mobile consistency.`,
          });
        }
      }
    }

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
          accept={accept || 'image/*,video/mp4,video/webm,audio/*'}
          onChange={handleFileSelect}
          className="hidden"
        />

        {hasPreview ? (
          /* Preview state */
          <div className="p-2.5 space-y-2 overflow-hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[2px] border-2 border-ink/20 overflow-hidden bg-paper-100 flex-shrink-0 flex items-center justify-center">
                {isAudio ? (
                  <div className="w-full h-full flex items-center justify-center bg-flame-500/20 text-flame-600">
                    <MusicNote className="w-5 h-5" weight="fill" />
                  </div>
                ) : isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-ink/10">
                    <VideoCamera className="w-5 h-5 text-ink-mute" weight="duotone" />
                  </div>
                ) : (
                  <img src={value} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" weight="fill" />
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    {isAudio ? 'Audio Uploaded to S3' : 'Uploaded to S3'}
                  </span>
                </div>
                {!isAudio && (
                  <p className="text-[10px] text-ink-mute font-medium truncate" title={value}>
                    {value.split('/').pop()?.substring(0, 35)}
                  </p>
                )}
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

            {isAudio && (
              <div className="w-full overflow-hidden pt-0.5">
                <audio src={value} controls className="h-7 w-full max-w-full block" onClick={(e) => e.stopPropagation()} />
              </div>
            )}
          </div>
        ) : uploading ? (
          /* Uploading state */
          <div className="p-5 text-center space-y-2.5">
            <div className="w-full h-3.5 bg-paper-200 border border-ink/20 rounded-full overflow-hidden shadow-inner p-0.5">
              <div
                className="h-full bg-gradient-to-r from-flame-500 to-amber-500 transition-all duration-300 rounded-full shadow-sm"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
            <p className="text-xs font-bold text-ink uppercase tracking-wider">
              Uploading to S3…
            </p>
          </div>
        ) : (
          /* Empty state */
          <div className="p-4 text-center">
            {accept?.includes('audio') ? (
              <MusicNote className="w-6 h-6 text-flame-500/70 mx-auto mb-1" weight="duotone" />
            ) : (
              <UploadSimple className="w-6 h-6 text-ink/30 mx-auto mb-1" weight="duotone" />
            )}
            <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">
              {accept?.includes('audio') ? 'Drop audio file or click to upload' : 'Drop image/file or click to upload'}
            </p>
            <p className="text-[10px] text-ink-faint mt-0.5">
              {accept?.includes('audio') ? 'MP3, WAV, AAC, M4A, OGG · Uploads directly to S3' : 'JPG, PNG, WEBP, GIF, MP4 · Uploads directly to S3'}
            </p>
          </div>
        )}
      </div>

      {/* Aspect Ratio Notice */}
      {aspectNotice && (
        <div
          className={`text-[11px] font-semibold px-2 py-1 rounded-[2px] border ${
            aspectNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {aspectNotice.text}
        </div>
      )}

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

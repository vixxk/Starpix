import { resolveMediaUrl } from '../../utils/media';

export const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

export const getTemplateId = (item) => {
  if (!item) return '';
  if (typeof item.templateId === 'object' && item.templateId?._id) return String(item.templateId._id);
  if (typeof item.templateId === 'string' && item.templateId) return item.templateId;
  if (typeof item.activeTemplate === 'object' && item.activeTemplate?._id) return String(item.activeTemplate._id);
  if (typeof item.template === 'object' && item.template?._id) return String(item.template._id);
  return '';
};

export const getCreationId = (item) => {
  return String(item._id || item.id || '');
};

export const getCardThumbnail = (item) => {
  if (!item) return resolveMediaUrl(null);

  // 1. Check AI Template or Standard Template object first
  const tObj =
    item.aiTemplate ||
    item.activeTemplate ||
    item.template ||
    (typeof item.aiTemplateId === 'object' ? item.aiTemplateId : null) ||
    (typeof item.templateId === 'object' ? item.templateId : null);

  if (tObj) {
    const adminThumb = tObj.thumbnailUrl || tObj.thumbnail || tObj.sampleSourceImageUrl || tObj.previewAsset;
    if (adminThumb && typeof adminThumb === 'string' && !isVideoMedia(adminThumb)) {
      return resolveMediaUrl(adminThumb);
    }
  }

  // 2. Check if item.image or item.localUri or item.editedPhoto is a static image fallback
  const candidates = [item.image, item.localUri, item.editedPhoto];
  for (const cand of candidates) {
    if (cand && typeof cand === 'string' && !isVideoMedia(cand)) {
      return resolveMediaUrl(cand);
    }
  }

  return resolveMediaUrl(null);
};

export const formatDownloadDate = (dateStr, language = 'en') => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(language || 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return null;
  }
};

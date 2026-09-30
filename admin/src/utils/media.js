import API from '../services/api';

/**
 * Resolves a media path or relative URL to a fully qualified URL.
 * @param {string} path - URL or relative asset path
 * @returns {string} - Absolute media URL
 */
export const resolveMediaUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = API.defaults.baseURL || '';
  const rootHost = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${rootHost}${cleanPath}`;
};

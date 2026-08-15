import API from './api';

export const resolveMediaUrl = (url, fallback = 'https://d3arutsevouzgm.cloudfront.net/templates/01a4ab85-4749-4908-8da5-89a77ced34fa.jpg') => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  // Local device file URIs or base64 data URIs
  if (url.startsWith('file://') || url.startsWith('data:') || url.startsWith('content://')) {
    return url;
  }

  let resolved = url;

  // Relative path resolution
  if (url.startsWith('/')) {
    const host = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    resolved = `${host}${url}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const host = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    resolved = `${host}/${url}`;
  }

  // Replace localhost with actual LAN IP when testing on physical mobile devices
  if (resolved.includes('localhost') && API.defaults.baseURL && !API.defaults.baseURL.includes('localhost')) {
    const host = API.defaults.baseURL.replace(/\/api\/?$/, '');
    resolved = resolved.replace(/http:\/\/localhost:5000/g, host);
  }

  return resolved;
};

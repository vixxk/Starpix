import API from './api';

export const resolveMediaUrl = (
  url,
  fallback = ''
) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  // Local device file URIs or base64 data URIs
  if (
    url.startsWith('file://') ||
    url.startsWith('data:') ||
    url.startsWith('content://') ||
    url.startsWith('ph://')
  ) {
    return url;
  }

  let resolved = url.trim();

  // If old dead cloudfront domain was saved, redirect to working S3 bucket
  if (resolved.includes('d3arutsevouzgm.cloudfront.net')) {
    resolved = resolved.replace(
      'd3arutsevouzgm.cloudfront.net',
      'starpix-media-production.s3.ap-south-1.amazonaws.com'
    );
  }

  // Route S3 assets through backend proxy to bypass mobile DNS resolution failures
  if (
    (resolved.includes('starpix-media-production.s3.ap-south-1.amazonaws.com') ||
     resolved.includes('d3arutsevouzgm.cloudfront.net')) &&
    !resolved.includes('/api/uploads/proxy-image')
  ) {
    const host = API.defaults.baseURL
      ? API.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    resolved = `${host}/api/uploads/proxy-image?url=${encodeURIComponent(resolved)}`;
  }

  // Relative path resolution
  if (resolved.startsWith('/')) {
    const host = API.defaults.baseURL
      ? API.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    resolved = `${host}${resolved}`;
  } else if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
    const host = API.defaults.baseURL
      ? API.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    resolved = `${host}/${resolved}`;
  }

  // Replace localhost with actual LAN IP when testing on physical mobile devices
  if (
    resolved.includes('localhost') &&
    API.defaults.baseURL &&
    !API.defaults.baseURL.includes('localhost')
  ) {
    const host = API.defaults.baseURL.replace(/\/api\/?$/, '');
    resolved = resolved.replace(/http:\/\/localhost:5000/g, host);
  }

  return resolved;
};

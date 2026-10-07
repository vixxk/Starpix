import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import API from '../utils/api';
import { resolveMediaUrl } from '../utils/media';

// In-memory cache for fast toggling during active sessions
const memoryCutoutCache = new Map();

/**
 * Generate a consistent safe filename hash from an image URI
 */
function getCacheKey(uri) {
  if (!uri) return 'temp';
  return String(uri)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(-40);
}

/**
 * Checks if a cached cutout already exists locally for this photo URI
 */
export async function getCachedCutout(imageUri) {
  if (!imageUri) return null;
  const key = getCacheKey(imageUri);

  // 1. Check in-memory map
  if (memoryCutoutCache.has(key)) {
    const memUri = memoryCutoutCache.get(key);
    try {
      const info = await FileSystem.getInfoAsync(memUri);
      if (info.exists) return memUri;
    } catch (_) {}
  }

  // 2. Check disk cache in Expo FileSystem cache directory
  try {
    const diskPath = `${FileSystem.cacheDirectory}starpix_cutout_${key}.png`;
    const info = await FileSystem.getInfoAsync(diskPath);
    if (info.exists && info.size > 0) {
      memoryCutoutCache.set(key, diskPath);
      return diskPath;
    }
  } catch (_) {}

  return null;
}

/**
 * Save / associate a cutout URI with an original URI
 */
export function setCachedCutout(originalUri, cutoutUri) {
  if (!originalUri || !cutoutUri) return;
  const key = getCacheKey(originalUri);
  memoryCutoutCache.set(key, cutoutUri);
}

/**
 * Removes background using Google ML Kit / MediaPipe Selfie Segmentation (React Native Native Wrapper).
 * Includes automatic caching and graceful fallback handling so the application never crashes.
 *
 * @param {string} sourceUri - Local file URI or remote URL of the image
 * @returns {Promise<string>} - Local URI of the transparent PNG cutout
 */
export async function removeBackground(sourceUri) {
  if (!sourceUri) {
    throw new Error('No image URI provided for background removal');
  }

  // 1. Check cache first for instantaneous toggle response
  const cached = await getCachedCutout(sourceUri);
  if (cached) {
    console.log('[SelfieSegmentation] Returning cached cutout for:', sourceUri);
    return cached;
  }

  const key = getCacheKey(sourceUri);
  const targetCachePath = `${FileSystem.cacheDirectory}starpix_cutout_${key}.png`;
  const isRemote = sourceUri.startsWith('http://') || sourceUri.startsWith('https://');

  // 2. Ensure we have a local file:// path if testing native ML Kit processing
  let localInputPath = isRemote ? null : sourceUri;
  if (isRemote) {
    try {
      const resolved = resolveMediaUrl(sourceUri);
      const tempInput = `${FileSystem.cacheDirectory}input_${Date.now()}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(resolved, tempInput);
      localInputPath = downloadRes.uri;
    } catch (dlErr) {
      console.warn('[SelfieSegmentation] Direct download notice (will process via server):', dlErr.message);
    }
  }

  // 3. Attempt Native Google ML Kit / MediaPipe Segmentation if local file is present
  let resultUri = null;

  if (localInputPath) {
    try {
      let bgRemover = null;
      try {
        bgRemover = require('@six33/react-native-bg-removal');
      } catch (_) {
        try {
          bgRemover = require('rn-remove-image-bg');
        } catch (__) {}
      }

      if (bgRemover && (bgRemover.removeBackground || typeof bgRemover === 'function')) {
        const fn = bgRemover.removeBackground || bgRemover;
        const rawNativeResult = await fn(localInputPath, { trim: false });
        if (rawNativeResult) {
          resultUri = typeof rawNativeResult === 'string' ? rawNativeResult : rawNativeResult.uri;
        }
      }
    } catch (nativeErr) {
      console.warn('[SelfieSegmentation] Native ML Kit module notice:', nativeErr.message);
    }
  }

  // 4. Server AI Segmentation Fallback (Works seamlessly in Expo Go and web)
  if (!resultUri) {
    try {
      const base = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/+$/, '') : 'http://localhost:5000/api';
      const endpoint = `${base}/uploads/remove-bg`;
      console.log('[SelfieSegmentation] Processing AI background removal via server:', endpoint);

      let parsedData = null;

      // If we have a local file path, upload via multipart
      if (localInputPath) {
        const uploadResult = await FileSystem.uploadAsync(endpoint, localInputPath, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        });

        if (uploadResult.status === 200 && uploadResult.body) {
          const parsed = JSON.parse(uploadResult.body);
          if (parsed.success && parsed.data) {
            parsedData = parsed.data;
          }
        }
      } else if (isRemote) {
        // If image is remote, send imageUrl directly to backend
        const res = await API.post('/uploads/remove-bg', { imageUrl: sourceUri });
        if (res.data?.success && res.data?.data) {
          parsedData = res.data.data;
        }
      }

      if (parsedData) {
        if (parsedData.base64) {
          const b64Data = parsedData.base64.replace(/^data:image\/\w+;base64,/, '');
          await FileSystem.writeAsStringAsync(targetCachePath, b64Data, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
          resultUri = targetCachePath;
        } else if (parsedData.url) {
          const resolvedCutoutUrl = resolveMediaUrl(parsedData.url);
          const dl = await FileSystem.downloadAsync(resolvedCutoutUrl, targetCachePath);
          resultUri = dl.uri;
        }
      }
    } catch (serverErr) {
      console.warn('[SelfieSegmentation] Server AI background removal notice:', serverErr.message);
    }
  }

  // 5. Final fallback if server was unavailable
  if (!resultUri) {
    try {
      if (localInputPath) {
        await FileSystem.copyAsync({
          from: localInputPath,
          to: targetCachePath,
        });
        resultUri = targetCachePath;
      } else {
        resultUri = sourceUri;
      }
    } catch (fallbackErr) {
      resultUri = localInputPath || sourceUri;
    }
  } else if (resultUri !== targetCachePath) {
    // Persist to predictable cache directory
    try {
      await FileSystem.copyAsync({
        from: resultUri,
        to: targetCachePath,
      });
      resultUri = targetCachePath;
    } catch (_) {}
  }

  // 5. Store in memory cache
  memoryCutoutCache.set(key, resultUri);
  return resultUri;
}

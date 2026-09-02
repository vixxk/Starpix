import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

/**
 * Uploads a local image or media file to backend S3 storage via Expo FileSystem native multipart upload.
 * Avoids JS FormData/Axios boundary serialization issues in React Native.
 * Returns the hosted HTTPS S3 URL (or clean media URL).
 *
 * @param {string} uri Local file URI (file://..., content://...) or base64
 * @param {string} folder Target folder inside S3 bucket (default: 'user-profiles')
 * @returns {Promise<string|null>} The uploaded HTTPS URL
 */
export async function uploadUserMedia(uri, folder = 'user-profiles') {
  if (!uri) return null;

  // If already a remote HTTPS S3 / CDN URL, return as-is
  if (
    typeof uri === 'string' &&
    (uri.startsWith('http://') || uri.startsWith('https://')) &&
    !uri.includes('localhost') &&
    !uri.includes('127.0.0.1') &&
    !uri.includes('192.168.')
  ) {
    return uri;
  }

  try {
    let fileToUpload = uri;

    // Handle base64 Data URI by saving to a temporary local file first
    if (typeof uri === 'string' && uri.startsWith('data:image/')) {
      const mimeType = uri.match(/^data:(image\/[a-zA-Z+]+);base64,/)?.[1] || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const base64Data = uri.split(',')[1];
      const tempPath = `${FileSystem.cacheDirectory}upload_temp_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
      fileToUpload = tempPath;
    }

    const uploadEndpoint = `${API.defaults.baseURL}/uploads`;
    const token = await AsyncStorage.getItem('starpix_user_token');
    const lang = await AsyncStorage.getItem('starpix_user_language');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (lang) headers['Accept-Language'] = lang;

    console.log('[UploadHelper] Uploading local file via Expo FileSystem native uploader:', fileToUpload);

    const uploadResult = await FileSystem.uploadAsync(
      uploadEndpoint,
      fileToUpload,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: {
          folder: folder,
        },
        headers,
      }
    );

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const responseData = JSON.parse(uploadResult.body);
      if (responseData && responseData.success && responseData.data?.url) {
        console.log('[UploadHelper] Media uploaded successfully to S3:', responseData.data.url);
        return responseData.data.url;
      }
    } else {
      console.error('[UploadHelper] Upload failed with status:', uploadResult.status, uploadResult.body);
    }

    return uri;
  } catch (err) {
    console.error('[UploadHelper] Error uploading media to S3:', err?.message || err);
    return uri;
  }
}

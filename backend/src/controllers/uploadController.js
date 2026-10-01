const asyncHandler = require('../utils/asyncHandler');
const { uploadToS3 } = require('../services/s3Service');
const sharp = require('sharp');

// @desc    Upload single media asset (image/video/frame/effect)
// @route   POST /api/uploads
// @access  Private (Admin / User)
const uploadSingleMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const folder = req.body.folder || 'media';
  let bufferToUpload = req.file.buffer;

  const isProfilePhoto = folder === 'user-profiles' || folder === 'avatars' || folder === 'profiles';

  // Process image assets: 1:1 square (512x512) for profile photos, 9:16 (1080x1920) for media templates
  if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
    try {
      if (isProfilePhoto) {
        bufferToUpload = await sharp(req.file.buffer)
          .resize(512, 512, { fit: 'cover', position: 'center' })
          .toBuffer();
        console.log('[Upload] Profile photo asset processed into 1:1 square (512x512 cover)');
      } else {
        bufferToUpload = await sharp(req.file.buffer)
          .resize(1080, 1920, { fit: 'cover', position: 'center' })
          .toBuffer();
        console.log('[Upload] Image asset processed into 9:16 aspect ratio (1080x1920 cover zoom)');
      }
    } catch (sharpErr) {
      console.error('[Upload] Error processing image ratio:', sharpErr.message);
    }
  }

  const fileUrl = await uploadToS3(bufferToUpload, req.file.originalname, req.file.mimetype, folder);

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: bufferToUpload.length,
    },
  });
});

// @desc    Proxy media image for CORS-safe processing
// @route   GET /api/uploads/proxy-image
// @access  Public / Admin
const proxyImage = asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL parameter is required' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: `Failed to fetch image: ${response.statusText}` });
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch image from URL: ' + err.message });
  }
});

module.exports = {
  uploadSingleMedia,
  proxyImage,
};


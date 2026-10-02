const asyncHandler = require('../utils/asyncHandler');
const { uploadToS3 } = require('../services/s3Service');
const sharp = require('sharp');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
  const isTemplateMedia = folder === 'templates' || folder === 'reels';

  // Process image assets: 1:1 square (512x512) for profile photos, 9:16 (1080x1920) for media templates
  if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
    try {
      if (isProfilePhoto) {
        bufferToUpload = await sharp(req.file.buffer)
          .resize(512, 512, { fit: 'cover', position: 'center' })
          .toBuffer();
        console.log('[Upload] Profile photo asset processed into 1:1 square (512x512 cover)');
      } else if (isTemplateMedia) {
        bufferToUpload = await sharp(req.file.buffer)
          .resize(1080, 1920, { fit: 'cover', position: 'center' })
          .toBuffer();
        console.log('[Upload] Image asset processed into 9:16 aspect ratio (1080x1920 cover zoom)');
      }
    } catch (sharpErr) {
      console.error('[Upload] Error processing image ratio:', sharpErr.message);
    }
  }

  // Process video assets for templates: ensure strict 9:16 (1080x1920) ratio for cross-platform consistency
  if (req.file.mimetype && req.file.mimetype.startsWith('video/') && isTemplateMedia) {
    try {
      const ext = path.extname(req.file.originalname) || '.mp4';
      const tmpInput = path.join(os.tmpdir(), `upload_${Date.now()}_input${ext}`);
      const tmpOutput = path.join(os.tmpdir(), `upload_${Date.now()}_916.mp4`);
      fs.writeFileSync(tmpInput, req.file.buffer);

      let probeOut = '';
      try {
        probeOut = execSync(
          `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${tmpInput}"`,
          { encoding: 'utf8' }
        ).trim();
      } catch (e) {}

      const [w, h] = probeOut ? probeOut.split('x').map(Number) : [0, 0];
      const isExact916 = w === 1080 && h === 1920;

      if (!isExact916) {
        console.log(`[Upload] Template video uploaded with size ${w}x${h}. Re-encoding to exact 9:16 (1080x1920) ratio...`);
        execSync(
          `ffmpeg -y -i "${tmpInput}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -movflags +faststart -crf 22 "${tmpOutput}"`,
          { stdio: 'pipe' }
        );
        if (fs.existsSync(tmpOutput) && fs.statSync(tmpOutput).size > 0) {
          bufferToUpload = fs.readFileSync(tmpOutput);
          console.log('[Upload] Video successfully normalized to 9:16 (1080x1920) ratio');
        }
      }

      try { if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput); } catch (e) {}
      try { if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput); } catch (e) {}
    } catch (videoErr) {
      console.error('[Upload] Error converting template video to 9:16:', videoErr.message);
    }
  }

  const fileUrl = await uploadToS3(bufferToUpload, req.file.originalname, req.file.mimetype, folder, req);

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


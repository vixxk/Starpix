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
          `ffmpeg -y -i "${tmpInput}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -movflags +faststart -crf 22 -c:a aac -b:a 192k "${tmpOutput}"`,
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

// @desc    Proxy media image for CORS-safe processing & DNS bypass on mobile devices
// @route   GET /api/uploads/proxy-image
// @access  Public / Admin
const proxyImage = asyncHandler(async (req, res) => {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL parameter is required' });
  }

  if (url.includes('d3arutsevouzgm.cloudfront.net')) {
    url = url.replace('d3arutsevouzgm.cloudfront.net', 'starpix-media-production.s3.ap-south-1.amazonaws.com');
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

const { fork } = require('child_process');
const { v4: uuidv4 } = require('uuid');

async function processBgRemovalWorker(inputPath) {
  return new Promise((resolve, reject) => {
    const workerScript = path.join(__dirname, '../utils/bgRemoverWorker.js');
    const child = fork(workerScript, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let isDone = false;

    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        child.kill('SIGKILL');
        reject(new Error('Background removal timed out after 30s'));
      }
    }, 30000);

    child.on('message', (msg) => {
      if (!isDone) {
        isDone = true;
        clearTimeout(timeout);
        child.kill();
        if (msg.success && msg.base64) {
          resolve(Buffer.from(msg.base64, 'base64'));
        } else {
          reject(new Error(msg.error || 'Worker failed'));
        }
      }
    });

    child.on('error', (err) => {
      if (!isDone) {
        isDone = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    child.on('exit', (code) => {
      if (!isDone) {
        isDone = true;
        clearTimeout(timeout);
        reject(new Error(`Worker exited with code ${code}`));
      }
    });

    child.send({ inputPath });
  });
}

async function processBgRemovalFal(imageUrlOrDataUri) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('No FAL_KEY available');

  const res = await fetch('https://fal.run/fal-ai/imageutils/rembg', {
    method: 'POST',
    headers: {
      Authorization: 'Key ' + falKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrlOrDataUri,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Fal error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const cutoutUrl = data?.image?.url || data?.url;
  if (!cutoutUrl) throw new Error('No cutout URL in Fal response');

  const imgRes = await fetch(cutoutUrl);
  if (!imgRes.ok) throw new Error('Failed to download Fal cutout image');
  const arrayBuf = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// @desc    Remove background from image using AI segmentation (Fal.ai + Isolated Worker fallback)
// @route   POST /api/uploads/remove-bg
// @access  Public / User
const removeImageBackground = asyncHandler(async (req, res) => {
  let inputPath = null;
  let dataUriForFal = null;
  const tempFilesToClean = [];

  try {
    if (req.file && req.file.buffer) {
      const mime = req.file.mimetype || 'image/jpeg';
      dataUriForFal = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      const ext = path.extname(req.file.originalname) || '.jpg';
      inputPath = path.join(os.tmpdir(), `bg_rem_in_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
      fs.writeFileSync(inputPath, req.file.buffer);
      tempFilesToClean.push(inputPath);
    } else if (req.body.imageUrl && typeof req.body.imageUrl === 'string') {
      const imageUrl = req.body.imageUrl.trim();
      if (imageUrl.startsWith('data:image/')) {
        dataUriForFal = imageUrl;
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          inputPath = path.join(os.tmpdir(), `bg_rem_in_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
          fs.writeFileSync(inputPath, Buffer.from(matches[2], 'base64'));
          tempFilesToClean.push(inputPath);
        }
      } else {
        let fetchUrl = imageUrl;
        if (fetchUrl.includes('d3arutsevouzgm.cloudfront.net')) {
          fetchUrl = fetchUrl.replace('d3arutsevouzgm.cloudfront.net', 'starpix-media-production.s3.ap-south-1.amazonaws.com');
        }
        try {
          const resp = await fetch(fetchUrl);
          if (resp.ok) {
            const arrBuf = await resp.arrayBuffer();
            const buf = Buffer.from(arrBuf);
            const ext = path.extname(fetchUrl.split('?')[0]) || '.jpg';
            inputPath = path.join(os.tmpdir(), `bg_rem_in_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
            fs.writeFileSync(inputPath, buf);
            tempFilesToClean.push(inputPath);
            const contentType = resp.headers.get('content-type') || 'image/jpeg';
            dataUriForFal = `data:${contentType};base64,${buf.toString('base64')}`;
          } else {
            console.warn(`[UploadController] Failed to download remote imageUrl (${resp.status}): ${fetchUrl}`);
            dataUriForFal = fetchUrl;
            inputPath = fetchUrl;
          }
        } catch (fetchErr) {
          console.warn('[UploadController] Error fetching imageUrl:', fetchErr.message);
          dataUriForFal = fetchUrl;
          inputPath = fetchUrl;
        }
      }
    } else if (req.body.imageBase64 && typeof req.body.imageBase64 === 'string') {
      const rawB64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      dataUriForFal = req.body.imageBase64.startsWith('data:') ? req.body.imageBase64 : `data:image/jpeg;base64,${rawB64}`;
      inputPath = path.join(os.tmpdir(), `bg_rem_in_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
      fs.writeFileSync(inputPath, Buffer.from(rawB64, 'base64'));
      tempFilesToClean.push(inputPath);
    }

    if (!inputPath && !dataUriForFal) {
      return res.status(400).json({ success: false, message: 'No image provided for background removal' });
    }

    console.log('[UploadController] Processing background removal...');
    let pngBuffer = null;

    // 1. Primary: Use Fal.ai AI background removal (high quality, fast, no native C++ memory leaks)
    if (process.env.FAL_KEY && dataUriForFal) {
      try {
        console.time('fal-bg-removal');
        pngBuffer = await processBgRemovalFal(dataUriForFal);
        console.timeEnd('fal-bg-removal');
        console.log('[UploadController] Background removal succeeded via Fal.ai');
      } catch (falErr) {
        console.warn('[UploadController] Fal.ai background removal notice:', falErr.message);
      }
    }

    // 2. Secondary fallback: Isolated child-process worker running @imgly/background-removal-node
    if (!pngBuffer && inputPath) {
      try {
        console.time('worker-bg-removal');
        pngBuffer = await processBgRemovalWorker(inputPath);
        console.timeEnd('worker-bg-removal');
        console.log('[UploadController] Background removal succeeded via isolated worker');
      } catch (workerErr) {
        console.warn('[UploadController] Isolated worker background removal notice:', workerErr.message);
      }
    }

    if (!pngBuffer) {
      throw new Error('Both Fal.ai and local segmentation workers were unable to process image');
    }

    // Save cutout locally so it is immediately accessible via local network without S3 DNS issues
    const { saveLocally } = require('../services/s3Service');
    const fileName = `cutout_${Date.now()}.png`;
    const objectKey = `user-cutouts/${uuidv4()}.png`;
    const localUrl = saveLocally(pngBuffer, objectKey, 'user-cutouts', req);

    // Also upload to S3 if configured
    let s3Url = localUrl;
    try {
      s3Url = await uploadToS3(pngBuffer, fileName, 'image/png', 'user-cutouts', req);
    } catch (_) {}

    res.status(200).json({
      success: true,
      data: {
        url: localUrl || s3Url,
        localUrl: localUrl,
        s3Url: s3Url,
        base64: `data:image/png;base64,${pngBuffer.toString('base64')}`,
        size: pngBuffer.length,
      },
    });
  } catch (err) {
    console.error('[UploadController] Error removing background:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove background: ' + err.message,
    });
  } finally {
    for (const f of tempFilesToClean) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
  }
});

module.exports = {
  uploadSingleMedia,
  proxyImage,
  removeImageBackground,
};


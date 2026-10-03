const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { uploadToS3 } = require('./s3Service');

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

/**
 * Checks whether a URL or path represents a video file
 */
const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

/**
 * Downloads a remote URL or resolves a local file to a temp file path
 */
async function downloadToTemp(urlOrPath, tempDir, prefix = 'media') {
  if (!urlOrPath) return null;

  const extMatch = typeof urlOrPath === 'string' ? urlOrPath.match(/\.([a-zA-Z0-9]+)(\?.*)?$/) : null;
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.tmp';
  const destPath = path.join(tempDir, `${prefix}_${uuidv4()}${ext}`);

  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const res = await fetch(urlOrPath, {
      headers: { 'User-Agent': 'StarpixMediaRenderer/1.0' },
    });
    if (!res.ok) throw new Error(`Failed to fetch media from ${urlOrPath}: status ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuf));
    return destPath;
  }

  // Handle data URI
  if (urlOrPath.startsWith('data:')) {
    const base64Data = urlOrPath.split(',')[1];
    fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
    return destPath;
  }

  // Handle local filesystem path
  if (fs.existsSync(urlOrPath)) {
    fs.copyFileSync(urlOrPath, destPath);
    return destPath;
  }

  return null;
}

/**
 * Reads a media source (URL, base64, or local path) into a Buffer
 */
async function getMediaBuffer(urlOrPath) {
  if (!urlOrPath) return null;
  if (Buffer.isBuffer(urlOrPath)) return urlOrPath;

  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const res = await fetch(urlOrPath, {
      headers: { 'User-Agent': 'StarpixMediaRenderer/1.0' },
    });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  if (urlOrPath.startsWith('data:')) {
    const base64Data = urlOrPath.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  if (fs.existsSync(urlOrPath)) {
    return fs.readFileSync(urlOrPath);
  }

  return null;
}

/**
 * Generates an SVG clipping mask matching the mobile app's getPhotoShapeStyles
 */
function getShapeMaskSvg(shape, w, h) {
  const minDim = Math.min(w, h);
  switch (shape) {
    case 'circle':
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${minDim / 2}" fill="#fff" />`;
    case 'rounded':
      const r = minDim * 0.2;
      return `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff" />`;
    case 'diamond':
      return `<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="#fff" />`;
    case 'hexagon':
      return `<polygon points="${w * 0.25},0 ${w * 0.75},0 ${w},${h / 2} ${w * 0.75},${h} ${w * 0.25},${h} 0,${h / 2}" fill="#fff" />`;
    case 'star':
      return `<polygon points="${w * 0.5},0 ${w * 0.61},${h * 0.35} ${w * 0.98},${h * 0.35} ${w * 0.68},${h * 0.57} ${w * 0.79},${h * 0.91} ${w * 0.5},${h * 0.70} ${w * 0.21},${h * 0.91} ${w * 0.32},${h * 0.57} ${w * 0.02},${h * 0.35} ${w * 0.39},${h * 0.35}" fill="#fff" />`;
    case 'heart':
      return `<polygon points="${w * 0.5},${h * 0.15} ${w * 0.65},0 ${w * 0.85},0 ${w},${h * 0.15} ${w},${h * 0.35} ${w * 0.5},${h * 0.90} 0,${h * 0.35} 0,${h * 0.15} ${w * 0.15},0 ${w * 0.35},0" fill="#fff" />`;
    case 'rectangle':
    default:
      return `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff" />`;
  }
}

/**
 * Escapes special XML characters for SVG text
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * Creates the shaped user photo buffer using Sharp
 */
async function processUserPhoto(photoBuffer, w, h, shape = 'rectangle') {
  if (!photoBuffer) return null;

  try {
    const resizedPhoto = await sharp(photoBuffer)
      .resize(w, h, { fit: 'cover', position: 'center' })
      .ensureAlpha()
      .toBuffer();

    const maskSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${getShapeMaskSvg(shape, w, h)}</svg>`;
    const maskBuffer = Buffer.from(maskSvg);

    const shapedPhoto = await sharp(resizedPhoto)
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .png()
      .toBuffer();

    return shapedPhoto;
  } catch (err) {
    console.error('[Renderer] Error shaping user photo:', err.message);
    return null;
  }
}

/**
 * Generates SVG buffer for User Name text layer
 */
function generateTextSvg(text, x, y, width, height, fontSize, fontColor = '#FFFFFF', textAlign = 'center', fontWeight = 'bold') {
  if (!text || !text.trim()) return null;

  const escapedText = escapeXml(text.trim());
  let anchor = 'middle';
  let textX = x + width / 2;

  if (textAlign === 'left') {
    anchor = 'start';
    textX = x;
  } else if (textAlign === 'right') {
    anchor = 'end';
    textX = x + width;
  }

  const textY = Math.round(y + height / 2 + fontSize * 0.35);

  const svgContent = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.95" />
        </filter>
      </defs>
      <text
        x="${textX}"
        y="${textY}"
        font-family="Noto Sans, sans-serif"
        font-size="${fontSize}"
        font-weight="${fontWeight}"
        fill="${fontColor}"
        text-anchor="${anchor}"
        filter="url(#textShadow)"
      >
        ${escapedText}
      </text>
    </svg>
  `;

  return Buffer.from(svgContent);
}

/**
 * Builds the composite transparent overlay PNG (containing shaped photo, text layer, and static footer if image)
 */
async function buildOverlayPng({
  photoBuffer,
  photoLayer,
  userNameText,
  effectiveTextLayer,
  imageFooterBuffer,
  footerRect,
  photoTransform,
  nameTransform,
}) {
  const composites = [];

  // 1. Static Image Footer (zIndex 10)
  if (imageFooterBuffer && footerRect) {
    try {
      const resizedFooter = await sharp(imageFooterBuffer)
        .resize(footerRect.width, footerRect.height, {
          fit: footerRect.fit === 'cover' ? 'cover' : 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      composites.push({
        input: resizedFooter,
        left: Math.max(0, footerRect.left),
        top: Math.max(0, footerRect.top),
      });
    } catch (e) {
      console.warn('[Renderer] Error preparing image footer:', e.message);
    }
  }

  // 2. Shaped User Photo (zIndex 15)
  if (photoBuffer && photoLayer) {
    const scale = photoTransform?.scale || 1;
    const photoW = Math.round(photoLayer.width * CANVAS_WIDTH * scale);
    const photoH = Math.round(photoLayer.height * CANVAS_HEIGHT * scale);
    const photoLeft = Math.round(photoLayer.x * CANVAS_WIDTH - photoW / 2 + (photoTransform?.offsetX || 0));
    const photoTop = Math.round(photoLayer.y * CANVAS_HEIGHT - photoH / 2 + (photoTransform?.offsetY || 0));

    const shaped = await processUserPhoto(photoBuffer, photoW, photoH, photoLayer.shape || 'rectangle');
    if (shaped) {
      composites.push({
        input: shaped,
        left: Math.max(0, photoLeft),
        top: Math.max(0, photoTop),
      });
    }
  }

  // 3. User Name Text (zIndex 20)
  if (userNameText && effectiveTextLayer) {
    const fontSizeScale = nameTransform?.fontSizeScale || 1;
    const effWidth = Math.round((effectiveTextLayer.width || 0.6) * CANVAS_WIDTH);
    const effHeight = Math.round((effectiveTextLayer.height || 0.1) * CANVAS_HEIGHT);
    const effLeft = Math.round(effectiveTextLayer.x * CANVAS_WIDTH - effWidth / 2 + (nameTransform?.offsetX || 0));
    const effTop = Math.round(effectiveTextLayer.y * CANVAS_HEIGHT - effHeight / 2 + (nameTransform?.offsetY || 0));
    const computedFontSize = Math.max(20, Math.round((effectiveTextLayer.fontSize || 22) * (CANVAS_WIDTH / 375) * fontSizeScale));

    const textSvgBuf = generateTextSvg(
      userNameText,
      effLeft,
      effTop,
      effWidth,
      effHeight,
      computedFontSize,
      effectiveTextLayer.fontColor || '#FFFFFF',
      effectiveTextLayer.textAlign || 'center',
      effectiveTextLayer.fontWeight || 'bold'
    );

    if (textSvgBuf) {
      composites.push({
        input: textSvgBuf,
        left: 0,
        top: 0,
      });
    }
  }

  if (composites.length === 0) {
    return null;
  }

  const baseTransparent = sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  return await baseTransparent.composite(composites).png().toBuffer();
}

/**
 * Main rendering method to composite full personalized template video or image
 */
async function renderPersonalizedTemplate({
  template,
  userNameText = '',
  userQuoteText = '',
  userPhotoUri = null,
  selectedFooter = null,
  photoTransform = {},
  nameTransform = {},
  req = null,
}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'starpix-render-'));
  const tempFilesToClean = [tempDir];

  try {
    // 1. Identify active footer
    const templateFooters = template.footers || [];
    let activeFooter = null;

    if (selectedFooter === 'none' || selectedFooter === null) {
      activeFooter = null;
    } else if (selectedFooter) {
      if (typeof selectedFooter === 'object') {
        activeFooter = selectedFooter;
      } else if (typeof selectedFooter === 'string') {
        activeFooter = templateFooters.find(
          (f) => String(f._id || f.id) === String(selectedFooter) || f.name === selectedFooter
        );
      }
    } else if (selectedFooter === undefined && templateFooters.length > 0) {
      activeFooter = templateFooters[0];
    }

    // 2. Identify Layers from CanvasConfig
    const canvasConfig = template.canvasConfig || {};
    const layers = canvasConfig.layers || [];

    let photoLayer = layers.find((l) => l.type === 'photo');
    let textLayer = layers.find((l) => l.type === 'text' && l.fieldName === 'name') || layers.find((l) => l.type === 'text');

    // Default layers fallback if template doesn't have canvas layers defined
    if (!photoLayer && userPhotoUri) {
      photoLayer = {
        x: 0.24,
        y: 0.88,
        width: 0.36,
        height: 0.22,
        shape: 'circle',
      };
    }

    let effectiveTextLayer = textLayer || {
      x: 0.72,
      y: 0.78,
      width: 0.75,
      height: 0.1,
      fontSize: 24,
      fontColor: '#FFFFFF',
      textAlign: 'left',
    };

    if (activeFooter && activeFooter.userNamePosition && activeFooter.userNamePosition.x !== undefined) {
      effectiveTextLayer = {
        ...effectiveTextLayer,
        ...activeFooter.userNamePosition,
      };
    }

    const effectiveName = userNameText || effectiveTextLayer.defaultValue || '';

    // 3. Determine media types
    const rawBgImage = canvasConfig.backgroundImage || template.mainMedia || template.previewAsset || template.thumbnail;
    const isBaseVideo = Boolean(template.type === 'video' || isVideoMedia(rawBgImage));

    const rawFooterAsset = activeFooter ? (activeFooter.videoAsset || activeFooter.asset) : null;
    const isFooterVideo = Boolean(rawFooterAsset && (activeFooter.type === 'video' || isVideoMedia(rawFooterAsset)));

    const isOutputVideo = isBaseVideo || isFooterVideo;

    // 4. Download / Fetch resources
    const baseMediaPath = await downloadToTemp(rawBgImage, tempDir, 'base');
    if (!baseMediaPath) {
      throw new Error('Failed to resolve template background media');
    }
    tempFilesToClean.push(baseMediaPath);

    let photoBuffer = null;
    if (userPhotoUri) {
      photoBuffer = await getMediaBuffer(userPhotoUri);
    }

    // 5. Calculate Footer Geometry
    let footerRect = null;
    let footerVideoPath = null;
    let imageFooterBuffer = null;

    if (activeFooter && rawFooterAsset) {
      const heightPct = activeFooter.heightPercent || activeFooter.configuration?.heightPercent || 40;
      const fit = activeFooter.objectFit || activeFooter.configuration?.objectFit || 'contain';
      const fWidth = Math.round((activeFooter.width !== undefined ? activeFooter.width : 1.0) * CANVAS_WIDTH);
      const fHeight = Math.round((activeFooter.height !== undefined ? activeFooter.height : heightPct / 100) * CANVAS_HEIGHT);
      const fLeft = Math.round((activeFooter.x !== undefined ? activeFooter.x : 0.5) * CANVAS_WIDTH - fWidth / 2);
      const fTop = Math.round((activeFooter.y !== undefined ? activeFooter.y : (1 - heightPct / 200)) * CANVAS_HEIGHT - fHeight / 2);

      footerRect = {
        width: fWidth,
        height: fHeight,
        left: fLeft,
        top: fTop,
        fit,
      };

      if (isFooterVideo) {
        footerVideoPath = await downloadToTemp(rawFooterAsset, tempDir, 'foot_vid');
        if (footerVideoPath) tempFilesToClean.push(footerVideoPath);
      } else {
        imageFooterBuffer = await getMediaBuffer(rawFooterAsset);
      }
    }

    // 6. Build the static overlay PNG (User photo + User name + Static Image footer if not video)
    const overlayBuffer = await buildOverlayPng({
      photoBuffer,
      photoLayer,
      userNameText: effectiveName,
      effectiveTextLayer,
      imageFooterBuffer: !isFooterVideo ? imageFooterBuffer : null,
      footerRect: !isFooterVideo ? footerRect : null,
      photoTransform,
      nameTransform,
    });

    let overlayPngPath = null;
    if (overlayBuffer) {
      overlayPngPath = path.join(tempDir, `overlay_${Date.now()}.png`);
      fs.writeFileSync(overlayPngPath, overlayBuffer);
      tempFilesToClean.push(overlayPngPath);
    }

    // 7. Render Output Video or Image
    if (isOutputVideo) {
      const outputVideoPath = path.join(tempDir, `rendered_${Date.now()}.mp4`);
      tempFilesToClean.push(outputVideoPath);

      let ffmpegCmd = '';

      if (isBaseVideo) {
        if (isFooterVideo && footerVideoPath) {
          // Both base and footer are videos:
          // [0:v] is base video
          // [1:v] is footer video
          // [2:v] is overlay PNG (photo + name)
          const fWidth = footerRect.width;
          const fHeight = footerRect.height;
          const fLeft = footerRect.left;
          const fTop = footerRect.top;
          const fitMode = footerRect.fit;

          let footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=increase,crop=${fWidth}:${fHeight}`;
          if (fitMode === 'contain') {
            footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=decrease,pad=${fWidth}:${fHeight}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
          }

          if (overlayPngPath) {
            ffmpegCmd = `ffmpeg -y -i "${baseMediaPath}" -stream_loop -1 -i "${footerVideoPath}" -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[tmp];[tmp][2:v]overlay=0:0[outv]" -map "[outv]" -map 0:a? -shortest -c:v libx264 -preset veryfast -crf 22 -c:a aac -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          } else {
            ffmpegCmd = `ffmpeg -y -i "${baseMediaPath}" -stream_loop -1 -i "${footerVideoPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[outv]" -map "[outv]" -map 0:a? -shortest -c:v libx264 -preset veryfast -crf 22 -c:a aac -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          }
        } else {
          // Base is video, footer is static image or no footer (overlayPngPath already has footer, photo, text)
          if (overlayPngPath) {
            ffmpegCmd = `ffmpeg -y -i "${baseMediaPath}" -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[base][1:v]overlay=0:0[outv]" -map "[outv]" -map 0:a? -c:v libx264 -preset veryfast -crf 22 -c:a aac -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          } else {
            ffmpegCmd = `ffmpeg -y -i "${baseMediaPath}" -vf "scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}" -c:v libx264 -preset veryfast -crf 22 -c:a copy -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          }
        }
      } else {
        // Base is static image, but footer is video (animated status video!)
        const fWidth = footerRect ? footerRect.width : CANVAS_WIDTH;
        const fHeight = footerRect ? footerRect.height : Math.round(0.4 * CANVAS_HEIGHT);
        const fLeft = footerRect ? footerRect.left : 0;
        const fTop = footerRect ? footerRect.top : Math.round(0.6 * CANVAS_HEIGHT);

        let footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=increase,crop=${fWidth}:${fHeight}`;
        if (footerRect?.fit === 'contain') {
          footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=decrease,pad=${fWidth}:${fHeight}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
        }

        if (overlayPngPath) {
          ffmpegCmd = `ffmpeg -y -loop 1 -i "${baseMediaPath}" -i "${footerVideoPath}" -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[tmp];[tmp][2:v]overlay=0:0[outv]" -map "[outv]" -map 1:a? -shortest -c:v libx264 -preset veryfast -crf 22 -c:a aac -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
        } else {
          ffmpegCmd = `ffmpeg -y -loop 1 -i "${baseMediaPath}" -i "${footerVideoPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[outv]" -map "[outv]" -map 1:a? -shortest -c:v libx264 -preset veryfast -crf 22 -c:a aac -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
        }
      }

      console.log('[Renderer] Executing FFmpeg video render...');
      execSync(ffmpegCmd, { stdio: 'pipe' });

      if (!fs.existsSync(outputVideoPath) || fs.statSync(outputVideoPath).size === 0) {
        throw new Error('FFmpeg failed to produce final video');
      }

      const videoBuffer = fs.readFileSync(outputVideoPath);
      const s3Url = await uploadToS3(videoBuffer, `status_${Date.now()}.mp4`, 'video/mp4', 'user-creations', req);

      return {
        downloadUrl: s3Url,
        format: 'mp4',
        isVideo: true,
      };
    } else {
      // Both base and footer are images (Static 1080x1920 image template)
      const baseImageBuffer = fs.readFileSync(baseMediaPath);
      let sharpCanvas = sharp(baseImageBuffer)
        .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: 'cover', position: 'center' });

      if (overlayBuffer) {
        sharpCanvas = sharpCanvas.composite([{ input: overlayBuffer, left: 0, top: 0 }]);
      }

      const finalJpgBuffer = await sharpCanvas.jpeg({ quality: 95 }).toBuffer();
      const s3Url = await uploadToS3(finalJpgBuffer, `status_${Date.now()}.jpg`, 'image/jpeg', 'user-creations', req);

      return {
        downloadUrl: s3Url,
        format: 'jpg',
        isVideo: false,
      };
    }
  } finally {
    // Clean up temporary files
    for (const f of tempFilesToClean) {
      try {
        if (fs.existsSync(f)) {
          const stat = fs.statSync(f);
          if (stat.isDirectory()) {
            fs.rmSync(f, { recursive: true, force: true });
          } else {
            fs.unlinkSync(f);
          }
        }
      } catch (cleanErr) {}
    }
  }
}

module.exports = {
  renderPersonalizedTemplate,
  isVideoMedia,
};

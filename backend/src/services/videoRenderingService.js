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
 * Extracts video duration in seconds via ffprobe
 */
function getVideoDuration(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10000 }
    ).toString().trim();
    const num = parseFloat(out);
    return !isNaN(num) && num > 0 ? num : null;
  } catch (e) {
    return null;
  }
}

/**
 * Checks whether a media file contains an audio stream
 */
function hasAudioStream(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  try {
    const out = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10000 }
    ).toString().trim();
    return Boolean(out && out.length > 0);
  } catch (e) {
    return false;
  }
}

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
 * Generates an SVG clipping mask matching the mobile app's ShapeClippedPhoto
 */
function getShapeMaskSvg(shape, w, h) {
  const minDim = Math.min(w, h);
  const heartPoints = `${w * 0.5},${h * 0.15} ${w * 0.65},0 ${w * 0.85},0 ${w},${h * 0.15} ${w},${h * 0.35} ${w * 0.5},${h * 0.90} 0,${h * 0.35} 0,${h * 0.15} ${w * 0.15},0 ${w * 0.35},0`;
  const diamondPoints = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
  const hexagonPoints = `${w * 0.25},0 ${w * 0.75},0 ${w},${h / 2} ${w * 0.75},${h} ${w * 0.25},${h} 0,${h / 2}`;
  const starPoints = `${w * 0.5},0 ${w * 0.61},${h * 0.35} ${w * 0.98},${h * 0.35} ${w * 0.68},${h * 0.57} ${w * 0.79},${h * 0.91} ${w * 0.5},${h * 0.70} ${w * 0.21},${h * 0.91} ${w * 0.32},${h * 0.57} ${w * 0.02},${h * 0.35} ${w * 0.39},${h * 0.35}`;

  switch (String(shape || '').toLowerCase()) {
    case 'circle':
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${minDim / 2}" fill="#fff" />`;
    case 'rounded':
      const r = minDim * 0.2;
      return `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff" />`;
    case 'diamond':
      return `<polygon points="${diamondPoints}" fill="#fff" />`;
    case 'hexagon':
      return `<polygon points="${hexagonPoints}" fill="#fff" />`;
    case 'star':
      return `<polygon points="${starPoints}" fill="#fff" />`;
    case 'heart':
      return `<polygon points="${heartPoints}" fill="#fff" />`;
    case 'rectangle':
    default:
      return `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff" />`;
  }
}

/**
 * Generates outer white border stroke matching the mobile app's ShapeClippedPhoto renderStrokeShape
 */
function getShapeStrokeSvg(shape, w, h, strokeWidth = 3) {
  const minDim = Math.min(w, h);
  const halfStroke = strokeWidth / 2;
  const heartPoints = `${w * 0.5},${h * 0.15} ${w * 0.65},0 ${w * 0.85},0 ${w},${h * 0.15} ${w},${h * 0.35} ${w * 0.5},${h * 0.90} 0,${h * 0.35} 0,${h * 0.15} ${w * 0.15},0 ${w * 0.35},0`;
  const diamondPoints = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
  const hexagonPoints = `${w * 0.25},0 ${w * 0.75},0 ${w},${h / 2} ${w * 0.75},${h} ${w * 0.25},${h} 0,${h / 2}`;
  const starPoints = `${w * 0.5},0 ${w * 0.61},${h * 0.35} ${w * 0.98},${h * 0.35} ${w * 0.68},${h * 0.57} ${w * 0.79},${h * 0.91} ${w * 0.5},${h * 0.70} ${w * 0.21},${h * 0.91} ${w * 0.32},${h * 0.57} ${w * 0.02},${h * 0.35} ${w * 0.39},${h * 0.35}`;

  switch (String(shape || '').toLowerCase()) {
    case 'circle':
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${minDim / 2 - halfStroke}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'rounded':
      const r = minDim * 0.2;
      return `<rect x="${halfStroke}" y="${halfStroke}" width="${w - strokeWidth}" height="${h - strokeWidth}" rx="${r}" ry="${r}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'diamond':
      return `<polygon points="${diamondPoints}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'hexagon':
      return `<polygon points="${hexagonPoints}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'star':
      return `<polygon points="${starPoints}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'heart':
      return `<polygon points="${heartPoints}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
    case 'rectangle':
    default:
      return `<rect x="${halfStroke}" y="${halfStroke}" width="${w - strokeWidth}" height="${h - strokeWidth}" stroke="#FFFFFF" stroke-width="${strokeWidth}" fill="none" />`;
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
 * Creates the shaped user photo buffer using Sharp with exact shape, crisp white stroke border,
 * and default avatar placeholder if no user photo was provided.
 */
async function processUserPhoto(photoBuffer, w, h, shape = 'rectangle') {
  const minDim = Math.min(w, h);
  const strokeSvg = getShapeStrokeSvg(shape, w, h, 3);
  const maskSvg = getShapeMaskSvg(shape, w, h);

  if (!photoBuffer) {
    // Generate default avatar placeholder matching mobile ShapeClippedPhoto:
    // Base dark background #1E293B, persona icon in #94A3B8, and outer stroke border
    const avatarSvg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="shapeClip_${shape}">
            ${maskSvg}
          </clipPath>
        </defs>
        <g clip-path="url(#shapeClip_${shape})">
          <rect x="0" y="0" width="${w}" height="${h}" fill="#1E293B" />
          <g transform="translate(${w / 2 - minDim * 0.22}, ${h / 2 - minDim * 0.22})">
            <circle cx="${minDim * 0.22}" cy="${minDim * 0.16}" r="${minDim * 0.12}" fill="#94A3B8" />
            <rect x="${minDim * 0.06}" y="${minDim * 0.32}" width="${minDim * 0.32}" height="${minDim * 0.2}" rx="${minDim * 0.1}" fill="#94A3B8" />
          </g>
        </g>
        ${strokeSvg}
      </svg>
    `;
    try {
      return await sharp(Buffer.from(avatarSvg)).png().toBuffer();
    } catch (e) {
      console.warn('[Renderer] Error generating avatar placeholder:', e.message);
      return null;
    }
  }

  try {
    const resizedPhoto = await sharp(photoBuffer)
      .resize(w, h, { fit: 'cover', position: 'center' })
      .ensureAlpha()
      .toBuffer();

    const maskBuffer = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${maskSvg}</svg>`);
    const borderBuffer = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${strokeSvg}</svg>`);

    const shapedPhoto = await sharp(resizedPhoto)
      .composite([
        { input: maskBuffer, blend: 'dest-in' },
        { input: borderBuffer, blend: 'over' },
      ])
      .png()
      .toBuffer();

    return shapedPhoto;
  } catch (err) {
    console.error('[Renderer] Error shaping user photo:', err.message);
    return null;
  }
}

/**
 * Generates SVG buffer for User Name text layer matching mobile text rendering with drop shadow
 */
function generateTextSvg(text, x, y, width, height, fontSize, fontColor = '#FFFFFF', textAlign = 'center', fontWeight = 'bold') {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();
  const escapedText = escapeXml(trimmedText);

  // Auto-fit font size if text exceeds width (mimicking adjustsFontSizeToFit)
  let effFontSize = fontSize;
  const approxTextWidth = trimmedText.length * fontSize * 0.58;
  if (approxTextWidth > width && width > 0) {
    effFontSize = Math.max(16, Math.floor((width / approxTextWidth) * fontSize));
  }

  let anchor = 'middle';
  let textX = x + width / 2;

  if (textAlign === 'left') {
    anchor = 'start';
    textX = x;
  } else if (textAlign === 'right') {
    anchor = 'end';
    textX = x + width;
  }

  const textY = Math.round(y + height / 2 + effFontSize * 0.35);

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
        font-family="sans-serif"
        font-size="${effFontSize}"
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
          fit: footerRect.fit === 'fill' ? 'fill' : (footerRect.fit === 'cover' ? 'cover' : 'contain'),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      composites.push({
        input: resizedFooter,
        left: footerRect.left,
        top: footerRect.top,
      });
    } catch (e) {
      console.warn('[Renderer] Error preparing image footer:', e.message);
    }
  }

  // 2. Shaped User Photo with White Border (zIndex 15)
  if (photoLayer) {
    const scale = photoTransform?.scale || 1;
    const photoW = Math.max(40, Math.round(photoLayer.width * CANVAS_WIDTH * scale));
    const photoH = Math.max(40, Math.round(photoLayer.height * CANVAS_HEIGHT * scale));
    const photoLeft = Math.round(photoLayer.x * CANVAS_WIDTH - photoW / 2 + (photoTransform?.offsetX || 0));
    const photoTop = Math.round(photoLayer.y * CANVAS_HEIGHT - photoH / 2 + (photoTransform?.offsetY || 0));

    const shaped = await processUserPhoto(photoBuffer, photoW, photoH, photoLayer.shape || 'rectangle');
    if (shaped) {
      composites.push({
        input: shaped,
        left: photoLeft,
        top: photoTop,
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
        activeFooter = { ...selectedFooter };
      } else if (typeof selectedFooter === 'string') {
        const found = templateFooters.find(
          (f) => String(f._id || f.id) === String(selectedFooter) || f.name === selectedFooter
        );
        if (found) {
          activeFooter = typeof found.toObject === 'function' ? found.toObject() : { ...found };
        }
      }
    } else if (selectedFooter === undefined && templateFooters.length > 0) {
      const f = templateFooters[0];
      activeFooter = typeof f.toObject === 'function' ? f.toObject() : { ...f };
    }

    // Merge with DB footer definition if available to ensure all admin properties are present
    if (activeFooter && (activeFooter._id || activeFooter.id)) {
      const dbMatch = templateFooters.find(
        (f) => String(f._id || f.id) === String(activeFooter._id || activeFooter.id) || f.name === activeFooter.name
      );
      if (dbMatch) {
        const dbObj = typeof dbMatch.toObject === 'function' ? dbMatch.toObject() : dbMatch;
        activeFooter = {
          ...dbObj,
          ...activeFooter,
          userPhotoPosition: activeFooter.userPhotoPosition || dbObj.userPhotoPosition || null,
          userNamePosition: activeFooter.userNamePosition || dbObj.userNamePosition || null,
          userPhotoShape: activeFooter.userPhotoShape || dbObj.userPhotoShape || activeFooter.shape || dbObj.shape || null,
        };
      }
    }

    // 2. Identify Layers from CanvasConfig & Active Footer
    const canvasConfig = template.canvasConfig || req?.body?.customizationState?.canvasConfig || {};
    const canvasLayers = canvasConfig.layers || [];

    const basePhotoLayer = canvasLayers.find((l) => l.type === 'photo');
    const footerPhotoPos = activeFooter?.userPhotoPosition;
    const footerPhotoShape = activeFooter?.userPhotoShape || activeFooter?.shape || activeFooter?.userPhotoPosition?.shape;

    let effectivePhotoLayer = (basePhotoLayer || footerPhotoPos || footerPhotoShape || userPhotoUri)
      ? {
          x: footerPhotoPos?.x !== undefined
            ? (footerPhotoPos.x > 1 ? footerPhotoPos.x / 100 : footerPhotoPos.x)
            : (basePhotoLayer?.x !== undefined ? (basePhotoLayer.x > 1 ? basePhotoLayer.x / 100 : basePhotoLayer.x) : 0.25),
          y: footerPhotoPos?.y !== undefined
            ? (footerPhotoPos.y > 1 ? footerPhotoPos.y / 100 : footerPhotoPos.y)
            : (basePhotoLayer?.y !== undefined ? (basePhotoLayer.y > 1 ? basePhotoLayer.y / 100 : basePhotoLayer.y) : 0.8),
          width: footerPhotoPos?.width !== undefined
            ? (footerPhotoPos.width > 1 ? footerPhotoPos.width / 100 : footerPhotoPos.width)
            : (basePhotoLayer?.width !== undefined ? (basePhotoLayer.width > 1 ? basePhotoLayer.width / 100 : basePhotoLayer.width) : 0.35),
          height: footerPhotoPos?.height !== undefined
            ? (footerPhotoPos.height > 1 ? footerPhotoPos.height / 100 : footerPhotoPos.height)
            : (basePhotoLayer?.height !== undefined ? (basePhotoLayer.height > 1 ? basePhotoLayer.height / 100 : basePhotoLayer.height) : 0.22),
          shape: footerPhotoShape || footerPhotoPos?.shape || basePhotoLayer?.shape || 'circle',
        }
      : null;

    const baseTextNameLayer = canvasLayers.find((l) => l.type === 'text' && l.fieldName === 'name') || canvasLayers.find((l) => l.type === 'text');
    const footerTextPos = activeFooter?.userNamePosition;
    const defaultTextX = effectivePhotoLayer?.x !== undefined ? effectivePhotoLayer.x : 0.5;

    let effectiveTextLayer = (baseTextNameLayer || footerTextPos || userNameText)
      ? {
          x: footerTextPos?.x !== undefined
            ? (footerTextPos.x > 1 ? footerTextPos.x / 100 : footerTextPos.x)
            : (baseTextNameLayer?.x !== undefined ? (baseTextNameLayer.x > 1 ? baseTextNameLayer.x / 100 : baseTextNameLayer.x) : defaultTextX),
          y: footerTextPos?.y !== undefined
            ? (footerTextPos.y > 1 ? footerTextPos.y / 100 : footerTextPos.y)
            : (baseTextNameLayer?.y !== undefined ? (baseTextNameLayer.y > 1 ? baseTextNameLayer.y / 100 : baseTextNameLayer.y) : 0.75),
          width: footerTextPos?.width !== undefined
            ? (footerTextPos.width > 1 ? footerTextPos.width / 100 : footerTextPos.width)
            : (baseTextNameLayer?.width !== undefined ? (baseTextNameLayer.width > 1 ? baseTextNameLayer.width / 100 : baseTextNameLayer.width) : 0.6),
          height: footerTextPos?.height !== undefined
            ? (footerTextPos.height > 1 ? footerTextPos.height / 100 : footerTextPos.height)
            : (baseTextNameLayer?.height !== undefined ? (baseTextNameLayer.height > 1 ? baseTextNameLayer.height / 100 : baseTextNameLayer.height) : 0.1),
          fontSize: footerTextPos?.fontSize !== undefined
            ? footerTextPos.fontSize
            : (baseTextNameLayer?.fontSize !== undefined ? baseTextNameLayer.fontSize : 22),
          fontColor: footerTextPos?.fontColor || baseTextNameLayer?.fontColor || '#FFFFFF',
          textAlign: footerTextPos?.textAlign || baseTextNameLayer?.textAlign || 'center',
          fontWeight: footerTextPos?.fontWeight || baseTextNameLayer?.fontWeight || 'bold',
        }
      : null;

    const effectiveName = userNameText || effectiveTextLayer?.defaultValue || '';

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

    // 5. Calculate Footer Geometry matching mobile index.jsx
    let footerRect = null;
    let footerVideoPath = null;
    let imageFooterBuffer = null;

    if (activeFooter && rawFooterAsset) {
      const heightVal = activeFooter.height !== undefined
        ? activeFooter.height
        : (activeFooter.heightPercent ? activeFooter.heightPercent / 100 : 0.4);
      const heightNorm = typeof heightVal === 'number'
        ? (heightVal > 1 ? heightVal / 100 : heightVal)
        : 0.4;

      const widthVal = activeFooter.width !== undefined ? activeFooter.width : 1.0;
      const widthNorm = typeof widthVal === 'number'
        ? (widthVal > 1 ? widthVal / 100 : widthVal)
        : 1.0;

      const fWidth = Math.round(widthNorm * CANVAS_WIDTH);
      const fHeight = Math.round(heightNorm * CANVAS_HEIGHT);

      const xVal = activeFooter.x !== undefined ? activeFooter.x : 0.5;
      const xNorm = typeof xVal === 'number' ? (xVal > 1 ? xVal / 100 : xVal) : 0.5;

      const yVal = activeFooter.y !== undefined ? activeFooter.y : (1 - heightNorm / 2);
      const yNorm = typeof yVal === 'number' ? (yVal > 1 ? yVal / 100 : yVal) : (1 - heightNorm / 2);

      const fLeft = Math.round(xNorm * CANVAS_WIDTH - fWidth / 2);
      const fTop = Math.round(yNorm * CANVAS_HEIGHT - fHeight / 2);

      const fitMode = activeFooter.objectFit === 'cover'
        ? 'cover'
        : activeFooter.objectFit === 'fill'
        ? 'fill'
        : 'contain';

      footerRect = {
        width: fWidth,
        height: fHeight,
        left: fLeft,
        top: fTop,
        fit: fitMode,
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
      photoLayer: effectivePhotoLayer,
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
      const baseHasAudio = hasAudioStream(baseMediaPath);
      const footerHasAudio = Boolean(isFooterVideo && footerVideoPath && hasAudioStream(footerVideoPath));

      if (isBaseVideo) {
        const baseDuration = getVideoDuration(baseMediaPath);
        const durationLimit = baseDuration ? Math.min(60, Math.max(3, baseDuration)) : 15;
        const durationArg = `-t ${durationLimit}`;
        const fadeStart = Math.max(0, durationLimit - 0.5);
        const audioFadeFilter = `-af "afade=t=out:st=${fadeStart}:d=0.5"`;

        let audioMapArg = '';
        if (baseHasAudio) {
          audioMapArg = `-map 0:a:0? ${audioFadeFilter} -c:a aac -b:a 192k`;
        } else if (footerHasAudio) {
          audioMapArg = `-map 1:a:0? ${audioFadeFilter} -c:a aac -b:a 192k`;
        }

        if (isFooterVideo && footerVideoPath) {
          // Both base and footer are videos:
          const fWidth = footerRect.width;
          const fHeight = footerRect.height;
          const fLeft = footerRect.left;
          const fTop = footerRect.top;
          const fitMode = footerRect.fit;

          let footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=increase,crop=${fWidth}:${fHeight}`;
          if (fitMode === 'contain') {
            footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=decrease,pad=${fWidth}:${fHeight}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
          } else if (fitMode === 'fill') {
            footScaleFilter = `scale=${fWidth}:${fHeight}`;
          }

          if (overlayPngPath) {
            ffmpegCmd = `ffmpeg -y -threads 2 -i "${baseMediaPath}" -stream_loop -1 -i "${footerVideoPath}" -loop 1 -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[tmp];[tmp][2:v]overlay=0:0[outv]" -map "[outv]" ${audioMapArg} ${durationArg} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          } else {
            ffmpegCmd = `ffmpeg -y -threads 2 -i "${baseMediaPath}" -stream_loop -1 -i "${footerVideoPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}:eof_action=pass[outv]" -map "[outv]" ${audioMapArg} ${durationArg} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          }
        } else {
          // Base is video, footer is static image or no footer (overlayPngPath already has footer, photo, text)
          if (overlayPngPath) {
            ffmpegCmd = `ffmpeg -y -threads 2 -i "${baseMediaPath}" -loop 1 -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[base][1:v]overlay=0:0[outv]" -map "[outv]" ${audioMapArg} ${durationArg} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          } else {
            ffmpegCmd = `ffmpeg -y -threads 2 -i "${baseMediaPath}" -vf "scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}" ${audioMapArg} ${durationArg} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
          }
        }
      } else {
        // Base is static image, but footer is video (animated status video!)
        const footDuration = getVideoDuration(footerVideoPath);
        const targetDuration = footDuration ? Math.min(30, Math.max(5, footDuration)) : 15;
        const fadeStart = Math.max(0, targetDuration - 0.5);
        const audioFadeFilter = `-af "afade=t=out:st=${fadeStart}:d=0.5"`;

        let audioMapArg = '';
        if (footerHasAudio) {
          audioMapArg = `-map 1:a:0? ${audioFadeFilter} -c:a aac -b:a 192k`;
        }

        const fWidth = footerRect ? footerRect.width : CANVAS_WIDTH;
        const fHeight = footerRect ? footerRect.height : Math.round(0.4 * CANVAS_HEIGHT);
        const fLeft = footerRect ? footerRect.left : 0;
        const fTop = footerRect ? footerRect.top : Math.round(0.6 * CANVAS_HEIGHT);
        const fitMode = footerRect?.fit || 'contain';

        let footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=increase,crop=${fWidth}:${fHeight}`;
        if (fitMode === 'contain') {
          footScaleFilter = `scale=${fWidth}:${fHeight}:force_original_aspect_ratio=decrease,pad=${fWidth}:${fHeight}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
        } else if (fitMode === 'fill') {
          footScaleFilter = `scale=${fWidth}:${fHeight}`;
        }

        if (overlayPngPath) {
          ffmpegCmd = `ffmpeg -y -threads 2 -loop 1 -i "${baseMediaPath}" -i "${footerVideoPath}" -loop 1 -i "${overlayPngPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}[tmp];[tmp][2:v]overlay=0:0[outv]" -map "[outv]" ${audioMapArg} -t ${targetDuration} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
        } else {
          ffmpegCmd = `ffmpeg -y -threads 2 -loop 1 -i "${baseMediaPath}" -i "${footerVideoPath}" -filter_complex "[0:v]scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=increase,crop=${CANVAS_WIDTH}:${CANVAS_HEIGHT}[base];[1:v]${footScaleFilter}[foot];[base][foot]overlay=${fLeft}:${fTop}[outv]" -map "[outv]" ${audioMapArg} -t ${targetDuration} -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputVideoPath}"`;
        }
      }

      console.log('[Renderer] Executing FFmpeg video render...');
      execSync(ffmpegCmd, { stdio: 'pipe', timeout: 120000 });

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

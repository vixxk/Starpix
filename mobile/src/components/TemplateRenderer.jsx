import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AppVideo, { ResizeMode } from './AppVideo';
import { COLORS, FONTS } from '../constants/colors';
import { resolveMediaUrl } from '../utils/media';
import { useCreationStore } from '../store/useCreationStore';

const isVideoMedia = (url) => {
  if (!url) return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

const getPhotoShapeStyles = (shape, width, height) => {
  const minDim = Math.min(width || 100, height || 100);
  switch (shape) {
    case 'circle':
      return {
        borderRadius: minDim / 2,
        clipPath: 'circle(50% at 50% 50%)',
      };
    case 'diamond':
      return {
        borderRadius: 0,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      };
    case 'hexagon':
      return {
        borderRadius: 0,
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      };
    case 'star':
      return {
        borderRadius: 0,
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      };
    case 'heart':
      return {
        borderRadius: 0,
        clipPath: 'polygon(50% 15%, 65% 0%, 85% 0%, 100% 15%, 100% 35%, 50% 90%, 0% 35%, 0% 15%, 15% 0%, 35% 0%)',
      };
    case 'rounded':
      return {
        borderRadius: minDim * 0.2,
        clipPath: 'inset(0 round 20%)',
      };
    case 'rectangle':
    default:
      return {
        borderRadius: 0,
        clipPath: 'none',
      };
  }
};

function DraggablePhotoLayer({
  layer,
  userPhotoUri,
  layerLeft,
  layerTop,
  layerWidth,
  layerHeight,
  onPressPhotoSlot,
  interactive = true,
}) {
  const shape = layer.shape || 'rectangle';
  const shapeStyle = getPhotoShapeStyles(shape, layerWidth, layerHeight);

  if (!userPhotoUri && !interactive) {
    return null;
  }

  const content = userPhotoUri ? (
    <Image
      source={{ uri: resolveMediaUrl(userPhotoUri) }}
      style={StyleSheet.absoluteFillObject}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.photoPlaceholderInner}>
      <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
    </View>
  );

  const containerStyle = [
    styles.layerContainer,
    {
      left: layerLeft,
      top: layerTop,
      width: layerWidth,
      height: layerHeight,
      zIndex: layer.zIndex !== undefined ? layer.zIndex : 15,
      overflow: 'hidden',
      borderWidth: userPhotoUri || !interactive ? 0 : 2,
      borderColor: COLORS.orange,
      borderStyle: userPhotoUri ? 'solid' : 'dashed',
      backgroundColor: userPhotoUri ? 'transparent' : (interactive ? 'rgba(225, 29, 72, 0.12)' : 'transparent'),
      ...shapeStyle,
    },
  ];

  if (!interactive) {
    return (
      <View style={containerStyle} pointerEvents="none">
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressPhotoSlot}
      style={containerStyle}
    >
      {content}
    </TouchableOpacity>
  );
}

function DraggableTextLayer({
  layer,
  textValue,
  layerLeft,
  layerTop,
  layerWidth,
  layerHeight,
  canvasWidth,
}) {
  if (!textValue || textValue.trim() === '') {
    return null;
  }

  const computedFontSize = Math.max(10, (layer.fontSize || 22) * (canvasWidth / 375));
  const computedLineHeight = Math.max(12, Math.round(computedFontSize * 1.15));
  const textAlign = layer.textAlign || 'left';
  const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start';

  return (
    <View
      style={[
        styles.layerContainer,
        {
          left: layerLeft,
          top: layerTop,
          width: layerWidth,
          height: layerHeight,
          zIndex: layer.zIndex !== undefined ? layer.zIndex : 16,
          justifyContent: 'center',
          alignItems: justifyContent,
          paddingHorizontal: 2,
        },
      ]}
      pointerEvents="none"
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{
          width: '100%',
          fontSize: computedFontSize,
          lineHeight: computedLineHeight,
          color: layer.fontColor || COLORS.white,
          fontFamily: FONTS.bold,
          textAlign: textAlign,
          textAlignVertical: 'center',
          includeFontPadding: false,
        }}
      >
        {textValue}
      </Text>
    </View>
  );
}

export default function TemplateRenderer({
  template,
  userPhotoUri,
  userNameText,
  userQuoteText,
  selectedEffect,
  selectedFooter,
  photoTransform = { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
  nameTransform = { offsetX: 0, offsetY: 0, fontSizeScale: 1 },
  canvasWidth,
  canvasHeight,
  showWatermark = false,
  isMuted = false,
  shouldPlay = true,
  withPersonalization = true,
  allowDefaultText = false,
  interactive = true,
  onPressPhotoSlot,
  onPhotoTransformChange,
  onNameTransformChange,
}) {
  const layerTransforms = useCreationStore((s) => s.layerTransforms);
  const setLayerTransform = useCreationStore((s) => s.setLayerTransform);
  const defaultStorePhoto = useCreationStore((s) => s.defaultUserPhotoUri);
  const effectiveUserPhotoUri = withPersonalization
    ? (userPhotoUri || defaultStorePhoto || null)
    : null;

  if (!template) {
    return (
      <View style={[styles.placeholder, { width: canvasWidth, height: canvasHeight }]}>
        <Text style={styles.placeholderText}>Select a template to preview</Text>
      </View>
    );
  }

  const tmpl = template.rawTemplate ? { ...template.rawTemplate, ...template } : template;
  const [videoError, setVideoError] = useState(false);
  const layers = (tmpl.canvasConfig && tmpl.canvasConfig.layers) || [];

  // Resolve template footers list
  const templateFooters = (tmpl.footers && Array.isArray(tmpl.footers))
    ? tmpl.footers
    : (tmpl.rawTemplate?.footers && Array.isArray(tmpl.rawTemplate.footers) ? tmpl.rawTemplate.footers : []);

  // Resolve active footer object from string ID or object
  let resolvedFooter = selectedFooter || selectedEffect || null;
  if (resolvedFooter === 'none' || resolvedFooter === false) {
    resolvedFooter = null;
  } else if (typeof resolvedFooter === 'string') {
    resolvedFooter = templateFooters.find(
      (f) => String(f.id || f._id) === String(resolvedFooter) || f.name === resolvedFooter
    ) || null;
  } else if (resolvedFooter && typeof resolvedFooter === 'object') {
    const matchId = resolvedFooter._id || resolvedFooter.id;
    const dbMatch = templateFooters.find(
      (f) => (matchId && String(f._id || f.id) === String(matchId)) || f.name === resolvedFooter.name
    );
    if (dbMatch) {
      resolvedFooter = { ...dbMatch, ...resolvedFooter };
    }
  }

  // 1. Resolve image candidate for poster / thumbnail / background
  const getImageSource = () => {
    const candidates = [
      tmpl.thumbnailUrl,
      tmpl.posterUrl,
      tmpl.thumbnail,
      tmpl.previewImage,
      tmpl.previewUrl,
      tmpl.previewAsset,
      tmpl.preview,
      tmpl.canvasConfig?.backgroundImage,
      tmpl.mainMedia,
      tmpl.contentUrl,
      tmpl.mediaUrl,
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && !isVideoMedia(c)) {
        return resolveMediaUrl(c);
      }
    }
    return '';
  };

  // 2. Resolve video candidate if template is video
  const getVideoSource = () => {
    const candidates = [
      tmpl.canvasConfig?.backgroundImage,
      tmpl.contentUrl,
      tmpl.mediaUrl,
      tmpl.mainMedia,
      tmpl.previewAsset,
      tmpl.preview,
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && isVideoMedia(c)) {
        return resolveMediaUrl(c);
      }
    }
    return '';
  };

  const bgImageUrl = getImageSource();
  const videoUri = getVideoSource();
  const fallbackBg = (tmpl.canvasConfig && tmpl.canvasConfig.backgroundColor) || COLORS.ink;

  return (
    <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
      {/* Background Layer: Always show image base first so preview is never a black box */}
      <View style={{ width: canvasWidth, height: canvasHeight, position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
        {bgImageUrl ? (
          <Image
            source={{ uri: bgImageUrl }}
            style={{ width: canvasWidth, height: canvasHeight, position: 'absolute', top: 0, left: 0 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: canvasWidth, height: canvasHeight, position: 'absolute', top: 0, left: 0, backgroundColor: fallbackBg }} />
        )}

        {!videoError && videoUri ? (
          Platform.OS === 'web' ? (
            <video
              ref={(ref) => {
                if (ref) {
                  ref.muted = isMuted || !shouldPlay;
                  if (shouldPlay) ref.play().catch(() => {});
                  else ref.pause();
                }
              }}
              src={videoUri}
              autoPlay={shouldPlay}
              loop={shouldPlay}
              muted={isMuted || !shouldPlay}
              playsInline
              onError={() => setVideoError(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <AppVideo
              source={{ uri: videoUri }}
              style={{ width: canvasWidth, height: canvasHeight, position: 'absolute', top: 0, left: 0 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={shouldPlay}
              isLooping={shouldPlay}
              isMuted={isMuted || !shouldPlay}
              onError={() => setVideoError(true)}
            />
          )
        ) : null}
      </View>

      {/* Render Canvas Layers (Only when withPersonalization is true) */}
      {withPersonalization && layers.map((layer) => {
        const activeFooterObj = resolvedFooter;

        if (layer.type === 'photo') {
          let effectiveLayer = layer;
          if (activeFooterObj && activeFooterObj.userPhotoPosition && activeFooterObj.userPhotoPosition.x !== undefined) {
            effectiveLayer = {
              ...layer,
              ...activeFooterObj.userPhotoPosition,
            };
          }

          const layerWidth = (effectiveLayer.width !== undefined ? effectiveLayer.width : layer.width) * canvasWidth;
          const layerHeight = (effectiveLayer.height !== undefined ? effectiveLayer.height : layer.height) * canvasHeight;
          const layerLeft = (effectiveLayer.x !== undefined ? effectiveLayer.x : layer.x) * canvasWidth - layerWidth / 2;
          const layerTop = (effectiveLayer.y !== undefined ? effectiveLayer.y : layer.y) * canvasHeight - layerHeight / 2;

          return (
            <DraggablePhotoLayer
              key={effectiveLayer.id || layer.id || 'photo_layer'}
              layer={effectiveLayer}
              userPhotoUri={effectiveUserPhotoUri}
              photoTransform={photoTransform}
              layerLeft={layerLeft}
              layerTop={layerTop}
              layerWidth={layerWidth}
              layerHeight={layerHeight}
              onPressPhotoSlot={onPressPhotoSlot}
              onPhotoTransformChange={onPhotoTransformChange}
              interactive={interactive}
            />
          );
        }

        if (layer.type === 'text') {
          // Only render text layer if it is the personalized Name layer
          if (layer.fieldName && layer.fieldName !== 'name') {
            return null;
          }

          let effectiveLayer = layer;
          if (activeFooterObj && activeFooterObj.userNamePosition && activeFooterObj.userNamePosition.x !== undefined) {
            effectiveLayer = {
              ...layer,
              ...activeFooterObj.userNamePosition,
            };
          }

          const effWidth = (effectiveLayer.width !== undefined ? effectiveLayer.width : layer.width) * canvasWidth;
          const effHeight = (effectiveLayer.height !== undefined ? effectiveLayer.height : layer.height) * canvasHeight;
          const effLeft = (effectiveLayer.x !== undefined ? effectiveLayer.x : layer.x) * canvasWidth - effWidth / 2;
          const effTop = (effectiveLayer.y !== undefined ? effectiveLayer.y : layer.y) * canvasHeight - effHeight / 2;

          let textValue = userNameText;
          if ((!textValue || textValue.trim() === '') && allowDefaultText) {
            textValue = effectiveLayer.defaultValue || '';
          }

          if (!textValue || textValue.trim() === '') {
            return null;
          }

          const layerKey = effectiveLayer.id || effectiveLayer.fieldName || `text_${effectiveLayer.x}_${effectiveLayer.y}`;
          const currentLayerTransform = layerTransforms[layerKey] || nameTransform || { offsetX: 0, offsetY: 0 };

          const handleTransformChange = (newTransform) => {
            setLayerTransform(layerKey, newTransform);
            if (onNameTransformChange) {
              onNameTransformChange(newTransform);
            }
          };

          return (
            <DraggableTextLayer
              key={layerKey}
              layer={effectiveLayer}
              textValue={textValue}
              transform={currentLayerTransform}
              layerLeft={effLeft}
              layerTop={effTop}
              layerWidth={effWidth}
              layerHeight={effHeight}
              canvasWidth={canvasWidth}
              onTransformChange={handleTransformChange}
            />
          );
        }

        return null;
      })}

      {/* Fallback footer-defined text layer if not defined in template canvasConfig */}
      {withPersonalization && !layers.some((l) => l.type === 'text' && (l.fieldName === 'name' || !l.fieldName)) && (() => {
        const activeFooterObj = selectedFooter || selectedEffect;
        const pos = activeFooterObj?.userNamePosition;
        let textValue = userNameText;
        if ((!textValue || textValue.trim() === '') && allowDefaultText) {
          textValue = pos?.defaultValue || '';
        }
        if (!textValue || textValue.trim() === '') return null;

        const effX = pos?.x ?? 0.5;
        const effY = pos?.y ?? 0.9;
        const effWidth = (pos?.width ?? 0.8) * canvasWidth;
        const effHeight = (pos?.height ?? 0.1) * canvasHeight;
        const effLeft = effX * canvasWidth - effWidth / 2;
        const effTop = effY * canvasHeight - effHeight / 2;

        return (
          <DraggableTextLayer
            key="footer_name_layer"
            layer={{
              fontSize: pos?.fontSize || 22,
              fontColor: pos?.fontColor || COLORS.white,
              textAlign: pos?.textAlign || 'center',
              zIndex: pos?.zIndex || 20,
            }}
            textValue={textValue}
            layerLeft={effLeft}
            layerTop={effTop}
            layerWidth={effWidth}
            layerHeight={effHeight}
            canvasWidth={canvasWidth}
          />
        );
      })()}

      {/* Fallback footer-defined photo layer if not defined in template canvasConfig */}
      {withPersonalization && effectiveUserPhotoUri && !layers.some((l) => l.type === 'photo') && (() => {
        const activeFooterObj = selectedFooter || selectedEffect;
        const pos = activeFooterObj?.userPhotoPosition;
        if (!pos) return null;

        const effX = pos.x ?? 0.2;
        const effY = pos.y ?? 0.85;
        const effWidth = (pos.width ?? 0.3) * canvasWidth;
        const effHeight = (pos.height ?? 0.2) * canvasHeight;
        const effLeft = effX * canvasWidth - effWidth / 2;
        const effTop = effY * canvasHeight - effHeight / 2;

        return (
          <DraggablePhotoLayer
            key="footer_photo_layer"
            layer={{
              shape: pos.shape || activeFooterObj.userPhotoShape || 'circle',
              zIndex: pos.zIndex || 20,
            }}
            userPhotoUri={effectiveUserPhotoUri}
            layerLeft={effLeft}
            layerTop={effTop}
            layerWidth={effWidth}
            layerHeight={effHeight}
            interactive={interactive}
          />
        );
      })()}

      {/* Video / Image Footer Overlay */}
      {resolvedFooter && (
        (() => {
          const footerObj = resolvedFooter;
          const rawAsset = footerObj.videoAsset || footerObj.asset || footerObj.imageUrl;
          if (!rawAsset) return null;

          const footerUri = resolveMediaUrl(rawAsset);
          const isVidAsset = isVideoMedia(rawAsset) || isVideoMedia(footerUri) || footerObj.type === 'video';

          const footerImageCandidate =
            (!isVideoMedia(footerObj.imageUrl) && footerObj.imageUrl) ||
            (!isVideoMedia(footerObj.asset) && footerObj.asset) ||
            (!isVideoMedia(rawAsset) && rawAsset) ||
            '';
          const footerImageUri = footerImageCandidate ? resolveMediaUrl(footerImageCandidate) : '';

          const parseNorm = (val) => {
            if (typeof val !== 'number' || isNaN(val)) return null;
            return val > 3 ? val / 100 : val;
          };

          const heightVal = footerObj.height !== undefined
            ? parseNorm(footerObj.height)
            : (typeof footerObj.heightPercent === 'number' ? footerObj.heightPercent / 100 : null);
          const heightNorm = heightVal !== null ? heightVal : 0.4;

          const yNorm = footerObj.y !== undefined
            ? (parseNorm(footerObj.y) ?? (1 - heightNorm / 2))
            : (1 - heightNorm / 2);

          const isFullOverlay = heightNorm >= 0.75 || (typeof footerObj.heightPercent === 'number' && footerObj.heightPercent >= 75);

          // In app UI, stretch footer to full canvas width
          const fWidth = canvasWidth;
          const fHeight = isFullOverlay ? canvasHeight : Math.round(heightNorm * canvasHeight);
          const fLeft = 0;
          let fTop = isFullOverlay ? 0 : Math.round(yNorm * canvasHeight - fHeight / 2);

          if (!isFullOverlay) {
            if (fTop + fHeight > canvasHeight) fTop = canvasHeight - fHeight;
            if (fTop < 0) fTop = 0;
          }

          const fit = isFullOverlay ? 'stretch' : (footerObj.objectFit === 'cover' ? 'cover' : 'stretch');

          const overlayStyle = {
            position: 'absolute',
            left: fLeft,
            top: fTop,
            width: fWidth,
            height: fHeight,
            zIndex: footerObj.zIndex || 10,
            overflow: 'hidden',
          };

          if (isVidAsset) {
            // When previewing static (shouldPlay false) and static thumbnail image exists, use it
            if (footerImageUri && !shouldPlay) {
              return (
                <View style={overlayStyle} pointerEvents="none">
                  <Image
                    source={{ uri: footerImageUri }}
                    style={{ width: fWidth, height: fHeight }}
                    resizeMode={fit === 'cover' ? 'cover' : 'stretch'}
                  />
                </View>
              );
            }

            if (Platform.OS === 'web') {
              return (
                <video
                  src={footerUri}
                  autoPlay={shouldPlay}
                  loop={shouldPlay}
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    left: fLeft,
                    top: fTop,
                    width: fWidth,
                    height: fHeight,
                    objectFit: fit === 'cover' ? 'cover' : 'fill',
                    pointerEvents: 'none',
                    zIndex: footerObj.zIndex || 10,
                  }}
                />
              );
            }

            return (
              <View style={overlayStyle} pointerEvents="none">
                <AppVideo
                  source={{ uri: footerUri }}
                  style={{ width: fWidth, height: fHeight }}
                  resizeMode={fit === 'cover' ? ResizeMode.COVER : ResizeMode.STRETCH}
                  shouldPlay={shouldPlay}
                  isLooping={shouldPlay}
                  isMuted
                />
              </View>
            );
          }

          if (!footerImageUri && !footerUri) return null;

          return (
            <View style={overlayStyle} pointerEvents="none">
              <Image
                source={{ uri: footerImageUri || footerUri }}
                style={{ width: fWidth, height: fHeight }}
                resizeMode={fit === 'cover' ? 'cover' : 'stretch'}
              />
            </View>
          );
        })()
      )}

      {/* Security Preview Watermark for Unpaid Premium Templates */}
      {showWatermark && (
        <View style={styles.watermarkContainer} pointerEvents="none">
          <View style={styles.watermarkGrid}>
            <Text style={styles.watermarkText}>STARPIX · PREVIEW</Text>
            <Text style={styles.watermarkText}>STARPIX · PREVIEW</Text>
            <Text style={styles.watermarkText}>STARPIX · PREVIEW</Text>
            <Text style={styles.watermarkText}>STARPIX · PREVIEW</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.ink,
    elevation: 8,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  placeholder: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.inkMuted,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  layerContainer: {
    position: 'absolute',
  },
  photoPlaceholderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: COLORS.orange,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 10, 5, 0.12)',
    overflow: 'hidden',
  },
  watermarkGrid: {
    transform: [{ rotate: '-28deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.22)',
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
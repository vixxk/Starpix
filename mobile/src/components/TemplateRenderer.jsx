import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
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
}) {
  const shape = layer.shape || 'rectangle';
  const shapeStyle = getPhotoShapeStyles(shape, layerWidth, layerHeight);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressPhotoSlot}
      style={[
        styles.layerContainer,
        {
          left: layerLeft,
          top: layerTop,
          width: layerWidth,
          height: layerHeight,
          zIndex: layer.zIndex !== undefined ? layer.zIndex : 15,
          overflow: 'hidden',
          borderWidth: userPhotoUri ? 0 : 2,
          borderColor: COLORS.orange,
          borderStyle: userPhotoUri ? 'solid' : 'dashed',
          backgroundColor: userPhotoUri ? 'transparent' : 'rgba(249, 115, 22, 0.18)',
          ...shapeStyle,
        },
      ]}
    >
      {userPhotoUri ? (
        <Image
          source={{ uri: resolveMediaUrl(userPhotoUri) }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.photoPlaceholderInner}>
          <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
        </View>
      )}
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
  isMuted = true,
  shouldPlay = true,
  onPressPhotoSlot,
  onPhotoTransformChange,
  onNameTransformChange,
}) {
  const layerTransforms = useCreationStore((s) => s.layerTransforms);
  const setLayerTransform = useCreationStore((s) => s.setLayerTransform);
  const defaultStorePhoto = useCreationStore((s) => s.defaultUserPhotoUri);
  const effectiveUserPhotoUri = userPhotoUri || defaultStorePhoto || null;

  if (!template) {
    return (
      <View style={[styles.placeholder, { width: canvasWidth, height: canvasHeight }]}>
        <Text style={styles.placeholderText}>Select a template to preview</Text>
      </View>
    );
  }

  const [videoError, setVideoError] = useState(false);
  const layers = (template.canvasConfig && template.canvasConfig.layers) || [];
  const rawBgImage = (template.canvasConfig && template.canvasConfig.backgroundImage) || template.mainMedia || template.previewAsset || template.preview || template.thumbnail;
  const bgImage = resolveMediaUrl(rawBgImage);
  const isVideo = !videoError && shouldPlay && (isVideoMedia(rawBgImage) || isVideoMedia(bgImage) || template.type === 'video');

  return (
    <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
      {/* Background Media Layer */}
      {bgImage ? (
        isVideo ? (
          Platform.OS === 'web' ? (
            <video
              src={bgImage}
              autoPlay
              loop
              muted={isMuted}
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
            <Video
              source={{ uri: bgImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.COVER}
              shouldPlay={shouldPlay}
              isLooping
              isMuted={isMuted}
              onError={() => setVideoError(true)}
            />
          )
        ) : (
          <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        )
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: (template.canvasConfig && template.canvasConfig.backgroundColor) || COLORS.ink }]} />
      )}

      {/* Render Canvas Layers */}
      {layers.map((layer) => {
        const layerWidth = layer.width * canvasWidth;
        const layerHeight = layer.height * canvasHeight;
        const layerLeft = layer.x * canvasWidth - layerWidth / 2;
        const layerTop = layer.y * canvasHeight - layerHeight / 2;

        if (layer.type === 'photo') {
          return (
            <DraggablePhotoLayer
              key={layer.id || 'photo_layer'}
              layer={layer}
              userPhotoUri={effectiveUserPhotoUri}
              photoTransform={photoTransform}
              layerLeft={layerLeft}
              layerTop={layerTop}
              layerWidth={layerWidth}
              layerHeight={layerHeight}
              onPressPhotoSlot={onPressPhotoSlot}
              onPhotoTransformChange={onPhotoTransformChange}
            />
          );
        }

        if (layer.type === 'text') {
          // Only render text layer if it is the personalized Name layer
          if (layer.fieldName !== 'name') {
            return null;
          }

          let effectiveLayer = layer;
          const activeFooterObj = selectedFooter || selectedEffect;
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
          if (!textValue || textValue.trim() === '') {
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

      {/* Video Footer Overlay */}
      {(selectedEffect || selectedFooter) && (
        (() => {
          const footerObj = selectedFooter || selectedEffect;
          const rawAsset = footerObj.videoAsset || footerObj.asset;
          if (!rawAsset) return null;

          const footerUri = resolveMediaUrl(rawAsset);
          const isVid = isVideoMedia(rawAsset) || isVideoMedia(footerUri) || footerObj.type === 'video';
          const heightPct = footerObj.heightPercent || footerObj.configuration?.heightPercent || 40;
          const fit = footerObj.objectFit || footerObj.configuration?.objectFit || 'contain';

          const fWidth = (footerObj.width !== undefined ? footerObj.width : 1.0) * canvasWidth;
          const fHeight = (footerObj.height !== undefined ? footerObj.height : heightPct / 100) * canvasHeight;
          const fLeft = (footerObj.x !== undefined ? footerObj.x : 0.5) * canvasWidth - fWidth / 2;
          const fTop = (footerObj.y !== undefined ? footerObj.y : (1 - heightPct / 200)) * canvasHeight - fHeight / 2;

          const overlayStyle = {
            position: 'absolute',
            left: fLeft,
            top: fTop,
            width: fWidth,
            height: fHeight,
            zIndex: footerObj.zIndex || 10,
          };

          if (isVid) {
            if (Platform.OS === 'web') {
              return (
                <video
                  src={footerUri}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    left: fLeft,
                    top: fTop,
                    width: fWidth,
                    height: fHeight,
                    objectFit: fit,
                    pointerEvents: 'none',
                    zIndex: footerObj.zIndex || 10,
                  }}
                />
              );
            }
            return (
              <View style={[overlayStyle, { overflow: 'hidden' }]} pointerEvents="none">
                <Video
                  source={{ uri: footerUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={fit === 'cover' ? ResizeMode.COVER : ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  isMuted
                />
              </View>
            );
          }

          return (
            <View style={overlayStyle} pointerEvents="none">
              <Image
                source={{ uri: footerUri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={fit === 'cover' ? 'cover' : 'contain'}
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
import React, { useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, PanResponder, Platform } from 'react-native';
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

function DraggablePhotoLayer({
  layer,
  userPhotoUri,
  photoTransform,
  layerLeft,
  layerTop,
  layerWidth,
  layerHeight,
  onPressPhotoSlot,
  onPhotoTransformChange,
}) {
  const currentOffsetX = photoTransform?.photoOffsetX ?? photoTransform?.offsetX ?? 0;
  const currentOffsetY = photoTransform?.photoOffsetY ?? photoTransform?.offsetY ?? 0;

  const initialOffset = useRef({ x: currentOffsetX, y: currentOffsetY });
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      initialOffset.current = { x: currentOffsetX, y: currentOffsetY };
    }
  }, [currentOffsetX, currentOffsetY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        if (onPhotoTransformChange) {
          const newX = initialOffset.current.x + gestureState.dx;
          const newY = initialOffset.current.y + gestureState.dy;
          onPhotoTransformChange({
            photoOffsetX: newX,
            photoOffsetY: newY,
            offsetX: newX,
            offsetY: newY,
          });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        initialOffset.current = {
          x: initialOffset.current.x + gestureState.dx,
          y: initialOffset.current.y + gestureState.dy,
        };
        if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
          if (onPressPhotoSlot) onPressPhotoSlot();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  const finalPhotoLeft = layerLeft + currentOffsetX;
  const finalPhotoTop = layerTop + currentOffsetY;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.layerContainer,
        {
          left: finalPhotoLeft,
          top: finalPhotoTop,
          width: layerWidth,
          height: layerHeight,
          zIndex: layer.zIndex || 1,
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: userPhotoUri ? 0 : 2,
          borderColor: COLORS.orange,
          borderStyle: userPhotoUri ? 'solid' : 'dashed',
          backgroundColor: userPhotoUri ? 'transparent' : 'rgba(249, 115, 22, 0.18)',
        },
      ]}
    >
      {userPhotoUri ? (
        <Image
          source={{ uri: resolveMediaUrl(userPhotoUri) }}
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [
                { scale: photoTransform.scale || 1 },
                { rotate: `${photoTransform.rotation || 0}deg` },
              ],
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.photoPlaceholderInner}>
          <Text style={styles.photoPlaceholderText}>Tap or Drag to Position</Text>
        </View>
      )}
    </View>
  );
}

function DraggableTextLayer({
  layer,
  textValue,
  transform,
  layerLeft,
  layerTop,
  layerWidth,
  layerHeight,
  canvasWidth,
  onTransformChange,
}) {
  const currentOffsetX = transform?.offsetX ?? transform?.nameOffsetX ?? 0;
  const currentOffsetY = transform?.offsetY ?? transform?.nameOffsetY ?? 0;

  const initialOffset = useRef({ x: currentOffsetX, y: currentOffsetY });
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      initialOffset.current = { x: currentOffsetX, y: currentOffsetY };
    }
  }, [currentOffsetX, currentOffsetY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        if (onTransformChange) {
          const newX = initialOffset.current.x + gestureState.dx;
          const newY = initialOffset.current.y + gestureState.dy;
          onTransformChange({
            offsetX: newX,
            offsetY: newY,
            nameOffsetX: newX,
            nameOffsetY: newY,
          });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        initialOffset.current = {
          x: initialOffset.current.x + gestureState.dx,
          y: initialOffset.current.y + gestureState.dy,
        };
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  const fontScaleFactor = transform?.fontSizeScale || 1;
  const finalTextLeft = layerLeft + currentOffsetX;
  const finalTextTop = layerTop + currentOffsetY;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.layerContainer,
        {
          left: finalTextLeft,
          top: finalTextTop,
          width: layerWidth,
          height: layerHeight,
          zIndex: layer.zIndex || 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Text
        style={{
          fontSize: Math.max(10, (layer.fontSize || 22) * (canvasWidth / 375) * fontScaleFactor),
          color: layer.fontColor || COLORS.white,
          fontFamily: FONTS.bold,
          textAlign: layer.textAlign || 'center',
          textShadowColor: 'rgba(0,0,0,0.85)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
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
  selectedFrame,
  selectedEffect,
  photoTransform = { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
  nameTransform = { offsetX: 0, offsetY: 0, fontSizeScale: 1 },
  canvasWidth,
  canvasHeight,
  showWatermark = false,
  onPressPhotoSlot,
  onPhotoTransformChange,
  onNameTransformChange,
}) {
  const layerTransforms = useCreationStore((s) => s.layerTransforms);
  const setLayerTransform = useCreationStore((s) => s.setLayerTransform);

  if (!template) {
    return (
      <View style={[styles.placeholder, { width: canvasWidth, height: canvasHeight }]}>
        <Text style={styles.placeholderText}>Select a template to preview</Text>
      </View>
    );
  }

  const layers = (template.canvasConfig && template.canvasConfig.layers) || [];
  const rawBgImage = (template.canvasConfig && template.canvasConfig.backgroundImage) || template.mainMedia || template.previewAsset || template.thumbnail;
  const bgImage = resolveMediaUrl(rawBgImage);
  const isVideo = isVideoMedia(rawBgImage) || isVideoMedia(bgImage) || template.type === 'video';

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
              muted
              playsInline
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
              shouldPlay
              isLooping
              isMuted
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
              userPhotoUri={userPhotoUri}
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
          let textValue = layer.defaultValue;
          const layerKey = layer.id || layer.fieldName || `text_${layer.x}_${layer.y}`;

          if (layer.fieldName === 'name') {
            if (!userNameText || userNameText.trim() === '') {
              return null;
            }
            textValue = userNameText;
          } else if (layer.fieldName === 'quote' && userQuoteText) {
            textValue = userQuoteText;
          }

          if (!textValue || textValue.trim() === '') {
            return null;
          }

          const currentLayerTransform = layerTransforms[layerKey] || (layer.fieldName === 'name' ? nameTransform : { offsetX: 0, offsetY: 0 });

          const handleTransformChange = (newTransform) => {
            setLayerTransform(layerKey, newTransform);
            if (layer.fieldName === 'name' && onNameTransformChange) {
              onNameTransformChange(newTransform);
            }
          };

          return (
            <DraggableTextLayer
              key={layerKey}
              layer={layer}
              textValue={textValue}
              transform={currentLayerTransform}
              layerLeft={layerLeft}
              layerTop={layerTop}
              layerWidth={layerWidth}
              layerHeight={layerHeight}
              canvasWidth={canvasWidth}
              onTransformChange={handleTransformChange}
            />
          );
        }

        return null;
      })}

      {/* Frame Overlay positioned by admin coordinates */}
      {selectedFrame && selectedFrame.asset && (
        <Image
          source={{ uri: resolveMediaUrl(selectedFrame.asset) }}
          style={
            selectedFrame.placement
              ? {
                  position: 'absolute',
                  left: (selectedFrame.placement.x || 0.5) * canvasWidth - ((selectedFrame.placement.width || 1) * canvasWidth) / 2,
                  top: (selectedFrame.placement.y || 0.5) * canvasHeight - ((selectedFrame.placement.height || 1) * canvasHeight) / 2,
                  width: (selectedFrame.placement.width || 1) * canvasWidth,
                  height: (selectedFrame.placement.height || 1) * canvasHeight,
                  zIndex: selectedFrame.placement.zIndex || 10,
                }
              : [StyleSheet.absoluteFillObject, { zIndex: 10 }]
          }
          resizeMode="contain"
        />
      )}

      {/* Effect Overlay */}
      {selectedEffect && selectedEffect.asset && (
        <Image
          source={{ uri: resolveMediaUrl(selectedEffect.asset) }}
          style={[StyleSheet.absoluteFillObject, { zIndex: 12, opacity: 0.75 }]}
          resizeMode="cover"
        />
      )}

      {/* Security Preview Watermark for Unpaid Premium Templates */}
      {showWatermark && (
        <View style={styles.watermarkContainer} pointerEvents="none">
          <View style={styles.watermarkGrid}>
            <Text style={styles.watermarkText}>STATUZZZ · PREVIEW</Text>
            <Text style={styles.watermarkText}>STATUZZZ · PREVIEW</Text>
            <Text style={styles.watermarkText}>STATUZZZ · PREVIEW</Text>
            <Text style={styles.watermarkText}>STATUZZZ · PREVIEW</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderRadius: 24,
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
    borderRadius: 24,
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
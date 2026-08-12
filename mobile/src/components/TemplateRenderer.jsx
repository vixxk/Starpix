import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';

export default function TemplateRenderer({
  template,
  userPhotoUri,
  userNameText,
  userQuoteText,
  selectedFrame,
  selectedEffect,
  photoTransform = { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
  canvasWidth,
  canvasHeight,
  showWatermark = false,
}) {
  if (!template) {
    return (
      <View style={[styles.placeholder, { width: canvasWidth, height: canvasHeight }]}>
        <Text style={styles.placeholderText}>Select a template to preview</Text>
      </View>
    );
  }

  const layers = template.canvasConfig?.layers || [];
  const bgImage = template.canvasConfig?.backgroundImage || template.mainMedia || template.previewAsset;

  return (
    <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
      {/* Background Image Layer */}
      {bgImage ? (
        <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: template.canvasConfig?.backgroundColor || COLORS.ink }]} />
      )}

      {/* Render Canvas Layers */}
      {layers.map((layer) => {
        const layerWidth = layer.width * canvasWidth;
        const layerHeight = layer.height * canvasHeight;
        const layerLeft = layer.x * canvasWidth - layerWidth / 2;
        const layerTop = layer.y * canvasHeight - layerHeight / 2;

        if (layer.type === 'photo') {
          return (
            <View
              key={layer.id || 'photo_layer'}
              style={[
                styles.layerContainer,
                {
                  left: layerLeft,
                  top: layerTop,
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
                  source={{ uri: userPhotoUri }}
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      transform: [
                        { scale: photoTransform.scale || 1 },
                        { rotate: `${photoTransform.rotation || 0}deg` },
                        { translateX: photoTransform.offsetX || 0 },
                        { translateY: photoTransform.offsetY || 0 },
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholderInner}>
                  <Text style={styles.photoPlaceholderText}>Tap to Add Photo</Text>
                </View>
              )}
            </View>
          );
        }

        if (layer.type === 'text') {
          let textValue = layer.defaultValue;
          if (layer.fieldName === 'name' && userNameText) textValue = userNameText;
          if (layer.fieldName === 'quote' && userQuoteText) textValue = userQuoteText;

          return (
            <View
              key={layer.id || 'text_layer'}
              style={[
                styles.layerContainer,
                {
                  left: layerLeft,
                  top: layerTop,
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
                  fontSize: Math.max(12, (layer.fontSize || 22) * (canvasWidth / 375)),
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

        return null;
      })}

      {/* Frame Overlay positioned by admin coordinates */}
      {selectedFrame && selectedFrame.asset && (
        <Image
          source={{ uri: selectedFrame.asset }}
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
          source={{ uri: selectedEffect.asset }}
          style={[StyleSheet.absoluteFillObject, { zIndex: 12, opacity: 0.75 }]}
          resizeMode="cover"
        />
      )}

      {/* Security Preview Watermark for Unpaid Premium Templates */}
      {showWatermark && (
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>STATUZZZ PREVIEW</Text>
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    letterSpacing: 4,
    transform: [{ rotate: '-30deg' }],
  },
});
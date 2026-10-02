import React, { useState, useEffect } from 'react';
import { View, Image as RNImage, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Renders user photo clipped precisely to the designated shape
 * (heart, circle, diamond, hexagon, star, rounded, rectangle).
 * When no photo is provided or on load error, renders a clean,
 * modern default placeholder silhouette rather than any random image.
 */
export default function ShapeClippedPhoto({
  shape = 'rectangle',
  uri = null,
  width,
  height,
  style,
}) {
  const [photoUri, setPhotoUri] = useState(uri);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setPhotoUri(uri);
    setHasError(false);
  }, [uri]);

  const handleError = () => {
    setHasError(true);
    setPhotoUri(null);
  };

  const minDim = Math.min(width, height);
  const isCircle = shape === 'circle';
  const isRounded = shape === 'rounded';
  const isHeart = shape === 'heart';
  const isDiamond = shape === 'diamond';
  const isHexagon = shape === 'hexagon';
  const isStar = shape === 'star';

  const borderRadius = (isCircle || isHeart || isDiamond || isHexagon || isStar)
    ? minDim / 2
    : isRounded
    ? minDim * 0.22
    : 8;

  const contentWidth = (isHeart || isDiamond || isHexagon || isStar) ? minDim * 0.88 : width;
  const contentHeight = (isHeart || isDiamond || isHexagon || isStar) ? minDim * 0.88 : height;

  return (
    <View
      style={[
        {
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      pointerEvents="none"
    >
      {/* Shaped Container with Smooth Mask & White Border */}
      <View
        style={{
          width: contentWidth,
          height: contentHeight,
          borderRadius: borderRadius,
          overflow: 'hidden',
          backgroundColor: '#E2E8F0',
          borderWidth: 2.5,
          borderColor: '#FFFFFF',
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 3.5,
        }}
      >
        {!hasError && photoUri ? (
          <RNImage
            source={{ uri: photoUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={handleError}
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#E2E8F0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="person"
              size={Math.max(16, Math.round(minDim * 0.44))}
              color="#94A3B8"
            />
          </View>
        )}
      </View>
    </View>
  );
}

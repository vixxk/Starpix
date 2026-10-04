import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Polygon,
  Circle as SvgCircle,
  Rect as SvgRect,
  Image as SvgImage,
  G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

/**
 * Renders user photo clipped precisely to the designated shape
 * (heart, circle, diamond, hexagon, star, rounded, rectangle)
 * using true SVG clipping paths matching the backend Sharp renderer.
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

  const w = Math.round(width || 100);
  const h = Math.round(height || 100);
  const minDim = Math.min(w, h);

  const normalizedShape = String(shape || 'rectangle').toLowerCase();
  const isCircle = normalizedShape === 'circle';
  const isRounded = normalizedShape === 'rounded';
  const isHeart = normalizedShape === 'heart';
  const isDiamond = normalizedShape === 'diamond';
  const isHexagon = normalizedShape === 'hexagon';
  const isStar = normalizedShape === 'star';

  // Polygon definitions matching backend videoRenderingService.js getShapeMaskSvg exactly
  const heartPoints = `${w * 0.5},${h * 0.15} ${w * 0.65},0 ${w * 0.85},0 ${w},${h * 0.15} ${w},${h * 0.35} ${w * 0.5},${h * 0.90} 0,${h * 0.35} 0,${h * 0.15} ${w * 0.15},0 ${w * 0.35},0`;
  const diamondPoints = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
  const hexagonPoints = `${w * 0.25},0 ${w * 0.75},0 ${w},${h / 2} ${w * 0.75},${h} ${w * 0.25},${h} 0,${h / 2}`;
  const starPoints = `${w * 0.5},0 ${w * 0.61},${h * 0.35} ${w * 0.98},${h * 0.35} ${w * 0.68},${h * 0.57} ${w * 0.79},${h * 0.91} ${w * 0.5},${h * 0.70} ${w * 0.21},${h * 0.91} ${w * 0.32},${h * 0.57} ${w * 0.02},${h * 0.35} ${w * 0.39},${h * 0.35}`;

  const clipId = `shape_clip_${normalizedShape}_${w}_${h}`;

  const renderClipShape = () => {
    if (isCircle) {
      return <SvgCircle cx={w / 2} cy={h / 2} r={minDim / 2} />;
    }
    if (isRounded) {
      const r = minDim * 0.2;
      return <SvgRect x="0" y="0" width={w} height={h} rx={r} ry={r} />;
    }
    if (isDiamond) {
      return <Polygon points={diamondPoints} />;
    }
    if (isHexagon) {
      return <Polygon points={hexagonPoints} />;
    }
    if (isStar) {
      return <Polygon points={starPoints} />;
    }
    if (isHeart) {
      return <Polygon points={heartPoints} />;
    }
    return <SvgRect x="0" y="0" width={w} height={h} />;
  };

  const renderStrokeShape = () => {
    if (isCircle) {
      return <SvgCircle cx={w / 2} cy={h / 2} r={minDim / 2 - 1.25} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    if (isRounded) {
      const r = minDim * 0.2;
      return <SvgRect x="1.25" y="1.25" width={w - 2.5} height={h - 2.5} rx={r} ry={r} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    if (isDiamond) {
      return <Polygon points={diamondPoints} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    if (isHexagon) {
      return <Polygon points={hexagonPoints} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    if (isStar) {
      return <Polygon points={starPoints} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    if (isHeart) {
      return <Polygon points={heartPoints} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
    }
    return <SvgRect x="1.25" y="1.25" width={w - 2.5} height={h - 2.5} stroke="#FFFFFF" strokeWidth="2.5" fill="none" />;
  };

  return (
    <View
      style={[
        {
          width: w,
          height: h,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <ClipPath id={clipId}>
            {renderClipShape()}
          </ClipPath>
        </Defs>

        {/* Base filled shape background */}
        <G clipPath={`url(#${clipId})`}>
          <SvgRect x="0" y="0" width={w} height={h} fill="#1E293B" />
          {!hasError && photoUri ? (
            <SvgImage
              href={{ uri: photoUri }}
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid slice"
              onError={handleError}
            />
          ) : (
            <G transform={`translate(${w / 2 - minDim * 0.22}, ${h / 2 - minDim * 0.22})`}>
              <SvgCircle cx={minDim * 0.22} cy={minDim * 0.16} r={minDim * 0.12} fill="#94A3B8" />
              <SvgRect x={minDim * 0.06} y={minDim * 0.32} width={minDim * 0.32} height={minDim * 0.2} rx={minDim * 0.1} fill="#94A3B8" />
            </G>
          )}
        </G>

        {/* Crisp White Outer Border Stroke */}
        {renderStrokeShape()}
      </Svg>
    </View>
  );
}


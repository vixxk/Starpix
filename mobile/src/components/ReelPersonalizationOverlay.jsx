import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fontScale } from '../utils/responsive';
import { FONTS } from '../constants/colors';
import { resolveMediaUrl } from '../utils/media';
import AppVideo, { ResizeMode } from './AppVideo';
import ShapeClippedPhoto from './ShapeClippedPhoto';

export default function ReelPersonalizationOverlay({
  frameId = 'durga_puja',
  customFooter = null,
  canvasConfig = null,
  userName = 'Uika',
  userPhotoUri = null,
  cardWidth,
  cardHeight,
  isPlaying = true,
}) {
  const photoSize = wp(0.18);
  const ringSize = wp(0.24);

  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [userPhotoUri]);

  const effectivePhoto =
    !imgError && userPhotoUri ? resolveMediaUrl(userPhotoUri) : null;

  const renderUserPhoto = () => (
    <View
      style={[
        styles.photoMask,
        {
          width: photoSize,
          height: photoSize,
          borderRadius: photoSize / 2,
          backgroundColor: '#E2E8F0',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      {effectivePhoto ? (
        <Image
          source={{ uri: effectivePhoto }}
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: photoSize / 2,
          }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Ionicons name="person" size={photoSize * 0.48} color="#94A3B8" />
      )}
    </View>
  );

  if (frameId === 'none' && !customFooter && !canvasConfig) {
    if (!userName && !userPhotoUri) return null;
    return (
      <View
        style={[
          styles.container,
          {
            position: 'absolute',
            left: 0,
            width: cardWidth,
            bottom: hp(0.02),
            zIndex: 40,
            elevation: 25,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          {renderUserPhoto()}
        </View>
        <View style={styles.bannerWrapper}>
          <Text style={styles.bannerNameText} numberOfLines={1}>
            {userName}
          </Text>
        </View>
      </View>
    );
  }

  const canvasLayers = canvasConfig?.layers || [];
  const photoLayer = canvasLayers.find((l) => l.type === 'photo');
  const baseTextNameLayer = canvasLayers.find((l) => l.type === 'text' && l.fieldName === 'name') || canvasLayers.find((l) => l.type === 'text');
  const textNameLayer =
    baseTextNameLayer
      ? {
          width: 0.5,
          height: 0.1,
          fontSize: 22,
          fontColor: '#FFFFFF',
          ...baseTextNameLayer,
          x: baseTextNameLayer.x !== undefined ? baseTextNameLayer.x : (customFooter?.userNamePosition?.x ?? 0.78),
          y: baseTextNameLayer.y !== undefined ? baseTextNameLayer.y : (customFooter?.userNamePosition?.y ?? 0.78),
          textAlign: baseTextNameLayer.textAlign || customFooter?.userNamePosition?.textAlign || 'center',
        }
      : customFooter?.userNamePosition
      ? { width: 0.8, height: 0.1, fontSize: 24, fontColor: '#FFFFFF', ...customFooter.userNamePosition }
      : null;

  // Case 1: Template was configured by Admin in the Canvas Editor with custom layers.
  // Render EXACTLY as seen in Admin Canvas Editor:
  // - Shape-clipped photo layer (heart, circle, diamond, etc.)
  // - Text name layer with precise coordinates and styling
  // - NO hardcoded golden ribbon banner, NO hardcoded beaded rings
  if (canvasLayers.length > 0) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: cardWidth,
            height: cardHeight,
            zIndex: 35,
            elevation: 25,
          },
        ]}
        pointerEvents="none"
      >
        {/* Photo Layer with exact SVG ClipPath shape */}
        {photoLayer ? (() => {
          const lWidth = photoLayer.width * cardWidth;
          const lHeight = photoLayer.height * cardHeight;
          const left = photoLayer.x * cardWidth - lWidth / 2;
          const top = photoLayer.y * cardHeight - lHeight / 2;

          return (
            <View
              style={{
                position: 'absolute',
                left,
                top,
                width: lWidth,
                height: lHeight,
                zIndex: photoLayer.zIndex || 25,
                elevation: 25,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              pointerEvents="none"
            >
              <ShapeClippedPhoto
                shape={photoLayer.shape || 'rectangle'}
                uri={effectivePhoto}
                width={lWidth}
                height={lHeight}
              />
            </View>
          );
        })() : effectivePhoto ? (
          <View
            style={{
              position: 'absolute',
              left: 0.25 * cardWidth - (0.35 * cardWidth) / 2,
              top: (textNameLayer?.y ?? 0.8) * cardHeight - (0.22 * cardHeight) / 2,
              width: 0.35 * cardWidth,
              height: 0.22 * cardHeight,
              zIndex: 25,
              elevation: 25,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            <ShapeClippedPhoto
              shape="circle"
              uri={effectivePhoto}
              width={0.35 * cardWidth}
              height={0.22 * cardHeight}
            />
          </View>
        ) : null}

        {/* Text Name Layer positioned as in admin */}
        {textNameLayer ? (() => {
          const lWidth = (textNameLayer.width || 0.5) * cardWidth;
          const lHeight = (textNameLayer.height || 0.1) * cardHeight;
          const left = (textNameLayer.x ?? 0.78) * cardWidth - lWidth / 2;
          const top = (textNameLayer.y ?? 0.78) * cardHeight - lHeight / 2;
          const computedFontSize = Math.max(12, (textNameLayer.fontSize || 22) * (cardWidth / 375));

          return (
            <View
              style={{
                position: 'absolute',
                left,
                top,
                width: lWidth,
                height: lHeight,
                zIndex: textNameLayer.zIndex || 30,
                elevation: 25,
                justifyContent: 'center',
                alignItems:
                  textNameLayer.textAlign === 'right'
                    ? 'flex-end'
                    : textNameLayer.textAlign === 'center'
                    ? 'center'
                    : 'flex-start',
                paddingHorizontal: 2,
              }}
              pointerEvents="none"
            >
              <Text
                style={{
                  fontSize: computedFontSize,
                  color: textNameLayer.fontColor || '#FFFFFF',
                  fontFamily: FONTS.bold,
                  textAlign: textNameLayer.textAlign || 'center',
                  textShadowColor: 'rgba(0, 0, 0, 0.95)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3.5,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {userName}
              </Text>
            </View>
          );
        })() : userName ? (
          <View
            style={{
              position: 'absolute',
              left: 0.5 * cardWidth - (0.6 * cardWidth) / 2,
              top: 0.78 * cardHeight,
              width: 0.6 * cardWidth,
              height: 0.1 * cardHeight,
              zIndex: 30,
              elevation: 25,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            <Text
              style={{
                fontSize: Math.max(14, 22 * (cardWidth / 375)),
                color: '#FFFFFF',
                fontFamily: FONTS.bold,
                textAlign: 'center',
                textShadowColor: 'rgba(0, 0, 0, 0.95)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3.5,
              }}
              numberOfLines={1}
            >
              {userName}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Case 2: Legacy template without canvas layers, but with a custom footer from admin
  if (customFooter) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: cardWidth,
            height: cardHeight,
            zIndex: 25,
            elevation: 18,
          },
        ]}
        pointerEvents="none"
      >
        {customFooter.userNamePosition ? (
          <>
            {/* User photo ring positioned gracefully above name position */}
            <View
              style={{
                position: 'absolute',
                left: (customFooter.userNamePosition.x ?? 0.5) * cardWidth - ringSize / 2,
                top: Math.max(
                  0,
                  (customFooter.userNamePosition.y ?? 0.85) * cardHeight - hp(0.021) - ringSize - 4
                ),
                width: ringSize,
                height: ringSize,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                elevation: 20,
              }}
              pointerEvents="none"
            >
              <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
                <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="goldGradCust" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FFF2A3" />
                      <Stop offset="30%" stopColor="#F59E0B" />
                      <Stop offset="60%" stopColor="#D97706" />
                      <Stop offset="80%" stopColor="#FDE68A" />
                      <Stop offset="100%" stopColor="#B45309" />
                    </LinearGradient>
                    <LinearGradient id="goldRimCust" x1="0%" y1="100%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#F59E0B" />
                      <Stop offset="50%" stopColor="#FEF3C7" />
                      <Stop offset="100%" stopColor="#D97706" />
                    </LinearGradient>
                  </Defs>
                  <Circle cx="50" cy="50" r="47" stroke="url(#goldGradCust)" strokeWidth="2.5" fill="none" strokeDasharray="2.5, 3.5" />
                  <Circle cx="50" cy="50" r="43.5" stroke="url(#goldRimCust)" strokeWidth="3" fill="#3D1A06" fillOpacity="0.45" />
                  <Circle cx="50" cy="50" r="39" stroke="url(#goldGradCust)" strokeWidth="1.5" fill="none" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const cx = 50 + 47 * Math.cos(rad);
                    const cy = 50 + 47 * Math.sin(rad);
                    return <Circle key={i} cx={cx} cy={cy} r="2.5" fill="url(#goldGradCust)" />;
                  })}
                </Svg>
                {renderUserPhoto()}
              </View>
            </View>

            {/* Name Banner at user position */}
            <View
              style={{
                position: 'absolute',
                left: (customFooter.userNamePosition.x ?? 0.5) * cardWidth - wp(0.24),
                top: (customFooter.userNamePosition.y ?? 0.85) * cardHeight - hp(0.021),
                width: wp(0.48),
                alignItems: 'center',
                zIndex: 30,
                elevation: 20,
              }}
              pointerEvents="none"
            >
              <View style={styles.bannerWrapper}>
                <Svg width={wp(0.48)} height={hp(0.042)} viewBox="0 0 200 40" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="bannerGradCustPos" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#B45309" />
                      <Stop offset="15%" stopColor="#F59E0B" />
                      <Stop offset="50%" stopColor="#FFFBEB" />
                      <Stop offset="85%" stopColor="#F59E0B" />
                      <Stop offset="100%" stopColor="#B45309" />
                    </LinearGradient>
                    <LinearGradient id="ribbonFoldCustPos" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#92400E" />
                      <Stop offset="100%" stopColor="#451A03" />
                    </LinearGradient>
                  </Defs>
                  <Path d="M 10 7 L 30 7 L 30 33 L 10 33 L 20 20 Z" fill="url(#bannerGradCustPos)" stroke="#78350F" strokeWidth="1" />
                  <Path d="M 28 33 L 30 33 L 30 38 Z" fill="url(#ribbonFoldCustPos)" />
                  <Path d="M 190 7 L 170 7 L 170 33 L 190 33 L 180 20 Z" fill="url(#bannerGradCustPos)" stroke="#78350F" strokeWidth="1" />
                  <Path d="M 172 33 L 170 33 L 170 38 Z" fill="url(#ribbonFoldCustPos)" />
                  <Rect x="25" y="4" width="150" height="32" rx="4" fill="url(#bannerGradCustPos)" stroke="#78350F" strokeWidth="1.2" />
                  <Rect x="27" y="6" width="146" height="28" rx="3" fill="#FFFDF5" fillOpacity="0.88" stroke="#D97706" strokeWidth="0.8" />
                  <Circle cx="35" cy="20" r="2" fill="#B45309" />
                  <Circle cx="165" cy="20" r="2" fill="#B45309" />
                </Svg>
                <Text style={styles.bannerNameText} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View
            style={[
              styles.container,
              {
                width: cardWidth,
                bottom: hp(0.015),
                zIndex: 30,
                elevation: 20,
              },
            ]}
            pointerEvents="none"
          >
            {/* Ornate Golden Circular Frame with User Photo */}
            <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
              <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="goldGradCust" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFF2A3" />
                    <Stop offset="30%" stopColor="#F59E0B" />
                    <Stop offset="60%" stopColor="#D97706" />
                    <Stop offset="80%" stopColor="#FDE68A" />
                    <Stop offset="100%" stopColor="#B45309" />
                  </LinearGradient>
                  <LinearGradient id="goldRimCust" x1="0%" y1="100%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#F59E0B" />
                    <Stop offset="50%" stopColor="#FEF3C7" />
                    <Stop offset="100%" stopColor="#D97706" />
                  </LinearGradient>
                </Defs>
                <Circle cx="50" cy="50" r="47" stroke="url(#goldGradCust)" strokeWidth="2.5" fill="none" strokeDasharray="2.5, 3.5" />
                <Circle cx="50" cy="50" r="43.5" stroke="url(#goldRimCust)" strokeWidth="3" fill="#3D1A06" fillOpacity="0.45" />
                <Circle cx="50" cy="50" r="39" stroke="url(#goldGradCust)" strokeWidth="1.5" fill="none" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const cx = 50 + 47 * Math.cos(rad);
                  const cy = 50 + 47 * Math.sin(rad);
                  return <Circle key={i} cx={cx} cy={cy} r="2.5" fill="url(#goldGradCust)" />;
                })}
              </Svg>
              {renderUserPhoto()}
            </View>

            {/* Golden Ribbon Banner with User Name */}
            <View style={styles.bannerWrapper}>
              <Svg width={wp(0.48)} height={hp(0.042)} viewBox="0 0 200 40" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="bannerGradCust2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#B45309" />
                    <Stop offset="15%" stopColor="#F59E0B" />
                    <Stop offset="50%" stopColor="#FFFBEB" />
                    <Stop offset="85%" stopColor="#F59E0B" />
                    <Stop offset="100%" stopColor="#B45309" />
                  </LinearGradient>
                  <LinearGradient id="ribbonFoldCust2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#92400E" />
                    <Stop offset="100%" stopColor="#451A03" />
                  </LinearGradient>
                </Defs>
                <Path d="M 10 7 L 30 7 L 30 33 L 10 33 L 20 20 Z" fill="url(#bannerGradCust2)" stroke="#78350F" strokeWidth="1" />
                <Path d="M 28 33 L 30 33 L 30 38 Z" fill="url(#ribbonFoldCust2)" />
                <Path d="M 190 7 L 170 7 L 170 33 L 190 33 L 180 20 Z" fill="url(#bannerGradCust2)" stroke="#78350F" strokeWidth="1" />
                <Path d="M 172 33 L 170 33 L 170 38 Z" fill="url(#ribbonFoldCust2)" />
                <Rect x="25" y="4" width="150" height="32" rx="4" fill="url(#bannerGradCust2)" stroke="#78350F" strokeWidth="1.2" />
                <Rect x="27" y="6" width="146" height="28" rx="3" fill="#FFFDF5" fillOpacity="0.88" stroke="#D97706" strokeWidth="0.8" />
                <Circle cx="35" cy="20" r="2" fill="#B45309" />
                <Circle cx="165" cy="20" r="2" fill="#B45309" />
              </Svg>
              <Text style={styles.bannerNameText} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }


  if (!frameId || frameId === 'none') return null;

  if (frameId === 'durga_puja') {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        {/* Ornate Golden Circular Frame with User Photo */}
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFF2A3" />
                <Stop offset="30%" stopColor="#F59E0B" />
                <Stop offset="60%" stopColor="#D97706" />
                <Stop offset="80%" stopColor="#FDE68A" />
                <Stop offset="100%" stopColor="#B45309" />
              </LinearGradient>
              <LinearGradient id="goldRim" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#F59E0B" />
                <Stop offset="50%" stopColor="#FEF3C7" />
                <Stop offset="100%" stopColor="#D97706" />
              </LinearGradient>
            </Defs>

            {/* Outer Decorative Sunburst Beaded Ring */}
            <Circle cx="50" cy="50" r="47" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" strokeDasharray="2.5, 3.5" />
            <Circle cx="50" cy="50" r="43.5" stroke="url(#goldRim)" strokeWidth="3" fill="#3D1A06" fillOpacity="0.45" />
            <Circle cx="50" cy="50" r="39" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />

            {/* Small floral/bead accents at cardinal points */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 47 * Math.cos(rad);
              const cy = 50 + 47 * Math.sin(rad);
              return <Circle key={i} cx={cx} cy={cy} r="2.5" fill="url(#goldGrad)" />;
            })}
          </Svg>

          {/* User Photo in Center */}
          {renderUserPhoto()}
        </View>

        {/* Ornate Golden Ribbon Banner with User Name */}
        <View style={styles.bannerWrapper}>
          <Svg width={wp(0.48)} height={hp(0.042)} viewBox="0 0 200 40" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#B45309" />
                <Stop offset="15%" stopColor="#F59E0B" />
                <Stop offset="50%" stopColor="#FFFBEB" />
                <Stop offset="85%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#B45309" />
              </LinearGradient>
              <LinearGradient id="ribbonFold" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#92400E" />
                <Stop offset="100%" stopColor="#451A03" />
              </LinearGradient>
            </Defs>

            {/* Ribbon Left Swallowtail Flag */}
            <Path d="M 10 7 L 30 7 L 30 33 L 10 33 L 20 20 Z" fill="url(#bannerGrad)" stroke="#78350F" strokeWidth="1" />
            <Path d="M 28 33 L 30 33 L 30 38 Z" fill="url(#ribbonFold)" />

            {/* Ribbon Right Swallowtail Flag */}
            <Path d="M 190 7 L 170 7 L 170 33 L 190 33 L 180 20 Z" fill="url(#bannerGrad)" stroke="#78350F" strokeWidth="1" />
            <Path d="M 172 33 L 170 33 L 170 38 Z" fill="url(#ribbonFold)" />

            {/* Center Scroll Plaque */}
            <Rect x="25" y="4" width="150" height="32" rx="4" fill="url(#bannerGrad)" stroke="#78350F" strokeWidth="1.2" />
            <Rect x="27" y="6" width="146" height="28" rx="3" fill="#FFFDF5" fillOpacity="0.88" stroke="#D97706" strokeWidth="0.8" />

            {/* Small decorative flourishes on banner sides */}
            <Circle cx="35" cy="20" r="2" fill="#B45309" />
            <Circle cx="165" cy="20" r="2" fill="#B45309" />
          </Svg>

          <Text style={styles.bannerNameText} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        {/* Calligraphy Title: HAPPY Durga Puja */}
        <View style={styles.titleWrapper}>
          <Text style={styles.happyText}>HAPPY</Text>
          <Text style={styles.durgaPujaText}>Durga Puja</Text>

          {/* Golden Lotus Flower Emblem */}
          <Svg width={wp(0.12)} height={hp(0.024)} viewBox="0 0 40 20" style={styles.lotusSvg}>
            <Defs>
              <LinearGradient id="lotusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FDE68A" />
                <Stop offset="50%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#D97706" />
              </LinearGradient>
            </Defs>
            <Path d="M 20 2 C 22 8 23 15 20 18 C 17 15 18 8 20 2 Z" fill="url(#lotusGrad)" />
            <Path d="M 20 18 C 16 16 11 12 12 7 C 15 8 18 13 20 18 Z" fill="url(#lotusGrad)" />
            <Path d="M 20 18 C 14 17 6 15 6 12 C 10 12 16 15 20 18 Z" fill="url(#lotusGrad)" opacity="0.85" />
            <Path d="M 20 18 C 24 16 29 12 28 7 C 25 8 22 13 20 18 Z" fill="url(#lotusGrad)" />
            <Path d="M 20 18 C 26 17 34 15 34 12 C 30 12 24 15 20 18 Z" fill="url(#lotusGrad)" opacity="0.85" />
            <Path d="M 12 19 L 28 19" stroke="url(#lotusGrad)" strokeWidth="1.5" strokeLinecap="round" />
          </Svg>
        </View>
      </View>
    );
  }

  // 2. Mandala / Diya Festive footer
  if (frameId === 'mandala' || frameId === 'diya_mandala' || frameId?.includes('mandala')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="festiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FDE047" />
                <Stop offset="50%" stopColor="#E11D48" />
                <Stop offset="100%" stopColor="#9F1239" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="47" stroke="url(#festiveGrad)" strokeWidth="3" fill="#1C1917" fillOpacity="0.6" />
            <Circle cx="50" cy="50" r="41" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" />
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 46 * Math.cos(rad);
              const cy = 50 + 46 * Math.sin(rad);
              return <Circle key={i} cx={cx} cy={cy} r="2.2" fill="#FDE047" />;
            })}
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={styles.festivePlaque}>
            <Text style={styles.festiveNameText} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 3. Royal Imperial Crest Frame
  if (frameId === 'royal_crest' || frameId?.includes('royal')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="royalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FDE68A" />
                <Stop offset="40%" stopColor="#D97706" />
                <Stop offset="80%" stopColor="#78350F" />
                <Stop offset="100%" stopColor="#451A03" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="48" stroke="url(#royalGrad)" strokeWidth="3.5" fill="#2A0808" fillOpacity="0.75" />
            <Circle cx="50" cy="50" r="41.5" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="2, 4" fill="none" />
            <Path d="M 40 8 L 45 15 L 50 6 L 55 15 L 60 8 L 57 20 L 43 20 Z" fill="#F59E0B" />
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={[styles.simplePlaque, { backgroundColor: '#450A0A', borderColor: '#D97706' }]}>
            <Text style={[styles.bannerNameText, { color: '#FDE68A' }]} numberOfLines={1}>
              👑 {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 4. Radiant Sunrise Amber Frame
  if (frameId === 'sunrise_amber' || frameId === 'diya_temple' || frameId?.includes('sunrise')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FEF08A" />
                <Stop offset="50%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#EA580C" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="47" stroke="url(#sunGrad)" strokeWidth="3" fill="#241407" fillOpacity="0.65" />
            <Circle cx="50" cy="50" r="41" stroke="#FEF9C3" strokeWidth="1.5" fill="none" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 44 * Math.cos(rad);
              const y1 = 50 + 44 * Math.sin(rad);
              const x2 = 50 + 49 * Math.cos(rad);
              const y2 = 50 + 49 * Math.sin(rad);
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#FEF08A" strokeWidth="1.8" />;
            })}
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={[styles.simplePlaque, { backgroundColor: '#FFFBEB', borderColor: '#EA580C' }]}>
            <Text style={[styles.bannerNameText, { color: '#C2410C' }]} numberOfLines={1}>
              ☀️ {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 5. Sacred Devotional Om Frame
  if (frameId === 'bhakti_om' || frameId?.includes('bhakti') || frameId?.includes('om')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="omGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FED7AA" />
                <Stop offset="50%" stopColor="#F97316" />
                <Stop offset="100%" stopColor="#C2410C" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="47" stroke="url(#omGrad)" strokeWidth="3.2" fill="#2E1065" fillOpacity="0.7" />
            <Circle cx="50" cy="50" r="42" stroke="#FEF3C7" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" />
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={[styles.simplePlaque, { backgroundColor: '#2E1065', borderColor: '#F97316' }]}>
            <Text style={[styles.bannerNameText, { color: '#FED7AA' }]} numberOfLines={1}>
              🕉️ {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 6. Romantic Floral Love Frame
  if (frameId === 'romantic_floral' || frameId === 'couple' || frameId?.includes('floral') || frameId?.includes('love')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="floralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FBCFE8" />
                <Stop offset="50%" stopColor="#EC4899" />
                <Stop offset="100%" stopColor="#BE185D" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="47" stroke="url(#floralGrad)" strokeWidth="3" fill="#2A0B1A" fillOpacity="0.65" />
            <Circle cx="50" cy="50" r="41.5" stroke="#FFF1F2" strokeWidth="1.5" strokeDasharray="2, 4" fill="none" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 46 * Math.cos(rad);
              const cy = 50 + 46 * Math.sin(rad);
              return <Circle key={i} cx={cx} cy={cy} r="2.5" fill="#F472B6" />;
            })}
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={[styles.simplePlaque, { backgroundColor: '#FFF1F2', borderColor: '#EC4899' }]}>
            <Text style={[styles.bannerNameText, { color: '#BE185D' }]} numberOfLines={1}>
              💖 {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 7. Moonlight Silver Starlight Frame
  if (frameId === 'moon_clouds' || frameId?.includes('moonlight')) {
    return (
      <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
        <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#E2E8F0" />
                <Stop offset="50%" stopColor="#38BDF8" />
                <Stop offset="100%" stopColor="#0284C7" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="47" stroke="url(#silverGrad)" strokeWidth="3" fill="#0F172A" fillOpacity="0.7" />
            <Circle cx="50" cy="50" r="41" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" />
          </Svg>
          {renderUserPhoto()}
        </View>

        <View style={styles.bannerWrapper}>
          <View style={[styles.simplePlaque, { backgroundColor: '#0F172A', borderColor: '#38BDF8' }]}>
            <Text style={[styles.bannerNameText, { color: '#38BDF8' }]} numberOfLines={1}>
              ✨ {userName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 8. Rose Glow Modern (default fallback)
  return (
    <View style={[styles.container, { width: cardWidth }]} pointerEvents="none">
      <View style={[styles.ringContainer, { width: ringSize, height: ringSize }]}>
        <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="roseGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FDA4AF" />
              <Stop offset="100%" stopColor="#E11D48" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="46" stroke="url(#roseGlow)" strokeWidth="3" fill="#18181B" fillOpacity="0.55" />
          <Circle cx="50" cy="50" r="41" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3, 3" fill="none" />
        </Svg>
        {renderUserPhoto()}
      </View>

      <View style={styles.bannerWrapper}>
        <View style={styles.simplePlaque}>
          <Text style={styles.bannerNameText} numberOfLines={1}>
            {userName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: hp(0.032),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  photoMask: {
    overflow: 'hidden',
    backgroundColor: '#374151',
  },
  bannerWrapper: {
    marginTop: -hp(0.012),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(0.042),
    width: wp(0.48),
    zIndex: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  bannerNameText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: '#3B1F0B',
    textAlign: 'center',
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  simplePlaque: {
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E11D48',
  },
  festivePlaque: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#9F1239',
  },
  festiveNameText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: '#9F1239',
    textAlign: 'center',
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.004),
  },
  happyText: {
    color: '#FEF3C7',
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  durgaPujaText: {
    color: '#FFFBEB',
    fontSize: fontScale(24),
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(120, 53, 15, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: -2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  lotusSvg: {
    marginTop: 2,
  },
});

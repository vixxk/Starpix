import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { wp, hp, fontScale } from '../utils/responsive';
import { FONTS } from '../constants/colors';
import { resolveMediaUrl } from '../utils/media';

export default function ReelPersonalizationOverlay({
  frameId = 'durga_puja',
  userName = 'Uika',
  userPhotoUri = null,
  cardWidth,
  cardHeight,
}) {
  if (!frameId || frameId === 'none') return null;

  const photoSize = wp(0.18);
  const ringSize = wp(0.24);
  const effectivePhoto = userPhotoUri
    ? resolveMediaUrl(userPhotoUri)
    : 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/sample/user_sample_face.jpg';

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
          <View style={[styles.photoMask, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
            <Image source={{ uri: effectivePhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          </View>
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

  // Mandala / Festive footer
  if (frameId === 'mandala' || frameId === 'diya_temple') {
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
          <View style={[styles.photoMask, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
            <Image source={{ uri: effectivePhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          </View>
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

  // Modern / Glassmorphism footer for moon_lake, moon_clouds, couple, etc.
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
        <View style={[styles.photoMask, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
          <Image source={{ uri: effectivePhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        </View>
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

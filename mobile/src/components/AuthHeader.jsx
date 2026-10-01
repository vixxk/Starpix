import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fontScale } from '../utils/responsive';
import { FONTS } from '../constants/colors';
import { useTranslation } from 'react-i18next';

export default function AuthHeader({ showBack = false, onBack, tagline }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const headerHeight = hp(0.35);

  return (
    <View style={[styles.headerContainer, { height: headerHeight }]}>
      {/* Red Ambient Gradient & Fluid Sphere Shapes */}
      <Svg
        width={wp(1.0)}
        height={headerHeight}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="redBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF333E" />
            <Stop offset="45%" stopColor="#EE1D24" />
            <Stop offset="100%" stopColor="#C9101A" />
          </LinearGradient>

          <RadialGradient
            id="centerAura"
            cx="50%"
            cy="52%"
            r="45%"
            fx="50%"
            fy="52%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="55%" stopColor="#FF6B72" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#EE1D24" stopOpacity="0" />
          </RadialGradient>

          <LinearGradient id="circleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#EE1D24" stopOpacity="0.04" />
          </LinearGradient>
        </Defs>

        {/* Base Red Gradient */}
        <Rect x="0" y="0" width={wp(1.0)} height={headerHeight} fill="url(#redBg)" />

        {/* Large Overlapping Fluid Circles / Curves as seen in screenshots */}
        {/* Left arc */}
        <Circle
          cx={-wp(0.12)}
          cy={headerHeight * 0.42}
          r={wp(0.48)}
          fill="url(#circleGlow)"
        />

        {/* Right upper arc */}
        <Circle
          cx={wp(1.12)}
          cy={headerHeight * 0.35}
          r={wp(0.52)}
          fill="url(#circleGlow)"
        />

        {/* Bottom-left curved wave */}
        <Circle
          cx={wp(0.18)}
          cy={headerHeight * 0.95}
          r={wp(0.46)}
          fill="#FFFFFF"
          fillOpacity={0.06}
        />

        {/* Bottom-right curved wave */}
        <Circle
          cx={wp(0.85)}
          cy={headerHeight * 0.92}
          r={wp(0.44)}
          fill="#FFFFFF"
          fillOpacity={0.07}
        />

        {/* Soft Radial Center Aura behind Brand Logo */}
        <Circle
          cx={wp(0.5)}
          cy={headerHeight * 0.52}
          r={wp(0.42)}
          fill="url(#centerAura)"
        />
      </Svg>

      {/* Back Button */}
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={[styles.backButton, { top: Math.max(insets.top, hp(0.015)) + hp(0.01) }]}
        >
          <Ionicons name="chevron-back" size={fontScale(22)} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Centered Brand Logo & Tagline */}
      <View style={styles.brandCenter}>
        <View style={styles.logoRow}>
          {/* Brand Name Text: "Star" in dark black, "pix" in bright red */}
          <Text style={styles.logoText}>
            <Text style={styles.starText}>Star</Text>
            <Text style={styles.pixText}>pix</Text>
          </Text>

          {/* Sparkles Above "pix" */}
          <View style={styles.sparkleWrap} pointerEvents="none">
            {/* Small Left Star */}
            <Svg width={wp(0.038)} height={wp(0.038)} viewBox="0 0 20 20" style={styles.smallSparkle}>
              <Path
                d="M10 0 C10 6 14 10 20 10 C14 10 10 14 10 20 C10 14 6 10 0 10 C6 10 10 6 10 0 Z"
                fill="#EE1D24"
              />
            </Svg>
            {/* Larger Right Star */}
            <Svg width={wp(0.06)} height={wp(0.06)} viewBox="0 0 24 24" style={styles.largeSparkle}>
              <Path
                d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
                fill="#EE1D24"
              />
            </Svg>
          </View>
        </View>

        {/* Tagline */}
        <Text style={styles.taglineText}>
          {tagline || t('auth_tagline') || 'Make Status. Be the Star.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: wp(0.05),
    zIndex: 10,
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -hp(0.015),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  logoText: {
    fontSize: fontScale(35),
    fontFamily: FONTS.bold,
    letterSpacing: -0.6,
  },
  starText: {
    color: '#111827',
  },
  pixText: {
    color: '#EE1D24',
  },
  sparkleWrap: {
    position: 'absolute',
    top: -hp(0.02),
    right: -wp(0.045),
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  smallSparkle: {
    marginRight: -wp(0.005),
    marginBottom: hp(0.006),
  },
  largeSparkle: {
    transform: [{ rotate: '4deg' }],
  },
  taglineText: {
    color: '#1F2937',
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    marginTop: hp(0.006),
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

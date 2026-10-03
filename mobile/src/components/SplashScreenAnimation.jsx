import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

// Try to keep native splash visible until our animated splash component renders
try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 4-pointed diamond sparkle SVG
 */
function SparkleSvg({ size = 20, color = '#FFD000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill={color}
      />
    </Svg>
  );
}

export default function SplashScreenAnimation({ isReady = false, onFinish, minDuration = 2000 }) {
  const { t } = useTranslation();

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  // Star logo entrance & floating
  const starScale = useRef(new Animated.Value(0.2)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(-12)).current;
  const starFloat = useRef(new Animated.Value(0)).current;

  // Background aura pulse (centered directly on star)
  const auraScale = useRef(new Animated.Value(0.85)).current;
  const auraOpacity = useRef(new Animated.Value(0)).current;

  // Cosmic shockwave ring
  const shockwaveScale = useRef(new Animated.Value(0.7)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;

  // Text entrance
  const textTranslateY = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Sparkles animations
  const sparkleScale1 = useRef(new Animated.Value(0)).current;
  const sparkleScale2 = useRef(new Animated.Value(0)).current;
  const sparkleScale3 = useRef(new Animated.Value(0)).current;
  const sparkleScale4 = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  // Shimmer progress bar
  const progressBarWidth = useRef(new Animated.Value(0)).current;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const isExiting = useRef(false);

  // 1. Hide native splash once component is mounted
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  // 2. Play Main Animation Sequence
  useEffect(() => {
    // Continuous sparkle rotation
    Animated.loop(
      Animated.timing(sparkleRotate, {
        toValue: 360,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Continuous floating for star logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(starFloat, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(starFloat, {
          toValue: 6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous aura breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(auraScale, {
          toValue: 1.12,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraScale, {
          toValue: 0.94,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coordinated Entrance Animation: Star, Glow, Sparkles & Text appear harmoniously
    Animated.parallel([
      // A. Star Springs in
      Animated.parallel([
        Animated.timing(starOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(starScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(starRotate, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // B. Radial Aura fades in smoothly
      Animated.timing(auraOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      // C. Shockwave burst centered on star
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(shockwaveScale, {
            toValue: 2.1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(shockwaveOpacity, {
              toValue: 0.65,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(shockwaveOpacity, {
              toValue: 0,
              duration: 620,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),

      // D. Sparkles pop in with quick stagger
      Animated.sequence([
        Animated.delay(100),
        Animated.stagger(90, [
          Animated.spring(sparkleScale1, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(sparkleScale2, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(sparkleScale3, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(sparkleScale4, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
      ]),

      // E. Starpix Text & Tagline Reveal
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 550,
            delay: 100,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Progress bar fill across bottom
    Animated.timing(progressBarWidth, {
      toValue: 1,
      duration: minDuration - 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  // 3. Trigger Outro Exit when Ready and Min Time Reached
  useEffect(() => {
    if (isReady && minTimeElapsed && !isExiting.current) {
      isExiting.current = true;

      Animated.parallel([
        // Star gives a celebratory pop
        Animated.timing(starScale, {
          toValue: 1.08,
          duration: 320,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        // Entire splash screen smoothly fades out
        Animated.timing(containerScale, {
          toValue: 1.04,
          duration: 360,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 340,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }
  }, [isReady, minTimeElapsed, onFinish]);

  const spinInterpolation = sparkleRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const starRotateInterpolation = starRotate.interpolate({
    inputRange: [-12, 0],
    outputRange: ['-12deg', '0deg'],
  });

  const logoSize = Math.min(SCREEN_WIDTH * 0.44, 175);
  const glowSize = Math.round(logoSize * 2.5);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
      pointerEvents={isExiting.current ? 'none' : 'auto'}
    >
      {/* Center Branding Content */}
      <View style={styles.centerBox}>
        {/* Star Section: Glow and Star are anchored at the EXACT same center */}
        <View style={[styles.starSection, { width: logoSize, height: logoSize }]}>
          {/* Feathered Radial Gradient Glow - perfectly centered behind the star */}
          <Animated.View
            style={[
              styles.radialGlowWrapper,
              {
                width: glowSize,
                height: glowSize,
                left: -(glowSize - logoSize) / 2,
                top: -(glowSize - logoSize) / 2,
                opacity: auraOpacity,
                transform: [{ scale: auraScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={glowSize} height={glowSize} viewBox={`0 0 ${glowSize} ${glowSize}`}>
              <Defs>
                <RadialGradient
                  id="starGlowGrad"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#EE1D24" stopOpacity="0.32" />
                  <Stop offset="35%" stopColor="#C41230" stopOpacity="0.18" />
                  <Stop offset="70%" stopColor="#800020" stopOpacity="0.05" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle
                cx={glowSize / 2}
                cy={glowSize / 2}
                r={glowSize / 2}
                fill="url(#starGlowGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Shockwave Burst Ring - centered on the star */}
          <Animated.View
            style={[
              styles.shockwaveRing,
              {
                width: logoSize * 1.15,
                height: logoSize * 1.15,
                left: -(logoSize * 1.15 - logoSize) / 2,
                top: -(logoSize * 1.15 - logoSize) / 2,
                borderRadius: (logoSize * 1.15) / 2,
                opacity: shockwaveOpacity,
                transform: [{ scale: shockwaveScale }],
              },
            ]}
            pointerEvents="none"
          />

          {/* Diamond Sparkles anchored around the star */}
          <Animated.View
            style={[
              styles.sparkleItem,
              {
                top: -12,
                left: -18,
                transform: [{ scale: sparkleScale1 }, { rotate: spinInterpolation }],
              },
            ]}
          >
            <SparkleSvg size={24} color="#EE1D24" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkleItem,
              {
                top: -8,
                right: -24,
                transform: [{ scale: sparkleScale2 }, { rotate: spinInterpolation }],
              },
            ]}
          >
            <SparkleSvg size={34} color="#C41230" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkleItem,
              {
                bottom: 8,
                right: -22,
                transform: [{ scale: sparkleScale3 }, { rotate: spinInterpolation }],
              },
            ]}
          >
            <SparkleSvg size={22} color="#FF3366" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkleItem,
              {
                bottom: -10,
                left: -14,
                transform: [{ scale: sparkleScale4 }, { rotate: spinInterpolation }],
              },
            ]}
          >
            <SparkleSvg size={20} color="#800020" />
          </Animated.View>

          {/* Animated 3D Shooting Star Logo */}
          <Animated.View
            style={[
              styles.starWrapper,
              {
                width: logoSize,
                height: logoSize,
                opacity: starOpacity,
                transform: [
                  { scale: starScale },
                  { translateY: starFloat },
                  { rotate: starRotateInterpolation },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/star-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Brand Text Section */}
        <Animated.View
          style={[
            styles.brandTextContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          {/* Wordmark: "Star" + "pix" with Sparkles */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.textStar}>Star</Text>
            <View style={styles.pixWrapper}>
              <Text style={styles.textPix}>pix</Text>
              {/* Twin Sparkles above "pix" from official brand logo */}
              <View style={styles.pixSparkleSmall}>
                <SparkleSvg size={13} color="#EE1D24" />
              </View>
              <View style={styles.pixSparkleLarge}>
                <SparkleSvg size={19} color="#EE1D24" />
              </View>
            </View>
          </View>

          {/* Localized Tagline */}
          <Animated.Text
            style={[
              styles.taglineText,
              { opacity: taglineOpacity },
            ]}
          >
            {t('auth_tagline') || 'Make Status. Be the Star.'}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Sleek Minimalist Loading Shimmer Bar at bottom */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressBarWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF', // Clean white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  radialGlowWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwaveRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(238, 29, 36, 0.4)',
  },
  sparkleItem: {
    position: 'absolute',
    zIndex: 2,
  },
  starWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#C41230',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTextContainer: {
    alignItems: 'center',
    marginTop: 4,
    zIndex: 5,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStar: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'Poppins_800ExtraBold',
    fontSize: Math.min(SCREEN_WIDTH * 0.12, 48),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  pixWrapper: {
    position: 'relative',
    marginLeft: 1,
  },
  textPix: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'Poppins_800ExtraBold',
    fontSize: Math.min(SCREEN_WIDTH * 0.12, 48),
    fontWeight: '900',
    color: '#EE1D24',
    letterSpacing: -1,
    textShadowColor: 'rgba(238, 29, 36, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  pixSparkleSmall: {
    position: 'absolute',
    top: -10,
    right: 28,
  },
  pixSparkleLarge: {
    position: 'absolute',
    top: -20,
    right: 4,
  },
  taglineText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'Poppins_500Medium',
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 15),
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: Math.max(SCREEN_HEIGHT * 0.07, 44),
    width: SCREEN_WIDTH * 0.38,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#EE1D24',
  },
});

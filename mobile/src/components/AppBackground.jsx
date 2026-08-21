import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS, BRUTAL } from '../constants/colors';
import { resolveMediaUrl } from '../utils/media';

export default function AppBackground({ children, style, variant = 'soft', bgImage, resizeMode = 'stretch' }) {
  const isBrutal = variant === 'bone';
  const resolvedBg = bgImage ? resolveMediaUrl(bgImage) : null;

  return (
    <View style={[styles.container, isBrutal && styles.brutalContainer, style]}>
      {resolvedBg ? (
        <>
          <Image
            source={{ uri: resolvedBg }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={resizeMode}
          />
          <View style={styles.darkOverlay} />
        </>
      ) : !isBrutal ? (
        <>
          {/* Soft orange radial glows */}
          <View style={[styles.glow, styles.glowTop]} />
          <View style={[styles.glow, styles.glowBottom]} />
        </>
      ) : null}

      {/* Screen Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
    overflow: 'hidden',
  },
  brutalContainer: {
    backgroundColor: BRUTAL.bone,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 8, 3, 0.45)',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(253, 186, 116, 0.14)',
  },
  glowTop: {
    top: -140,
    right: -110,
    width: 340,
    height: 340,
  },
  glowBottom: {
    bottom: -160,
    left: -130,
    width: 360,
    height: 360,
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});

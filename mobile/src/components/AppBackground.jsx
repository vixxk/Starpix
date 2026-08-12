import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function AppBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* Soft orange radial glows */}
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

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

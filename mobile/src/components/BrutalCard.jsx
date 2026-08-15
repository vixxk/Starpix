import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BRUTAL } from '../constants/colors';
import { wp } from '../utils/responsive';

/**
 * Neo-Brutalist card — sharp corners, hard ink border and a solid offset
 * shadow (a plate behind the card, since RN shadows can't "spread").
 *
 * Usage:
 *   <BrutalCard offset={wp(0.016)} plateColor={BRUTAL.ink}>
 *     <View>…content…</View>
 *   </BrutalCard>
 */
export default function BrutalCard({ children, style, contentStyle, offset, plateColor }) {
  const shadowOffset = offset ?? wp(0.016);
  return (
    <View style={[styles.wrap, style]}>
      {/* Hard shadow plate */}
      <View
        pointerEvents="none"
        style={[
          styles.plate,
          {
            top: shadowOffset,
            left: shadowOffset,
            backgroundColor: plateColor || BRUTAL.ink,
          },
        ]}
      />
      {/* Card face */}
      <View style={[styles.face, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    width: '100%',
  },
  plate: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  face: {
    backgroundColor: BRUTAL.paper,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
});

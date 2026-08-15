import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS, BRUTAL } from '../constants/colors';
import { fontScale, wp } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function AppButton({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isBrutal = variant === 'brutal';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptic="impact"
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isSecondary && styles.secondaryButton,
        isBrutal && styles.brutalButton,
        disabled && styles.disabledButton,
        style,
      ]}
      contentStyle={styles.content}
    >
      {isBrutal ? (
        <View style={styles.brutalWrap}>
          {/* Hard shadow plate */}
          <View style={styles.brutalPlate} pointerEvents="none" />
          {/* Stamped face */}
          <View style={styles.brutalFace}>
            {loading ? (
              <ActivityIndicator color={BRUTAL.ink} />
            ) : (
              <Text style={[styles.brutalText, textStyle]}>{title}</Text>
            )}
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.orange} />
      ) : (
        <Text style={[styles.text, isSecondary && styles.secondaryText, textStyle]}>
          {title}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(0.04),
  },
  primaryButton: {
    backgroundColor: COLORS.orange,
    elevation: 4,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.white,
    fontSize: fontScale(15.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  secondaryText: {
    color: COLORS.orange,
  },
  brutalWrap: {
    position: 'relative',
    width: '100%',
  },
  brutalPlate: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 0,
    bottom: 0,
    backgroundColor: BRUTAL.ink,
  },
  brutalFace: {
    minHeight: 54,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(0.04),
    position: 'relative',
    zIndex: 2,
  },
  brutalText: {
    color: BRUTAL.ink,
    fontSize: fontScale(14.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

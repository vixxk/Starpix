import React from 'react';
import { Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
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

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptic="impact"
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isSecondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      contentStyle={styles.content}
    >
      {loading ? (
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
    paddingHorizontal: wp(0.04),
    width: '100%',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    letterSpacing: 0.1,
  },
  secondaryText: {
    color: COLORS.orange,
  },
});

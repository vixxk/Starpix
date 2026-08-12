import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp } from '../utils/responsive';

/**
 * Small floating toast (orange theme). Pass `message` to show; it animates in,
 * auto-dismisses after `duration`, then calls `onDone`. Pass a changing
 * `toastKey` to re-trigger even when the message text is identical.
 */
export default function Toast({ message, toastKey = 0, onDone, duration = 2400, icon = 'information-circle' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 90 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 10, duration: 160, useNativeDriver: true }),
      ]).start(() => onDone && onDone());
    }, duration);

    return () => clearTimeout(timer);
  }, [toastKey, message, duration, onDone, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom: 76 + insets.bottom, opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.orange} />
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: wp(0.82),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 6,
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flexShrink: 1,
    color: COLORS.ink,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semibold,
    lineHeight: fontScale(17),
  },
});

import React, { useRef, useCallback } from 'react';
import { Animated, Pressable } from 'react-native';
import { hapticTap, hapticImpact } from '../utils/haptics';

/**
 * Pressable wrapper with subtle spring scale + opacity feedback.
 * `style` applies to the animated container (use for width/height/layout),
 * `contentStyle` applies to the inner Pressable (use for padding/alignment).
 * NOTE: the inner Pressable fills the container (flex: 1), so when the wrapper
 * has fixed dimensions, pass a centering `contentStyle` to align its children.
 */
export default function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  contentStyle,
  scaleTo = 0.96,
  opacityTo = 0.8,
  disabled = false,
  haptic = 'tap', // 'tap' | 'impact' | 'none'
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (haptic === 'tap') hapticTap();
    else if (haptic === 'impact') hapticImpact();
    Animated.parallel([
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.timing(opacity, { toValue: opacityTo, duration: 90, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, scaleTo, opacityTo, haptic]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        style={[{ flex: 1 }, contentStyle]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

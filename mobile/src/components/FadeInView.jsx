import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Wrapper that fades in (and slides up slightly) when mounted.
 * `delay` staggers entrances — pass increasing delays for a cascade effect.
 */
export default function FadeInView({
  children,
  delay = 0,
  duration = 420,
  distance = 14,
  style,
  ...rest
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, translateY, duration, delay, distance]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

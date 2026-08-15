import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeInView({
  children,
  delay = 0,
  duration = 300,
  distance = 8,
  style,
  ...rest
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(distance);

    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]);

    anim.start();

    return () => {
      anim.stop();
      opacity.setValue(1);
      translateY.setValue(0);
    };
  }, [delay, duration, distance]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

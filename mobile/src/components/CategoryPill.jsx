import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale } from '../utils/responsive';
import { hapticImpact } from '../utils/haptics';

export default function CategoryPill({ category, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          hapticImpact();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.pill, isSelected ? styles.selectedPill : styles.unselectedPill]}
      >
        <View style={[styles.iconWrap, isSelected && styles.selectedIconWrap]}>
          <Text style={styles.icon}>{category.icon || '✨'}</Text>
        </View>
        <Text style={[styles.text, isSelected ? styles.selectedText : styles.unselectedText]}>
          {category.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1.2,
    gap: 5,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  selectedPill: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
    elevation: 2,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  unselectedPill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
  },
  icon: {
    fontSize: fontScale(11),
    textAlign: 'center',
  },
  text: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  selectedText: {
    color: COLORS.white,
  },
  unselectedText: {
    color: COLORS.ink,
  },
});

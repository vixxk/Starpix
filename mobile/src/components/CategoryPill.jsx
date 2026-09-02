import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale } from '../utils/responsive';
import { hapticImpact } from '../utils/haptics';
import { getLocalizedName } from '../utils/localized';

export default function CategoryPill({ category, isSelected, onPress, small = false }) {
  const { i18n } = useTranslation();
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
        style={[
          styles.pill,
          small && styles.smallPill,
          isSelected ? styles.selectedPill : styles.unselectedPill,
        ]}
      >
        <View style={[styles.iconWrap, small && styles.smallIconWrap, isSelected && styles.selectedIconWrap]}>
          <Text style={[styles.icon, small && styles.smallIcon]}>{category.icon || '✨'}</Text>
        </View>
        <Text style={[styles.text, small && styles.smallText, isSelected ? styles.selectedText : styles.unselectedText]}>
          {getLocalizedName(category, i18n.language)}
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
  smallPill: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    marginRight: 6,
    borderWidth: 1,
    gap: 4,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  smallIcon: {
    fontSize: fontScale(9.5),
  },
  text: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  smallText: {
    fontSize: fontScale(10),
  },
  selectedText: {
    color: COLORS.white,
  },
  unselectedText: {
    color: COLORS.ink,
  },
});

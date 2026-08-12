import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function CategoryPill({ category, isSelected, onPress }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.pill, isSelected ? styles.selectedPill : styles.unselectedPill]}
      contentStyle={styles.content}
    >
      <View style={[styles.iconWrap, isSelected && styles.selectedIconWrap]}>
        <Text style={styles.icon}>{category.icon || '✨'}</Text>
      </View>
      <Text style={[styles.text, isSelected ? styles.selectedText : styles.unselectedText]}>
        {category.name}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  unselectedPill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
  },
  icon: {
    fontSize: fontScale(12.5),
    lineHeight: fontScale(15),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  text: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
  },
  selectedText: {
    color: COLORS.white,
  },
  unselectedText: {
    color: COLORS.inkMuted,
  },
});

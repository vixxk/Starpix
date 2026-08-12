import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function CategoryCard({ category, isSelected, onPress }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      style={[styles.card, isSelected && styles.selectedCard]}
      contentStyle={styles.content}
    >
      <View style={[styles.iconChip, isSelected && styles.selectedIconChip]}>
        <Text style={styles.icon}>{category.icon || '✨'}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.name, isSelected && styles.selectedName]}
      >
        {category.name}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 78,
    marginRight: 10,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCard: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeTint,
  },
  content: {
    alignItems: 'center',
    gap: 6,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconChip: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  icon: {
    fontSize: fontScale(20),
  },
  name: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.semibold,
    textAlign: 'center',
  },
  selectedName: {
    color: COLORS.orange,
  },
});

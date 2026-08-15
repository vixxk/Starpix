import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp, CARD_SHADOW } from '../utils/responsive';
import PressableScale from './PressableScale';

/**
 * Themed "Explore Status Templates" CTA card used in empty states
 * (Favorites, Downloads). Full width, matches the app's orange/cream theme.
 */
export default function ExploreCta({ onPress, style }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      haptic="impact"
      style={[styles.card, style]}
      contentStyle={styles.content}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={22} color={COLORS.white} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          Explore Status Templates
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Choose from 100+ designs
        </Text>
      </View>
      <View style={styles.arrowWrap}>
        <Ionicons name="arrow-forward" size={16} color={COLORS.orange} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 70,
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  content: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    elevation: 2,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  textWrap: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1,
    borderColor: 'rgba(247, 227, 208, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});

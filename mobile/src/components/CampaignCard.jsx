import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
import { wp, hp, fontScale, SCREEN_PAD, SPACING, CARD_SHADOW } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function CampaignCard({ campaign, onPress }) {
  if (!campaign) return null;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={styles.container}
    >
      <Image
        source={{ uri: campaign.heroBackground || campaign.heroImage }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⭐ SPECIAL CAMPAIGN</Text>
        </View>
        <View>
          <Text style={styles.title}>{campaign.name}</Text>
          <Text numberOfLines={2} style={styles.description}>{campaign.description}</Text>
        </View>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>{campaign.ctaText || 'Explore Campaign'}</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    height: hp(0.21),
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SCREEN_PAD,
    marginTop: SPACING.md,
    position: 'relative',
    ...CARD_SHADOW,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 15, 5, 0.58)',
  },
  content: {
    flex: 1,
    padding: wp(0.045),
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  title: {
    color: COLORS.white,
    fontSize: fontScale(18),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.3,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    marginTop: 3,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  ctaText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(12),
  },
  ctaArrow: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14),
    marginLeft: 4,
    marginTop: -1,
  },
});

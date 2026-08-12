import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/colors';
import { CARD_WIDTH, CARD_SHADOW, fontScale } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function TemplateCard({ template, onPress, width, style }) {
  const isPremium = template.accessType === 'premium';
  const isVideo = template.type === 'video';

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
      style={[
        styles.card,
        style,
        {
          width: width || CARD_WIDTH,
          aspectRatio: 0.72,
        },
        CARD_SHADOW,
      ]}
    >
      <Image
        source={{ uri: template.thumbnail || template.previewAsset }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.topShade} />

      {/* Top badges */}
      <View style={styles.badgeRow}>
        {isPremium ? (
          <View style={[styles.badge, styles.premiumBadge]}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.freeBadge]}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        )}

        {isVideo && (
          <View style={[styles.badge, styles.videoBadge]}>
            <Text style={styles.videoText}>VIDEO</Text>
          </View>
        )}
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Text numberOfLines={1} style={styles.categoryText}>{template.categoryId?.name || 'Status'}</Text>
        <Text numberOfLines={1} style={styles.titleText}>{template.name}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(20, 10, 2, 0.28)',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadge: {
    backgroundColor: COLORS.gold,
  },
  premiumText: {
    color: '#000',
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  freeBadge: {
    backgroundColor: COLORS.orange,
  },
  freeText: {
    color: COLORS.white,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  videoBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  videoText: {
    color: COLORS.white,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(247, 227, 208, 0.6)',
  },
  categoryText: {
    color: COLORS.orangeDeep,
    fontSize: fontScale(9),
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    color: COLORS.ink,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
});

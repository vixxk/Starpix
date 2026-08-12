import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, TYPO } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import PressableScale from './PressableScale';

export default function SectionHeader({ title, subtitle, onSeeAll, icon, count, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftWrap}>
        {icon && (
          <View style={styles.iconChip}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={[TYPO.h2, styles.title]} numberOfLines={1}>{title}</Text>
            {typeof count === 'number' && count > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {onSeeAll && (
        <PressableScale
          onPress={onSeeAll}
          scaleTo={0.9}
          style={styles.seeAllBtn}
          contentStyle={styles.seeAllContent}
        >
          <Text style={styles.seeAll}>See All</Text>
          <Text style={styles.seeAllArrow}>›</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    marginTop: hp(0.024),
    marginBottom: hp(0.014),
  },
  leftWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: wp(0.03),
  },
  iconChip: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.028),
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.025),
  },
  iconText: {
    fontSize: fontScale(16),
    textAlign: 'center',
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.015),
  },
  title: {
    color: COLORS.ink,
    flexShrink: 1,
  },
  countBadge: {
    minWidth: wp(0.055),
    height: wp(0.055),
    paddingHorizontal: wp(0.015),
    borderRadius: wp(0.028),
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: COLORS.white,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  seeAllBtn: {
    paddingVertical: hp(0.005),
    paddingLeft: wp(0.03),
  },
  seeAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: {
    color: COLORS.orange,
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  seeAllArrow: {
    color: COLORS.orange,
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    marginLeft: 2,
    marginTop: -1,
  },
});

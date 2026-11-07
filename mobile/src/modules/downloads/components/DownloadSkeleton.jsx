import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../../../components/Skeleton';
import { COLORS, BRUTAL } from '../../../constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../../../utils/responsive';

/**
 * Premium skeleton loading state for Downloads screen.
 * Perfectly mirrors the exact geometry, typography heights, and button layout of DownloadCard.
 */
export default function DownloadSkeleton() {
  const skeletonItems = [
    { id: 1, titleW: wp(0.46), dateW: wp(0.26), hasBadge: true },
    { id: 2, titleW: wp(0.38), dateW: wp(0.22), hasBadge: false },
    { id: 3, titleW: wp(0.42), dateW: wp(0.28), hasBadge: true },
    { id: 4, titleW: wp(0.34), dateW: wp(0.20), hasBadge: false },
    { id: 5, titleW: wp(0.40), dateW: wp(0.24), hasBadge: false },
  ];

  return (
    <View style={styles.container}>
      {/* Top Toolbar Skeleton (Prevents Layout Shift) */}
      <View style={styles.toolbarRow}>
        <Skeleton width={wp(0.32)} height={16} borderRadius={6} />
        <Skeleton width={wp(0.22)} height={24} borderRadius={8} />
      </View>

      {/* List of Skeleton Cards */}
      <View style={styles.cardList}>
        {skeletonItems.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.card,
              { opacity: Math.max(0.45, 1 - idx * 0.12) },
            ]}
          >
            {/* Left 9:16 Portrait Thumbnail */}
            <View style={styles.thumbnailWrapper}>
              <Skeleton width="100%" height="100%" borderRadius={12} />
              {item.hasBadge && (
                <View style={styles.badgePlaceholder}>
                  <Skeleton width={18} height={18} borderRadius={9} />
                </View>
              )}
            </View>

            {/* Right Content Body */}
            <View style={styles.body}>
              {/* Title & Date */}
              <View style={styles.textGroup}>
                <Skeleton width={item.titleW} height={16} borderRadius={5} />
                <Skeleton width={item.dateW} height={12} borderRadius={4} style={styles.dateSkeleton} />
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                {/* Re-download button */}
                <View style={styles.primaryBtn}>
                  <Skeleton width="100%" height="100%" borderRadius={8} />
                </View>

                {/* Share button */}
                <View style={styles.secondaryBtn}>
                  <Skeleton width="100%" height="100%" borderRadius={8} />
                </View>

                {/* Trash button */}
                <View style={styles.deleteBtn}>
                  <Skeleton width="100%" height="100%" borderRadius={8} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: hp(0.006),
    paddingBottom: hp(0.04),
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.014),
    paddingHorizontal: 2,
  },
  cardList: {
    gap: hp(0.014),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    padding: wp(0.03),
    alignItems: 'center',
    gap: wp(0.035),
    ...CARD_SHADOW,
  },
  thumbnailWrapper: {
    width: wp(0.22),
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  badgePlaceholder: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  textGroup: {
    marginBottom: 4,
  },
  dateSkeleton: {
    marginTop: 5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: wp(0.02),
  },
  primaryBtn: {
    width: wp(0.27),
    height: 29,
    borderRadius: 8,
    overflow: 'hidden',
  },
  secondaryBtn: {
    width: wp(0.20),
    height: 29,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteBtn: {
    width: 30,
    height: 29,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 'auto',
  },
});


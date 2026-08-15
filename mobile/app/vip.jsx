import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppBackground from '../src/components/AppBackground';
import ScreenHeader from '../src/components/ScreenHeader';
import AppButton from '../src/components/AppButton';
import ConfirmModal from '../src/components/ConfirmModal';
import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, SCREEN_DIMENSIONS } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const BENEFITS = [
  {
    icon: 'infinite-outline',
    title: 'All-Access Library',
    desc: 'Unlock 100+ HD photo & video status templates',
  },
  {
    icon: 'download-outline',
    title: 'Unlimited HD Exports',
    desc: 'Save in ultra-high resolution with 0 watermarks',
  },
  {
    icon: 'sparkles-outline',
    title: 'Ad-Free Studio',
    desc: 'Fast, smooth editing with zero pop-up distractions',
  },
  {
    icon: 'flash-outline',
    title: 'Early Access Drops',
    desc: 'Be first to access trending daily & festival designs',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Priority VIP Support',
    desc: 'Instant help & custom photo placement support',
  },
];

export default function VipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const isVipActive = Boolean(user && user.isPremium && user.subscriptionStatus === 'active');
  const isSmall = SCREEN_DIMENSIONS.isSmallDevice;

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top, hp(0.015)),
            paddingBottom: Math.max(insets.bottom, hp(0.02)),
          },
        ]}
      >
        <ScreenHeader
          icon="👑"
          title="VIP Pass Subscription"
          subtitle="Unlock the full Statuzzz experience"
          onBack={() => router.back()}
        />

        {/* Single Non-Scrolling Screen Layout */}
        <View style={styles.mainContainer}>
          {/* Pass Card — Hero VIP Banner */}
          <View style={[styles.passCard, isSmall && styles.passCardSmall]}>
            <View style={styles.passGlow} />
            <View style={styles.passTop}>
              <View style={[styles.crownBadge, isSmall && styles.crownBadgeSmall]}>
                <MaterialCommunityIcons name="crown" size={isSmall ? 20 : 24} color="#1c1917" />
              </View>
              <View style={styles.passTitleWrap}>
                <Text style={[styles.passTitle, isSmall && styles.passTitleSmall]}>STATUZZZ VIP</Text>
                <Text style={styles.passSubtitle} numberOfLines={1}>
                  {user ? user.name || 'Member' : 'Guest'} · All-Access Pass
                </Text>
              </View>
              {isVipActive && (
                <View style={[styles.statusBadge, styles.statusActive]}>
                  <View style={[styles.statusDot, styles.dotActive]} />
                  <Text style={[styles.statusText, styles.statusTextActive]}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.passBottom}>
              <Text style={[styles.passPrice, isSmall && styles.passPriceSmall]}>
                ₹199<Text style={styles.passPriceUnit}>/month</Text>
              </Text>
              <Text style={styles.passNote} numberOfLines={1}>
                {isVipActive ? 'Enjoy unlimited premium creations.' : 'One pass. Every template unlocked.'}
              </Text>
            </View>
          </View>

          {/* What's Included Section Header */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionLabel}>What's Included</Text>
            <Text style={styles.sectionSubtitle}>Everything you get with VIP access</Text>
          </View>

          {/* Benefits — Stacked 1-under-another Row Cards */}
          <View style={styles.benefitsList}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={styles.benefitRow}>
                <View style={styles.benefitIconWrap}>
                  <Ionicons name={b.icon} size={fontScale(18)} color={COLORS.orange} />
                </View>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitTitle} numberOfLines={1}>
                    {b.title}
                  </Text>
                  <Text style={styles.benefitDesc} numberOfLines={1}>
                    {b.desc}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={fontScale(18)} color={COLORS.success} />
              </View>
            ))}
          </View>

          {/* Bottom Upgrade CTA Button */}
          <AppButton
            title={isVipActive ? 'VIP Pass Active' : 'Upgrade to VIP Pass · ₹199/mo'}
            onPress={() => setShowComingSoon(true)}
            variant={isVipActive ? 'secondary' : 'primary'}
            style={styles.ctaBtn}
          />
        </View>
      </View>

      {/* Themed Coming Soon Modal */}
      <ConfirmModal
        visible={showComingSoon}
        title="VIP Pass Coming Soon"
        message="The VIP all-access subscription is almost here. Meanwhile, unlock any premium template individually with a one-time payment."
        confirmText="Got It"
        icon="trophy-outline"
        iconColor={COLORS.orange}
        hideCancel
        onCancel={() => setShowComingSoon(false)}
        onConfirm={() => setShowComingSoon(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: SCREEN_PAD,
    justifyContent: 'space-between',
    marginTop: hp(0.008),
  },

  /* VIP Pass Card Banner */
  passCard: {
    backgroundColor: COLORS.orange,
    borderRadius: wp(0.045),
    borderWidth: 1,
    borderColor: COLORS.orangeDeep,
    paddingHorizontal: wp(0.045),
    paddingVertical: hp(0.016),
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: hp(0.006) },
    shadowOpacity: 0.28,
    shadowRadius: wp(0.035),
  },
  passCardSmall: {
    paddingVertical: hp(0.012),
  },
  passGlow: {
    position: 'absolute',
    top: -hp(0.08),
    right: -wp(0.12),
    width: wp(0.48),
    height: wp(0.48),
    borderRadius: wp(0.24),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  passTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownBadge: {
    width: wp(0.11),
    height: wp(0.11),
    borderRadius: wp(0.035),
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  crownBadgeSmall: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.03),
  },
  passTitleWrap: {
    flex: 1,
    marginLeft: wp(0.03),
    minWidth: 0,
  },
  passTitle: {
    color: COLORS.white,
    fontSize: fontScale(16.5),
    fontFamily: FONTS.black,
    letterSpacing: 0.8,
  },
  passTitleSmall: {
    fontSize: fontScale(14.5),
  },
  passSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    marginTop: hp(0.002),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.012),
    paddingHorizontal: wp(0.028),
    paddingVertical: hp(0.005),
    borderRadius: wp(0.028),
    borderWidth: 1,
    marginLeft: wp(0.02),
  },
  statusActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  statusInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  statusDot: {
    width: wp(0.018),
    height: wp(0.018),
    borderRadius: wp(0.009),
  },
  dotActive: {
    backgroundColor: '#4ade80',
  },
  dotInactive: {
    backgroundColor: '#fca5a5',
  },
  statusText: {
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
  statusTextActive: {
    color: '#bbf7d0',
  },
  statusTextInactive: {
    color: '#fecaca',
  },
  passBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: hp(0.01),
  },
  passPrice: {
    color: COLORS.white,
    fontSize: fontScale(24),
    fontFamily: FONTS.black,
    letterSpacing: -0.5,
  },
  passPriceSmall: {
    fontSize: fontScale(20),
  },
  passPriceUnit: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  passNote: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    marginLeft: wp(0.02),
  },

  /* Section Header */
  sectionHeaderWrap: {
    marginTop: hp(0.016),
    marginBottom: 0,
  },
  sectionLabel: {
    color: COLORS.ink,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 1,
  },

  /* Benefits Stacked Rows */
  benefitsList: {
    flex: 1,
    justifyContent: 'space-evenly',
    marginTop: 0,
    marginBottom: hp(0.006),
  },
  benefitRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: wp(0.038),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: wp(0.035),
    paddingVertical: hp(0.011),
    elevation: 1,
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: hp(0.003) },
    shadowOpacity: 0.04,
    shadowRadius: wp(0.02),
  },
  benefitIconWrap: {
    width: wp(0.105),
    height: wp(0.105),
    borderRadius: wp(0.03),
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(247, 227, 208, 0.6)',
  },
  benefitTextWrap: {
    flex: 1,
    marginLeft: wp(0.03),
    marginRight: wp(0.02),
  },
  benefitTitle: {
    color: COLORS.ink,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
  },
  benefitDesc: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    marginTop: hp(0.002),
  },

  /* CTA Button */
  ctaBtn: {
    marginTop: hp(0.006),
  },
});

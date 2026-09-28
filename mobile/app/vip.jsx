import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { fontScale, wp, hp, SCREEN_PAD } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';
import ConfirmModal from '../src/components/ConfirmModal';

// High-resolution posters hosted on S3 matching the reference layout exactly
const POSTERS = {
  durgaPuja: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
  goodMorning: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/ccead801-2abb-4d74-8f50-7bee9c53fa7a.jpg',
  goodNight: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/eb57459c-c20d-4bbb-8fee-5f5464efb57d.jpg',
  togetherAlways: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/d81f4913-f71e-433f-b803-c3f27777967c.jpg',
  happyDiwali: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/6adc6e37-9b98-4470-9a27-e2915e73b4e3.jpg',
};

const PLANS = [
  {
    id: '7days',
    price: '₹29',
    periodKey: 'sub_plan_7_days',
    ctaKey: 'sub_cta_7_days',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_no_ads',
    ],
  },
  {
    id: '30days',
    price: '₹99',
    periodKey: 'sub_plan_30_days',
    ctaKey: 'sub_cta_30_days',
    badgeKey: 'sub_most_popular',
    badgeType: 'popular',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_30',
      'sub_feat_no_ads',
    ],
  },
  {
    id: '1year',
    price: '₹599',
    periodKey: 'sub_plan_1_year',
    ctaKey: 'sub_cta_1_year',
    badgeKey: 'sub_best_value',
    badgeType: 'best_value',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_year',
      'sub_feat_no_ads',
      'sub_feat_exclusive_festivals',
    ],
  },
];

export default function VipScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  const [selectedPlanId, setSelectedPlanId] = useState('30days');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState(null);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const handlePurchase = async () => {
    try {
      // Simulate upgrade / plan purchase
      const daysToAdd = selectedPlan.id === '7days' ? 7 : selectedPlan.id === '30days' ? 30 : 365;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToAdd);

      if (user) {
        await updateUserProfile({
          isPremium: true,
          subscriptionStatus: 'active',
          subscriptionPlan: selectedPlan.id,
          subscriptionExpiresAt: expiryDate.toISOString(),
        });
      }

      setPurchaseDetails({
        plan: t(selectedPlan.periodKey),
        price: selectedPlan.price,
      });
      setShowSuccessModal(true);
    } catch {
      setShowSuccessModal(true);
    }
  };

  const openUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn('Failed to open link:', e);
    }
  };

  const featureChecklist = [
    {
      id: 'templates',
      iconType: 'p_box',
      labelKey: 'sub_feat_thousands',
    },
    {
      id: 'morning_night',
      iconType: 'sun',
      labelKey: 'sub_feat_morning_night',
    },
    {
      id: 'festival_devotional',
      iconType: 'flower',
      labelKey: 'sub_feat_festival_devotional',
    },
    {
      id: 'trending_viral',
      iconType: 'trending',
      labelKey: 'sub_feat_trending_viral',
    },
    {
      id: 'personalization',
      iconType: 'person',
      labelKey: 'sub_feat_name_photo',
    },
    {
      id: 'download_share',
      iconType: 'download',
      labelKey: 'sub_feat_download_share',
    },
    {
      id: 'new_content',
      iconType: 'sparkles',
      labelKey: 'sub_feat_new_content',
    },
  ];

  const renderFeatureIcon = (type) => {
    switch (type) {
      case 'p_box':
        return (
          <View style={styles.pBadge}>
            <Text style={styles.pBadgeText}>P</Text>
          </View>
        );
      case 'sun':
        return <Ionicons name="sunny-outline" size={fontScale(13)} color="#EE1D24" />;
      case 'flower':
        return <MaterialCommunityIcons name="spa-outline" size={fontScale(13)} color="#EE1D24" />;
      case 'trending':
        return <Feather name="trending-up" size={fontScale(13)} color="#EE1D24" />;
      case 'person':
        return <Ionicons name="person-outline" size={fontScale(13)} color="#EE1D24" />;
      case 'download':
        return <Ionicons name="download-outline" size={fontScale(13)} color="#EE1D24" />;
      case 'sparkles':
        return <Ionicons name="sparkles-outline" size={fontScale(13)} color="#EE1D24" />;
      default:
        return <Ionicons name="checkmark" size={fontScale(13)} color="#EE1D24" />;
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Subtle ambient fluid background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={wp(1.0)} height={hp(1.0)}>
          <Defs>
            <RadialGradient id="topGlow" cx="90%" cy="12%" r="55%">
              <Stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="bottomLeftGlow" cx="0%" cy="92%" r="45%">
              <Stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="bottomRightGlow" cx="100%" cy="95%" r="45%">
              <Stop offset="0%" stopColor="#FFF1F2" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={wp(0.85)} cy={hp(0.14)} r={wp(0.48)} fill="url(#topGlow)" />
          <Circle cx={wp(0.05)} cy={hp(0.9)} r={wp(0.35)} fill="url(#bottomLeftGlow)" />
          <Circle cx={wp(0.95)} cy={hp(0.92)} r={wp(0.35)} fill="url(#bottomRightGlow)" />
        </Svg>
      </View>

      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, hp(0.015)) },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={fontScale(22)} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>Starpix</Text>
            <MaterialCommunityIcons
              name="star-four-points"
              size={fontScale(14)}
              color="#EE1D24"
              style={styles.brandStar}
            />
          </View>
          <Text style={styles.brandTagline}>{t('sub_tagline')}</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerSkipBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.headerSkipText}>{t('sub_skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, hp(0.02)) + hp(0.01) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section: Left Copy & Features, Right Fanned Posters */}
        <View style={styles.heroSection}>
          {/* Left Column */}
          <View style={styles.heroLeft}>
            <Text style={styles.heroUnlockText}>{t('sub_unlock')}</Text>
            <View style={styles.heroBrandRow}>
              <Text style={styles.heroBrandText}>{t('sub_starpix_premium')}</Text>
              <Text style={styles.heroCrown}>👑</Text>
            </View>
            <Text style={styles.heroSubtitle}>{t('sub_hero_subtitle')}</Text>

            {/* Checklist items */}
            <View style={styles.checklist}>
              {featureChecklist.map((item) => (
                <View key={item.id} style={styles.checkItemRow}>
                  <View style={styles.checkIconBox}>
                    {renderFeatureIcon(item.iconType)}
                  </View>
                  <Text style={styles.checkItemText} numberOfLines={2}>
                    {t(item.labelKey)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right Column: Overlapping Fanned Status Cards */}
          <View style={styles.heroRight}>
            {/* Card 1: Durga Puja (Top left, tilted -6deg) */}
            <View style={[styles.posterCard, styles.poster1]}>
              <Image
                source={{ uri: POSTERS.durgaPuja }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 2: Good Morning (Top right, tilted +8deg) */}
            <View style={[styles.posterCard, styles.poster2]}>
              <Image
                source={{ uri: POSTERS.goodMorning }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 3: Good Night (Middle left, tilted -4deg) */}
            <View style={[styles.posterCard, styles.poster3]}>
              <Image
                source={{ uri: POSTERS.goodNight }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 4: Together Always (Middle right, tilted +6deg) */}
            <View style={[styles.posterCard, styles.poster4]}>
              <Image
                source={{ uri: POSTERS.togetherAlways }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 5: Happy Diwali (Bottom center-left, tilted -3deg) */}
            <View style={[styles.posterCard, styles.poster5]}>
              <Image
                source={{ uri: POSTERS.happyDiwali }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* 3 Subscription Plan Cards */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.88}
              >
                {/* Top Badge (Most Popular / Best Value) */}
                {plan.badgeKey && (
                  <View
                    style={[
                      styles.planBadge,
                      plan.badgeType === 'popular'
                        ? styles.popularBadge
                        : styles.bestValueBadge,
                    ]}
                  >
                    {plan.badgeType === 'popular' ? (
                      <Ionicons
                        name="flash"
                        size={fontScale(9)}
                        color="#FACC15"
                        style={styles.badgeIcon}
                      />
                    ) : (
                      <Text style={styles.badgeCrownIcon}>👑</Text>
                    )}
                    <Text
                      style={[
                        styles.planBadgeText,
                        plan.badgeType === 'popular'
                          ? styles.popularBadgeText
                          : styles.bestValueBadgeText,
                      ]}
                      numberOfLines={1}
                    >
                      {t(plan.badgeKey)}
                    </Text>
                  </View>
                )}

                {/* Radio Button */}
                <View style={styles.radioWrap}>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>

                {/* Price */}
                <Text
                  style={[
                    styles.planPrice,
                    isSelected && styles.planPriceSelected,
                  ]}
                  numberOfLines={1}
                >
                  {plan.price}
                </Text>

                {/* Period */}
                <Text
                  style={[
                    styles.planPeriod,
                    isSelected && styles.planPeriodSelected,
                  ]}
                  numberOfLines={1}
                >
                  {t(plan.periodKey)}
                </Text>

                {/* Divider */}
                <View style={styles.planCardDivider} />

                {/* Feature Bullet Points */}
                <View style={styles.planFeaturesList}>
                  {plan.features.map((featKey) => (
                    <View key={featKey} style={styles.planFeatureRow}>
                      <Ionicons
                        name="checkmark"
                        size={fontScale(11)}
                        color="#EE1D24"
                        style={styles.planCheckIcon}
                      />
                      <Text style={styles.planFeatureText} numberOfLines={2}>
                        {t(featKey)}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Big Red CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePurchase}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>{t(selectedPlan.ctaKey)}</Text>
        </TouchableOpacity>

        {/* Disclaimers */}
        <View style={styles.disclaimersWrap}>
          <Text style={styles.disclaimerPrimary}>{t('sub_disclaimer_one_time')}</Text>
          <Text style={styles.disclaimerSecondary}>{t('sub_disclaimer_period')}</Text>
        </View>

        {/* 4 Trust Badges */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustBadgeItem}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={fontScale(20)}
              color="#EE1D24"
            />
            <Text style={styles.trustBadgeText}>{t('sub_trust_secure')}</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustBadgeItem}>
            <Ionicons name="card-outline" size={fontScale(20)} color="#EE1D24" />
            <Text style={styles.trustBadgeText}>{t('sub_trust_upi')}</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustBadgeItem}>
            <Ionicons name="lock-closed-outline" size={fontScale(20)} color="#EE1D24" />
            <Text style={styles.trustBadgeText}>{t('sub_trust_ssl')}</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustBadgeItem}>
            <MaterialCommunityIcons name="headphones" size={fontScale(20)} color="#EE1D24" />
            <Text style={styles.trustBadgeText}>{t('sub_trust_support')}</Text>
          </View>
        </View>

        {/* Legal Disclaimer Footer */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            {t('sub_by_purchasing')}{' '}
            <Text
              style={styles.legalLink}
              onPress={() => openUrl('https://starpix.co/terms')}
            >
              {t('sub_terms')}
            </Text>{' '}
            {t('sub_and')}{' '}
            <Text
              style={styles.legalLink}
              onPress={() => openUrl('https://starpix.co/privacy')}
            >
              {t('sub_privacy')}
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Purchase Confirmation Modal */}
      <ConfirmModal
        visible={showSuccessModal}
        title={purchaseDetails ? `🎉 ${purchaseDetails.plan}` : t('sub_starpix_premium')}
        message={
          purchaseDetails
            ? `Your subscription for ${purchaseDetails.price} is active! Enjoy unlimited status creations and watermark-free downloads.`
            : t('sub_hero_subtitle')
        }
        confirmText={t('got_it')}
        icon="crown"
        iconColor="#EE1D24"
        hideCancel
        onCancel={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.04),
    paddingBottom: hp(0.01),
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerBackBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: fontScale(22),
    fontWeight: '900',
    color: '#EE1D24',
    letterSpacing: -0.5,
  },
  brandStar: {
    marginLeft: wp(0.005),
    marginTop: -hp(0.006),
  },
  brandTagline: {
    fontSize: fontScale(9),
    color: '#4B5563',
    fontWeight: '500',
    marginTop: -hp(0.002),
  },
  headerSkipBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerSkipText: {
    fontSize: fontScale(13.5),
    fontWeight: '600',
    color: '#1F2937',
  },

  /* Scroll container */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(0.04),
  },

  /* Hero Section */
  heroSection: {
    flexDirection: 'row',
    marginTop: hp(0.006),
    marginBottom: hp(0.015),
    height: hp(0.355),
  },
  heroLeft: {
    flex: 1.18,
    paddingRight: wp(0.02),
    justifyContent: 'flex-start',
  },
  heroUnlockText: {
    fontSize: fontScale(23),
    fontWeight: '900',
    color: '#111827',
    lineHeight: fontScale(27),
    letterSpacing: -0.6,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroBrandText: {
    fontSize: fontScale(20),
    fontWeight: '900',
    color: '#EE1D24',
    lineHeight: fontScale(25),
    letterSpacing: -0.4,
  },
  heroCrown: {
    fontSize: fontScale(16),
    marginLeft: wp(0.01),
  },
  heroSubtitle: {
    fontSize: fontScale(10.5),
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: fontScale(14),
    marginTop: hp(0.004),
    marginBottom: hp(0.01),
  },

  /* Checklist */
  checklist: {
    gap: hp(0.007),
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconBox: {
    width: wp(0.055),
    height: wp(0.055),
    borderRadius: wp(0.013),
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pBadge: {
    width: wp(0.042),
    height: wp(0.042),
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.008),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pBadgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(9),
    fontWeight: '900',
  },
  checkItemText: {
    fontSize: fontScale(10.2),
    color: '#374151',
    fontWeight: '500',
    marginLeft: wp(0.018),
    flex: 1,
    lineHeight: fontScale(13.5),
  },

  /* Right Column: Fanned Cards */
  heroRight: {
    flex: 0.95,
    position: 'relative',
    height: '100%',
  },
  posterCard: {
    position: 'absolute',
    borderRadius: wp(0.035),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(0.005) },
    shadowOpacity: 0.22,
    shadowRadius: wp(0.018),
    elevation: 6,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },

  /* Precise positions & rotations for the 5 fanned cards */
  poster1: {
    top: 0,
    left: wp(0.04),
    width: wp(0.24),
    height: wp(0.315),
    transform: [{ rotate: '-6deg' }],
    zIndex: 1,
  },
  poster2: {
    top: hp(0.018),
    right: wp(0.01),
    width: wp(0.225),
    height: wp(0.295),
    transform: [{ rotate: '8deg' }],
    zIndex: 2,
  },
  poster3: {
    top: hp(0.095),
    left: wp(0.005),
    width: wp(0.235),
    height: wp(0.305),
    transform: [{ rotate: '-4deg' }],
    zIndex: 3,
  },
  poster4: {
    top: hp(0.125),
    right: wp(0.01),
    width: wp(0.225),
    height: wp(0.295),
    transform: [{ rotate: '6deg' }],
    zIndex: 4,
  },
  poster5: {
    top: hp(0.185),
    left: wp(0.045),
    width: wp(0.245),
    height: wp(0.315),
    transform: [{ rotate: '-3deg' }],
    zIndex: 5,
  },

  /* Plans Container (3 Cards side by side) */
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: wp(0.018),
    marginTop: hp(0.008),
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.035),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(0.018),
    paddingTop: hp(0.016),
    paddingBottom: hp(0.014),
    alignItems: 'center',
    position: 'relative',
    minHeight: hp(0.24),
  },
  planCardSelected: {
    borderColor: '#EE1D24',
    borderWidth: 1.8,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.004) },
    shadowOpacity: 0.15,
    shadowRadius: wp(0.02),
    elevation: 4,
  },

  /* Badges */
  planBadge: {
    position: 'absolute',
    top: -hp(0.013),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(0.018),
    paddingVertical: hp(0.0035),
    borderRadius: wp(0.02),
    zIndex: 2,
  },
  popularBadge: {
    backgroundColor: '#EE1D24',
  },
  bestValueBadge: {
    backgroundColor: '#FEF08A',
  },
  badgeIcon: {
    marginRight: wp(0.008),
  },
  badgeCrownIcon: {
    fontSize: fontScale(8.5),
    marginRight: wp(0.008),
  },
  planBadgeText: {
    fontSize: fontScale(7.8),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  popularBadgeText: {
    color: '#FFFFFF',
  },
  bestValueBadgeText: {
    color: '#854D0E',
  },

  /* Radio button */
  radioWrap: {
    marginBottom: hp(0.006),
  },
  radioCircle: {
    width: wp(0.046),
    height: wp(0.046),
    borderRadius: wp(0.023),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#EE1D24',
  },
  radioDot: {
    width: wp(0.024),
    height: wp(0.024),
    borderRadius: wp(0.012),
    backgroundColor: '#EE1D24',
  },

  /* Price & Period */
  planPrice: {
    fontSize: fontScale(18),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  planPriceSelected: {
    color: '#EE1D24',
  },
  planPeriod: {
    fontSize: fontScale(9.8),
    fontWeight: '700',
    color: '#111827',
    marginTop: hp(0.002),
    textAlign: 'center',
  },
  planPeriodSelected: {
    color: '#EE1D24',
  },

  planCardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp(0.008),
  },

  /* Plan feature list */
  planFeaturesList: {
    width: '100%',
    gap: hp(0.005),
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planCheckIcon: {
    marginRight: wp(0.01),
    marginTop: hp(0.001),
  },
  planFeatureText: {
    fontSize: fontScale(8.6),
    color: '#374151',
    fontWeight: '500',
    lineHeight: fontScale(11.5),
    flex: 1,
  },

  /* Primary CTA Button */
  ctaButton: {
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.07),
    paddingVertical: hp(0.016),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.02),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.006) },
    shadowOpacity: 0.35,
    shadowRadius: wp(0.03),
    elevation: 5,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Disclaimers */
  disclaimersWrap: {
    alignItems: 'center',
    marginTop: hp(0.012),
    marginBottom: hp(0.015),
  },
  disclaimerPrimary: {
    fontSize: fontScale(10.5),
    color: '#4B5563',
    fontWeight: '600',
  },
  disclaimerSecondary: {
    fontSize: fontScale(9.5),
    color: '#9CA3AF',
    marginTop: hp(0.003),
  },

  /* Trust Badges */
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.01),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  trustBadgeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(0.01),
  },
  trustDivider: {
    width: 1,
    height: hp(0.035),
    backgroundColor: '#E5E7EB',
  },
  trustBadgeText: {
    fontSize: fontScale(8.6),
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: hp(0.005),
    lineHeight: fontScale(11),
  },

  /* Legal Footer */
  legalFooter: {
    alignItems: 'center',
    marginTop: hp(0.012),
    paddingHorizontal: wp(0.04),
  },
  legalText: {
    fontSize: fontScale(9),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: fontScale(13),
  },
  legalLink: {
    color: '#EE1D24',
    textDecorationLine: 'underline',
  },
});

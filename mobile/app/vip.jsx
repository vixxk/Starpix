import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { fontScale, wp, hp, SCREEN_PAD } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';
import ConfirmModal from '../src/components/ConfirmModal';
import PlanAlertModal from '../src/components/PlanAlertModal';
import LanguageModal from '../src/components/LanguageModal';
import API from '../src/utils/api';
import { checkHasActiveSubscription } from '../src/utils/subscription';

import {
  POSTERS,
  DEFAULT_PLANS,
  styles,
} from '../src/modules/vip';

export default function VipScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const logout = useAuthStore((state) => state.logout);

  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState('30days');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [planAlertState, setPlanAlertState] = useState({
    visible: false,
    type: 'downgrade',
  });

  // Active subscription verification and plan tier hierarchy
  const hasActiveSub = checkHasActiveSubscription(user);

  // Disable hardware back button on Android when acting as mandatory paywall
  useEffect(() => {
    if (!hasActiveSub) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });
      return () => backHandler.remove();
    }
  }, [hasActiveSub]);

  const activePlanName = (() => {
    if (!hasActiveSub || !user?.subscriptionPlan) return '';
    const sp = String(user.subscriptionPlan).toLowerCase();
    if (sp.includes('year') || sp.includes('annual') || sp.includes('365')) {
      return t('sub_plan_1_year') || '1 Year Plan';
    }
    if (sp.includes('30') || sp.includes('month')) {
      return t('sub_plan_30_days') || '30 Days Plan';
    }
    if (sp.includes('7') || sp.includes('week')) {
      return t('sub_plan_7_days') || '7 Days Plan';
    }
    return user.subscriptionPlan;
  })();

  const formattedExpiry = user?.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt).toLocaleDateString(i18n.language || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const getPlanTier = (pid) => {
    if (!pid) return 0;
    const s = String(pid).toLowerCase();
    if (s.includes('year') || s.includes('annual') || s.includes('365')) return 3;
    if (s.includes('30') || s.includes('month')) return 2;
    if (s.includes('7') || s.includes('week')) return 1;
    return 1;
  };

  const currentPlanTier = hasActiveSub ? getPlanTier(user.subscriptionPlan) : 0;

  // Auto-select valid upgrade plan if current plan is active
  useEffect(() => {
    if (currentPlanTier === 1) {
      setSelectedPlanId('30days');
    } else if (currentPlanTier === 2) {
      setSelectedPlanId('1year');
    } else if (currentPlanTier >= 3) {
      setSelectedPlanId('1year');
    }
  }, [currentPlanTier]);

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const res = await API.get('/payments/plans');
        if (isMounted && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPlans(res.data.data);
        }
      } catch (err) {
        // Fallback gracefully to default plans
      }
    };
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1] || plans[0] || DEFAULT_PLANS[1];

  const handleSelectPlan = (planId) => {
    const planTier = getPlanTier(planId);
    if (currentPlanTier > 0) {
      if (planTier < currentPlanTier) {
        setPlanAlertState({ visible: true, type: 'downgrade' });
        return;
      }
      if (planTier === currentPlanTier) {
        setPlanAlertState({ visible: true, type: 'already_active' });
        return;
      }
    }
    setSelectedPlanId(planId);
  };

  const handlePurchase = async () => {
    const planTier = getPlanTier(selectedPlan.id);
    if (currentPlanTier > 0 && planTier <= currentPlanTier) {
      if (planTier === currentPlanTier) {
        setPlanAlertState({ visible: true, type: 'already_active' });
      } else {
        setPlanAlertState({ visible: true, type: 'downgrade' });
      }
      return;
    }

    try {
      const daysToAdd = Number(selectedPlan.durationDays) || (selectedPlan.id === '7days' ? 7 : selectedPlan.id === '30days' ? 30 : 365);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToAdd);

      try {
        const res = await API.post('/payments/subscribe', { planId: selectedPlan.id });
        if (res.data?.success && res.data?.data?.user) {
          const freshUser = { ...user, ...res.data.data.user };
          setUser(freshUser);
          updateUserProfile(res.data.data.user).catch(() => {});
        } else if (user) {
          const freshUser = {
            ...user,
            isPremium: true,
            subscriptionStatus: 'active',
            subscriptionPlan: selectedPlan.id,
            subscriptionExpiresAt: expiryDate.toISOString(),
          };
          setUser(freshUser);
          updateUserProfile(freshUser).catch(() => {});
        }
      } catch (apiErr) {
        if (apiErr.response?.data?.message) {
          Alert.alert('Notice', apiErr.response.data.message);
          return;
        }
        if (user) {
          const freshUser = {
            ...user,
            isPremium: true,
            subscriptionStatus: 'active',
            subscriptionPlan: selectedPlan.id,
            subscriptionExpiresAt: expiryDate.toISOString(),
          };
          setUser(freshUser);
          updateUserProfile(freshUser).catch(() => {});
        }
      }

      const planName = selectedPlan.periodKey && i18n.exists(selectedPlan.periodKey)
        ? t(selectedPlan.periodKey)
        : (selectedPlan.name || `${daysToAdd} Days Access`);

      setPurchaseDetails({
        plan: planName,
        price: typeof selectedPlan.price === 'number' || !String(selectedPlan.price).startsWith('₹')
          ? `₹${selectedPlan.price}`
          : selectedPlan.price,
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
        <View style={styles.topGlowOrb} />
        <View style={styles.bottomLeftGlowOrb} />
        <View style={styles.bottomRightGlowOrb} />
      </View>

      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, hp(0.015)) },
        ]}
      >
        {hasActiveSub ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={fontScale(22)} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}

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

        {!hasActiveSub ? (
          <View style={styles.headerActionsRight}>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(true)}
              style={styles.headerActionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={fontScale(20)} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLogoutModal(true)}
              style={styles.headerActionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={fontScale(20)} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: wp(0.1) }} />
        )}
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
            <Text style={styles.heroBrandText}>
              {t('sub_starpix_premium')} <Text style={styles.heroCrown}>👑</Text>
            </Text>
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
          {plans.map((plan) => {
            const planTier = getPlanTier(plan.id);
            const isCurrentPlan = currentPlanTier > 0 && planTier === currentPlanTier;
            const isLowerPlan = currentPlanTier > 0 && planTier < currentPlanTier;
            const isUpgrade = currentPlanTier > 0 && planTier > currentPlanTier;
            const isDisabled = isCurrentPlan || isLowerPlan;
            const isSelected = selectedPlanId === plan.id && !isDisabled;

            const hasBadge = plan.badgeKey || plan.badgeText || plan.badgeType;
            const badgeLabel = plan.badgeKey && i18n.exists(plan.badgeKey)
              ? t(plan.badgeKey)
              : (plan.badgeText || (plan.badgeType === 'popular' ? t('sub_most_popular') : plan.badgeType === 'best_value' ? t('sub_best_value') : ''));
            const isPopular = plan.badgeType === 'popular' || plan.id === '30days';

            const formattedPrice = typeof plan.price === 'number' || !String(plan.price).startsWith('₹')
              ? `₹${plan.price}`
              : plan.price;

            const periodTitle = plan.periodKey && i18n.exists(plan.periodKey)
              ? t(plan.periodKey)
              : (plan.name || `${plan.durationDays || 30} Days Access`);

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && (isUpgrade ? styles.planCardUpgradeSelected : styles.planCardSelected),
                  isCurrentPlan && styles.planCardActiveSub,
                  isLowerPlan && styles.planCardDisabled,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={isDisabled ? 0.9 : 0.88}
              >
                {/* Top Badge: Active Plan / Lower Plan / Upgrade / Most Popular / Best Value */}
                {isCurrentPlan ? (
                  <View style={[styles.planBadge, styles.activePlanBadge]}>
                    <Ionicons name="checkmark-circle" size={fontScale(9)} color="#FFFFFF" style={styles.badgeIcon} />
                    <Text style={[styles.planBadgeText, styles.activePlanBadgeText]} numberOfLines={1}>
                      {t('sub_current_active_plan') || 'CURRENT PLAN'}
                    </Text>
                  </View>
                ) : isLowerPlan ? (
                  <View style={[styles.planBadge, styles.lockedPlanBadge]}>
                    <Ionicons name="lock-closed" size={fontScale(9)} color="#FFFFFF" style={styles.badgeIcon} />
                    <Text style={[styles.planBadgeText, styles.lockedPlanBadgeText]} numberOfLines={1}>
                      {t('sub_lower_plan_locked') || 'LOWER PLAN'}
                    </Text>
                  </View>
                ) : isUpgrade ? (
                  <View style={[styles.planBadge, styles.upgradePlanBadge]}>
                    <Ionicons name="arrow-up-circle" size={fontScale(9)} color="#FFFFFF" style={styles.badgeIcon} />
                    <Text style={[styles.planBadgeText, styles.upgradePlanBadgeText]} numberOfLines={1}>
                      {t('sub_upgrade_plan') || 'UPGRADE'}
                    </Text>
                  </View>
                ) : Boolean(hasBadge && badgeLabel) ? (
                  <View
                    style={[
                      styles.planBadge,
                      isPopular
                        ? styles.popularBadge
                        : styles.bestValueBadge,
                    ]}
                  >
                    {isPopular ? (
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
                        isPopular
                          ? styles.popularBadgeText
                          : styles.bestValueBadgeText,
                      ]}
                      numberOfLines={1}
                    >
                      {badgeLabel}
                    </Text>
                  </View>
                ) : null}

                {/* Radio Button / Status Icon */}
                <View style={styles.radioWrap}>
                  {isCurrentPlan ? (
                    <View style={[styles.radioCircle, { borderColor: '#D97706', backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="checkmark" size={fontScale(10)} color="#D97706" />
                    </View>
                  ) : isLowerPlan ? (
                    <View style={[styles.radioCircle, { borderColor: '#9CA3AF', backgroundColor: '#F3F4F6' }]}>
                      <Ionicons name="lock-closed" size={fontScale(9)} color="#6B7280" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && (isUpgrade ? { borderColor: '#16A34A' } : styles.radioCircleSelected),
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.radioDot, isUpgrade && { backgroundColor: '#16A34A' }]} />
                      )}
                    </View>
                  )}
                </View>

                {/* Price */}
                <Text
                  style={[
                    styles.planPrice,
                    isSelected && (isUpgrade ? { color: '#16A34A' } : styles.planPriceSelected),
                    isCurrentPlan && { color: '#D97706' },
                    isLowerPlan && { color: '#9CA3AF' },
                  ]}
                  numberOfLines={1}
                >
                  {formattedPrice}
                </Text>

                {/* Period */}
                <Text
                  style={[
                    styles.planPeriod,
                    isSelected && (isUpgrade ? { color: '#16A34A' } : styles.planPeriodSelected),
                    isCurrentPlan && { color: '#D97706' },
                    isLowerPlan && { color: '#9CA3AF' },
                  ]}
                  numberOfLines={1}
                >
                  {periodTitle}
                </Text>

                {/* Divider */}
                <View style={styles.planCardDivider} />

                {/* Feature Bullet Points */}
                <View style={styles.planFeaturesList}>
                  {(plan.features || []).map((feat, fIdx) => (
                    <View key={`${plan.id}-feat-${fIdx}`} style={styles.planFeatureRow}>
                      <Ionicons
                        name="checkmark"
                        size={fontScale(11)}
                        color={isCurrentPlan ? '#D97706' : (isUpgrade && isSelected) ? '#16A34A' : isLowerPlan ? '#9CA3AF' : '#EE1D24'}
                        style={styles.planCheckIcon}
                      />
                      <Text
                        style={[
                          styles.planFeatureText,
                          isLowerPlan && { color: '#9CA3AF' },
                        ]}
                        numberOfLines={2}
                      >
                        {i18n.exists(feat) ? t(feat) : feat}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Big CTA Button or Disabled State if highest plan active */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            currentPlanTier > 0 && getPlanTier(selectedPlan.id) > currentPlanTier && { backgroundColor: '#16A34A' },
            (currentPlanTier >= 3 || (currentPlanTier > 0 && getPlanTier(selectedPlan.id) <= currentPlanTier)) && styles.ctaButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={currentPlanTier >= 3 || (currentPlanTier > 0 && getPlanTier(selectedPlan.id) <= currentPlanTier)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>
            {(() => {
              if (currentPlanTier >= 3) {
                return t('highest_plan_active') || 'VIP Active • Highest Plan Unlocked';
              }
              const activePlan = selectedPlan || DEFAULT_PLANS[1];
              const priceVal = activePlan?.price ?? 99;
              const formattedPrice = typeof priceVal === 'number' || !String(priceVal).startsWith('₹')
                ? `₹${priceVal}`
                : priceVal;

              if (activePlan?.ctaKey && i18n?.exists && i18n.exists(activePlan.ctaKey)) {
                return t(activePlan.ctaKey).replace(/₹\s*\d+/g, formattedPrice);
              }
              const planTitle = activePlan?.periodKey && i18n?.exists && i18n.exists(activePlan.periodKey)
                ? t(activePlan.periodKey)
                : (activePlan?.name || `${activePlan?.durationDays || 30} Days`);
              return `Get ${planTitle} for ${formattedPrice} →`;
            })()}
          </Text>
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
            ? t('sub_purchase_success_msg', {
                price: purchaseDetails.price,
                defaultValue: `Your subscription for ${purchaseDetails.price} is active! Enjoy unlimited status creations and watermark-free downloads.`,
              })
            : t('sub_hero_subtitle')
        }
        confirmText={t('got_it')}
        icon="crown"
        iconColor="#EE1D24"
        hideCancel
        onCancel={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)');
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)');
        }}
      />

      {/* Plan Downgrade & Already Active Alert Modal */}
      <PlanAlertModal
        visible={planAlertState.visible}
        type={planAlertState.type}
        currentPlanName={activePlanName}
        expiryDate={formattedExpiry ? `${t('active_until') || 'Active until'}: ${formattedExpiry}` : ''}
        onClose={() => setPlanAlertState((prev) => ({ ...prev, visible: false }))}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title={t('confirm_logout')}
        message={t('confirm_logout_msg')}
        confirmText={t('settings_logout')}
        cancelText={t('cancel')}
        icon="log-out-outline"
        iconColor="#DC2626"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
          router.replace('/(auth)/login');
        }}
      />

      {/* Language Selector Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
}


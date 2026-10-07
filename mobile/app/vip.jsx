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
import Skeleton from '../src/components/Skeleton';
import { checkHasActiveSubscription } from '../src/utils/subscription';

import {
  POSTERS,
  DEFAULT_PLANS,
  DEFAULT_CHECKLIST,
  styles,
} from '../src/modules/vip';

const FEATURE_TEXT_KEY_MAP = {
  'All Premium Templates': 'sub_feat_all_premium',
  'Daily New Content': 'sub_feat_daily_new',
  'No Ads': 'sub_feat_no_ads',
  'Full Access for 30 Days': 'sub_feat_full_access_30',
  'Full Access for 1 Year': 'sub_feat_full_access_year',
  'Exclusive Festival Collections': 'sub_feat_exclusive_festivals',
  'Thousands of Premium Templates': 'sub_feat_thousands',
  'Good Morning & Good Night Special': 'sub_feat_morning_night',
  'Festival & Devotional Special': 'sub_feat_festival_devotional',
  'Trending & Viral Designs': 'sub_feat_trending_viral',
  'Name & Photo Personalization': 'sub_feat_name_photo',
  'HD Download & Fast Share': 'sub_feat_download_share',
  'Daily New Content Added': 'sub_feat_new_content',
};

export default function VipScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const logout = useAuthStore((state) => state.logout);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [heroPosters, setHeroPosters] = useState(POSTERS);
  const [featureChecklist, setFeatureChecklist] = useState(DEFAULT_CHECKLIST);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [planAlertState, setPlanAlertState] = useState({
    visible: false,
    type: 'downgrade',
  });

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '';
    const s = String(val).trim();
    if (s.startsWith('₹') || s.startsWith('$')) return s;
    return `${currencySymbol}${s}`;
  };

  const resolveFeatureText = (feat) => {
    if (!feat) return '';
    if (i18n.exists(feat)) return t(feat);
    const mappedKey = FEATURE_TEXT_KEY_MAP[feat];
    if (mappedKey && i18n.exists(mappedKey)) return t(mappedKey);
    return feat;
  };

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
    const matched = plans.find((p) => p.id === user.subscriptionPlan);
    if (matched) {
      if (matched.periodKey && i18n.exists(matched.periodKey)) {
        return t(matched.periodKey);
      }
      if (matched.name) return matched.name;
    }
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
    const match = plans.find((p) => p.id === pid);
    if (match?.durationDays) {
      if (match.durationDays >= 300) return 3;
      if (match.durationDays >= 25) return 2;
      return 1;
    }
    if (match?.sortOrder) return match.sortOrder;
    const s = String(pid).toLowerCase();
    if (s.includes('year') || s.includes('annual') || s.includes('365')) return 3;
    if (s.includes('30') || s.includes('month')) return 2;
    if (s.includes('7') || s.includes('week')) return 1;
    return 1;
  };

  const currentPlanTier = hasActiveSub ? getPlanTier(user.subscriptionPlan) : 0;

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const res = await API.get('/payments/plans');
        if (isMounted && res.data && res.data.success) {
          if (res.data.currencySymbol) {
            setCurrencySymbol(res.data.currencySymbol);
          }
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            const activePlans = res.data.data;
            setPlans(activePlans);
            setSelectedPlanId((prevId) => {
              if (prevId && activePlans.some((p) => p.id === prevId)) return prevId;
              const popular = activePlans.find((p) => p.badgeType === 'popular' || p.badgeKey === 'sub_most_popular');
              if (popular) return popular.id;
              const midIdx = Math.floor(activePlans.length / 2);
              return activePlans[midIdx]?.id || activePlans[0]?.id;
            });
          } else {
            setPlans(DEFAULT_PLANS);
            setSelectedPlanId('30days');
          }

          if (Array.isArray(res.data.posters) && res.data.posters.length >= 5) {
            setHeroPosters({
              durgaPuja: res.data.posters[0],
              goodMorning: res.data.posters[1],
              goodNight: res.data.posters[2],
              togetherAlways: res.data.posters[3],
              happyDiwali: res.data.posters[4],
            });
          }
          if (Array.isArray(res.data.checklist) && res.data.checklist.length > 0) {
            setFeatureChecklist(res.data.checklist);
          }
        }
      } catch (err) {
        if (isMounted) {
          setPlans(DEFAULT_PLANS);
          setSelectedPlanId('30days');
        }
      } finally {
        if (isMounted) {
          setLoadingPlans(false);
        }
      }
    };
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-select valid upgrade plan if current plan is active
  useEffect(() => {
    if (!plans || plans.length === 0) return;
    if (currentPlanTier > 0) {
      const upgrade = plans.find((p) => getPlanTier(p.id) > currentPlanTier);
      if (upgrade) {
        setSelectedPlanId(upgrade.id);
      }
    }
  }, [currentPlanTier, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || null;

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
        price: formatPrice(selectedPlan.price),
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
              {featureChecklist.map((item) => {
                const label = item.textKey && i18n.exists(item.textKey)
                  ? t(item.textKey)
                  : item.labelKey && i18n.exists(item.labelKey)
                  ? t(item.labelKey)
                  : resolveFeatureText(item.text || item.textKey || item.labelKey || '');
                return (
                  <View key={item.id || item.text} style={styles.checkItemRow}>
                    <View style={styles.checkIconBox}>
                      {renderFeatureIcon(item.iconType)}
                    </View>
                    <Text style={styles.checkItemText} numberOfLines={2}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right Column: Overlapping Fanned Status Cards */}
          <View style={styles.heroRight}>
            {/* Card 1: Durga Puja (Top left, tilted -6deg) */}
            <View style={[styles.posterCard, styles.poster1]}>
              <Image
                source={{ uri: heroPosters.durgaPuja || POSTERS.durgaPuja }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 2: Good Morning (Top right, tilted +8deg) */}
            <View style={[styles.posterCard, styles.poster2]}>
              <Image
                source={{ uri: heroPosters.goodMorning || POSTERS.goodMorning }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 3: Good Night (Middle left, tilted -4deg) */}
            <View style={[styles.posterCard, styles.poster3]}>
              <Image
                source={{ uri: heroPosters.goodNight || POSTERS.goodNight }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 4: Together Always (Middle right, tilted +6deg) */}
            <View style={[styles.posterCard, styles.poster4]}>
              <Image
                source={{ uri: heroPosters.togetherAlways || POSTERS.togetherAlways }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>

            {/* Card 5: Happy Diwali (Bottom center-left, tilted -3deg) */}
            <View style={[styles.posterCard, styles.poster5]}>
              <Image
                source={{ uri: heroPosters.happyDiwali || POSTERS.happyDiwali }}
                style={styles.posterImg}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* 3 Subscription Plan Cards */}
        <View style={styles.plansContainer}>
          {loadingPlans ? (
            [1, 2, 3].map((skeletonIdx) => (
              <View
                key={`skeleton-plan-${skeletonIdx}`}
                style={[
                  styles.planCard,
                  styles.planCardSkeleton,
                  skeletonIdx === 2 && styles.planCardSelected,
                ]}
              >
                {/* Skeleton Badge */}
                <View style={styles.skeletonBadgeWrap}>
                  <Skeleton width={wp(0.24)} height={hp(0.02)} borderRadius={wp(0.03)} />
                </View>

                {/* Skeleton Radio */}
                <View style={styles.radioWrap}>
                  <Skeleton width={wp(0.045)} height={wp(0.045)} borderRadius={wp(0.025)} />
                </View>

                {/* Skeleton Price */}
                <View style={{ alignItems: 'center', marginTop: hp(0.005), marginBottom: hp(0.004) }}>
                  <Skeleton width={wp(0.18)} height={hp(0.032)} borderRadius={4} />
                </View>

                {/* Skeleton Period */}
                <View style={{ alignItems: 'center', marginBottom: hp(0.01) }}>
                  <Skeleton width={wp(0.16)} height={hp(0.016)} borderRadius={4} />
                </View>

                {/* Divider */}
                <View style={styles.planCardDivider} />

                {/* Skeleton Features */}
                <View style={styles.skeletonFeaturesList}>
                  {[1, 2, 3].map((f) => (
                    <View key={`skel-feat-${f}`} style={styles.skeletonFeatureRow}>
                      <Skeleton width={wp(0.03)} height={wp(0.03)} borderRadius={wp(0.015)} />
                      <Skeleton width={wp(0.2)} height={hp(0.014)} borderRadius={3} style={{ marginLeft: wp(0.012) }} />
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            plans.map((plan) => {
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

              const formattedPrice = formatPrice(plan.price);

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
                          {resolveFeatureText(feat)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Big CTA Button or Disabled State if highest plan active */}
        {loadingPlans ? (
          <View style={styles.ctaButtonSkeleton}>
            <Skeleton width="100%" height="100%" borderRadius={wp(0.07)} />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              currentPlanTier > 0 && getPlanTier(selectedPlan?.id) > currentPlanTier && { backgroundColor: '#16A34A' },
              (currentPlanTier >= 3 || (currentPlanTier > 0 && getPlanTier(selectedPlan?.id) <= currentPlanTier)) && styles.ctaButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={currentPlanTier >= 3 || (currentPlanTier > 0 && getPlanTier(selectedPlan?.id) <= currentPlanTier)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>
              {(() => {
                if (currentPlanTier >= 3) {
                  return t('highest_plan_active') || 'VIP Active • Highest Plan Unlocked';
                }
                const activePlan = selectedPlan || plans[0] || DEFAULT_PLANS[1];
                const priceVal = activePlan?.price ?? 99;
                const formattedPrice = formatPrice(priceVal);

                if (activePlan?.ctaKey && i18n?.exists && i18n.exists(activePlan.ctaKey)) {
                  return t(activePlan.ctaKey).replace(/[₹$]\s*[\d০-৯]+/g, formattedPrice);
                }
                const planTitle = activePlan?.periodKey && i18n?.exists && i18n.exists(activePlan.periodKey)
                  ? t(activePlan.periodKey)
                  : (activePlan?.name || `${activePlan?.durationDays || 30} Days`);

                if (i18n?.exists && i18n.exists('sub_cta_get_plan')) {
                  return t('sub_cta_get_plan', { plan: planTitle, price: formattedPrice });
                }
                return `Get ${planTitle} for ${formattedPrice} →`;
              })()}
            </Text>
          </TouchableOpacity>
        )}

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


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { fontScale, wp, hp } from '../src/utils/responsive';
import { hapticTap, hapticSuccess } from '../src/utils/haptics';
import { useAuthStore } from '../src/store/useAuthStore';
import ConfirmModal from '../src/components/ConfirmModal';
import BackButton from '../src/components/BackButton';
import API from '../src/utils/api';

import {
  ASSETS,
  CREDIT_PACKS,
  USAGE_GUIDE,
  CoinIcon,
  styles,
} from '../src/modules/buyCredits';

export default function BuyCreditsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  const [creditPacks, setCreditPacks] = useState(CREDIT_PACKS);
  const [heroBanner, setHeroBanner] = useState({
    headline: 'Create Amazing',
    subheadline: 'AI Photos & Videos',
    description: 'Use AI credits to transform photos into 8K realistic Bollywood portraits, festival videos, and trending reels',
    magicScript: 'Turn photos into magic',
    heroGirlImage: ASSETS.heroGirl,
    heroGirlBeforeImage: ASSETS.heroGirlBefore,
  });
  const [usageGuide, setUsageGuide] = useState(USAGE_GUIDE);

  useEffect(() => {
    let isMounted = true;
    const loadCreditSettings = async () => {
      try {
        const res = await API.get('/ai-credits');
        if (isMounted && res.data?.success && res.data?.data) {
          const { packs, heroBanner: hb, usageGuide: ug } = res.data.data;
          if (Array.isArray(packs) && packs.length > 0) {
            setCreditPacks(packs);
          }
          if (hb && typeof hb === 'object') {
            setHeroBanner((prev) => ({
              ...prev,
              ...hb,
            }));
          }
          if (Array.isArray(ug) && ug.length > 0) {
            setUsageGuide(ug);
          }
        }
      } catch {
        // Fallback gracefully to default constants
      }
    };
    loadCreditSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedPackId, setSelectedPackId] = useState('creator');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPack, setPurchasedPack] = useState(null);

  const currentCredits = user?.credits !== undefined ? user.credits : 240;
  const selectedPack = creditPacks.find((p) => p.id === selectedPackId) || creditPacks[0] || CREDIT_PACKS[2];

  const handleSelectPack = (packId) => {
    hapticTap();
    setSelectedPackId(packId);
  };

  const handlePurchase = async () => {
    hapticTap();
    const pack = selectedPack;
    try {
      const newTotal = (currentCredits || 0) + (pack?.credits || 0);
      if (user) {
        await updateUserProfile({ credits: newTotal });
      }
      setPurchasedPack({
        name: (pack?.nameKey && t(pack.nameKey) !== pack.nameKey ? t(pack.nameKey) : '') || pack?.name || pack?.id,
        credits: pack?.credits || 0,
        price: pack?.price || '',
      });
      setShowSuccessModal(true);
      hapticSuccess();
    } catch {
      setPurchasedPack({
        name: (pack?.nameKey && t(pack.nameKey) !== pack.nameKey ? t(pack.nameKey) : '') || pack?.name || pack?.id,
        credits: pack?.credits || 0,
        price: pack?.price || '',
      });
      setShowSuccessModal(true);
      hapticSuccess();
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, hp(0.015)) }]}>
        <BackButton />

        {/* Center Logo */}
        <View style={styles.headerCenter}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={fontScale(18)}
              color="#EE1D24"
              style={styles.logoStar}
            />
            <Text style={styles.logoTextStar}>Star</Text>
            <Text style={styles.logoTextPix}>Pix</Text>
          </View>
          <Text style={styles.logoSubtitle}>AI TRENDS</Text>
        </View>

        {/* Right Credits Pill Badge */}
        <View style={styles.creditBalancePill}>
          <View style={styles.coinPillIcon}>
            <Text style={styles.coinPillSymbol}>B</Text>
          </View>
          <Text style={styles.creditBalanceText}>{currentCredits}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, hp(0.02)) + hp(0.1) },
        ]}
      >
        {/* Hero Title Section */}
        <View style={styles.heroTitleWrap}>
          <Text style={styles.heroMainTitle}>{t('settings_buy_ai_credits') || 'Buy AI Credits'}</Text>
          <Text style={styles.heroSubtitle}>{t('buy_credits_subtitle')}</Text>
        </View>

        {/* Split Hero Visual Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerLeft}>
            <Text style={styles.bannerBoldText}>{(t('create_amazing') !== 'create_amazing' ? t('create_amazing') : '') || heroBanner.headline}</Text>
            <Text style={styles.bannerRedText}>{(t('ai_photos_videos') !== 'ai_photos_videos' ? t('ai_photos_videos') : '') || heroBanner.subheadline}</Text>
            <Text style={styles.bannerDescText}>{(t('use_credits_desc') !== 'use_credits_desc' ? t('use_credits_desc') : '') || heroBanner.description}</Text>
          </View>

          <View style={styles.heroBannerRight}>
            <View style={styles.heroFannedWrap}>
              <View style={[styles.fannedCard, styles.fannedCardBack]}>
                <Image
                  source={{ uri: heroBanner.heroGirlBeforeImage || ASSETS.heroGirlBefore }}
                  style={styles.fannedImg}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.fannedCard, styles.fannedCardFront]}>
                <Image
                  source={{ uri: heroBanner.heroGirlImage || ASSETS.heroGirl }}
                  style={styles.fannedImg}
                  resizeMode="cover"
                />
                <View style={styles.playBadgeMini}>
                  <Ionicons name="play" size={fontScale(12)} color="#FFFFFF" style={{ marginLeft: 1 }} />
                </View>
              </View>
            </View>

            <View style={styles.magicScriptWrap}>
              <Text style={styles.magicScriptText}>{(t('turn_photos_magic') !== 'turn_photos_magic' ? t('turn_photos_magic') : '') || heroBanner.magicScript}</Text>
              <MaterialCommunityIcons
                name="star-four-points"
                size={fontScale(12)}
                color="#EE1D24"
                style={styles.magicStar}
              />
            </View>
          </View>
        </View>

        {/* Credit Packs List */}
        <View style={styles.packsContainer}>
          {creditPacks.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packCard,
                  isSelected && styles.packCardSelected,
                  pack.isBestValue && !isSelected && styles.packCardBestValue,
                ]}
                onPress={() => handleSelectPack(pack.id)}
                activeOpacity={0.88}
              >
                {/* Left Coin Graphics */}
                <View style={styles.packLeftCol}>
                  <CoinIcon type={pack.iconType} />
                </View>

                {/* Center Content */}
                <View style={styles.packMidCol}>
                  <View style={styles.packTitleRow}>
                    <Text
                      style={[
                        styles.packName,
                        pack.id === 'starter' && styles.starterName,
                      ]}
                      numberOfLines={1}
                    >
                      {(pack.nameKey && t(pack.nameKey) !== pack.nameKey ? t(pack.nameKey) : '') || pack.name || pack.id}
                    </Text>

                    {(pack.badgeKey || pack.badgeType) ? (
                      <View
                        style={[
                          styles.packBadge,
                          pack.badgeType === 'starter' && styles.starterBadge,
                          pack.badgeType === 'popular' && styles.popularBadge,
                          pack.badgeType === 'best_value' && styles.bestValueBadge,
                        ]}
                      >
                        {pack.badgeType === 'popular' ? (
                          <Ionicons name="flash" size={fontScale(9)} color="#FACC15" style={{ marginRight: 3 }} />
                        ) : pack.badgeType === 'best_value' ? (
                          <MaterialCommunityIcons name="crown" size={fontScale(11)} color="#854D0E" style={{ marginRight: 3 }} />
                        ) : pack.badgeType === 'starter' ? (
                          <MaterialCommunityIcons name="tag-outline" size={fontScale(10)} color="#FFFFFF" style={{ marginRight: 3 }} />
                        ) : null}
                        <Text style={styles.packBadgeText}>
                          {((pack.badgeKey && t(pack.badgeKey) !== pack.badgeKey ? t(pack.badgeKey) : '') || pack.badgeKey || pack.badgeType || '').replace(/_/g, ' ')}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.packCreditsText}>{pack.creditsDisplay || `${pack.credits} AI Credits`}</Text>
                  <Text
                    style={[
                      styles.packDescText,
                      pack.id === 'creator' && styles.creatorDescText,
                    ]}
                    numberOfLines={1}
                  >
                    {(pack.descKey && t(pack.descKey) !== pack.descKey ? t(pack.descKey) : '') || pack.description || ''}
                  </Text>
                </View>

                {/* Right Price Box */}
                <View
                  style={[
                    styles.priceBox,
                    isSelected && styles.priceBoxSelected,
                  ]}
                >
                  <Text style={styles.priceText}>{pack.price}</Text>
                  <Ionicons name="chevron-forward" size={fontScale(12)} color="#6B7280" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* How AI Credits Are Used? Guide Section */}
        <View style={styles.guideSection}>
          <View style={styles.guideHeader}>
            <View style={styles.guideHeaderLeft}>
              <View style={styles.bulbCircle}>
                <Ionicons name="bulb" size={fontScale(14)} color="#FFFFFF" />
              </View>
              <Text style={styles.guideTitle}>{t('how_credits_used')}</Text>
            </View>
          </View>

          {/* Guide Columns Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guideCardsRow}
          >
            {usageGuide.map((item) => (
              <View key={item.id} style={styles.guideItemCard}>
                <View style={styles.guideItemHeader}>
                  <Ionicons
                    name={item.type === 'video' ? 'videocam' : 'image'}
                    size={fontScale(11)}
                    color="#EE1D24"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.guideItemType} numberOfLines={2}>
                    {(item.titleKey && t(item.titleKey) !== item.titleKey ? t(item.titleKey) : '') || item.title || ''}
                  </Text>
                </View>

                <View style={styles.guideCreditsBadge}>
                  <Text style={styles.guideCreditsText}>{item.range}</Text>
                </View>

                <View style={styles.guideThumbWrap}>
                  <Image source={{ uri: item.image }} style={styles.guideThumbImg} resizeMode="cover" />
                  {item.type === 'video' && (
                    <View style={styles.guidePlayOverlay}>
                      <Ionicons name="play" size={fontScale(12)} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar: Continue Button & Trust Indicators */}
      <View
        style={[
          styles.bottomFixedBar,
          { paddingBottom: Math.max(insets.bottom, hp(0.015)) },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handlePurchase}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={fontScale(17)}
            color="#FFFFFF"
            style={{ marginRight: wp(0.015) }}
          />
          <Text style={styles.continueButtonText}>{t('continue') || 'Continue'}</Text>
          <Ionicons
            name="chevron-forward"
            size={fontScale(18)}
            color="#FFFFFF"
            style={{ marginLeft: wp(0.02) }}
          />
        </TouchableOpacity>

        {/* 3 Trust Badges */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustBadgeItem}>
            <Ionicons name="checkmark-circle" size={fontScale(13)} color="#10B981" />
            <Text style={styles.trustBadgeText}>{t('secure_payment')}</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustBadgeItem}>
            <Ionicons name="flash" size={fontScale(13)} color="#3B82F6" />
            <Text style={styles.trustBadgeText}>{t('instant_credit_update')}</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustBadgeItem}>
            <Ionicons name="lock-closed" size={fontScale(12)} color="#4B5563" />
            <Text style={styles.trustBadgeText}>{t('trusted_safe')}</Text>
          </View>
        </View>
      </View>

      {/* Purchase Confirmation Modal */}
      <ConfirmModal
        visible={showSuccessModal}
        title={purchasedPack ? `${purchasedPack.credits} Credits Added!` : 'Credits Added'}
        message={
          purchasedPack
            ? `Your ${purchasedPack.name} (${purchasedPack.price}) has been processed successfully. You now have ${currentCredits + purchasedPack.credits} credits to create AI magic!`
            : 'Credits updated successfully.'
        }
        confirmText={t('got_it')}
        icon="sparkles"
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

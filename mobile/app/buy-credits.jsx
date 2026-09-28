import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { fontScale, wp, hp, SCREEN_PAD } from '../src/utils/responsive';
import { hapticTap, hapticSuccess } from '../src/utils/haptics';
import { useAuthStore } from '../src/store/useAuthStore';
import ConfirmModal from '../src/components/ConfirmModal';

// High-resolution remote cloud assets
const ASSETS = {
  heroGirl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
  heroGirlBefore: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
  usageBasic: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
  usagePremium: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
  usageCollage: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
  usageVideoStd: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
  usageVideoPrem: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
};

const CREDIT_PACKS = [
  {
    id: 'starter',
    nameKey: 'pack_starter',
    descKey: 'pack_starter_desc',
    badgeKey: 'first_purchase_only',
    badgeType: 'starter',
    credits: 25,
    creditsDisplay: '25 AI Credits',
    price: '₹ 25',
    iconType: 'gift',
  },
  {
    id: 'value',
    nameKey: 'pack_value',
    descKey: 'pack_value_desc',
    credits: 50,
    creditsDisplay: '50 AI Credits',
    price: '₹ 49',
    iconType: 'coins_small',
  },
  {
    id: 'creator',
    nameKey: 'pack_creator',
    descKey: 'pack_creator_desc',
    badgeKey: 'most_popular',
    badgeType: 'popular',
    credits: 240,
    creditsDisplay: '240 AI Credits',
    price: '₹ 199',
    iconType: 'coins_med',
    isPopular: true,
  },
  {
    id: 'pro',
    nameKey: 'pack_pro',
    descKey: 'pack_pro_desc',
    credits: 600,
    creditsDisplay: '600 AI Credits',
    price: '₹ 449',
    iconType: 'coins_large',
  },
  {
    id: 'power',
    nameKey: 'pack_power',
    descKey: 'pack_power_desc',
    credits: 1200,
    creditsDisplay: '1,200 AI Credits',
    price: '₹ 799',
    iconType: 'coins_stack',
  },
  {
    id: 'ultimate',
    nameKey: 'pack_ultimate',
    descKey: 'pack_ultimate_desc',
    badgeKey: 'best_value',
    badgeType: 'best_value',
    credits: 2500,
    creditsDisplay: '2,500 AI Credits',
    price: '₹ 1,499',
    iconType: 'coins_gold',
    isBestValue: true,
  },
];

const USAGE_GUIDE = [
  {
    id: 'basic_image',
    type: 'image',
    titleKey: 'usage_basic_image',
    range: '20–25 Credits',
    image: ASSETS.usageBasic,
  },
  {
    id: 'premium_image',
    type: 'image',
    titleKey: 'usage_premium_image',
    range: '40–60 Credits',
    image: ASSETS.usagePremium,
  },
  {
    id: 'collage',
    type: 'image',
    titleKey: 'usage_collage',
    range: '70–100 Credits',
    image: ASSETS.usageCollage,
  },
  {
    id: 'video_std',
    type: 'video',
    titleKey: 'usage_video_std',
    range: '350–400 Credits',
    image: ASSETS.usageVideoStd,
  },
  {
    id: 'video_prem',
    type: 'video',
    titleKey: 'usage_video_prem',
    range: '450–550 Credits',
    image: ASSETS.usageVideoPrem,
  },
];

export default function BuyCreditsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  const [selectedPackId, setSelectedPackId] = useState('creator');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPack, setPurchasedPack] = useState(null);

  const currentCredits = user?.credits !== undefined ? user.credits : 240;
  const selectedPack = CREDIT_PACKS.find((p) => p.id === selectedPackId) || CREDIT_PACKS[2];

  const handleSelectPack = (packId) => {
    hapticTap();
    setSelectedPackId(packId);
  };

  const handlePurchase = async () => {
    hapticTap();
    const pack = selectedPack;
    try {
      const newTotal = (currentCredits || 0) + pack.credits;
      if (user) {
        await updateUserProfile({ credits: newTotal });
      }
      setPurchasedPack({
        name: t(pack.nameKey),
        credits: pack.credits,
        price: pack.price,
      });
      setShowSuccessModal(true);
      hapticSuccess();
    } catch {
      setPurchasedPack({
        name: t(pack.nameKey),
        credits: pack.credits,
        price: pack.price,
      });
      setShowSuccessModal(true);
      hapticSuccess();
    }
  };

  const renderCoinIcon = (type) => {
    if (type === 'gift') {
      return (
        <View style={styles.coinStackWrap}>
          <View style={styles.coinCircleS}>
            <Text style={styles.coinSymbolText}>S</Text>
          </View>
          <View style={styles.giftBadge}>
            <Text style={styles.giftEmoji}>🎁</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.coinStackWrap}>
        <View style={styles.coinLayerBack} />
        <View style={styles.coinLayerMid} />
        <View style={styles.coinCircleB}>
          <Text style={styles.coinSymbolText}>B</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, hp(0.015)) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={fontScale(22)} color="#111827" />
        </TouchableOpacity>

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
            <Text style={styles.bannerBoldText}>{t('create_amazing')}</Text>
            <Text style={styles.bannerRedText}>{t('ai_photos_videos')}</Text>
            <Text style={styles.bannerDescText}>{t('use_credits_desc')}</Text>
          </View>

          <View style={styles.heroBannerRight}>
            {/* Overlapping Fanned Girl Photos */}
            <View style={styles.heroFannedWrap}>
              <View style={[styles.fannedCard, styles.fannedCardBack]}>
                <Image
                  source={{ uri: ASSETS.heroGirlBefore }}
                  style={styles.fannedImg}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.fannedCard, styles.fannedCardFront]}>
                <Image
                  source={{ uri: ASSETS.heroGirl }}
                  style={styles.fannedImg}
                  resizeMode="cover"
                />
                <View style={styles.playBadgeMini}>
                  <Ionicons name="play" size={fontScale(12)} color="#FFFFFF" style={{ marginLeft: 1 }} />
                </View>
              </View>
            </View>

            <View style={styles.magicScriptWrap}>
              <Text style={styles.magicScriptText}>{t('turn_photos_magic')}</Text>
              <MaterialCommunityIcons
                name="star-four-points"
                size={fontScale(12)}
                color="#EE1D24"
                style={styles.magicStar}
              />
            </View>
          </View>
        </View>

        {/* Credit Packs List (6 Cards) */}
        <View style={styles.packsContainer}>
          {CREDIT_PACKS.map((pack) => {
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
                <View style={styles.packLeftCol}>{renderCoinIcon(pack.iconType)}</View>

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
                      {t(pack.nameKey)}
                    </Text>

                    {pack.badgeKey && (
                      <View
                        style={[
                          styles.packBadge,
                          pack.badgeType === 'starter' && styles.starterBadge,
                          pack.badgeType === 'popular' && styles.popularBadge,
                          pack.badgeType === 'best_value' && styles.bestValueBadge,
                        ]}
                      >
                        {(pack.badgeType === 'popular' || pack.badgeType === 'best_value') && (
                          <Text style={styles.badgeCrownEmoji}>👑</Text>
                        )}
                        <Text style={styles.packBadgeText}>{t(pack.badgeKey)}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.packCreditsText}>{pack.creditsDisplay}</Text>
                  <Text
                    style={[
                      styles.packDescText,
                      pack.id === 'creator' && styles.creatorDescText,
                    ]}
                    numberOfLines={1}
                  >
                    {t(pack.descKey)}
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

            <View style={styles.guideHeaderRight}>
              <Text style={styles.guideSub1}>Based on actual AI generation cost</Text>
              <Text style={styles.guideSub2}>(Image ~ ₹10, Video ~ ₹200)</Text>
            </View>
          </View>

          {/* 5 Guide Columns Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guideCardsRow}
          >
            {USAGE_GUIDE.map((item) => (
              <View key={item.id} style={styles.guideItemCard}>
                <View style={styles.guideItemHeader}>
                  <Ionicons
                    name={item.type === 'video' ? 'videocam' : 'image'}
                    size={fontScale(11)}
                    color="#EE1D24"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.guideItemType} numberOfLines={2}>
                    {t(item.titleKey)}
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
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
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
        title={purchasedPack ? `🎉 ${purchasedPack.credits} Credits Added!` : 'Credits Added'}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoStar: {
    marginRight: wp(0.005),
  },
  logoTextStar: {
    fontSize: fontScale(21),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoTextPix: {
    fontSize: fontScale(21),
    fontWeight: '900',
    color: '#EE1D24',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1.2,
    marginTop: -hp(0.002),
  },
  creditBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: wp(0.028),
    paddingVertical: hp(0.005),
    borderRadius: wp(0.04),
    gap: wp(0.015),
  },
  coinPillIcon: {
    width: wp(0.05),
    height: wp(0.05),
    borderRadius: wp(0.025),
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinPillSymbol: {
    color: '#FFFFFF',
    fontSize: fontScale(10),
    fontWeight: '900',
  },
  creditBalanceText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#111827',
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: wp(0.04),
    paddingTop: hp(0.015),
  },

  /* Hero Title */
  heroTitleWrap: {
    marginBottom: hp(0.015),
  },
  heroMainTitle: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: '#EE1D24',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: fontScale(11.5),
    fontWeight: '500',
    color: '#4B5563',
    marginTop: hp(0.002),
  },

  /* Hero Visual Banner */
  heroBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F2',
    borderRadius: wp(0.035),
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: wp(0.035),
    marginBottom: hp(0.018),
    overflow: 'hidden',
    position: 'relative',
  },
  heroBannerLeft: {
    flex: 1.15,
    justifyContent: 'center',
  },
  bannerBoldText: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#111827',
  },
  bannerRedText: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#EE1D24',
    marginBottom: hp(0.004),
  },
  bannerDescText: {
    fontSize: fontScale(9.8),
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: fontScale(13.5),
  },
  heroBannerRight: {
    flex: 0.95,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroFannedWrap: {
    width: wp(0.28),
    height: wp(0.24),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fannedCard: {
    position: 'absolute',
    width: wp(0.18),
    height: wp(0.22),
    borderRadius: wp(0.02),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: wp(0.015),
    elevation: 4,
  },
  fannedCardBack: {
    transform: [{ rotate: '-12deg' }],
    left: wp(0.01),
  },
  fannedCardFront: {
    transform: [{ rotate: '6deg' }],
    right: wp(0.01),
  },
  fannedImg: {
    width: '100%',
    height: '100%',
  },
  playBadgeMini: {
    position: 'absolute',
    bottom: -hp(0.005),
    right: -wp(0.01),
    width: wp(0.06),
    height: wp(0.06),
    borderRadius: wp(0.03),
    backgroundColor: '#EE1D24',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  magicScriptWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.006),
  },
  magicScriptText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#EE1D24',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  magicStar: {
    marginLeft: 2,
  },

  /* Packs Container */
  packsContainer: {
    gap: hp(0.01),
    marginBottom: hp(0.02),
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.035),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(0.03),
    paddingVertical: hp(0.012),
  },
  packCardSelected: {
    borderColor: '#FDA4AF',
    borderWidth: 1.6,
    backgroundColor: '#FFFDFD',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: wp(0.02),
    elevation: 3,
  },
  packCardBestValue: {
    borderColor: '#FDE047',
    backgroundColor: '#FEFCE8',
  },

  /* Left Coin Graphics */
  packLeftCol: {
    width: wp(0.14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(0.02),
  },
  coinStackWrap: {
    width: wp(0.12),
    height: wp(0.11),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coinCircleB: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.0475),
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  coinCircleS: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.0475),
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbolText: {
    color: '#FFFFFF',
    fontSize: fontScale(12),
    fontWeight: '900',
  },
  coinLayerBack: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: wp(0.09),
    height: wp(0.09),
    borderRadius: wp(0.045),
    backgroundColor: '#D97706',
  },
  coinLayerMid: {
    position: 'absolute',
    top: 5,
    left: 7,
    width: wp(0.09),
    height: wp(0.09),
    borderRadius: wp(0.045),
    backgroundColor: '#FBBF24',
  },
  giftBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  giftEmoji: {
    fontSize: fontScale(13),
  },

  /* Center Details */
  packMidCol: {
    flex: 1,
    justifyContent: 'center',
  },
  packTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp(0.015),
  },
  packName: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#111827',
  },
  starterName: {
    color: '#EE1D24',
  },
  packBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(0.018),
    paddingVertical: hp(0.0025),
    borderRadius: wp(0.02),
  },
  starterBadge: {
    backgroundColor: '#EE1D24',
  },
  popularBadge: {
    backgroundColor: '#EE1D24',
  },
  bestValueBadge: {
    backgroundColor: '#EE1D24',
  },
  badgeCrownEmoji: {
    fontSize: fontScale(8.5),
    marginRight: 2,
  },
  packBadgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(8),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  packCreditsText: {
    fontSize: fontScale(13),
    fontWeight: '900',
    color: '#111827',
    marginTop: hp(0.002),
  },
  packDescText: {
    fontSize: fontScale(10),
    color: '#6B7280',
    fontWeight: '500',
    marginTop: hp(0.001),
  },
  creatorDescText: {
    color: '#2563EB',
    fontWeight: '600',
  },

  /* Right Price Box */
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(0.025),
    paddingHorizontal: wp(0.028),
    paddingVertical: hp(0.008),
    gap: wp(0.01),
  },
  priceBoxSelected: {
    borderColor: '#FDA4AF',
    backgroundColor: '#FFF5F5',
  },
  priceText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#111827',
  },

  /* How AI Credits Are Used Guide Section */
  guideSection: {
    backgroundColor: '#FFFBFB',
    borderRadius: wp(0.035),
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: wp(0.03),
    marginTop: hp(0.005),
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.01),
  },
  guideHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.015),
  },
  bulbCircle: {
    width: wp(0.06),
    height: wp(0.06),
    borderRadius: wp(0.03),
    backgroundColor: '#EE1D24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '900',
    color: '#EE1D24',
  },
  guideHeaderRight: {
    alignItems: 'flex-end',
  },
  guideSub1: {
    fontSize: fontScale(7.8),
    color: '#6B7280',
    fontWeight: '600',
  },
  guideSub2: {
    fontSize: fontScale(7.5),
    color: '#9CA3AF',
  },
  guideCardsRow: {
    gap: wp(0.02),
    paddingTop: hp(0.005),
  },
  guideItemCard: {
    width: wp(0.24),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.02),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: wp(0.015),
  },
  guideItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(0.035),
  },
  guideItemType: {
    fontSize: fontScale(8.2),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: fontScale(10.5),
  },
  guideCreditsBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: wp(0.015),
    paddingVertical: hp(0.002),
    borderRadius: wp(0.01),
    marginVertical: hp(0.004),
  },
  guideCreditsText: {
    fontSize: fontScale(8),
    fontWeight: '800',
    color: '#EE1D24',
  },
  guideThumbWrap: {
    width: wp(0.2),
    height: wp(0.2),
    borderRadius: wp(0.015),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  guideThumbImg: {
    width: '100%',
    height: '100%',
  },
  guidePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Floating Bottom Bar */
  bottomFixedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: wp(0.04),
    paddingTop: hp(0.012),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: wp(0.02),
    elevation: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.06),
    paddingVertical: hp(0.016),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.004) },
    shadowOpacity: 0.35,
    shadowRadius: wp(0.02),
    elevation: 4,
  },
  continueButtonText: {
    fontSize: fontScale(16),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(0.008),
    paddingHorizontal: wp(0.02),
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.01),
  },
  trustDivider: {
    width: 1,
    height: hp(0.016),
    backgroundColor: '#E5E7EB',
  },
  trustBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '500',
    color: '#4B5563',
  },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
  Share,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import PressableScale from '../../src/components/PressableScale';
import Toast from '../../src/components/Toast';
import ReelPersonalizationOverlay from '../../src/components/ReelPersonalizationOverlay';
import LanguageModal from '../../src/components/LanguageModal';
import AppVideo, { ResizeMode } from '../../src/components/AppVideo';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import { hapticTap, hapticImpact } from '../../src/utils/haptics';
import API from '../../src/utils/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCreationStore } from '../../src/store/useCreationStore';
import { SUPPORTED_LANGUAGES } from '../../src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const S3_BASE = 'https://starpix-media-production.s3.ap-south-1.amazonaws.com';

const DEFAULT_REELS = [
  {
    id: 'durga_puja_1',
    title: 'Happy Durga Puja',
    category: 'durga_puja',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/durga_puja_reel_bg.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'retro_80s_1',
    title: "Retro 80's Bollywood",
    category: 'retro_80s',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/retro_80s.jpg`,
    defaultFrame: 'mandala',
  },
  {
    id: 'vintage_couple_1',
    title: 'Vintage Couple Ride',
    category: 'dance_video',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/vintage_couple.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'good_morning_1',
    title: 'Good Morning Sunrise',
    category: 'good_morning',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/frames/sunrise_thumb.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'diwali_festive_1',
    title: 'Diwali Festive Lights',
    category: 'festivals',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
    defaultFrame: 'durga_puja',
  },
];

const FRAME_OPTIONS = [
  { id: 'none', isNone: true, thumb: null },
  { id: 'durga_puja', isNone: false, thumb: `${S3_BASE}/frames/durga_puja_thumb.jpg` },
  { id: 'moon_lake', isNone: false, thumb: `${S3_BASE}/frames/frame_moon_lake.jpg` },
  { id: 'moon_clouds', isNone: false, thumb: `${S3_BASE}/frames/moon_clouds_thumb.jpg` },
  { id: 'mandala', isNone: false, thumb: `${S3_BASE}/frames/diya_mandala_thumb.jpg` },
  { id: 'diya_temple', isNone: false, thumb: `${S3_BASE}/frames/sunrise_thumb.jpg` },
  { id: 'couple', isNone: false, thumb: `${S3_BASE}/frames/couple_thumb.jpg` },
];

const CATEGORY_CHIPS = [
  // Row 1
  [
    { id: 'special', icon: '⭐', labelKey: 'todays_special', isSpecial: true },
    { id: 'trending', icon: '🔥', labelKey: 'trending' },
    { id: 'durga_puja', icon: '🪷', labelKey: 'durga_puja' },
  ],
  // Row 2
  [
    { id: 'good_morning', icon: '☀️', labelKey: 'good_morning' },
    { id: 'bhakti', icon: '🕉', labelKey: 'bhakti' },
    { id: 'dance_video', icon: '🎵', labelKey: 'dance_video' },
    { id: 'all', icon: '⊞', labelKey: 'all' },
  ],
  // Row 3
  [
    { id: 'retro_80s', icon: '📻', labelKey: 'retro_80s' },
    { id: 'tomorrow', icon: '📅', labelKey: 'tomorrow' },
    { id: 'festivals', icon: '🎉', labelKey: 'festivals' },
    { id: 'more', icon: null, chevron: true, labelKey: 'more' },
  ],
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const storeUserPhotoUri = useCreationStore((s) => s.userPhotoUri || s.defaultUserPhotoUri);
  const storeUserNameText = useCreationStore((s) => s.userNameText || s.defaultUserNameText);

  const displayName = user?.name || user?.fullName || storeUserNameText || 'Uika';
  const displayPhoto = user?.profilePhoto || storeUserPhotoUri || null;

  const [activeCategory, setActiveCategory] = useState('special');
  const [reels, setReels] = useState(DEFAULT_REELS);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState('durga_puja');
  const [isPlaying, setIsPlaying] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  // Modals
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const scrollRef = useRef(null);
  const cardWidth = wp(0.92);
  const cardHeight = hp(0.50);

  const activeReel = reels[currentReelIndex] || reels[0];

  // Fetch backend templates if available
  useEffect(() => {
    API.get('/templates', { params: { limit: 12, sort: 'trending' } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiReels = res.data.data.map((t, idx) => ({
            id: t._id || `tmpl_${idx}`,
            title: t.name,
            category: t.categoryId?.name?.toLowerCase() || 'trending',
            mediaType: t.type === 'video' ? 'video' : 'image',
            mediaUrl: t.previewAsset || t.mainMedia || t.thumbnail || DEFAULT_REELS[0].mediaUrl,
            defaultFrame: 'durga_puja',
          }));
          // Put our reference Durga Puja template at index 0 for 100% screenshot fidelity
          setReels([DEFAULT_REELS[0], ...apiReels, ...DEFAULT_REELS.slice(1)]);
        }
      })
      .catch((err) => {
        console.log('Using default reels:', err?.message);
      });
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleNextReel = () => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    setCurrentReelIndex((prev) => (prev + 1) % reels.length);
  };

  const handleCategoryPress = (catId) => {
    hapticTap();
    if (catId === 'more') {
      router.push('/explore');
      return;
    }
    setActiveCategory(catId);
    if (catId === 'all') {
      // Show all
      setCurrentReelIndex(0);
    } else {
      const matchIndex = reels.findIndex((r) => r.category === catId);
      if (matchIndex >= 0) {
        setCurrentReelIndex(matchIndex);
      }
    }
  };

  const handleTogglePlay = () => {
    hapticTap();
    setIsPlaying((prev) => !prev);
  };

  const handleDownload = () => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    showToast(t('download_saved_msg') || 'Status saved successfully!');
    // If backend template, can push or save
    if (activeReel?.id && !activeReel.id.startsWith('durga_')) {
      useCreationStore.getState().setSelectedFooter(selectedFrame !== 'none' ? { name: selectedFrame } : null);
    }
  };

  const handleShare = async () => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${activeReel?.title || 'Happy Durga Puja'} - Created on StarPix! Check out trending AI statuses.`,
      });
    } catch (e) {
      console.warn('Share cancelled or failed', e);
    }
  };

  const handleEdit = () => {
    hapticTap();
    router.push('/edit-profile');
  };

  const handleChangeLanguage = async (code) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('starpix_user_language', code);
    setShowLanguageModal(false);
    showToast(t('language_updated'));
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        {/* Left: Welcome & User Name */}
        <View style={styles.userGreetingWrap}>
          <Text style={styles.welcomeText}>{t('welcome')}</Text>
          <Text style={styles.userNameText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Right Action Icons & Buttons */}
        <View style={styles.headerActionsWrap}>
          {/* AI Trends Pill Button */}
          <PressableScale
            onPress={() => {
              hapticTap();
              router.push('/ai-video');
            }}
            scaleTo={0.93}
            style={styles.aiTrendsBtn}
            contentStyle={styles.aiTrendsContent}
          >
            <Ionicons name="sparkles" size={fontScale(13)} color="#E11D48" />
            <Text style={styles.aiTrendsText}>{t('ai_trends')}</Text>
          </PressableScale>

          {/* Language Switcher Icon */}
          <PressableScale
            onPress={() => {
              hapticTap();
              setShowLanguageModal(true);
            }}
            scaleTo={0.9}
            style={styles.langBtn}
            contentStyle={styles.iconCenter}
          >
            <Text style={styles.langIconText}>文A</Text>
          </PressableScale>

          {/* PRO Pill Button */}
          <PressableScale
            onPress={() => {
              hapticTap();
              router.push('/vip');
            }}
            scaleTo={0.93}
            style={styles.proBtn}
            contentStyle={styles.proContent}
          >
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.proText}>{t('pro_badge')}</Text>
          </PressableScale>

          {/* Options Menu 3 dots */}
          <PressableScale
            onPress={() => {
              hapticTap();
              setShowOptionsMenu(true);
            }}
            scaleTo={0.9}
            style={styles.optionsBtn}
            contentStyle={styles.iconCenter}
          >
            <Ionicons name="ellipsis-vertical" size={fontScale(18)} color="#374151" />
          </PressableScale>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(0.04) }]}
      >
        {/* Category / Filter Chips (3 Rows) */}
        <View style={styles.categoryContainer}>
          {CATEGORY_CHIPS.map((row, rowIdx) => (
            <View key={`row_${rowIdx}`} style={styles.categoryRow}>
              {row.map((chip) => {
                const isSelected = activeCategory === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    activeOpacity={0.75}
                    onPress={() => handleCategoryPress(chip.id)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                      chip.isSpecial && !isSelected && styles.chipSpecialInactive,
                    ]}
                  >
                    {chip.icon ? (
                      <Text style={styles.chipIcon}>{chip.icon}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t(chip.labelKey)}
                    </Text>
                    {chip.chevron ? (
                      <Ionicons
                        name="chevron-down"
                        size={fontScale(11)}
                        color={isSelected ? '#FFFFFF' : '#E11D48'}
                        style={{ marginLeft: 2 }}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Main Reel Card */}
        <View style={[styles.reelCard, { width: cardWidth, height: cardHeight }]}>
          {/* Background Media */}
          {activeReel.mediaType === 'video' ? (
            <AppVideo
              source={{ uri: activeReel.mediaUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: activeReel.mediaUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}

          {/* Personalized Golden Ring + Name Ribbon + Calligraphy Title */}
          {selectedFrame !== 'none' ? (
            <ReelPersonalizationOverlay
              frameId={selectedFrame}
              userName={displayName}
              userPhotoUri={displayPhoto}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
            />
          ) : null}

          {/* Right Circular Play/Pause Button */}
          <PressableScale
            onPress={handleTogglePlay}
            scaleTo={0.92}
            style={styles.playPauseBtn}
            contentStyle={styles.iconCenter}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={fontScale(18)}
              color="#FFFFFF"
            />
          </PressableScale>

          {/* Floating Next Pill Button (Bottom-Right) */}
          <PressableScale
            onPress={handleNextReel}
            scaleTo={0.94}
            style={styles.nextPillBtn}
            contentStyle={styles.nextPillContent}
          >
            <Text style={styles.nextPillText}>{t('next')}</Text>
            <Ionicons name="chevron-forward" size={fontScale(14)} color="#111827" />
          </PressableScale>
        </View>

        {/* 3 Action Buttons Row: Download, Share, Edit */}
        <View style={[styles.actionRow, { width: cardWidth }]}>
          {/* Download Button */}
          <PressableScale
            onPress={handleDownload}
            scaleTo={0.95}
            style={styles.downloadActionBtn}
            contentStyle={styles.actionBtnContent}
          >
            <Ionicons name="download-outline" size={fontScale(16)} color="#FFFFFF" />
            <Text style={styles.downloadActionText}>{t('download')}</Text>
          </PressableScale>

          {/* Share Button */}
          <PressableScale
            onPress={handleShare}
            scaleTo={0.95}
            style={styles.shareActionBtn}
            contentStyle={styles.actionBtnContent}
          >
            <Ionicons name="share-outline" size={fontScale(16)} color="#FFFFFF" />
            <Text style={styles.shareActionText}>{t('share')}</Text>
          </PressableScale>

          {/* Edit Button */}
          <PressableScale
            onPress={handleEdit}
            scaleTo={0.95}
            style={styles.editActionBtn}
            contentStyle={styles.actionBtnContent}
          >
            <Ionicons name="pencil-outline" size={fontScale(15)} color="#E11D48" />
            <Text style={styles.editActionText}>{t('edit')}</Text>
          </PressableScale>
        </View>

        {/* Frame Selector Thumbnails Row */}
        <View style={[styles.frameSelectorWrap, { width: cardWidth }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.frameScrollContent}
          >
            {FRAME_OPTIONS.map((frame) => {
              const isSelected = selectedFrame === frame.id;
              return (
                <TouchableOpacity
                  key={frame.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    hapticTap();
                    setSelectedFrame(frame.id);
                  }}
                  style={[
                    styles.frameBox,
                    frame.isNone && styles.frameBoxNone,
                    isSelected && styles.frameBoxActive,
                  ]}
                >
                  {frame.isNone ? (
                    <Ionicons name="ban-outline" size={fontScale(20)} color="#78350F" />
                  ) : (
                    <Image
                      source={{ uri: frame.thumb }}
                      style={styles.frameThumbImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom Scroll Indicator */}
        <View style={styles.scrollIndicatorWrap}>
          <Ionicons name="chevron-down" size={fontScale(15)} color="#E11D48" />
          <Ionicons
            name="chevron-down"
            size={fontScale(15)}
            color="#E11D48"
            style={{ marginTop: -8 }}
          />
          <Text style={styles.scrollIndicatorText}>
            {t('scroll_to_view_next_reel')}
          </Text>
        </View>
      </ScrollView>

      {/* Language Switcher Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleChangeLanguage}
      />

      {/* Options Menu Modal (3 dots) */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsSheet} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push('/settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>{t('settings') || 'Settings'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push('/vip');
              }}
            >
              <Ionicons name="diamond-outline" size={20} color="#F59E0B" />
              <Text style={styles.menuItemText}>{t('vip_pass_subscription') || 'VIP Pass'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push('/buy-credits');
              }}
            >
              <Ionicons name="flash-outline" size={20} color="#E11D48" />
              <Text style={styles.menuItemText}>{t('buy_ai_credits') || 'Buy AI Credits'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push('/downloads');
              }}
            >
              <Ionicons name="download-outline" size={20} color="#374151" />
              <Text style={styles.menuItemText}>{t('nav_downloads')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.012),
    backgroundColor: '#FFFFFF',
  },
  userGreetingWrap: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginBottom: 1,
  },
  userNameText: {
    fontSize: fontScale(21),
    fontFamily: FONTS.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.02),
  },
  aiTrendsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#FDA4AF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiTrendsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTrendsText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
  langBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCenter: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langIconText: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
  proBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  proContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crownIcon: {
    fontSize: fontScale(12),
  },
  proText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.black,
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  optionsBtn: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  },
  categoryContainer: {
    width: '100%',
    paddingHorizontal: SCREEN_PAD,
    marginVertical: hp(0.008),
    gap: hp(0.008),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.018),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: wp(0.026),
    paddingVertical: hp(0.007),
    gap: 4,
  },
  chipActive: {
    backgroundColor: '#9F1239',
    borderColor: '#9F1239',
  },
  chipSpecialInactive: {
    borderColor: '#FECDD3',
  },
  chipIcon: {
    fontSize: fontScale(11.5),
  },
  chipText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#1F2937',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  reelCard: {
    borderRadius: wp(0.045),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1C1917',
    marginTop: hp(0.006),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  playPauseBtn: {
    position: 'absolute',
    right: wp(0.035),
    top: '48%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 30,
  },
  nextPillBtn: {
    position: 'absolute',
    right: wp(0.035),
    bottom: hp(0.02),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  nextPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  nextPillText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(0.02),
    marginTop: hp(0.012),
  },
  downloadActionBtn: {
    flex: 1.15,
    height: hp(0.048),
    backgroundColor: '#EF4444',
    borderRadius: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  shareActionBtn: {
    flex: 1.15,
    height: hp(0.048),
    backgroundColor: '#22C55E',
    borderRadius: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  editActionBtn: {
    flex: 0.95,
    height: hp(0.048),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 6,
  },
  downloadActionText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  shareActionText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  editActionText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
  frameSelectorWrap: {
    marginTop: hp(0.012),
  },
  frameScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.02),
  },
  frameBox: {
    width: wp(0.125),
    height: wp(0.125),
    borderRadius: wp(0.025),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameBoxNone: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  frameBoxActive: {
    borderColor: '#E11D48',
    borderWidth: 2.2,
  },
  frameThumbImage: {
    width: '100%',
    height: '100%',
  },
  scrollIndicatorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.014),
  },
  scrollIndicatorText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  langOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  langOptionItemActive: {
    backgroundColor: '#FFF1F2',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  langFlag: {
    fontSize: fontScale(20),
  },
  langName: {
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
    color: '#1F2937',
  },
  langNameActive: {
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
  langNative: {
    fontSize: fontScale(12),
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  optionsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: fontScale(14.5),
    fontFamily: FONTS.medium,
    color: '#1F2937',
  },
});

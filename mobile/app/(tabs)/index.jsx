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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

import {
  S3_BASE,
  DEFAULT_REELS,
  FRAME_OPTIONS,
  CATEGORY_CHIPS,
  styles,
} from '../../src/modules/home';

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

  const [framesList, setFramesList] = useState(FRAME_OPTIONS);

  // Animated bouncing down movement for scroll indicator arrows
  const arrowBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounceAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, {
          toValue: 6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounce, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    bounceAnim.start();
    return () => bounceAnim.stop();
  }, [arrowBounce]);

  // Fetch backend templates if available
  useEffect(() => {
    API.get('/templates', { params: { limit: 12, sort: 'trending' } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiReels = res.data.data.map((t, idx) => ({
            id: t._id || `tmpl_${idx}`,
            title: t.name,
            category: t.categoryId?.slug || t.categoryId?.name?.toLowerCase() || 'trending',
            mediaType: t.type === 'video' ? 'video' : 'image',
            mediaUrl: t.previewAsset || t.mainMedia || t.thumbnail || DEFAULT_REELS[0].mediaUrl,
            defaultFrame: 'durga_puja',
          }));
          setReels(apiReels);
        }
      })
      .catch((err) => {
        console.log('Using default reels:', err?.message);
      });

    // Fetch dynamic footers / frames from backend
    API.get('/frames')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiFrames = res.data.data.map((f) => ({
            id: f.name?.toLowerCase().includes('durga') ? 'durga_puja' : (f._id || f.name),
            isNone: false,
            thumb: f.thumbnail || f.asset,
            asset: f.asset,
            name: f.name,
          }));
          setFramesList([FRAME_OPTIONS[0], ...apiFrames]);
        }
      })
      .catch((e) => console.log('Using default frames:', e?.message));
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
            <MaterialCommunityIcons name="crown" size={fontScale(14)} color="#F59E0B" />
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

          {/* Right Circular Play/Pause Button - ONLY for Video */}
          {activeReel.mediaType === 'video' ? (
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
          ) : null}

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
            <Text
              style={styles.downloadActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t('download')}
            </Text>
          </PressableScale>

          {/* Share Button */}
          <PressableScale
            onPress={handleShare}
            scaleTo={0.95}
            style={styles.shareActionBtn}
            contentStyle={styles.actionBtnContent}
          >
            <Ionicons name="share-outline" size={fontScale(16)} color="#FFFFFF" />
            <Text
              style={styles.shareActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t('share')}
            </Text>
          </PressableScale>

          {/* Edit Button */}
          <PressableScale
            onPress={handleEdit}
            scaleTo={0.95}
            style={styles.editActionBtn}
            contentStyle={styles.actionBtnContent}
          >
            <Ionicons name="pencil-outline" size={fontScale(15)} color="#E11D48" />
            <Text
              style={styles.editActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t('edit')}
            </Text>
          </PressableScale>
        </View>

        {/* Frame Selector Thumbnails Row */}
        <View style={[styles.frameSelectorWrap, { width: cardWidth }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.frameScrollContent}
          >
            {framesList.map((frame) => {
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

        {/* Bottom Scroll Indicator with animated downward movement */}
        <TouchableOpacity
          style={styles.scrollIndicatorWrap}
          onPress={handleNextReel}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ translateY: arrowBounce }], alignItems: 'center' }}>
            <Ionicons name="chevron-down" size={fontScale(15)} color="#E11D48" />
            <Ionicons
              name="chevron-down"
              size={fontScale(15)}
              color="#E11D48"
              style={{ marginTop: -8 }}
            />
          </Animated.View>
          <Text style={styles.scrollIndicatorText}>
            {t('scroll_to_view_next_story') || 'Scroll to view next story'}
          </Text>
        </TouchableOpacity>
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
              <Text style={styles.menuItemText}>{t('settings') || t('settings_title') || 'Settings'}</Text>
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
              <Text style={styles.menuItemText}>{t('buy_ai_credits') || t('settings_buy_ai_credits') || 'Buy AI Credits'}</Text>
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


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
  Share,
  Dimensions,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';
import { resolveMediaUrl } from '../../src/utils/media';

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

const normalizeCat = (c) => (c || '').toString().toLowerCase().replace(/[-_\s]/g, '');

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
  const [framesList, setFramesList] = useState(FRAME_OPTIONS);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const flatListRef = useRef(null);
  const [contentAreaHeight, setContentAreaHeight] = useState(0);

  // Responsive calculations so card + action row + frame selector fit within the visible viewport on all screens
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const fallbackHeight = Math.max(360, windowHeight - insets.top - insets.bottom - 210);
  const availHeight = contentAreaHeight > 0 ? contentAreaHeight : fallbackHeight;

  // Reserved space for controls: actionRow (38) + frameSelector (44) + scrollIndicator (24) + margins/paddings (~20)
  const reservedControlsHeight = 126;
  const maxCardHeight = Math.max(180, Math.floor(availHeight - reservedControlsHeight));
  const maxCardWidth = Math.min(Math.floor(windowWidth * 0.88), windowWidth - 72);

  let cardHeight = maxCardHeight;
  let cardWidth = Math.floor(cardHeight * (9 / 16));
  if (cardWidth > maxCardWidth) {
    cardWidth = maxCardWidth;
    cardHeight = Math.floor(cardWidth * (16 / 9));
  }

  const controlsWidth = Math.max(cardWidth, Math.min(windowWidth * 0.92, 360));

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

  // Fetch backend templates
  useEffect(() => {
    API.get('/templates', { params: { limit: 100, sort: 'trending' } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiReels = res.data.data.map((item, idx) => {
            const nameLower = (item.name || '').toLowerCase();
            let defFrame = 'durga_puja';
            if (nameLower.includes('retro')) defFrame = 'rose_glow';
            else if (nameLower.includes('couple') || nameLower.includes('sunset')) defFrame = 'romantic_floral';
            else if (nameLower.includes('sunrise') || nameLower.includes('morning')) defFrame = 'sunrise_amber';
            else if (nameLower.includes('bhakti') || nameLower.includes('mahadev') || nameLower.includes('ganesha')) defFrame = 'bhakti_om';
            else if (nameLower.includes('diwali') || nameLower.includes('festive')) defFrame = 'mandala';
            else if (nameLower.includes('moonlight') || nameLower.includes('night')) defFrame = 'moon_clouds';

            const catRaw =
              item.categoryId?.slug ||
              (typeof item.categoryId === 'string' ? item.categoryId : '') ||
              item.categoryId?.name ||
              item.category ||
              'trending';

            return {
              id: item._id || `tmpl_${idx}`,
              title: item.name,
              category: catRaw,
              mediaType: item.type === 'video' ? 'video' : 'image',
              mediaUrl: item.previewAsset || item.mainMedia || item.thumbnail || DEFAULT_REELS[0].mediaUrl,
              posterUrl: item.thumbnail || item.mainMedia || DEFAULT_REELS[0].posterUrl,
              defaultFrame: defFrame,
              footers: Array.isArray(item.footers) ? item.footers : [],
            };
          });

          // Combine with default reels so all categories always have templates available
          const combined = [...apiReels];
          DEFAULT_REELS.forEach((def) => {
            const exists = combined.some(
              (c) => c.id === def.id || (c.title && def.title && c.title.toLowerCase() === def.title.toLowerCase())
            );
            if (!exists) {
              combined.push(def);
            }
          });

          setReels(combined);
        }
      })
      .catch((err) => {
        console.log('Using default reels:', err?.message);
      });

    // Fetch dynamic footers / frames from backend
    API.get('/frames')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiFrames = res.data.data.map((f) => {
            const nameLower = (f.name || '').toLowerCase();
            let frameId = 'rose_glow';
            if (nameLower.includes('durga')) frameId = 'durga_puja';
            else if (nameLower.includes('mandala') || nameLower.includes('diya')) frameId = 'mandala';
            else if (nameLower.includes('royal') || nameLower.includes('crest')) frameId = 'royal_crest';
            else if (nameLower.includes('sunrise') || nameLower.includes('amber')) frameId = 'sunrise_amber';
            else if (nameLower.includes('floral') || nameLower.includes('love')) frameId = 'romantic_floral';
            else if (nameLower.includes('om') || nameLower.includes('bhakti')) frameId = 'bhakti_om';
            else if (nameLower.includes('moonlight') || nameLower.includes('silver') || nameLower.includes('cloud')) frameId = 'moon_clouds';

            return {
              id: frameId,
              isNone: false,
              thumb: f.thumbnail || f.asset,
              asset: f.asset,
              name: f.name,
            };
          });
          setFramesList([FRAME_OPTIONS[0], ...apiFrames]);
        }
      })
      .catch((e) => console.log('Using default frames:', e?.message));
  }, []);

  // Filter reels based on active category
  const displayReels = useMemo(() => {
    if (activeCategory === 'all') {
      return reels.length > 0 ? reels : DEFAULT_REELS;
    }
    const normActive = normalizeCat(activeCategory);
    const matched = reels.filter((r) => {
      const normR = normalizeCat(r.category);
      if (normR === normActive) return true;
      if (normActive === 'special' && (normR === 'durgapuja' || normR === 'festivals' || normR === 'trending')) {
        return true;
      }
      return false;
    });

    if (matched.length > 0) return matched;

    const defaultMatched = DEFAULT_REELS.filter((r) => {
      const normR = normalizeCat(r.category);
      return normR === normActive || (normActive === 'special' && (normR === 'durgapuja' || normR === 'festivals'));
    });

    if (defaultMatched.length > 0) return defaultMatched;
    return reels.length > 0 ? [reels[0]] : DEFAULT_REELS.slice(0, 1);
  }, [activeCategory, reels]);

  const activeReel = displayReels[currentReelIndex] || displayReels[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setCurrentReelIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNextReel = (currentIndex) => {
    const targetIdx = typeof currentIndex === 'number' ? currentIndex + 1 : currentReelIndex + 1;
    if (targetIdx < displayReels.length) {
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: targetIdx,
        animated: true,
      });
      setCurrentReelIndex(targetIdx);
    }
  };

  const handleCategoryPress = (catId) => {
    hapticTap();
    setActiveCategory(catId);
    setCurrentReelIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleTogglePlay = () => {
    hapticTap();
    setIsPlaying((prev) => !prev);
  };

  const handleDownload = async (reelItem) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    const target = reelItem || activeReel;
    const mediaSource = target?.mediaUrl;
    if (!mediaSource) {
      showToast(t('download_saved_msg') || 'Status saved successfully!');
      return;
    }

    try {
      const resolved = resolveMediaUrl(mediaSource);
      const isVideo = target.mediaType === 'video' || (typeof resolved === 'string' && Boolean(resolved.match(/\.(mp4|webm|mov)(\?.*)?$/i)));
      const ext = isVideo ? 'mp4' : 'jpg';
      let targetUri = resolved;

      if (resolved && (resolved.startsWith('http://') || resolved.startsWith('https://'))) {
        const fileUri = `${FileSystem.documentDirectory}starpix_${Date.now()}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(resolved, fileUri);
        targetUri = downloaded.uri;
      }

      // Save directly to user's device photo gallery
      let savedToGallery = false;
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.createAssetAsync(targetUri);
          savedToGallery = true;
        }
      } catch (mediaErr) {
        console.warn('MediaLibrary notice:', mediaErr?.message);
      }

      // Add to Downloads store so it appears in the Downloads tab
      const creationItem = {
        id: `reel_${Date.now()}`,
        name: target.title || 'Personalized Status',
        thumbnail: targetUri,
        localUri: targetUri,
        editedText: displayName,
        selectedFrame: selectedFrame !== 'none' ? selectedFrame : null,
        createdAt: new Date().toISOString(),
      };
      useCreationStore.getState().addDownloadedCreation(creationItem);

      // Save to backend if user is authenticated
      if (user && target.id && !target.id.startsWith('durga_')) {
        try {
          await API.post('/creations/save-download', {
            templateId: target.id,
            imageUrl: resolved,
            editedText: displayName,
            customizationState: { selectedFrame },
          });
        } catch (e) {}
      }

      showToast(savedToGallery ? (t('download_saved_msg') || 'Status saved to gallery!') : 'Status downloaded!');
    } catch (err) {
      console.warn('Home download error:', err);
      showToast(t('download_saved_msg') || 'Status saved successfully!');
    }
  };

  const handleShare = async (reelItem) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    const target = reelItem || activeReel;
    const mediaSource = target?.mediaUrl;
    if (!mediaSource) {
      try {
        await Share.share({
          message: `${target?.title || 'Happy Durga Puja'} - Created on StarPix! Check out trending AI statuses.`,
        });
      } catch (e) {}
      return;
    }

    try {
      const resolved = resolveMediaUrl(mediaSource);
      const isVideo = target.mediaType === 'video' || (typeof resolved === 'string' && Boolean(resolved.match(/\.(mp4|webm|mov)(\?.*)?$/i)));
      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let shareUri = resolved;

      if (resolved && (resolved.startsWith('http://') || resolved.startsWith('https://'))) {
        const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(resolved, fileUri);
        shareUri = downloaded.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType,
          dialogTitle: `${target?.title || 'StarPix Status'}`,
        });
      } else {
        await Share.share({
          message: `${target?.title || 'Happy Durga Puja'} - Created on StarPix! Check out trending AI statuses.`,
        });
      }
    } catch (e) {
      console.warn('Share error:', e);
      try {
        await Share.share({
          message: `${target?.title || 'Happy Durga Puja'} - Created on StarPix! Check out trending AI statuses.`,
        });
      } catch (err) {}
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

  // Render individual template card page
  const renderReelItem = ({ item, index }) => {
    const hasNext = index < displayReels.length - 1;
    const isCurrentActive = index === currentReelIndex;

    return (
      <View style={[styles.pageContainer, { height: availHeight }]}>
        {/* Template Media Card Container */}
        <View style={styles.cardRowWrapper}>
          <View style={[styles.reelCard, { width: cardWidth, height: cardHeight }]}>
            {/* Background Media */}
            {item.mediaType === 'video' ? (
              <View style={StyleSheet.absoluteFillObject}>
                {item.posterUrl ? (
                  <Image
                    source={{ uri: item.posterUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : null}
                <AppVideo
                  source={{ uri: item.mediaUrl }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isPlaying && isCurrentActive}
                  isLooping
                  isMuted
                />
              </View>
            ) : (
              <Image
                source={{ uri: item.mediaUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            )}

            {/* Personalized Golden Ring + Name Ribbon + Footer Plaque */}
            {selectedFrame !== 'none' ? (
              <ReelPersonalizationOverlay
                frameId={selectedFrame}
                userName={displayName}
                userPhotoUri={displayPhoto}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
              />
            ) : null}

            {/* Play/Pause Button - ONLY for Video */}
            {item.mediaType === 'video' ? (
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
          </View>

          {/* Next Button: NOT on template, positioned near the right end of the screen */}
          {hasNext ? (
            <PressableScale
              onPress={() => handleNextReel(index)}
              scaleTo={0.92}
              style={styles.floatingNextBtn}
              contentStyle={styles.nextPillContent}
            >
              <Text
                style={styles.nextPillText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('next')}
              </Text>
              <Ionicons name="chevron-forward" size={fontScale(13)} color="#E11D48" />
            </PressableScale>
          ) : null}
        </View>

        {/* 3 Action Buttons Row: Download, Share, Edit */}
        <View style={[styles.actionRow, { width: controlsWidth }]}>
          {/* Download Button */}
          <PressableScale
            onPress={() => handleDownload(item)}
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
            onPress={() => handleShare(item)}
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

        {/* Frame Selector Thumbnails Row: directly added on template */}
        <View style={[styles.frameSelectorWrap, { width: controlsWidth }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
            contentContainerStyle={styles.frameScrollContent}
          >
            {(() => {
              const itemFooters = (Array.isArray(item.footers) && item.footers.length > 0)
                ? item.footers.map((f, fIdx) => {
                    const nameLower = (f.name || '').toLowerCase();
                    let frameId = 'durga_puja';
                    if (nameLower.includes('mandala') || nameLower.includes('diya')) frameId = 'mandala';
                    else if (nameLower.includes('royal') || nameLower.includes('crest')) frameId = 'royal_crest';
                    else if (nameLower.includes('sunrise') || nameLower.includes('amber')) frameId = 'sunrise_amber';
                    else if (nameLower.includes('floral') || nameLower.includes('love')) frameId = 'romantic_floral';
                    else if (nameLower.includes('om') || nameLower.includes('bhakti')) frameId = 'bhakti_om';
                    else if (nameLower.includes('moonlight') || nameLower.includes('silver') || nameLower.includes('cloud')) frameId = 'moon_clouds';
                    else if (nameLower.includes('rose') || nameLower.includes('lake')) frameId = 'rose_glow';

                    return {
                      id: frameId,
                      isNone: false,
                      thumb: f.thumbnail || f.asset || f.videoAsset,
                      asset: f.asset || f.videoAsset,
                      name: f.name,
                    };
                  })
                : [];

              const effectiveFrames = [
                FRAME_OPTIONS[0],
                ...(itemFooters.length > 0 ? itemFooters : framesList.slice(1)),
              ];

              return effectiveFrames.map((frame) => {
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
              });
            })()}
          </ScrollView>
        </View>

        {/* Bottom Scroll Indicator: ONLY visible under the FIRST content template */}
        {index === 0 && displayReels.length > 1 ? (
          <TouchableOpacity
            style={styles.scrollIndicatorWrap}
            onPress={() => handleNextReel(index)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ translateY: arrowBounce }], alignItems: 'center' }}>
              <Ionicons name="chevron-down" size={fontScale(14)} color="#E11D48" />
              <Ionicons
                name="chevron-down"
                size={fontScale(14)}
                color="#E11D48"
                style={{ marginTop: -8 }}
              />
            </Animated.View>
            <Text style={styles.scrollIndicatorText}>
              {t('scroll_to_view_next_story') || 'Scroll to view next story'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.scrollIndicatorSpacer} />
        )}
      </View>
    );
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
        </View>
      </View>

      {/* Sticky Category / Filter Chips at Top */}
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

      {/* Main Single-Viewport Snapping List */}
      <View
        style={{ flex: 1, width: '100%' }}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && Math.abs(h - contentAreaHeight) > 2) {
            setContentAreaHeight(h);
          }
        }}
      >
        <FlatList
          ref={flatListRef}
          data={displayReels}
          keyExtractor={(item, index) => item.id || `reel_${index}`}
          renderItem={renderReelItem}
          pagingEnabled={Platform.OS === 'ios'}
          snapToInterval={availHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          directionalLockEnabled={true}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            const newIndex = Math.round(offsetY / availHeight);
            if (newIndex >= 0 && newIndex < displayReels.length && newIndex !== currentReelIndex) {
              setCurrentReelIndex(newIndex);
            }
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          getItemLayout={(data, index) => ({
            length: availHeight,
            offset: availHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </View>

      {/* Language Switcher Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleChangeLanguage}
      />

      <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
    </View>
  );
}

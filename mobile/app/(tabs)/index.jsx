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
  ActivityIndicator,
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
import { uploadUserMedia } from '../../src/utils/upload';

import PressableScale from '../../src/components/PressableScale';
import Toast from '../../src/components/Toast';
import ReelPersonalizationOverlay from '../../src/components/ReelPersonalizationOverlay';
import LanguageModal from '../../src/components/LanguageModal';
import PaidTemplateConfirmModal from '../../src/components/PaidTemplateConfirmModal';
import AppVideo, { ResizeMode } from '../../src/components/AppVideo';
import Skeleton from '../../src/components/Skeleton';
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

  // Header Greeting: Use first name only, and if multi-word or long, append '...'
  const greetingName = useMemo(() => {
    if (!displayName) return 'User';
    const trimmed = displayName.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] || trimmed;
    if (parts.length > 1 || firstName.length > 10) {
      const truncated = firstName.length > 10 ? firstName.slice(0, 9) : firstName;
      return `${truncated}...`;
    }
    return firstName;
  }, [displayName]);

  const [actionLoading, setActionLoading] = useState(null); // { type: 'download' | 'share', id: string }

  const [activeCategory, setActiveCategory] = useState('special');
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [selectedFrames, setSelectedFrames] = useState({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeReelPlaybackReady, setActiveReelPlaybackReady] = useState(false);

  // Synchronize playback: hold playback at frame 0 for a brief 350ms so background, footer, name & avatar all mount together before motion starts
  useEffect(() => {
    setActiveReelPlaybackReady(false);
    const timer = setTimeout(() => {
      setActiveReelPlaybackReady(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [currentReelIndex, activeCategory]);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [framesList, setFramesList] = useState(FRAME_OPTIONS);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [paidConfirmState, setPaidConfirmState] = useState(null); // { item, action: 'download' | 'share' }
  const [payingForTemplate, setPayingForTemplate] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const viewedReelIds = useRef(new Set());

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

  const getSubscriptionLabel = () => {
    const isVip = Boolean(
      user &&
      user.isPremium &&
      (user.subscriptionStatus === 'active' || !user.subscriptionStatus) &&
      (!user.subscriptionExpiresAt || new Date() <= new Date(user.subscriptionExpiresAt))
    );
    if (!isVip) {
      return t('pro_badge') || 'PRO';
    }
    const plan = user.subscriptionPlan;
    if (plan === '7days') return '7D VIP';
    if (plan === '30days') return '30D VIP';
    if (plan === '1year' || plan === 'annual') return '1Y VIP';
    return t('vip') || 'VIP';
  };

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
  // Fetch backend templates
  useEffect(() => {
    API.get('/templates', { params: { limit: 100, sort: 'trending' } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiReels = res.data.data.map((item, idx) => {
            const catRaw =
              item.categoryId?.slug ||
              (typeof item.categoryId === 'string' ? item.categoryId : '') ||
              item.categoryId?.name ||
              item.category ||
              'trending';

            const contentSource = item.mainMedia || item.previewAsset || item.mediaUrl;
            const thumbSource = item.thumbnail || contentSource;

            const isVideo =
              item.type === 'video' ||
              (typeof contentSource === 'string' && Boolean(contentSource.match(/\.(mp4|webm|mov)(\?.*)?$/i))) ||
              (typeof item.mediaUrl === 'string' && Boolean(item.mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)));

            const templateFooters = (Array.isArray(item.footers) ? item.footers : [])
              .filter((f) => f && (f.asset || f.videoAsset || f.thumbnail || f.name))
              .map((f, fIdx) => {
                const fId = f._id ? String(f._id) : (f.id ? String(f.id) : `footer_${item._id || idx}_${fIdx}`);
                const fAsset = f.videoAsset || f.asset || '';
                const fThumb = f.thumbnail || fAsset;
                return {
                  id: fId,
                  name: f.name || `Footer ${fIdx + 1}`,
                  asset: fAsset,
                  videoAsset: f.videoAsset || '',
                  thumb: fThumb,
                  thumbnail: fThumb,
                  heightPercent: typeof f.heightPercent === 'number' ? f.heightPercent : 40,
                  objectFit: f.objectFit || 'contain',
                  x: f.x,
                  y: f.y,
                  width: f.width,
                  height: f.height,
                  zIndex: f.zIndex || 10,
                  userNamePosition: f.userNamePosition || null,
                  isNone: false,
                  isCustom: true,
                };
              });

            const isPaid = ['premium', 'paid', 'vip'].includes(item.accessType) || Number(item.price) > 0;

            return {
              id: item._id || `tmpl_${idx}`,
              title: item.name,
              nameTranslations: item.nameTranslations,
              category: catRaw,
              mediaType: isVideo ? 'video' : 'image',
              contentUrl: resolveMediaUrl(contentSource),
              mediaUrl: resolveMediaUrl(contentSource),
              posterUrl: resolveMediaUrl(thumbSource),
              thumbnailUrl: resolveMediaUrl(thumbSource),
              defaultFrame: templateFooters.length > 0 ? templateFooters[0].id : 'none',
              footers: templateFooters,
              canvasConfig: item.canvasConfig || null,
              accessType: item.accessType || 'free',
              price: Number(item.price) || 0,
              isPaid,
              rawTemplate: item,
            };
          });

          setReels(apiReels);
        }
      })
      .catch((err) => {
        console.log('Error fetching templates:', err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter reels based on active category
  const displayReels = useMemo(() => {
    if (activeCategory === 'all') {
      return reels;
    }
    const normActive = normalizeCat(activeCategory);
    return reels.filter((r) => {
      const normR = normalizeCat(r.category);
      if (normR === normActive) return true;
      if (normActive === 'special' && (normR === 'durgapuja' || normR === 'festivals' || normR === 'trending')) {
        return true;
      }
      return false;
    });
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

  // View tracking for templates displayed in the feed
  const recordReelView = useCallback((templateId) => {
    if (!templateId || viewedReelIds.current.has(templateId)) return;
    if (String(templateId).startsWith('durga_')) return;
    viewedReelIds.current.add(templateId);
    API.post(`/templates/${templateId}/view`).catch(() => {});
  }, []);

  useEffect(() => {
    if (displayReels && displayReels[currentReelIndex]) {
      recordReelView(displayReels[currentReelIndex].id);
    }
  }, [currentReelIndex, displayReels, recordReelView]);

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

  const executeDownload = async (target) => {
    const mediaSource = target?.mediaUrl;
    if (!mediaSource) {
      showToast(t('download_saved_msg') || 'Status saved successfully!');
      return;
    }

    setActionLoading({ type: 'download', id: target.id });

    try {
      const targetFrame = selectedFrames[target.id] !== undefined
        ? selectedFrames[target.id]
        : (target.defaultFrame || (target.footers && target.footers.length > 0 ? target.footers[0].id : 'none'));

      const activeCustomFooter =
        target.footers && target.footers.length > 0
          ? target.footers.find((f) => f.id === targetFrame) || target.footers[0]
          : null;

      let remoteUserPhoto = displayPhoto;
      if (displayPhoto && !displayPhoto.startsWith('http://') && !displayPhoto.startsWith('https://')) {
        try {
          const uploaded = await uploadUserMedia(displayPhoto, 'user-creations');
          if (uploaded) remoteUserPhoto = uploaded;
        } catch (uploadErr) {
          console.warn('Could not upload user photo:', uploadErr);
        }
      }

      let resolved = resolveMediaUrl(mediaSource);
      let isVideo = target.mediaType === 'video' || (typeof resolved === 'string' && Boolean(resolved.match(/\.(mp4|webm|mov)(\?.*)?$/i)));

      // Request server-side personalized render with footers, user photo, and user name
      if (target.id && !String(target.id).startsWith('durga_')) {
        try {
          const res = await API.post(`/creations/${target.id}/download`, {
            userNameText: displayName,
            userPhotoUri: remoteUserPhoto || displayPhoto,
            selectedFooter: activeCustomFooter,
            customizationState: {
              userNameText: displayName,
              userPhotoUri: remoteUserPhoto || displayPhoto,
              selectedFrame: targetFrame,
              footers: target.footers || [],
              canvasConfig: target.canvasConfig || null,
              selectedFooter: activeCustomFooter,
            },
          }, { timeout: 60000 });
          if (res.data?.data?.downloadUrl) {
            resolved = res.data.data.downloadUrl;
            if (typeof res.data.data.isVideo === 'boolean') {
              isVideo = res.data.data.isVideo;
            }
          }
        } catch (errApi) {
          console.warn('Personalized download endpoint notice:', errApi?.message);
        }
      }

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
        templateId: target.id,
        name: target.title || 'Personalized Status',
        nameTranslations: target.nameTranslations,
        thumbnail: target.thumbnailUrl || target.posterUrl || targetUri,
        localUri: targetUri,
        image: resolved,
        mediaUrl: resolved,
        mediaType: target.mediaType || (isVideo ? 'video' : 'image'),
        editedText: displayName,
        userNameText: displayName,
        userPhotoUri: remoteUserPhoto || displayPhoto || null,
        selectedFrame: targetFrame !== 'none' ? targetFrame : null,
        activeTemplate: target.rawTemplate || target,
        template: target.rawTemplate || target,
        footers: target.footers || [],
        selectedFooter: activeCustomFooter,
        canvasConfig: target.canvasConfig || null,
        createdAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
        isPaid: target.isPaid,
        price: target.price,
      };
      useCreationStore.getState().addDownloadedCreation(creationItem);

      // Record usage on backend
      if (target.id && !String(target.id).startsWith('durga_')) {
        API.post(`/templates/${target.id}/use`, { action: 'download' }).catch(() => {});
        if (user) {
          try {
            await API.post('/creations/save-download', {
              templateId: target.id,
              imageUrl: resolved,
              editedText: displayName,
              editedPhoto: remoteUserPhoto || displayPhoto || '',
              customizationState: {
                userNameText: displayName,
                userPhotoUri: remoteUserPhoto || displayPhoto || null,
                selectedFrame: targetFrame,
                footers: target.footers || [],
                canvasConfig: target.canvasConfig || null,
                selectedFooter: activeCustomFooter,
              },
            });
          } catch (e) {}
        }
      }

      showToast(savedToGallery ? (t('download_saved_msg') || 'Status saved to gallery!') : 'Status downloaded!');
    } catch (err) {
      console.warn('Home download error:', err);
      showToast(t('download_saved_msg') || 'Status saved successfully!');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (reelItem) => {
    if (actionLoading) return;
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    const target = reelItem || activeReel;
    if (!target) return;

    // Check if paid template and not yet unlocked in current session
    if (target.isPaid && !unlockedIds.has(target.id)) {
      // Show confirmation popup for the money required
      setPaidConfirmState({ item: target, action: 'download' });
      return;
    }

    await executeDownload(target);
  };

  const executeShare = async (target) => {
    const mediaSource = target?.mediaUrl;
    if (!mediaSource) {
      try {
        await Share.share({
          message: `${target?.title || 'Happy Durga Puja'} - Created on StarPix! Check out trending AI statuses.`,
        });
      } catch (e) {}
      return;
    }

    setActionLoading({ type: 'share', id: target.id });

    try {
      const targetFrame = selectedFrames[target.id] !== undefined
        ? selectedFrames[target.id]
        : (target.defaultFrame || (target.footers && target.footers.length > 0 ? target.footers[0].id : 'none'));

      const activeCustomFooter =
        target.footers && target.footers.length > 0
          ? target.footers.find((f) => f.id === targetFrame) || target.footers[0]
          : null;

      let remoteUserPhoto = displayPhoto;
      if (displayPhoto && !displayPhoto.startsWith('http://') && !displayPhoto.startsWith('https://')) {
        try {
          const uploaded = await uploadUserMedia(displayPhoto, 'user-creations');
          if (uploaded) remoteUserPhoto = uploaded;
        } catch (uploadErr) {
          console.warn('Could not upload user photo:', uploadErr);
        }
      }

      let resolved = resolveMediaUrl(mediaSource);
      let isVideo = target.mediaType === 'video' || (typeof resolved === 'string' && Boolean(resolved.match(/\.(mp4|webm|mov)(\?.*)?$/i)));

      // Request personalized share link with footers, user photo, and user name
      if (target.id && !String(target.id).startsWith('durga_')) {
        try {
          const res = await API.post(`/creations/${target.id}/share`, {
            userNameText: displayName,
            userPhotoUri: remoteUserPhoto || displayPhoto,
            selectedFooter: activeCustomFooter,
            customizationState: {
              userNameText: displayName,
              userPhotoUri: remoteUserPhoto || displayPhoto,
              selectedFrame: targetFrame,
              footers: target.footers || [],
              canvasConfig: target.canvasConfig || null,
              selectedFooter: activeCustomFooter,
            },
          }, { timeout: 60000 });
          const link = res.data?.data?.shareUrl || res.data?.data?.downloadUrl;
          if (link) {
            resolved = link;
          }
        } catch (errApi) {
          console.warn('Personalized share endpoint notice:', errApi?.message);
        }
      }

      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let shareUri = resolved;

      if (resolved && (resolved.startsWith('http://') || resolved.startsWith('https://'))) {
        const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(resolved, fileUri);
        shareUri = downloaded.uri;
      }

      // Save creation to Downloads store and backend as user shares
      const creationItem = {
        id: `reel_${Date.now()}`,
        templateId: target.id,
        name: target.title || 'Personalized Status',
        nameTranslations: target.nameTranslations,
        thumbnail: target.thumbnailUrl || target.posterUrl || shareUri,
        localUri: shareUri,
        image: resolved,
        mediaUrl: resolved,
        mediaType: target.mediaType || (isVideo ? 'video' : 'image'),
        editedText: displayName,
        userNameText: displayName,
        userPhotoUri: remoteUserPhoto || displayPhoto || null,
        selectedFrame: targetFrame !== 'none' ? targetFrame : null,
        activeTemplate: target.rawTemplate || target,
        template: target.rawTemplate || target,
        footers: target.footers || [],
        selectedFooter: activeCustomFooter,
        canvasConfig: target.canvasConfig || null,
        createdAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
        isPaid: target.isPaid,
        price: target.price,
      };
      useCreationStore.getState().addDownloadedCreation(creationItem);

      // Record use on backend
      if (target.id && !String(target.id).startsWith('durga_')) {
        API.post(`/templates/${target.id}/use`, { action: 'share' }).catch(() => {});
        if (user) {
          try {
            await API.post('/creations/save-download', {
              templateId: target.id,
              imageUrl: resolved,
              editedText: displayName,
              editedPhoto: remoteUserPhoto || displayPhoto || '',
              customizationState: {
                userNameText: displayName,
                userPhotoUri: remoteUserPhoto || displayPhoto || null,
                selectedFrame: targetFrame,
                footers: target.footers || [],
                canvasConfig: target.canvasConfig || null,
                selectedFooter: activeCustomFooter,
              },
            });
          } catch (e) {}
        }
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async (reelItem) => {
    if (actionLoading) return;
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    const target = reelItem || activeReel;
    if (!target) return;

    // Check if paid template and not yet unlocked in current session
    if (target.isPaid && !unlockedIds.has(target.id)) {
      // Show confirmation popup for the money required
      setPaidConfirmState({ item: target, action: 'share' });
      return;
    }

    await executeShare(target);
  };

  const handleConfirmPaidAction = async () => {
    if (!paidConfirmState?.item) return;
    const { item, action } = paidConfirmState;

    if (!user) {
      setPaidConfirmState(null);
      showToast(t('login_required_to_purchase'));
      router.push('/login');
      return;
    }

    setPayingForTemplate(true);
    try {
      const res = await API.post('/payments/create', {
        templateId: item.id,
        amount: item.price || 49,
      });

      if (res.data?.success) {
        hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
        setUnlockedIds((prev) => new Set(prev).add(item.id));
        setPaidConfirmState(null);
        showToast(t('payment_successful'));

        if (action === 'share') {
          executeShare(item);
        } else {
          executeDownload(item);
        }
      } else {
        showToast(res.data?.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.warn('Payment error:', err);
      showToast(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPayingForTemplate(false);
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
    const templateFooters = Array.isArray(item.footers) ? item.footers : [];
    const defaultFrameId = templateFooters.length > 0 ? templateFooters[0].id : (item.defaultFrame || 'durga_puja');
    const itemFrameId = selectedFrames[item.id] !== undefined
      ? selectedFrames[item.id]
      : defaultFrameId;
    const selectedCustomFooter = templateFooters.find((f) => f.id === itemFrameId) || null;
    const shouldPlayMedia = isPlaying && isCurrentActive && activeReelPlaybackReady;

    return (
      <View style={[styles.pageContainer, { height: availHeight }]}>
        {/* Template Media Card Container */}
        <View style={styles.cardRowWrapper}>
          <View style={[styles.reelCard, { width: cardWidth, height: cardHeight }]}>
            {/* Background Media */}
            {(() => {
              const contentUri = item.contentUrl || item.mediaUrl;

              return (
                <View style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0, overflow: 'hidden', borderRadius: wp(0.045) }}>
                  {item.thumbnailUrl && item.mediaType === 'video' ? (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0 }}
                      resizeMode="cover"
                    />
                  ) : null}
                  {item.mediaType === 'video' ? (
                    <AppVideo
                      source={{ uri: contentUri }}
                      style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0 }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={shouldPlayMedia}
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: contentUri }}
                      style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0 }}
                      resizeMode="cover"
                    />
                  )}
                </View>
              );
            })()}

            {/* Custom Footer Overlay Layer: Directly visible on the main template content */}
            {(() => {
              if (!selectedCustomFooter || itemFrameId === 'none') return null;

              const footerAsset = selectedCustomFooter.videoAsset || selectedCustomFooter.asset || '';
              if (!footerAsset) return null;

              const isVideoAsset = Boolean(
                footerAsset && (
                  footerAsset.endsWith('.mp4') ||
                  footerAsset.endsWith('.webm') ||
                  footerAsset.includes('.mp4?') ||
                  footerAsset.includes('video')
                )
              );

              const footerUri = resolveMediaUrl(footerAsset);
              if (!footerUri) return null;

              const heightNorm =
                typeof selectedCustomFooter.height === 'number'
                  ? (selectedCustomFooter.height > 1 ? selectedCustomFooter.height / 100 : selectedCustomFooter.height)
                  : (typeof selectedCustomFooter.heightPercent === 'number' ? selectedCustomFooter.heightPercent / 100 : 0.4);

              const widthNorm =
                typeof selectedCustomFooter.width === 'number'
                  ? (selectedCustomFooter.width > 1 ? selectedCustomFooter.width / 100 : selectedCustomFooter.width)
                  : 1.0;

              const fWidth = widthNorm * cardWidth;
              const fHeight = heightNorm * cardHeight;

              const xNorm = typeof selectedCustomFooter.x === 'number'
                ? (selectedCustomFooter.x > 1 ? selectedCustomFooter.x / 100 : selectedCustomFooter.x)
                : 0.5;

              const yNorm = typeof selectedCustomFooter.y === 'number'
                ? (selectedCustomFooter.y > 1 ? selectedCustomFooter.y / 100 : selectedCustomFooter.y)
                : (1 - heightNorm / 2);

              const fLeft = xNorm * cardWidth - fWidth / 2;
              const fTop = yNorm * cardHeight - fHeight / 2;

              const fitMode = selectedCustomFooter.objectFit === 'cover'
                ? 'cover'
                : selectedCustomFooter.objectFit === 'fill'
                ? 'fill'
                : 'contain';

              return (
                <View
                  style={{
                    position: 'absolute',
                    left: fLeft,
                    top: fTop,
                    width: fWidth,
                    height: fHeight,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: selectedCustomFooter.zIndex || 10,
                    elevation: 12,
                  }}
                  pointerEvents="none"
                >
                  {isVideoAsset ? (
                    <AppVideo
                      key={`footer_${selectedCustomFooter.id || 'curr'}_${item.id}`}
                      source={{ uri: footerUri }}
                      style={{ width: fWidth, height: fHeight }}
                      resizeMode={fitMode === 'cover' ? ResizeMode.COVER : fitMode === 'fill' ? ResizeMode.STRETCH : ResizeMode.CONTAIN}
                      shouldPlay={shouldPlayMedia}
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: footerUri }}
                      style={{ width: fWidth, height: fHeight }}
                      resizeMode={fitMode === 'fill' ? 'stretch' : fitMode}
                    />
                  )}
                </View>
              );
            })()}

            {/* Personalized Canvas Layers and/or Frame Overlay */}
            <ReelPersonalizationOverlay
              frameId={itemFrameId}
              customFooter={selectedCustomFooter}
              canvasConfig={item.canvasConfig}
              userName={displayName}
              userPhotoUri={displayPhoto}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              isPlaying={shouldPlayMedia}
            />

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
            onPress={() => !actionLoading && handleDownload(item)}
            scaleTo={0.95}
            disabled={Boolean(actionLoading)}
            style={[
              styles.downloadActionBtn,
              actionLoading?.id === item.id && actionLoading?.type === 'download' && { opacity: 0.85 },
            ]}
            contentStyle={styles.actionBtnContent}
          >
            {actionLoading?.id === item.id && actionLoading?.type === 'download' ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="download-outline" size={fontScale(16)} color="#FFFFFF" />
            )}
            <Text
              style={styles.downloadActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {actionLoading?.id === item.id && actionLoading?.type === 'download'
                ? (t('downloading') || 'Downloading...')
                : t('download')}
            </Text>
          </PressableScale>

          {/* Share Button */}
          <PressableScale
            onPress={() => !actionLoading && handleShare(item)}
            scaleTo={0.95}
            disabled={Boolean(actionLoading)}
            style={[
              styles.shareActionBtn,
              actionLoading?.id === item.id && actionLoading?.type === 'share' && { opacity: 0.85 },
            ]}
            contentStyle={styles.actionBtnContent}
          >
            {actionLoading?.id === item.id && actionLoading?.type === 'share' ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="share-outline" size={fontScale(16)} color="#FFFFFF" />
            )}
            <Text
              style={styles.shareActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {actionLoading?.id === item.id && actionLoading?.type === 'share'
                ? (t('sharing') || 'Sharing...')
                : t('share')}
            </Text>
          </PressableScale>

          {/* Edit Button */}
          <PressableScale
            onPress={handleEdit}
            scaleTo={0.95}
            disabled={Boolean(actionLoading)}
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

        {/* Frame Selector Thumbnails Row: only when template has footers */}
        {templateFooters.length > 0 ? (
          <View style={[styles.frameSelectorWrap, { width: controlsWidth }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              directionalLockEnabled={true}
              contentContainerStyle={styles.frameScrollContent}
            >
              {[FRAME_OPTIONS[0], ...templateFooters].map((frame, fIdx) => {
                if (!frame) return null;
                const isSelected = itemFrameId === frame.id;
                const frameKey = frame.id ? `${frame.id}_${fIdx}` : `frame_${fIdx}`;
                const resolvedThumb = frame.thumb ? resolveMediaUrl(frame.thumb) : null;

                return (
                  <TouchableOpacity
                    key={frameKey}
                    activeOpacity={0.75}
                    onPress={() => {
                      hapticTap();
                      setSelectedFrames((prev) => ({
                        ...prev,
                        [item.id]: frame.id,
                      }));
                    }}
                    style={[
                      styles.frameBox,
                      frame.isNone && styles.frameBoxNone,
                      isSelected && styles.frameBoxActive,
                    ]}
                  >
                    {frame.isNone || !resolvedThumb ? (
                      <Ionicons name="ban-outline" size={fontScale(20)} color="#78350F" />
                    ) : (
                      <Image
                        source={{ uri: resolvedThumb }}
                        style={styles.frameThumbImage}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

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
          <Text style={styles.userNameText} numberOfLines={1} ellipsizeMode="tail">
            {greetingName}
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
            <MaterialCommunityIcons name="crown" size={fontScale(14)} color="#1E1B2E" />
            <Text style={styles.proText}>{getSubscriptionLabel()}</Text>
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
        {loading ? (
          <View
            style={[
              styles.pageContainer,
              { height: availHeight, justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            {/* Card Skeleton (9:16 aspect ratio matching reelCard) */}
            <View style={styles.cardRowWrapper}>
              <Skeleton
                width={cardWidth}
                height={cardHeight}
                borderRadius={wp(0.045)}
                style={{ backgroundColor: '#E2E8F0' }}
              />
            </View>

            {/* Action Buttons Skeleton (Download, Share, Edit) */}
            <View style={[styles.actionRow, { width: controlsWidth, marginTop: 8 }]}>
              <Skeleton width="34%" height={38} borderRadius={20} style={{ backgroundColor: '#F1F5F9' }} />
              <Skeleton width="32%" height={38} borderRadius={20} style={{ backgroundColor: '#F1F5F9' }} />
              <Skeleton width="28%" height={38} borderRadius={20} style={{ backgroundColor: '#F1F5F9' }} />
            </View>

            {/* Frame Selector Skeleton (4 boxes) */}
            <View
              style={[
                styles.frameSelectorWrap,
                { width: controlsWidth, marginTop: 8, flexDirection: 'row', gap: wp(0.02) },
              ]}
            >
              <Skeleton width={44} height={44} borderRadius={10} style={{ backgroundColor: '#F1F5F9' }} />
              <Skeleton width={44} height={44} borderRadius={10} style={{ backgroundColor: '#F1F5F9' }} />
              <Skeleton width={44} height={44} borderRadius={10} style={{ backgroundColor: '#F1F5F9' }} />
              <Skeleton width={44} height={44} borderRadius={10} style={{ backgroundColor: '#F1F5F9' }} />
            </View>

            {/* Scroll Indicator Placeholder */}
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Skeleton width={110} height={12} borderRadius={6} style={{ backgroundColor: '#F1F5F9' }} />
            </View>
          </View>
        ) : displayReels.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Ionicons name="images-outline" size={fontScale(44)} color="#CBD5E1" />
            <Text
              style={{
                marginTop: 12,
                color: '#94A3B8',
                fontFamily: FONTS.medium,
                fontSize: fontScale(13.5),
                textAlign: 'center',
              }}
            >
              {t('no_templates_found') || 'No templates found'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayReels}
            extraData={i18n.language}
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
            initialNumToRender={3}
            maxToRenderPerBatch={4}
            windowSize={7}
            removeClippedSubviews={false}
          />
        )}
      </View>

      {/* Paid Template Confirmation Modal for Download/Share */}
      <PaidTemplateConfirmModal
        key={`paid_modal_${i18n.language}`}
        visible={paidConfirmState !== null}
        template={paidConfirmState?.item}
        action={paidConfirmState?.action || 'download'}
        loading={payingForTemplate}
        onConfirm={handleConfirmPaidAction}
        onCancel={() => setPaidConfirmState(null)}
      />

      {/* Language Switcher Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleChangeLanguage}
      />

      {/* Floating HUD loader when processing download or share */}
      {actionLoading ? (
        <View style={styles.floatingLoaderBadge}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.floatingLoaderText}>
            {actionLoading.type === 'download'
              ? (t('downloading') || 'Downloading...')
              : (t('sharing') || 'Sharing...')}
          </Text>
        </View>
      ) : null}

      <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
    </View>
  );
}

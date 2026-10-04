import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import AppVideo, { ResizeMode } from '../src/components/AppVideo';
import Toast from '../src/components/Toast';
import Skeleton from '../src/components/Skeleton';
import ConfirmModal from '../src/components/ConfirmModal';
import PressableScale from '../src/components/PressableScale';
import BackButton from '../src/components/BackButton';
import { FONTS } from '../src/constants/colors';

import { fontScale, wp, hp, SCREEN_PAD } from '../src/utils/responsive';
import { hapticTap, hapticSuccess, hapticError } from '../src/utils/haptics';
import API from '../src/utils/api';
import { resolveMediaUrl } from '../src/utils/media';
import { uploadUserMedia } from '../src/utils/upload';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreationStore } from '../src/store/useCreationStore';
import { checkHasActiveSubscription } from '../src/utils/subscription';

import {
  LANGUAGES,
  CATEGORIES,
  FALLBACK_TEMPLATES,
  HeroTemplateCard,
  styles,
} from '../src/modules/aiVideo';

export default function AITrendsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const addDownloadedCreation = useCreationStore((state) => state.addDownloadedCreation);

  const scrollRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Today's Special");

  // Multi-Face Selection: Array of image URIs for face slots [face1, face2]
  const [userFaces, setUserFaces] = useState([]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  // Result actions state
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories', { params: { active: true } });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const adminCats = res.data.data.map((c) => ({
          id: c.name,
          name: c.name,
          slug: c.slug,
          icon: c.icon || '✨',
          nameTranslations: c.nameTranslations || {},
        }));

        const hasSpecial = adminCats.some(
          (c) => c.name?.toLowerCase().includes('special') || c.slug === 'special'
        );
        const finalCats = hasSpecial
          ? adminCats
          : [{ id: "Today's Special", name: "Today's Special", icon: '⭐', slug: 'special' }, ...adminCats];

        setCategories(finalCats);
      }
    } catch (err) {
      console.log('Error fetching categories for AI Trends:', err?.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await API.get('/ai-video/templates');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setTemplates(res.data.data);
        setSelectedTemplate(res.data.data[0]);
      } else {
        setTemplates(FALLBACK_TEMPLATES);
        setSelectedTemplate(FALLBACK_TEMPLATES[0]);
      }
    } catch {
      setTemplates(FALLBACK_TEMPLATES);
      setSelectedTemplate(FALLBACK_TEMPLATES[0]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticTap();
    await Promise.all([fetchTemplates(), fetchCategories()]);
    setRefreshing(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  // Switch active template and smoothly scroll back to top
  const handleSelectTemplate = (tmpl) => {
    if (generating) return;
    hapticTap();
    setSelectedTemplate(tmpl);
    setUserFaces([]);
    setGeneratedResult(null);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Category filter selection
  const handleSelectCategory = (catId, slug) => {
    if (generating) return;
    hapticTap();
    setActiveCategory(catId);
    const isAllOrSpecial =
      catId === "Today's Special" ||
      catId === 'All' ||
      slug === 'special' ||
      slug === 'all';

    const filtered = isAllOrSpecial
      ? templates
      : templates.filter((t) => {
          const tCat = (t.category || '').toLowerCase().trim();
          const target = catId.toLowerCase().trim();
          const targetSlug = (slug || '').toLowerCase().trim();
          return (
            tCat === target ||
            (targetSlug && tCat === targetSlug) ||
            tCat.replace(/[-_\s]/g, '') === target.replace(/[-_\s]/g, '')
          );
        });

    if (filtered.length > 0) {
      setSelectedTemplate(filtered[0]);
      setUserFaces([]);
      setGeneratedResult(null);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };

  // Image Picker for face slots
  const handlePickFaceImage = async (slotIndex = 0) => {
    try {
      hapticTap();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('photo_access_required'), t('gallery_permission_required'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const updated = [...userFaces];
        updated[slotIndex] = pickedUri;
        setUserFaces(updated);
        setGeneratedResult(null);
        hapticSuccess();
        showToast(t('photo_selected') || 'Photo selected!');
      }
    } catch (err) {
      console.log('Error picking face image:', err?.message);
    }
  };

  const handleUploadCardPress = () => {
    hapticTap();
    const reqCount = selectedTemplate?.requiredPhotos || 1;
    let targetSlot = 0;
    for (let i = 0; i < reqCount; i++) {
      if (!userFaces[i]) {
        targetSlot = i;
        break;
      }
    }
    handlePickFaceImage(targetSlot);
  };

  const handleRemoveFace = (slotIndex) => {
    hapticTap();
    const updated = [...userFaces];
    updated[slotIndex] = null;
    setUserFaces(updated);
    setGeneratedResult(null);
  };

  // Get active face URI for a given slot (user face > template sample face > user profile photo)
  const getSlotImageUri = (tmpl, slotIndex) => {
    if (userFaces[slotIndex]) return userFaces[slotIndex];
    if (tmpl?.sampleSourceImageUrls && tmpl.sampleSourceImageUrls[slotIndex]) {
      return tmpl.sampleSourceImageUrls[slotIndex];
    }
    if (slotIndex === 0 && tmpl?.sampleSourceImageUrl) {
      return tmpl.sampleSourceImageUrl;
    }
    if (slotIndex === 0 && user?.profilePhoto) {
      return resolveMediaUrl(user?.profilePhoto);
    }
    return null;
  };

  // Trigger Generation with credit validation
  const handleTriggerCreate = () => {
    if (!selectedTemplate) return;
    hapticTap();
    const userCredits = user?.credits !== undefined ? user.credits : 240;
    const needed = selectedTemplate?.creditsRequired || 25;
    if (user && userCredits < needed) {
      Alert.alert(
        t('insufficient_credits') || 'Insufficient Credits',
        t('not_enough_credits_msg', { needed, available: userCredits }) ||
          `You need ${needed} credits to generate this, but currently have ${userCredits}. Would you like to buy more?`,
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          { text: t('settings_buy_ai_credits') || 'Buy Credits', onPress: () => router.push('/buy-credits') },
        ]
      );
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleConfirmGeneration = async () => {
    setConfirmModalVisible(false);
    if (!selectedTemplate) return;

    const cost = selectedTemplate.creditsRequired || 25;
    const prevCredits = user?.credits !== undefined ? user.credits : 240;

    try {
      setGenerating(true);
      showToast(t('ai_generation_started') || 'AI Generation Started');

      // Real-time instantaneous credit update
      if (prevCredits >= cost) {
        useAuthStore.getState().setUserCredits(prevCredits - cost);
      }

      const requiredCount = selectedTemplate.requiredPhotos || 1;
      const finalFaceUrls = [];

      for (let i = 0; i < requiredCount; i++) {
        const localFace = getSlotImageUri(selectedTemplate, i);
        if (localFace && (localFace.startsWith('file://') || localFace.startsWith('content://'))) {
          try {
            const uploaded = await uploadUserMedia(localFace, 'ai-faces');
            finalFaceUrls.push(uploaded || localFace);
          } catch {
            finalFaceUrls.push(localFace);
          }
        } else if (localFace) {
          finalFaceUrls.push(localFace);
        }
      }

      const res = await API.post(
        '/ai-video/generate',
        {
          templateId: selectedTemplate._id,
          targetVideoUrl: selectedTemplate.videoUrl,
          targetImageUrl: selectedTemplate.thumbnailUrl || selectedTemplate.videoUrl,
          userImageUrl: finalFaceUrls[0] || (user?.profilePhoto ? resolveMediaUrl(user.profilePhoto) : ''),
          userImageUrls: finalFaceUrls,
          mediaType: selectedTemplate.mediaType || 'video',
          prompt: selectedTemplate.prompt,
        },
        { timeout: 900000 }
      );

      if (res.data && res.data.success && res.data.data) {
        const url = res.data.data.resultUrl || res.data.data.videoUrl || res.data.data.imageUrl;
        const type = res.data.data.mediaType || selectedTemplate.mediaType || 'video';

        setGeneratedResult({
          resultUrl: url,
          mediaType: type,
          templateId: selectedTemplate._id,
        });

        // Update credits with exact server-confirmed balance
        const cost = selectedTemplate.creditsRequired || 25;
        const serverRemaining = res.data.data?.remainingCredits;
        const setUserCredits = useAuthStore.getState().setUserCredits;
        if (serverRemaining !== undefined) {
          if (setUserCredits) setUserCredits(serverRemaining);
        } else if (user?.credits !== undefined) {
          const nextVal = Math.max(0, (user.credits || 0) - cost);
          if (setUserCredits) setUserCredits(nextVal);
          const updateUserProfile = useAuthStore.getState().updateUserProfile;
          if (updateUserProfile) updateUserProfile({ credits: nextVal });
        }

        addDownloadedCreation({
          id: `ai_${Date.now()}`,
          name: selectedTemplate.title || 'AI Trend Creation',
          localUri: url,
          image: url,
          createdAt: new Date().toISOString(),
          downloadedAt: new Date().toISOString(),
          activeTemplate: selectedTemplate,
        });

        hapticSuccess();
        showToast(t('video_ready_title') || 'Generation Complete!');
      } else {
        throw new Error(res.data?.message || 'Face swap failed');
      }
    } catch (err) {
      hapticError();
      if (prevCredits !== undefined) {
        useAuthStore.getState().setUserCredits(prevCredits);
      }
      if (err.response?.data?.code === 'INSUFFICIENT_CREDITS') {
        const needed = err.response.data.creditsRequired || selectedTemplate?.creditsRequired || 25;
        const avail = err.response.data.availableCredits ?? (user?.credits || 0);
        Alert.alert(
          t('insufficient_credits') || 'Insufficient Credits',
          t('not_enough_credits_msg', { needed, available: avail }) ||
            `You need ${needed} credits to generate this, but currently have ${avail}. Would you like to buy more?`,
          [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            { text: t('settings_buy_ai_credits') || 'Buy Credits', onPress: () => router.push('/buy-credits') },
          ]
        );
        return;
      }
      const msg = err.response?.data?.message || err.message || 'AI generation failed';
      Alert.alert('AI Notice', msg);
    } finally {
      setGenerating(false);
    }
  };

  // Download generated result to gallery
  const handleDownloadResult = async () => {
    if (!generatedResult?.resultUrl) return;
    try {
      setDownloading(true);
      hapticTap();
      const mediaUrl = resolveMediaUrl(generatedResult.resultUrl);
      const isVideo = generatedResult.mediaType === 'video';
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileUri = `${FileSystem.documentDirectory}starpix_ai_${Date.now()}.${ext}`;

      const downloaded = await FileSystem.downloadAsync(mediaUrl, fileUri);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.createAssetAsync(downloaded.uri);
        hapticSuccess();
        showToast(t('download_saved_msg') || 'Saved to gallery!');
      } else {
        showToast('Permission needed to save to gallery');
      }
    } catch (e) {
      console.warn('Download result error:', e);
      Alert.alert('Notice', 'Failed to save to gallery');
    } finally {
      setDownloading(false);
    }
  };

  // Share generated result
  const handleShareResult = async () => {
    if (!generatedResult?.resultUrl) return;
    try {
      setSharing(true);
      hapticTap();
      const mediaUrl = resolveMediaUrl(generatedResult.resultUrl);
      const isVideo = generatedResult.mediaType === 'video';
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;

      const downloaded = await FileSystem.downloadAsync(mediaUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      }
    } catch (e) {
      console.warn('Share result error:', e);
    } finally {
      setSharing(false);
    }
  };

  // Render category icons
  const renderCategoryIcon = (iconType, isSelected) => {
    const color = isSelected ? '#FFFFFF' : '#EE1D24';
    switch (iconType) {
      case 'star':
        return <Ionicons name="star" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'music':
        return <Ionicons name="musical-notes" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'radio':
        return <MaterialCommunityIcons name="radio" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'temple':
        return <MaterialCommunityIcons name="home-variant-outline" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'om':
        return <MaterialCommunityIcons name="om" size={fontScale(13)} color={color} style={styles.catIcon} />;
      case 'camera':
        return <Ionicons name="camera-outline" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'trending':
        return <Feather name="trending-up" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'heart':
        return <Ionicons name="heart-outline" size={fontScale(12)} color={color} style={styles.catIcon} />;
      case 'cake':
        return <MaterialCommunityIcons name="cake-variant-outline" size={fontScale(12)} color={color} style={styles.catIcon} />;
      default:
        return null;
    }
  };

  const isCurrentVideo = (selectedTemplate?.mediaType || 'video') === 'video';
  const requiredPhotosCount = selectedTemplate?.requiredPhotos || 1;

  // Filter templates list based on category and excluding currently selected template
  const isSpecialOrAll =
    activeCategory === "Today's Special" ||
    activeCategory === 'All' ||
    activeCategory === 'special' ||
    activeCategory === 'all';

  const displayTemplates = isSpecialOrAll
    ? templates
    : (templates.filter((t) => {
        const tCat = (t.category || '').toLowerCase().trim();
        const target = activeCategory.toLowerCase().trim();
        return (
          tCat === target ||
          tCat.replace(/[-_\s]/g, '') === target.replace(/[-_\s]/g, '')
        );
      }).length > 0
        ? templates.filter((t) => {
            const tCat = (t.category || '').toLowerCase().trim();
            const target = activeCategory.toLowerCase().trim();
            return (
              tCat === target ||
              tCat.replace(/[-_\s]/g, '') === target.replace(/[-_\s]/g, '')
            );
          })
        : templates);
  const otherTemplates = displayTemplates.filter((t) => t._id !== selectedTemplate?._id);

  const getSubscriptionLabel = () => {
    const isVip = checkHasActiveSubscription(user);
    if (!isVip) {
      return t('pro_badge') || 'PRO';
    }
    const plan = user.subscriptionPlan;
    if (plan === '7days') return '7D VIP';
    if (plan === '30days') return '30D VIP';
    if (plan === '1year' || plan === 'annual') return '1Y VIP';
    return t('vip') || 'VIP';
  };

  const formatDisplayTitle = (val) => {
    if (!val || typeof val !== 'string') return '';
    if (val.includes('_')) {
      const cleaned = val.replace(/_/g, ' ').trim();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return val;
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, hp(0.015)) }]}>
        <View style={styles.headerLeft}>
          <BackButton />

          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={fontScale(18)}
                color="#EE1D24"
                style={styles.titleStar}
              />
              <Text style={styles.titleText}>{t('ai_trends')}</Text>
            </View>
            <Text style={styles.subtitleText}>{t('ai_trends_subtitle')}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
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

          {/* Available Credits Pill Badge */}
          <PressableScale
            onPress={() => {
              hapticTap();
              router.push('/buy-credits');
            }}
            scaleTo={0.93}
            style={styles.headerCreditsPill}
            contentStyle={styles.headerCreditsContent}
          >
            <View style={styles.headerCreditsIconBox}>
              <MaterialCommunityIcons name="star-four-points" size={fontScale(11)} color="#FFFFFF" />
            </View>
            <Text style={styles.headerCreditsValue}>
              {user?.credits !== undefined ? user.credits : 240}
            </Text>
          </PressableScale>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, hp(0.03)) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EE1D24"
            colors={['#EE1D24']}
          />
        }
      >
        {/* Quick Action Bar: Buy More Credits & History */}
        <View style={styles.quickActionBar}>
          <TouchableOpacity
            onPress={() => router.push('/buy-credits')}
            style={styles.buyCreditsPill}
            activeOpacity={0.8}
          >
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>D</Text>
            </View>
            <Text style={styles.buyCreditsText}>{t('buy_more_credits')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/downloads', params: { from: 'ai-video' } })}
            style={styles.historyPill}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={fontScale(15)} color="#FFFFFF" />
            <Text style={styles.historyText}>{t('history')}</Text>
          </TouchableOpacity>
        </View>

        {/* Categories / Filter Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const catLabel =
              (cat.nameTranslations && cat.nameTranslations[i18n.language]) ||
              (cat.slug === 'special' || cat.id === "Today's Special"
                ? t('todays_special')
                : (cat.name || cat.id));

            return (
              <TouchableOpacity
                key={cat.id || cat.slug}
                onPress={() => handleSelectCategory(cat.id, cat.slug)}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                activeOpacity={0.8}
              >
                {cat.icon ? (
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                ) : (
                  renderCategoryIcon(cat.iconType, isSelected)
                )}
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {catLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero Featured Template Viewer or Skeleton */}
        <HeroTemplateCard
          loading={loadingTemplates}
          selectedTemplate={selectedTemplate}
          requiredPhotosCount={requiredPhotosCount}
          userFaces={userFaces}
          getSlotImageUri={getSlotImageUri}
          handlePickFaceImage={handlePickFaceImage}
          handleRemoveFace={handleRemoveFace}
          handleUploadCardPress={handleUploadCardPress}
          isCurrentVideo={isCurrentVideo}
          generatedResult={generatedResult}
          generating={generating}
          downloading={downloading}
          sharing={sharing}
          handleDownloadResult={handleDownloadResult}
          handleShareResult={handleShareResult}
          handleTriggerCreate={handleTriggerCreate}
          t={t}
        />

        {/* Next Items / Feed List */}
        <View style={styles.feedSection}>
          {loadingTemplates ? (
            [1, 2, 3].map((itemKey) => (
              <View key={`skel-feed-${itemKey}`} style={styles.feedCard}>
                <Skeleton width={wp(0.24)} height={wp(0.24)} borderRadius={wp(0.025)} />
                <View style={[styles.feedDetails, { justifyContent: 'center', gap: 8 }]}>
                  <Skeleton width="75%" height={16} borderRadius={4} />
                  <Skeleton width="45%" height={12} borderRadius={3} />
                  <Skeleton width={wp(0.28)} height={hp(0.035)} borderRadius={wp(0.02)} style={{ marginTop: 4 }} />
                </View>
              </View>
            ))
          ) : (
            otherTemplates.map((tmpl) => {
              const isTmplVideo = tmpl.mediaType === 'video';
              const hasImageThumb = Boolean(
                tmpl.thumbnailUrl &&
                !tmpl.thumbnailUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)
              );
              const imgUri = resolveMediaUrl(
                hasImageThumb ? tmpl.thumbnailUrl : (tmpl.mediaType === 'image' ? tmpl.videoUrl : '')
              );

            return (
              <TouchableOpacity
                key={tmpl._id}
                style={styles.feedCard}
                onPress={() => handleSelectTemplate(tmpl)}
                activeOpacity={0.88}
              >
                {/* Left Thumbnail */}
                <View style={styles.feedThumbWrap}>
                  {isTmplVideo && !hasImageThumb ? (
                    <AppVideo
                      source={{ uri: resolveMediaUrl(tmpl.videoUrl) }}
                      style={styles.feedThumbImg}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isLooping={false}
                      isMuted={true}
                    />
                  ) : (
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.feedThumbImg}
                      resizeMode="cover"
                    />
                  )}
                  {isTmplVideo && (
                    <View style={styles.feedPlayIcon}>
                      <Ionicons name="play" size={fontScale(14)} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Right Details */}
                <View style={styles.feedDetails}>
                  <View style={styles.feedTitleRow}>
                    <Text style={styles.feedTitleText} numberOfLines={1}>
                      {formatDisplayTitle(tmpl.title)}
                    </Text>
                    <View style={styles.feedMediaBadge}>
                      <Ionicons
                        name={isTmplVideo ? 'videocam' : 'image'}
                        size={fontScale(10)}
                        color="#EE1D24"
                        style={{ marginRight: 2 }}
                      />
                      <Text style={styles.feedMediaBadgeText}>
                        {isTmplVideo ? 'Video' : 'Image'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.feedCreditText}>
                    {t('required_credit', { credit: tmpl.creditsRequired || 25 })}
                  </Text>

                  {/* Dynamic mini CTA button: Create Image or Create Video */}
                  <TouchableOpacity
                    style={styles.feedMiniButton}
                    onPress={() => handleSelectTemplate(tmpl)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="star-four-points"
                      size={fontScale(12)}
                      color="#EE1D24"
                      style={{ marginRight: wp(0.01) }}
                    />
                    <Text style={styles.feedMiniButtonText}>
                      {isTmplVideo ? t('create_video') : t('create_image')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        </View>
      </ScrollView>

      {/* Confirm Generation Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        title={selectedTemplate ? `✦ ${formatDisplayTitle(selectedTemplate.title)}` : t('ai_trends')}
        message={t('confirm_use_credits', {
          count: selectedTemplate?.creditsRequired || 25,
          type: isCurrentVideo ? t('media_video') : t('media_image'),
        }) || `Use ${selectedTemplate?.creditsRequired || 25} credits to generate this?`}
        confirmText={isCurrentVideo ? t('create_video') : t('create_image')}
        cancelText={t('cancel')}
        icon="sparkles"
        iconColor="#EE1D24"
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={handleConfirmGeneration}
      />

      <Toast message={toastMessage} toastKey={toastKey} />
    </View>
  );
}


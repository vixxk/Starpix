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

import { fontScale, wp, hp, SCREEN_PAD } from '../src/utils/responsive';
import { hapticTap, hapticSuccess, hapticError } from '../src/utils/haptics';
import API from '../src/utils/api';
import { resolveMediaUrl } from '../src/utils/media';
import { uploadUserMedia } from '../src/utils/upload';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreationStore } from '../src/store/useCreationStore';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
];

const CATEGORIES = [
  { id: "Today's Special", iconType: 'star' },
  { id: 'Dance Video', iconType: 'music' },
  { id: "Retro 80's", iconType: 'radio' },
  { id: "Bappa in 80's", iconType: 'temple' },
  { id: 'Ganesh Chaturthi', iconType: 'temple' },
  { id: 'Devotional', iconType: 'om' },
  { id: 'Photography Video', iconType: 'camera' },
  { id: 'Motivation', iconType: 'trending' },
  { id: 'Love', iconType: 'heart' },
  { id: 'Birthday', iconType: 'cake' },
];

// Fallback high-resolution template definitions matching the screenshot
const FALLBACK_TEMPLATES = [
  {
    _id: 'couple_ride_01',
    title: 'Vintage Indian Couple Ride',
    category: "Retro 80's",
    mediaType: 'video',
    requiredPhotos: 2,
    creditsRequired: 100,
    durationSeconds: 15,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/8a02f588-c7e8-4e48-8fe4-9d878d881783.jpg',
    ],
  },
  {
    _id: 'retro_six_frames_02',
    title: 'Retro Six Frames',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    creditsRequired: 25,
    durationSeconds: 0,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
  },
  {
    _id: 'bollywood_portrait_03',
    title: '1980s Bollywood Portrait',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    creditsRequired: 30,
    durationSeconds: 0,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
  },
];

export default function AITrendsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const addDownloadedCreation = useCreationStore((state) => state.addDownloadedCreation);

  const [templates, setTemplates] = useState([]);
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
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

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
    await fetchTemplates();
    setRefreshing(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  // Switch active template
  const handleSelectTemplate = (tmpl) => {
    hapticTap();
    setSelectedTemplate(tmpl);
    setGeneratedResult(null);
  };

  // Image Picker for face slots
  const handlePickFaceImage = async (slotIndex = 0) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('photo_access_required'), t('gallery_permission_required'));
        return;
      }

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const updated = [...userFaces];
        updated[slotIndex] = pickedUri;
        setUserFaces(updated);
        hapticTap();
      }
    } catch (err) {
      console.log('Error picking face image:', err?.message);
    }
  };

  const handleRemoveFace = (slotIndex) => {
    hapticTap();
    const updated = [...userFaces];
    updated[slotIndex] = null;
    setUserFaces(updated);
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

  // Trigger Generation
  const handleTriggerCreate = () => {
    if (!selectedTemplate) return;
    hapticTap();
    setConfirmModalVisible(true);
  };

  const handleConfirmGeneration = async () => {
    setConfirmModalVisible(false);
    if (!selectedTemplate) return;

    try {
      setGenerating(true);
      showToast(t('ai_generation_started') || 'AI Generation Started');

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
      const msg = err.response?.data?.message || err.message || 'AI generation failed';
      Alert.alert('AI Notice', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code);
    setShowLanguageModal(false);
    hapticTap();
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

  // Filter templates list excluding the currently selected template
  const otherTemplates = templates.filter((t) => t._id !== selectedTemplate?._id);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, hp(0.015)) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={fontScale(22)} color="#111827" />
          </TouchableOpacity>

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
          {/* Language Switcher */}
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={styles.langBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.langIconText}>文A</Text>
          </TouchableOpacity>

          {/* PRO Badge */}
          <TouchableOpacity
            onPress={() => router.push('/vip')}
            style={styles.proBadge}
            activeOpacity={0.8}
          >
            <Text style={styles.proCrown}>👑</Text>
            <Text style={styles.proText}>PRO</Text>
          </TouchableOpacity>

          {/* More options menu */}
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.moreBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={fontScale(18)} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
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
            onPress={() => router.push('/(tabs)/downloads')}
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
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  hapticTap();
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                activeOpacity={0.8}
              >
                {renderCategoryIcon(cat.iconType, isSelected)}
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat.id}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => hapticTap()}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryTextMore}>More</Text>
            <Ionicons name="chevron-down" size={fontScale(12)} color="#EE1D24" />
          </TouchableOpacity>
        </ScrollView>

        {/* Hero Featured Template Viewer */}
        {selectedTemplate ? (
          <View style={styles.heroCard}>
            {/* Top Before & Upload Cards Row */}
            <View style={styles.beforeRow}>
              {/* Before Slot Card */}
              <View style={styles.beforeContainer}>
                <View style={styles.beforeBadge}>
                  <Text style={styles.beforeBadgeText}>{t('before')}</Text>
                </View>

                {/* Multiple / Single Face Photos */}
                <View style={styles.beforePhotosRow}>
                  {Array.from({ length: requiredPhotosCount }).map((_, idx) => {
                    const uri = getSlotImageUri(selectedTemplate, idx);
                    return (
                      <View key={idx} style={styles.beforePhotoWrap}>
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={styles.beforePhotoImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.emptyBeforePhoto}>
                            <Ionicons name="person" size={fontScale(24)} color="#9CA3AF" />
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.removeFaceBtn}
                          onPress={() => handleRemoveFace(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={fontScale(11)} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Curved Arrow pointer pointing downward */}
                <View style={styles.curvedArrowWrap}>
                  <Svg width={wp(0.06)} height={hp(0.035)} viewBox="0 0 24 24">
                    <Path
                      d="M 4 2 Q 4 16 16 16 L 16 19 L 21 14 L 16 9 L 16 12 Q 7 12 7 2 Z"
                      fill="#EE1D24"
                    />
                  </Svg>
                </View>
              </View>

              {/* Upload Your Photo(s) Card */}
              <TouchableOpacity
                style={styles.uploadCard}
                onPress={() => handlePickFaceImage(0)}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIconBadge}>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={fontScale(22)}
                    color="#EE1D24"
                  />
                </View>
                <Text style={styles.uploadTitle} numberOfLines={1}>
                  {requiredPhotosCount > 1 ? t('upload_your_photos') : t('upload_your_photo')}
                </Text>
                <Text style={styles.uploadSubtitle} numberOfLines={1}>
                  {requiredPhotosCount > 1 ? t('add_1_or_2_photos') : t('add_1_photo')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* After Result / Preview Media Card */}
            <View style={styles.afterCard}>
              <View style={styles.afterTopRow}>
                <View style={styles.afterBadge}>
                  <Text style={styles.afterBadgeText}>{t('after')}</Text>
                </View>

                <View style={styles.mediaTypeBadge}>
                  <Ionicons
                    name={isCurrentVideo ? 'videocam' : 'image'}
                    size={fontScale(12)}
                    color="#EE1D24"
                    style={{ marginRight: wp(0.01) }}
                  />
                  <Text style={styles.mediaTypeBadgeText}>
                    {isCurrentVideo ? 'Video' : 'Image'}
                  </Text>
                </View>
              </View>

              {/* Main Media Preview */}
              <View style={styles.mediaContainer}>
                {generatedResult?.resultUrl ? (
                  isCurrentVideo ? (
                    <AppVideo
                      source={{ uri: resolveMediaUrl(generatedResult.resultUrl) }}
                      style={styles.mainMedia}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                    />
                  ) : (
                    <Image
                      source={{ uri: resolveMediaUrl(generatedResult.resultUrl) }}
                      style={styles.mainMedia}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View style={styles.mediaPreviewWrap}>
                    <Image
                      source={{
                        uri: resolveMediaUrl(
                          selectedTemplate.videoUrl || selectedTemplate.thumbnailUrl
                        ),
                      }}
                      style={styles.mainMedia}
                      resizeMode="cover"
                    />
                    {isCurrentVideo && (
                      <View style={styles.playButtonOverlay}>
                        <View style={styles.playButtonCircle}>
                          <Ionicons
                            name="play"
                            size={fontScale(24)}
                            color="#FFFFFF"
                            style={{ marginLeft: wp(0.01) }}
                          />
                        </View>
                      </View>
                    )}
                    {isCurrentVideo && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {`00:${selectedTemplate.durationSeconds || 15}`}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {generating && (
                  <View style={styles.generatingOverlay}>
                    <ActivityIndicator size="large" color="#EE1D24" />
                    <Text style={styles.generatingText}>Generating AI Magic...</Text>
                  </View>
                )}
              </View>

              {/* Info Row: Title & Credits */}
              <View style={styles.cardInfoRow}>
                <Text style={styles.templateTitle} numberOfLines={1}>
                  {selectedTemplate.title}
                </Text>

                <View style={styles.templateDetailsRight}>
                  <View style={styles.uploadCountRow}>
                    <Ionicons
                      name={requiredPhotosCount > 1 ? 'people' : 'person'}
                      size={fontScale(12)}
                      color="#EE1D24"
                      style={{ marginRight: wp(0.01) }}
                    />
                    <Text style={styles.uploadCountText}>
                      {requiredPhotosCount > 1
                        ? t('upload_2_photos')
                        : t('upload_1_photo')}
                    </Text>
                  </View>
                  <Text style={styles.creditText}>
                    {t('required_credit', { credit: selectedTemplate.creditsRequired || 25 })}
                  </Text>
                </View>
              </View>

              {/* Dynamic Action Button: Create Image or Create Video based on content */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleTriggerCreate}
                disabled={generating}
                activeOpacity={0.88}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={fontScale(16)}
                  color="#FFFFFF"
                  style={{ marginRight: wp(0.015) }}
                />
                <Text style={styles.createButtonText}>
                  {isCurrentVideo ? t('create_video') : t('create_image')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Next Items / Feed List */}
        <View style={styles.feedSection}>
          {otherTemplates.map((tmpl) => {
            const isTmplVideo = tmpl.mediaType === 'video';
            const imgUri = resolveMediaUrl(tmpl.thumbnailUrl || tmpl.videoUrl);

            return (
              <TouchableOpacity
                key={tmpl._id}
                style={styles.feedCard}
                onPress={() => handleSelectTemplate(tmpl)}
                activeOpacity={0.88}
              >
                {/* Left Thumbnail */}
                <View style={styles.feedThumbWrap}>
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.feedThumbImg}
                    resizeMode="cover"
                  />
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
                      {tmpl.title}
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
          })}
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.langModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.langModalCard}>
            <View style={styles.langModalHeader}>
              <Text style={styles.langModalTitle}>{t('settings_preferred_language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={fontScale(20)} color="#111827" />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langItem,
                    isSelected && styles.langItemSelected,
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
                    {lang.native} ({lang.name})
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={fontScale(18)} color="#EE1D24" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Generation Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        title={selectedTemplate ? `✦ ${selectedTemplate.title}` : t('ai_trends')}
        message={`Use ${selectedTemplate?.creditsRequired || 25} credits to generate your personalized AI ${isCurrentVideo ? 'video' : 'image'}?`}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: wp(0.09),
    height: wp(0.09),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleWrap: {
    marginLeft: wp(0.01),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleStar: {
    marginRight: wp(0.01),
  },
  titleText: {
    fontSize: fontScale(19),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: fontScale(9.8),
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: -hp(0.002),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.025),
  },
  langBtn: {
    width: wp(0.08),
    height: wp(0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  langIconText: {
    fontSize: fontScale(15),
    fontWeight: '700',
    color: '#EE1D24',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE047',
    paddingHorizontal: wp(0.022),
    paddingVertical: hp(0.005),
    borderRadius: wp(0.015),
    gap: wp(0.01),
  },
  proCrown: {
    fontSize: fontScale(11),
  },
  proText: {
    fontSize: fontScale(11),
    fontWeight: '900',
    color: '#111827',
  },
  moreBtn: {
    width: wp(0.08),
    height: wp(0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: wp(0.04),
    paddingTop: hp(0.01),
  },

  /* Quick Action Bar */
  quickActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(0.03),
    marginVertical: hp(0.01),
  },
  buyCreditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: wp(0.035),
    paddingVertical: hp(0.008),
    borderRadius: wp(0.05),
    gap: wp(0.015),
  },
  coinBadge: {
    width: wp(0.045),
    height: wp(0.045),
    borderRadius: wp(0.0225),
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    color: '#FFFFFF',
    fontSize: fontScale(9.5),
    fontWeight: '900',
  },
  buyCreditsText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#D97706',
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE1D24',
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.008),
    borderRadius: wp(0.05),
    gap: wp(0.015),
  },
  historyText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Categories Chips */
  categoriesScroll: {
    paddingVertical: hp(0.006),
    gap: wp(0.018),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(0.03),
    paddingVertical: hp(0.007),
    borderRadius: wp(0.05),
  },
  categoryChipSelected: {
    backgroundColor: '#EE1D24',
    borderColor: '#EE1D24',
  },
  catIcon: {
    marginRight: wp(0.012),
  },
  categoryText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#374151',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  categoryTextMore: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#EE1D24',
    marginRight: 2,
  },

  /* Hero Featured Template Viewer */
  heroCard: {
    marginTop: hp(0.012),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.04),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: wp(0.03),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: wp(0.02),
    elevation: 3,
  },

  /* Before Row */
  beforeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: wp(0.03),
    marginBottom: hp(0.015),
    position: 'relative',
  },
  beforeContainer: {
    flex: 1.15,
    backgroundColor: '#F9FAFB',
    borderRadius: wp(0.03),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: wp(0.02),
    position: 'relative',
    minHeight: hp(0.13),
  },
  beforeBadge: {
    position: 'absolute',
    top: hp(0.006),
    left: wp(0.018),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: wp(0.018),
    paddingVertical: hp(0.002),
    borderRadius: wp(0.015),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 5,
  },
  beforeBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#111827',
  },
  beforePhotosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(0.02),
    marginTop: hp(0.018),
  },
  beforePhotoWrap: {
    width: wp(0.18),
    height: wp(0.18),
    borderRadius: wp(0.02),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  beforePhotoImg: {
    width: '100%',
    height: '100%',
  },
  emptyBeforePhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFaceBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: wp(0.045),
    height: wp(0.045),
    borderRadius: wp(0.0225),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  curvedArrowWrap: {
    position: 'absolute',
    bottom: -hp(0.02),
    right: wp(0.04),
    zIndex: 10,
  },

  /* Upload Card */
  uploadCard: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#EE1D24',
    borderRadius: wp(0.03),
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.025),
  },
  uploadIconBadge: {
    marginBottom: hp(0.004),
  },
  uploadTitle: {
    fontSize: fontScale(11.5),
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: fontScale(9.5),
    color: '#6B7280',
    marginTop: hp(0.002),
    textAlign: 'center',
  },

  /* After Card */
  afterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.03),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    padding: wp(0.025),
  },
  afterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.008),
  },
  afterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: wp(0.02),
    paddingVertical: hp(0.003),
    borderRadius: wp(0.015),
  },
  afterBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#111827',
  },
  mediaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: wp(0.02),
    paddingVertical: hp(0.003),
    borderRadius: wp(0.015),
  },
  mediaTypeBadgeText: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#EE1D24',
  },

  /* Main Media */
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: wp(0.025),
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  mediaPreviewWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mainMedia: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: wp(0.13),
    height: wp(0.13),
    borderRadius: wp(0.065),
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: hp(0.01),
    right: wp(0.02),
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: wp(0.018),
    paddingVertical: hp(0.002),
    borderRadius: wp(0.01),
  },
  durationText: {
    fontSize: fontScale(9),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#EE1D24',
    marginTop: hp(0.01),
  },

  /* Card Info Row */
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.01),
  },
  templateTitle: {
    fontSize: fontScale(14),
    fontWeight: '900',
    color: '#111827',
    flex: 1,
    letterSpacing: -0.3,
  },
  templateDetailsRight: {
    alignItems: 'flex-end',
  },
  uploadCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadCountText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#EE1D24',
  },
  creditText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#D97706',
    marginTop: hp(0.002),
  },

  /* Big Red CTA Button */
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EE1D24',
    borderRadius: wp(0.06),
    paddingVertical: hp(0.016),
    marginTop: hp(0.014),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: hp(0.004) },
    shadowOpacity: 0.35,
    shadowRadius: wp(0.02),
    elevation: 4,
  },
  createButtonText: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Feed Section */
  feedSection: {
    marginTop: hp(0.015),
    gap: hp(0.012),
  },
  feedCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.03),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: wp(0.025),
    alignItems: 'center',
    gap: wp(0.03),
  },
  feedThumbWrap: {
    width: wp(0.24),
    height: wp(0.24),
    borderRadius: wp(0.025),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  feedThumbImg: {
    width: '100%',
    height: '100%',
  },
  feedPlayIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  feedDetails: {
    flex: 1,
    justifyContent: 'space-between',
    height: wp(0.24),
    paddingVertical: hp(0.002),
  },
  feedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedTitleText: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: wp(0.01),
  },
  feedMediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: wp(0.015),
    paddingVertical: hp(0.002),
    borderRadius: wp(0.01),
  },
  feedMediaBadgeText: {
    fontSize: fontScale(8.5),
    fontWeight: '700',
    color: '#EE1D24',
  },
  feedCreditText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#D97706',
  },
  feedMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: wp(0.04),
    paddingVertical: hp(0.008),
    paddingHorizontal: wp(0.03),
    alignSelf: 'flex-start',
  },
  feedMiniButtonText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#EE1D24',
  },

  /* Language Modal */
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.05),
  },
  langModalCard: {
    width: '100%',
    maxHeight: hp(0.7),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(0.04),
    padding: wp(0.04),
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.015),
    paddingBottom: hp(0.01),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  langModalTitle: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#111827',
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.012),
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  langItemSelected: {
    backgroundColor: '#FEF2F2',
    borderRadius: wp(0.02),
    paddingHorizontal: wp(0.02),
  },
  langText: {
    fontSize: fontScale(13),
    color: '#374151',
    fontWeight: '500',
  },
  langTextSelected: {
    color: '#EE1D24',
    fontWeight: '700',
  },
});

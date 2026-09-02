import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  Linking,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocalizedName } from '../src/utils/localized';

import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import FadeInView from '../src/components/FadeInView';
import Toast from '../src/components/Toast';
import Skeleton from '../src/components/Skeleton';

import { COLORS, FONTS } from '../src/constants/colors';
import { wp, hp, fontScale, SCREEN_PAD, GRID_GAP, CARD_WIDTH, CARD_HEIGHT } from '../src/utils/responsive';
import { hapticTap, hapticSuccess, hapticError } from '../src/utils/haptics';
import API from '../src/utils/api';
import { resolveMediaUrl } from '../src/utils/media';
import { uploadUserMedia } from '../src/utils/upload';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreationStore } from '../src/store/useCreationStore';

function SkeletonLoadingCard({ sub, t }) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonMedia, { opacity: pulseAnim }]}>
        <View style={styles.skeletonIconBadgeWrapper}>
          <ActivityIndicator
            size="large"
            color={COLORS.orange}
            style={styles.skeletonActivityOverlay}
          />
          <View style={styles.skeletonIconBadge}>
            <Ionicons name="sparkles" size={fontScale(20)} color={COLORS.orange} />
          </View>
        </View>
        <Text style={styles.skeletonMediaText}>{t('generating_content_title')}</Text>
      </Animated.View>

      <View style={styles.skeletonTextBanner}>
        <Text style={styles.skeletonSub}>{sub}</Text>
      </View>
    </View>
  );
}

function AISkeletonFeed() {
  return (
    <View style={styles.skeletonFeedContainer}>
      <View style={styles.skeletonChipsRow}>
        <Skeleton width={85} height={34} borderRadius={17} />
        <Skeleton width={85} height={34} borderRadius={17} />
        <Skeleton width={85} height={34} borderRadius={17} />
      </View>
      {[1, 2].map((key) => (
        <View key={key} style={styles.templateFeedCard}>
          <View style={[styles.cardFrame, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
            <Skeleton width="100%" height="100%" borderRadius={wp(0.04)} />
          </View>
          <View style={styles.actionRow}>
            <Skeleton width="48%" height={46} borderRadius={12} />
            <Skeleton width="48%" height={46} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AIVideoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // State management
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState('all');

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [isProfileSelected, setIsProfileSelected] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null); // { resultUrl, mediaType }
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState({});

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  const user = useAuthStore((state) => state.user);
  const addDownloadedCreation = useCreationStore((state) => state.addDownloadedCreation);

  const scrollViewRef = useRef(null);
  const templateYPositions = useRef({});

  // Sync profile photo from auth store
  useEffect(() => {
    const photo = user?.profilePhoto || user?.avatar;
    if (photo) {
      const resolved = resolveMediaUrl(photo);
      setProfilePhoto(resolved);
      setFaceImage((prev) => prev || resolved);
      setIsProfileSelected(true);
    }
  }, [user]);

  // Fetch AI templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingTemplates(true);
      const res = await API.get('/ai-video/templates');
      if (res.data && res.data.success) {
        const fetched = res.data.data || [];
        setTemplates(fetched);
        if (fetched.length > 0 && !selectedTemplate) {
          setSelectedTemplate(fetched[0]);
        }
      }
    } catch (err) {
      console.log('Error fetching AI templates:', err?.message);
    } finally {
      if (showLoading) setLoadingTemplates(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      hapticTap();
      await fetchTemplates(false);
    } catch (err) {
      console.log('Error refreshing AI swap screen:', err?.message);
    } finally {
      setRefreshing(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const filteredTemplates = React.useMemo(() => {
    if (activeMediaType === 'all') return templates;
    return templates.filter((t) => (t.mediaType || 'video') === activeMediaType);
  }, [templates, activeMediaType]);

  // Image selection handlers
  const handlePickFromGallery = async () => {
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFaceImage(result.assets[0].uri);
        setIsProfileSelected(false);
        hapticTap();
      }
    } catch (err) {
      console.log('Error picking face image:', err?.message);
    }
  };

  const handleSelectProfilePhoto = () => {
    if (profilePhoto) {
      setFaceImage(profilePhoto);
      setIsProfileSelected(true);
      hapticTap();
    }
  };

  // Trigger AI Face Swap via Backend Proxy for a target template
  const handleGenerateForTemplate = async (tmpl) => {
    const targetTemplate = tmpl || selectedTemplate;
    if (!targetTemplate) {
      hapticError();
      showToast(t('select_template_first'));
      return;
    }

    // Prioritize user profile photo from user auth store for face swap
    const userPhoto = user?.profilePhoto || user?.avatar;
    const faceToUse = userPhoto ? resolveMediaUrl(userPhoto) : faceImage;

    if (!faceToUse) {
      hapticError();
      showToast(t('select_face_first'));
      Alert.alert(
        'Profile Photo Required',
        'Please upload your profile photo first in profile settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: t('edit_details'), onPress: () => router.push('/edit-profile') }
        ]
      );
      return;
    }

    try {
      hapticTap();
      setGenerating(true);
      setGeneratedResult(null);
      showToast(t('ai_generation_started'));

      // Auto-scroll down to the loading indicator element under the template card
      const targetY = templateYPositions.current[targetTemplate._id];
      if (targetY !== undefined && scrollViewRef.current) {
        const cardFrameHeight = wp(0.89) * (16 / 9);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: targetY + cardFrameHeight - 60,
            animated: true,
          });
        }, 120);
      }

      let finalFaceUrl = faceToUse;
      if (
        faceToUse &&
        (faceToUse.startsWith('file://') ||
          faceToUse.startsWith('content://') ||
          faceToUse.startsWith('ph://') ||
          faceToUse.startsWith('data:image/'))
      ) {
        try {
          const uploadedUrl = await uploadUserMedia(faceToUse, 'ai-faces');
          if (uploadedUrl) {
            finalFaceUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.error('Error uploading face image to S3:', uploadErr);
        }
      }

      const res = await API.post(
        '/ai-video/generate',
        {
          templateId: targetTemplate._id,
          targetVideoUrl: targetTemplate.videoUrl,
          targetImageUrl: targetTemplate.thumbnailUrl || targetTemplate.sampleSourceImageUrl || targetTemplate.videoUrl,
          userImageUrl: finalFaceUrl,
          mediaType: targetTemplate.mediaType || 'video',
          prompt: targetTemplate.prompt,
        },
        {
          timeout: 900000, // 15 minutes extended timeout to support longer video generations
        }
      );

      if (res.data && res.data.success && res.data.data) {
        const url = res.data.data.resultUrl || res.data.data.videoUrl || res.data.data.imageUrl;
        const type = res.data.data.mediaType || targetTemplate.mediaType || 'video';
        const creationId = res.data.data.creationId;

        setGeneratedResult({ resultUrl: url, mediaType: type, templateId: targetTemplate._id });

        // Save AI creation to local Zustand store so it immediately appears on the Downloads page
        addDownloadedCreation({
          id: creationId || `ai_${Date.now()}`,
          _id: creationId || `ai_${Date.now()}`,
          name: getLocalizedName(targetTemplate, i18n.language) || targetTemplate.title || 'AI Face Swap',
          localUri: url,
          image: url,
          createdAt: new Date().toISOString(),
          downloadedAt: new Date().toISOString(),
          activeTemplate: targetTemplate,
          aiTemplate: targetTemplate,
          aiTemplateId: targetTemplate._id,
        });

        // Scroll down to the finished AI content result card
        const targetY = templateYPositions.current[targetTemplate._id];
        if (targetY !== undefined && scrollViewRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: targetY + 450,
              animated: true,
            });
          }, 250);
        }

        hapticSuccess();
        showToast(t('video_ready_title'));
      } else {
        throw new Error(res.data?.message || 'Face swap failed');
      }
    } catch (err) {
      hapticError();
      const msg = err.response?.data?.message || err.message || 'AI Face swap failed';
      Alert.alert('AI Swap Notice', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMedia = () => handleGenerateForTemplate(selectedTemplate);

  // Download video/image to device gallery
  const handleDownloadMedia = async () => {
    if (!generatedResult?.resultUrl) return;

    try {
      setDownloading(true);
      hapticTap();

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('photo_access_required'), t('gallery_permission_required'));
        setDownloading(false);
        return;
      }

      const isImage = generatedResult.mediaType === 'image';
      const ext = isImage ? 'jpg' : 'mp4';
      const filename = `starpix_ai_swap_${Date.now()}.${ext}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadRes = await FileSystem.downloadAsync(generatedResult.resultUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);

      hapticSuccess();
      showToast(t('video_saved_msg'));
    } catch (err) {
      console.log('Error downloading media:', err?.message);
      Alert.alert('Download Error', 'Could not save asset to gallery.');
    } finally {
      setDownloading(false);
    }
  };

  // Dedicated Share to WhatsApp button handler
  const handleShareWhatsApp = async () => {
    if (!generatedResult?.resultUrl) return;

    try {
      hapticTap();
      const isImage = generatedResult.mediaType === 'image';
      const ext = isImage ? 'jpg' : 'mp4';
      const mime = isImage ? 'image/jpeg' : 'video/mp4';
      const filename = `starpix_ai_whatsapp_${Date.now()}.${ext}`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadRes = await FileSystem.downloadAsync(generatedResult.resultUrl, fileUri);
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: mime,
          dialogTitle: t('share_to_whatsapp'),
          UTI: isImage ? 'public.jpeg' : 'com.apple.quicktime-movie',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (err) {
      console.log('Error sharing AI asset to WhatsApp:', err?.message);
    }
  };

  // Dedicated Normal System Share button handler
  const handleShareSystem = async () => {
    if (!generatedResult?.resultUrl) return;

    try {
      hapticTap();
      const isImage = generatedResult.mediaType === 'image';
      const ext = isImage ? 'jpg' : 'mp4';
      const mime = isImage ? 'image/jpeg' : 'video/mp4';
      const filename = `starpix_ai_share_${Date.now()}.${ext}`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadRes = await FileSystem.downloadAsync(generatedResult.resultUrl, fileUri);
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: mime,
          dialogTitle: t('share'),
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (err) {
      console.log('Error sharing AI asset via system share:', err?.message);
    }
  };

  return (
    <AppBackground>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <PressableScale
            onPress={() => {
              hapticTap();
              router.back();
            }}
            scaleTo={0.9}
            haptic="light"
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={fontScale(20)} color={COLORS.ink} />
          </PressableScale>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.orange}
              colors={[COLORS.orange]}
            />
          }
        >
          {loadingTemplates ? (
            <AISkeletonFeed />
          ) : templates.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No AI templates available.</Text>
            </View>
          ) : (
            <View style={styles.templatesContainer}>
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?._id === tmpl._id;
                const isImage = tmpl.mediaType === 'image';
                const price = tmpl.creditsRequired || 0;

                const isResultForThisTemplate = generatedResult?.templateId === tmpl._id || (isSelected && generatedResult?.resultUrl);
                const isGeneratingForThisTemplate = generating && isSelected;

                const isResultVideo = generatedResult?.resultUrl ? (
                  generatedResult.resultUrl.toLowerCase().includes('.mp4') ||
                  generatedResult.resultUrl.toLowerCase().includes('.webm') ||
                  generatedResult.resultUrl.toLowerCase().includes('.mov')
                ) : false;

                return (
                  <View
                    key={tmpl._id}
                    style={styles.templateFeedCard}
                    onLayout={(e) => {
                      const y = e.nativeEvent.layout.y;
                      templateYPositions.current[tmpl._id] = y;
                    }}
                  >
                    {/* Template Media Frame with Live Video Preview & Shimmer Skeleton Loading */}
                    <View style={styles.cardFrame}>
                      {!mediaLoaded[tmpl._id] && (
                        <Skeleton
                          width="100%"
                          height="100%"
                          borderRadius={0}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}
                      {!isImage ? (
                        <Video
                          source={{ uri: resolveMediaUrl(tmpl.videoUrl) }}
                          style={styles.cardMedia}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay
                          isLooping
                          isMuted
                          onLoad={() => setMediaLoaded((prev) => ({ ...prev, [tmpl._id]: true }))}
                          onReadyForDisplay={() => setMediaLoaded((prev) => ({ ...prev, [tmpl._id]: true }))}
                        />
                      ) : (
                        <Image
                          source={{ uri: resolveMediaUrl(tmpl.videoUrl || tmpl.thumbnailUrl) }}
                          style={styles.cardMedia}
                          resizeMode="cover"
                          onLoadEnd={() => setMediaLoaded((prev) => ({ ...prev, [tmpl._id]: true }))}
                        />
                      )}
                    </View>

                    {/* Action Buttons Row directly under template card */}
                    <View style={styles.actionRow}>
                      <PressableScale
                        onPress={() => {
                          hapticTap();
                          router.push('/edit-profile');
                        }}
                        scaleTo={0.95}
                        style={styles.editBtn}
                        contentStyle={styles.btnContent}
                      >
                        <Ionicons name="create-outline" size={fontScale(14)} color={COLORS.ink} />
                        <Text
                          style={styles.editBtnText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.65}
                        >
                          {t('edit_details')}
                        </Text>
                      </PressableScale>

                      <PressableScale
                        onPress={() => {
                          hapticTap();
                          setSelectedTemplate(tmpl);
                          setPendingTemplate(tmpl);
                          setConfirmModalVisible(true);
                        }}
                        scaleTo={0.95}
                        style={styles.tryBtn}
                        contentStyle={styles.btnContent}
                      >
                        <Ionicons name="sparkles" size={fontScale(15)} color={COLORS.white} />
                        <Text
                          style={styles.tryBtnText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.65}
                        >
                          {t('try_price', { price })}
                        </Text>
                      </PressableScale>
                    </View>

                    {/* Skeleton Loading Indicator for Selected Template */}
                    {isGeneratingForThisTemplate && (
                      <SkeletonLoadingCard
                        sub={t('generating_content_sub')}
                        t={t}
                      />
                    )}

                    {/* Result Player Section directly attached to Selected Template */}
                    {isResultForThisTemplate && generatedResult?.resultUrl && (
                      <FadeInView delay={100} style={styles.resultCard}>
                        <Text style={styles.resultTitle}>{t('video_ready_title')}</Text>

                        {isResultVideo ? (
                          <Video
                            source={{ uri: generatedResult.resultUrl }}
                            style={styles.videoPlayer}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            shouldPlay
                          />
                        ) : (
                          <Image
                            source={{ uri: generatedResult.resultUrl }}
                            style={styles.imagePlayer}
                            resizeMode="cover"
                          />
                        )}

                        <View style={styles.resultActionBtns}>
                          <PressableScale
                            onPress={handleDownloadMedia}
                            disabled={downloading}
                            scaleTo={0.95}
                            style={styles.downloadBtn}
                            contentStyle={styles.resultBtnContent}
                          >
                            {downloading ? (
                              <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                              <>
                                <Ionicons name="download-outline" size={fontScale(15)} color={COLORS.white} />
                                <Text
                                  style={styles.actionBtnText}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.75}
                                >
                                  {t('download_video')}
                                </Text>
                              </>
                            )}
                          </PressableScale>

                          <PressableScale
                            onPress={handleShareSystem}
                            scaleTo={0.95}
                            style={styles.shareBtn}
                            contentStyle={styles.resultBtnContent}
                          >
                            <Ionicons name="share-social-outline" size={fontScale(15)} color={COLORS.ink} />
                            <Text
                              style={[styles.actionBtnText, { color: COLORS.ink }]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.75}
                            >
                              {t('share')}
                            </Text>
                          </PressableScale>
                        </View>
                      </FadeInView>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />

        {/* Face Verification Modal Popup */}
        <Modal
          visible={confirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalFaceAvatarRing}>
                {profilePhoto || faceImage ? (
                  <Image source={{ uri: profilePhoto || faceImage }} style={styles.modalFaceAvatar} resizeMode="cover" />
                ) : (
                  <View style={styles.modalFacePlaceholder}>
                    <Ionicons name="person" size={fontScale(28)} color={COLORS.inkMute || '#666666'} />
                  </View>
                )}
              </View>

              <Text style={styles.modalTitle}>{t('face_verification_title')}</Text>
              <Text style={styles.modalMessage}>{t('face_verification_msg')}</Text>

              <View style={styles.modalActions}>
                <PressableScale
                  onPress={() => setConfirmModalVisible(false)}
                  scaleTo={0.96}
                  style={styles.modalCancelBtn}
                  contentStyle={styles.modalBtnContent}
                >
                  <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    setConfirmModalVisible(false);
                    if (pendingTemplate) {
                      handleGenerateForTemplate(pendingTemplate);
                    }
                  }}
                  scaleTo={0.96}
                  style={styles.modalProceedBtn}
                  contentStyle={styles.modalBtnContent}
                >
                  <Text style={styles.modalProceedText}>{t('confirm')}</Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.ink,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontFamily: FONTS.black,
    color: COLORS.ink,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
  },
  // Templates Container & Feed Cards
  loadingBox: {
    height: hp(0.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: hp(0.04),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    color: COLORS.inkMuted,
  },
  templatesContainer: {
    gap: hp(0.02),
    paddingBottom: hp(0.02),
    alignItems: 'center',
  },
  templateFeedCard: {
    width: wp(0.89),
    alignItems: 'center',
    marginBottom: hp(0.01),
  },
  cardFrame: {
    width: wp(0.89),
    height: wp(0.89) * (16 / 9),
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1E1005',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
  },
  cardMedia: {
    width: '100%',
    height: '100%',
  },

  // Action Row directly under template card (Inspired by campaign page TemplateCard.jsx)
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(0.025),
    marginTop: hp(0.008),
    width: wp(0.89),
  },
  editBtn: {
    flex: 1,
    height: hp(0.044),
    borderRadius: hp(0.012),
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  editBtnText: {
    color: COLORS.ink,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    flexShrink: 1,
  },
  tryBtn: {
    flex: 1,
    height: hp(0.044),
    borderRadius: hp(0.012),
    backgroundColor: COLORS.orange,
    elevation: 3,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  tryBtnText: {
    color: COLORS.white,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    flexShrink: 1,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
    width: '100%',
    paddingHorizontal: 4,
  },



  // Generate Button
  generateBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingVertical: hp(0.016),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.ink,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginBottom: hp(0.02),
  },
  generateBtnText: {
    color: COLORS.white,
    fontSize: fontScale(15),
    fontFamily: FONTS.black,
    letterSpacing: 0.5,
  },
  // Skeleton Section
  skeletonContainer: {
    width: wp(0.89),
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: wp(0.035),
    borderWidth: 2,
    borderColor: COLORS.orangeTint || '#FFE0B2',
    alignItems: 'center',
    marginTop: hp(0.015),
    elevation: 3,
    shadowColor: COLORS.orange || '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  skeletonMedia: {
    width: wp(0.81),
    height: wp(0.81) * (16 / 9),
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.ink || '#000000',
    overflow: 'hidden',
  },
  skeletonIconBadgeWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  skeletonIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  skeletonActivityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.35 }],
  },
  skeletonMediaText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    color: COLORS.ink || '#000000',
    letterSpacing: 0.5,
  },
  skeletonTextBanner: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  skeletonSub: {
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    color: COLORS.inkMute || '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },

  generatingBox: {
    width: wp(0.89),
    padding: hp(0.02),
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.orangeTint,
    marginTop: hp(0.012),
  },
  generatingText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: COLORS.orange,
  },

  // Result Section
  resultCard: {
    width: wp(0.89),
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: wp(0.03),
    borderWidth: 2,
    borderColor: COLORS.ink,
    alignItems: 'center',
    marginTop: hp(0.012),
  },
  resultTitle: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: COLORS.ink,
    marginBottom: 10,
  },
  imagePlayer: {
    width: wp(0.81),
    height: wp(0.81) * (16 / 9),
    borderRadius: 10,
    backgroundColor: COLORS.black,
    marginBottom: 12,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: wp(0.81),
    height: wp(0.81) * (16 / 9),
    borderRadius: 10,
    backgroundColor: COLORS.black,
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(0.02),
    width: '100%',
  },
  downloadBtn: {
    flex: 1,
    height: hp(0.048),
    backgroundColor: COLORS.ink,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  shareBtn: {
    flex: 1,
    height: hp(0.048),
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.ink,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  resultBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 6,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  userFaceHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card || '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.ink || '#000000',
    alignSelf: 'center',
    width: wp(0.89),
  },
  userFaceAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.orange || '#FF5722',
    overflow: 'hidden',
    backgroundColor: COLORS.surface || '#FAFAFA',
  },
  userFaceAvatar: {
    width: '100%',
    height: '100%',
  },
  userFacePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  userFaceTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  userFaceTitle: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: COLORS.ink || '#000000',
  },
  userFaceSub: {
    fontSize: fontScale(10),
    fontFamily: FONTS.medium,
    color: COLORS.inkMute || '#666666',
    marginTop: 2,
  },
  changeFaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ink || '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  changeFaceBtnText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 16, 5, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.06),
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.ink || '#000000',
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalFaceAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: COLORS.orange || '#FF5722',
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: COLORS.surfaceLight || '#F5F5F5',
  },
  modalFaceAvatar: {
    width: '100%',
    height: '100%',
  },
  modalFacePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontFamily: FONTS.extrabold || FONTS.bold,
    color: COLORS.ink || '#000000',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    color: COLORS.inkMute || '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight || '#F5F5F5',
    borderWidth: 1.5,
    borderColor: COLORS.ink || '#000000',
  },
  modalProceedBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.orange || '#FF5722',
    elevation: 3,
    shadowColor: COLORS.orange || '#FF5722',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  modalBtnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modalCancelText: {
    color: COLORS.ink || '#000000',
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  modalProceedText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  skeletonFeedContainer: {
    paddingHorizontal: wp(0.01),
    paddingTop: hp(0.005),
  },
  skeletonChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: hp(0.02),
  },
});

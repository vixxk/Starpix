import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, SafeAreaView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateRenderer from '../../src/components/TemplateRenderer';
import AppButton from '../../src/components/AppButton';
import ConfirmModal from '../../src/components/ConfirmModal';
import PaywallModal from '../../src/components/PaywallModal';
import Toast from '../../src/components/Toast';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { useCreationStore } from '../../src/store/useCreationStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { resolveMediaUrl } from '../../src/utils/media';
import { hapticTap } from '../../src/utils/haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.includes('/video/');
};

const getFooterThumbnail = (foot) => {
  if (!foot) return null;
  if (foot.thumbnail && !isVideoUrl(foot.thumbnail)) return resolveMediaUrl(foot.thumbnail);
  if (foot.videoAsset && !isVideoUrl(foot.videoAsset)) return resolveMediaUrl(foot.videoAsset);
  return null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH * 0.72;
const CANVAS_HEIGHT = CANVAS_WIDTH * (16 / 9);

const TABS = [
  { key: 'photo', label: 'Photo', icon: 'image-outline' },
  { key: 'text', label: 'Text', icon: 'text-outline' },
  { key: 'footers', label: 'Footers', icon: 'film-outline' },
];

export default function TemplateEditorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('photo');
  const [frames, setFrames] = useState([]);
  const [effects, setEffects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEntitled, setIsEntitled] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { kind: 'permission' }
  const [isFav, setIsFav] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  const router = useRouter();

  const handleToastDone = useCallback(() => setToastInfo(null), []);

  const showToast = (message, icon = 'heart') => {
    setToastInfo({ message, icon, key: Date.now() });
  };

  useEffect(() => {
    if (activeTemplate && user && Array.isArray(user.favorites)) {
      const activeId = String(activeTemplate._id || activeTemplate.id || '');
      const isAlreadyFav = user.favorites.some((f) => {
        const fId = String(typeof f === 'string' ? f : f?._id || f?.id || '');
        return fId && activeId && fId === activeId;
      });
      setIsFav(isAlreadyFav);
    }
  }, [activeTemplate?._id, user?.favorites]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!activeTemplate) return;

    const prevFav = isFav;
    const nextFav = !prevFav;
    const targetId = String(activeTemplate._id || activeTemplate.id);

    // 1. Instant local state & Toast update
    setIsFav(nextFav);
    showToast(
      nextFav ? 'Added to favorites' : 'Removed from favorites',
      nextFav ? 'heart' : 'heart-dislike'
    );

    // 2. Optimistic update to Zustand store user favorites array
    const storeUser = useAuthStore.getState().user;
    if (storeUser) {
      let currentFavs = Array.isArray(storeUser.favorites) ? [...storeUser.favorites] : [];
      if (nextFav) {
        if (!currentFavs.some((f) => String(typeof f === 'string' ? f : f._id || f.id) === targetId)) {
          currentFavs.push(activeTemplate);
        }
      } else {
        currentFavs = currentFavs.filter((f) => String(typeof f === 'string' ? f : f._id || f.id) !== targetId);
      }
      useAuthStore.setState({ user: { ...storeUser, favorites: currentFavs } });
    }

    try {
      const res = await API.post(`/templates/${activeTemplate._id}/favorite`);
      const serverFavStatus = res.data?.data?.isFavorited ?? res.data?.isFavorited;
      if (typeof serverFavStatus === 'boolean') {
        setIsFav(serverFavStatus);
      }
    } catch (err) {
      // Rollback on failure
      setIsFav(prevFav);
      if (storeUser) {
        useAuthStore.setState({ user: storeUser });
      }
      console.error('Error toggling favorite:', err);
    }
  };

  const {
    activeTemplate,
    setActiveTemplate,
    setEntitlementStatus,
    userPhotoUri,
    setUserPhotoUri,
    userNameText,
    setUserNameText,
    userQuoteText,
    setUserQuoteText,
    selectedFrame,
    setSelectedFrame,
    selectedEffect,
    setSelectedEffect,
    photoScale,
    photoRotation,
    photoOffsetX,
    photoOffsetY,
    setPhotoTransform,
    removePhoto,
    nameOffsetX,
    nameOffsetY,
    nameFontSizeScale,
    setNameTransform,
    removeName,
  } = useCreationStore();

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      try {
        const [resT, resF, resE] = await Promise.all([
          API.get(`/templates/${id}`),
          API.get('/frames'),
          API.get('/effects'),
        ]);

        if (resT.data.success) {
          const tData = resT.data.data;
          const storeState = useCreationStore.getState();
          const isRestored = storeState.isRestoredSession && storeState.activeTemplate && (storeState.activeTemplate._id === id || storeState.activeTemplate.id === id);
          if (!isRestored) {
            const profileName = user?.name || user?.displayName || null;
            const existingFooter = storeState.selectedFooter || storeState.selectedEffect;
            setActiveTemplate(tData, profileName);
            if (existingFooter !== undefined) {
              setSelectedEffect(existingFooter);
            }
          }

          if (resT.data.data.accessType === 'free') {
            setIsEntitled(true);
            setEntitlementStatus(true);
          } else {
            try {
              const resVerify = await API.get(`/payments/verify/${id}`);
              if (resVerify.data && resVerify.data.success && resVerify.data.data.isUnlocked) {
                setIsEntitled(true);
                setEntitlementStatus(true);
              } else {
                setIsEntitled(false);
                setEntitlementStatus(false);
              }
            } catch (errVer) {
              console.log('Verify entitlement error:', errVer?.message);
            }
          }
        }
        if (resF.data.success) setFrames(resF.data.data);
        if (resE.data.success) setEffects(resE.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateDetails();
  }, [id, user]);

  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setAlertInfo({ kind: 'permission' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
        setUserPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error launching image picker:', err);
    }
  };

  const handleResetTemplate = () => {
    if (activeTemplate) {
      const profileName = user?.name || user?.displayName || null;
      setActiveTemplate(activeTemplate, profileName);
    }
  };

  const handleProceedToPreview = () => {
    if (!activeTemplate) return;
    router.push({ pathname: `/preview/${activeTemplate._id}` });
  };

  const handlePrimaryAction = () => {
    if (!activeTemplate) return;
    if (isEntitled || activeTemplate.accessType === 'free') {
      handleProceedToPreview();
    } else {
      setPaywallVisible(true);
    }
  };

  if (loading || !activeTemplate) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerLeftGroup}>
              <Skeleton height={24} width={24} borderRadius={12} />
              <Skeleton height={20} width={wp(0.35)} borderRadius={6} style={{ marginLeft: 8 }} />
            </View>
            <Skeleton height={32} width={64} borderRadius={12} />
          </View>

          {/* Canvas Skeleton */}
          <View style={styles.canvasContainer}>
            <Skeleton height={CANVAS_HEIGHT} width={CANVAS_WIDTH} borderRadius={0} />
          </View>

          {/* Editor Panel Skeleton */}
          <View style={styles.editorPanel}>
            <View style={styles.tabsRow}>
              <Skeleton height={38} width={wp(0.20)} borderRadius={12} />
              <Skeleton height={38} width={wp(0.20)} borderRadius={12} />
              <Skeleton height={38} width={wp(0.20)} borderRadius={12} />
              <Skeleton height={38} width={wp(0.20)} borderRadius={12} />
            </View>
            <View style={{ marginTop: 16 }}>
              <Skeleton height={46} width="100%" borderRadius={14} style={{ marginBottom: 10 }} />
              <Skeleton height={44} width="100%" borderRadius={14} />
            </View>
          </View>
        </View>
      </AppBackground>
    );
  }

  const isFreeOrUnlocked = isEntitled || activeTemplate.accessType === 'free';
  const itemPrice = activeTemplate.price || 49;

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <PressableScale onPress={() => router.back()} scaleTo={0.88} style={styles.headerBtn} contentStyle={styles.iconContent}>
              <Ionicons name="chevron-back" size={24} color={COLORS.orange} />
            </PressableScale>
            <Text numberOfLines={1} style={styles.templateTitle}>{activeTemplate.name}</Text>
          </View>
          <View style={styles.headerRightGroup}>
            <PressableScale
              onPress={handleToggleFavorite}
              scaleTo={0.88}
              style={styles.favHeaderBtn}
              contentStyle={styles.favHeaderContent}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={18}
                color={isFav ? COLORS.error || '#ef4444' : COLORS.orange}
              />
            </PressableScale>
          </View>
        </View>

        {/* Live canvas */}
        <View style={styles.canvasContainer}>
          <TemplateRenderer
            template={activeTemplate}
            userPhotoUri={userPhotoUri}
            userNameText={userNameText}
            userQuoteText={userQuoteText}
            selectedFrame={selectedFrame}
            selectedEffect={selectedEffect}
            photoTransform={{ scale: photoScale, rotation: photoRotation, offsetX: photoOffsetX, offsetY: photoOffsetY }}
            nameTransform={{ offsetX: nameOffsetX, offsetY: nameOffsetY, fontSizeScale: nameFontSizeScale }}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            showWatermark={!isFreeOrUnlocked}
            onPressPhotoSlot={handlePickPhoto}
            onPhotoTransformChange={setPhotoTransform}
            onNameTransformChange={setNameTransform}
          />
        </View>

        {/* Edit panel */}
        <View style={styles.editorPanel}>
          <View style={styles.tabHeader}>
            <PressableScale
              onPress={() => setActiveTab('photo')}
              scaleTo={0.95}
              style={[styles.tabItem, activeTab === 'photo' && styles.activeTabItem]}
              contentStyle={styles.tabItemContent}
            >
              <Ionicons name="camera-outline" size={15} color={activeTab === 'photo' ? COLORS.white : '#8A7A68'} />
              <Text style={[styles.tabText, activeTab === 'photo' && styles.activeTabText]}>Photo</Text>
            </PressableScale>

            <PressableScale
              onPress={() => setActiveTab('text')}
              scaleTo={0.95}
              style={[styles.tabItem, activeTab === 'text' && styles.activeTabItem]}
              contentStyle={styles.tabItemContent}
            >
              <Ionicons name="text-outline" size={15} color={activeTab === 'text' ? COLORS.white : '#8A7A68'} />
              <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>Name</Text>
            </PressableScale>

            <PressableScale
              onPress={() => setActiveTab('footers')}
              scaleTo={0.95}
              style={[styles.tabItem, (activeTab === 'footers' || activeTab === 'effects') && styles.activeTabItem]}
              contentStyle={styles.tabItemContent}
            >
              <Ionicons name="film-outline" size={15} color={(activeTab === 'footers' || activeTab === 'effects') ? COLORS.white : '#8A7A68'} />
              <Text style={[styles.tabText, (activeTab === 'footers' || activeTab === 'effects') && styles.activeTabText]}>Footers</Text>
            </PressableScale>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'photo' && (
              <View style={styles.controlsStack}>
                <View style={styles.photoActionRow}>
                  <PressableScale
                    onPress={handlePickPhoto}
                    scaleTo={0.96}
                    style={styles.gallerySelectBtn}
                    contentStyle={styles.gallerySelectContent}
                  >
                    <Ionicons name="images-outline" size={20} color={COLORS.white} />
                    <Text style={styles.gallerySelectText}>
                      {userPhotoUri ? 'Change Photo from Gallery' : 'Select Photo from Gallery'}
                    </Text>
                  </PressableScale>
                  {userPhotoUri && (
                    <PressableScale
                      onPress={removePhoto}
                      scaleTo={0.92}
                      style={styles.deleteIconBtn}
                      contentStyle={styles.deleteIconContent}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger || '#ef4444'} />
                    </PressableScale>
                  )}
                </View>

                <PressableScale
                  onPress={handlePrimaryAction}
                  scaleTo={0.96}
                  style={[styles.previewActionBtn, !isFreeOrUnlocked && styles.payActionBtn]}
                  contentStyle={styles.previewActionContent}
                >
                  <Text style={styles.previewActionText}>
                    {isFreeOrUnlocked ? 'Preview Status' : `Pay ₹${itemPrice} to Unlock`}
                  </Text>
                  <Ionicons
                    name={isFreeOrUnlocked ? 'arrow-forward' : 'card-outline'}
                    size={18}
                    color={COLORS.white}
                  />
                </PressableScale>

              </View>
            )}

            {activeTab === 'text' && (
              <View style={styles.controlsStack}>
                <Text style={styles.inputLabel}>Personalized Name</Text>
                <View style={styles.textInputRow}>
                  <TextInput
                    value={userNameText}
                    onChangeText={setUserNameText}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.inkFaint}
                    style={styles.textInputFlex}
                  />
                  {userNameText !== '' && (
                    <PressableScale
                      onPress={removeName}
                      scaleTo={0.92}
                      style={styles.deleteIconBtn}
                      contentStyle={styles.deleteIconContent}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger || '#ef4444'} />
                    </PressableScale>
                  )}
                </View>
              </View>
            )}

            {(activeTab === 'footers' || activeTab === 'effects') && (
              <View style={styles.footersContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.footerScrollContent}
                >
                  {/* Box #1: None option (Default state: selectedEffect === null) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticTap();
                      setSelectedEffect(null);
                    }}
                    style={[
                      styles.footerBox,
                      selectedEffect === null && styles.footerBoxActive,
                    ]}
                  >
                    <Ionicons
                      name="ban-outline"
                      size={fontScale(17)}
                      color={selectedEffect === null ? COLORS.orange : '#64748B'}
                    />
                    {selectedEffect === null && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={8} color={COLORS.white} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Admin Uploaded Footer Thumbnail Boxes */}
                  {((activeTemplate && activeTemplate.footers && activeTemplate.footers.length > 0)
                    ? activeTemplate.footers
                    : (activeTemplate?.availableFilters || effects || [])
                  ).map((ft, idx) => {
                    const isSelected = Boolean(
                      selectedEffect &&
                        (selectedEffect === ft ||
                          (selectedEffect._id && ft._id && selectedEffect._id === ft._id) ||
                          (selectedEffect.videoAsset && ft.videoAsset && selectedEffect.videoAsset === ft.videoAsset) ||
                          (selectedEffect.name && ft.name && selectedEffect.name === ft.name))
                    );
                    const thumbUri = getFooterThumbnail(ft);

                    return (
                      <TouchableOpacity
                        key={ft._id || ft.videoAsset || idx}
                        activeOpacity={0.7}
                        onPress={() => {
                          hapticTap();
                          setSelectedEffect(ft);
                        }}
                        style={[
                          styles.footerBox,
                          isSelected && styles.footerBoxActive,
                        ]}
                      >
                        {thumbUri ? (
                          <Image
                            source={{ uri: thumbUri }}
                            style={styles.footerBoxThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.fallbackIconContainer}>
                            <Ionicons
                              name="sparkles"
                              size={fontScale(16)}
                              color={isSelected ? COLORS.orange : '#64748B'}
                            />
                          </View>
                        )}

                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={8} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Themed Alert (replaces native Alert) */}
      <ConfirmModal
        visible={alertInfo !== null}
        title={(alertInfo && alertInfo.title) || 'Photo Access Required'}
        message={(alertInfo && alertInfo.message) || 'Permission to access your photo library is required to add your photo to this status.'}
        confirmText="Got It"
        icon={(alertInfo && alertInfo.icon) || 'images-outline'}
        iconColor={(alertInfo && alertInfo.iconColor) || COLORS.orange}
        hideCancel
        onCancel={() => setAlertInfo(null)}
        onConfirm={() => setAlertInfo(null)}
      />

      {/* Paywall Unlock Modal */}
      {activeTemplate && (
        <PaywallModal
          visible={paywallVisible}
          template={activeTemplate}
          onClose={() => setPaywallVisible(false)}
          onSuccess={() => {
            setIsEntitled(true);
            setEntitlementStatus(true);
            setAlertInfo({
              title: 'Template Unlocked!',
              message: `You now have lifetime access to "${activeTemplate.name}". Watermark removed!`,
              icon: 'checkmark-circle-outline',
              iconColor: COLORS.orange,
            });
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastInfo?.message}
        toastKey={toastInfo?.key}
        icon={toastInfo?.icon || 'heart'}
        onDone={handleToastDone}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  payActionBtn: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  safeArea: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.035),
    paddingVertical: hp(0.012),
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingRight: 4,
    paddingLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateTitle: {
    flex: 1,
    color: COLORS.ink,
    fontSize: fontScale(15.5),
    fontFamily: FONTS.bold,
    textAlign: 'left',
    marginLeft: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favHeaderContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetHeaderBtn: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
    alignSelf: 'center',
    flexShrink: 0,
    flexGrow: 0,
  },
  resetHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    flex: 0,
    width: 'auto',
    height: 'auto',
  },
  resetHeaderBtnText: {
    color: COLORS.orange,
    fontFamily: FONTS.bold,
    fontSize: fontScale(12),
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: fontScale(14),
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  editorPanel: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: wp(0.045),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: hp(0.02),
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF0E0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeTabItem: {
    backgroundColor: COLORS.orange,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  tabText: {
    color: '#8A7A68',
    fontFamily: FONTS.semibold,
    fontSize: fontScale(12),
  },
  activeTabText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  tabContent: {
    minHeight: 110,
    justifyContent: 'center',
  },
  controlsStack: {
    gap: 8,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gallerySelectBtn: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  gallerySelectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  gallerySelectText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(13.5),
  },
  previewActionBtn: {
    height: 44,
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    marginTop: 4,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  previewActionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewActionText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14),
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInputFlex: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: COLORS.ink,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
  },
  deleteIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteIconContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positioningContainer: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  positionTitle: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  positionPadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dpadGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  dpadBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  dpadResetBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  dpadContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomColumn: {
    alignItems: 'center',
    gap: 4,
  },
  controlSubLabel: {
    fontSize: fontScale(10),
    fontFamily: FONTS.semibold,
    color: COLORS.inkMuted,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  inputLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  horizontalOptions: {
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  footersContainer: {
    gap: 8,
  },
  footerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  footerSectionTitle: {
    color: COLORS.ink,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
  },
  footerScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footerBox: {
    width: hp(0.046),
    height: hp(0.046),
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  footerBoxActive: {
    borderColor: COLORS.orange,
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  footerBoxThumb: {
    width: '100%',
    height: '100%',
  },
  fallbackIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: COLORS.orange,
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  optionChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipContent: {
    justifyContent: 'center',
  },
  selectedOptionChip: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeTint,
  },
  optionChipText: {
    color: COLORS.ink,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
  },
  selectedOptionChipText: {
    color: COLORS.orange,
  },
});

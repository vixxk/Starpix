import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, SPACING, CARD_SHADOW } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { resolveMediaUrl } from '../../src/utils/media';
import { useCreationStore } from '../../src/store/useCreationStore';
import ConfirmModal from '../../src/components/ConfirmModal';
import ExploreCta from '../../src/components/ExploreCta';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [backendDownloads, setBackendDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareAlert, setShareAlert] = useState(false);
  const [redownloadSuccessAlert, setRedownloadSuccessAlert] = useState(false);

  const downloadedCreations = useCreationStore((state) => state.downloadedCreations || []);
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);
  const removeDownloadedCreation = useCreationStore((state) => state.removeDownloadedCreation);
  const clearDownloadedCreations = useCreationStore((state) => state.clearDownloadedCreations);

  const fetchDownloads = useCallback(async () => {
    if (!user) {
      setBackendDownloads([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await API.get('/creations/my-downloads');
      if (res.data && res.data.success) {
        setBackendDownloads(res.data.data || []);
      }
    } catch (err) {
      console.warn('[Downloads Fetch Notice]:', err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refresh every time the Downloads screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDownloads();
    }, [fetchDownloads])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDownloads();
  }, [fetchDownloads]);

  const restoreCreationState = useCreationStore((state) => state.restoreCreationState);

  // Helper to normalize template ID
  const getTemplateId = (item) => {
    if (!item) return '';
    if (typeof item.templateId === 'object' && item.templateId?._id) return String(item.templateId._id);
    if (typeof item.templateId === 'string' && item.templateId) return item.templateId;
    if (typeof item.activeTemplate === 'object' && item.activeTemplate?._id) return String(item.activeTemplate._id);
    if (typeof item.template === 'object' && item.template?._id) return String(item.template._id);
    return '';
  };

  // Helper to normalize creation ID
  const getCreationId = (item) => {
    return String(item._id || item.id || '');
  };

  const isVideoMedia = (url) => {
    if (!url || typeof url !== 'string') return false;
    return Boolean(
      url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
      url.includes('/video/') ||
      url.includes('.mp4')
    );
  };

  const getCardThumbnail = (item) => {
    if (!item) return resolveMediaUrl(null);

    // 1. Check template object thumbnail first (which is guaranteed to be an image)
    const tObj = item.template || item.activeTemplate || (typeof item.templateId === 'object' ? item.templateId : null);
    if (tObj && tObj.thumbnail && !isVideoMedia(tObj.thumbnail)) {
      return resolveMediaUrl(tObj.thumbnail);
    }

    // 2. Check if item.image or item.localUri or item.editedPhoto is an image
    const candidates = [item.image, item.localUri, item.editedPhoto];
    for (const cand of candidates) {
      if (cand && typeof cand === 'string' && !isVideoMedia(cand)) {
        return resolveMediaUrl(cand);
      }
    }

    // 3. Fallback to template previewAsset if it's an image
    if (tObj && tObj.previewAsset && !isVideoMedia(tObj.previewAsset)) {
      return resolveMediaUrl(tObj.previewAsset);
    }

    return resolveMediaUrl(null);
  };

  // Combine backend S3 downloads and local store downloads into a unified list
  const allCreations = [];
  const seenIds = new Set();

  // 1. Add backend S3 downloads first
  backendDownloads.forEach((item) => {
    const cId = getCreationId(item);
    if (cId) seenIds.add(cId);

    const template = (typeof item.templateId === 'object' && item.templateId) ? item.templateId : {};
    const customState = item.customizationState || {};

    allCreations.push({
      _id: cId,
      title: item.templateTitle || template.name || 'Personalized Status',
      image: item.imageUrl || item.editedPhoto || template.previewAsset || template.thumbnail,
      editedText: item.editedText || customState.userNameText || '',
      editedPhoto: item.editedPhoto || customState.userPhotoUri || '',
      downloadedAt: item.downloadedAt || item.createdAt,
      template: template,
      activeTemplate: customState.activeTemplate || (template._id ? template : null),
      userPhotoUri: customState.userPhotoUri || item.editedPhoto || null,
      userNameText: customState.userNameText || item.editedText || '',
      userQuoteText: customState.userQuoteText || '',
      selectedFrame: customState.selectedFrame || null,
      selectedEffect: customState.selectedEffect || null,
      photoScale: customState.photoScale || 1,
      photoRotation: customState.photoRotation || 0,
      photoOffsetX: customState.photoOffsetX || 0,
      photoOffsetY: customState.photoOffsetY || 0,
      nameOffsetX: customState.nameOffsetX || 0,
      nameOffsetY: customState.nameOffsetY || 0,
      nameFontSizeScale: customState.nameFontSizeScale || 1,
      source: 'backend',
    });
  });

  // 2. Add local store downloads that aren't already represented in backend downloads
  downloadedCreations.forEach((item) => {
    const cId = getCreationId(item);
    const tId = getTemplateId(item);
    const text = item.editedText || item.userNameText || item.customizationState?.userNameText || '';
    const photo = item.userPhotoUri || item.editedPhoto || item.customizationState?.userPhotoUri || '';

    // Check if ID already seen
    if (cId && seenIds.has(cId)) return;

    // Check if exact same creation (templateId + text + photo) already exists from backend
    const isSameAsBackend = allCreations.some((bItem) => {
      const bTId = getTemplateId(bItem);
      if (tId && bTId && tId === bTId) {
        const bText = bItem.editedText || bItem.userNameText || '';
        const bPhoto = bItem.userPhotoUri || bItem.editedPhoto || '';
        if (text === bText && (photo === bPhoto || (!photo && !bPhoto))) {
          return true;
        }
      }
      return false;
    });

    if (!isSameAsBackend) {
      if (cId) seenIds.add(cId);
      const customState = item.customizationState || {};
      allCreations.push({
        _id: cId || `local_${Date.now()}`,
        title: item.name || 'Personalized Status',
        image: item.localUri || item.thumbnail || item.editedPhoto,
        editedText: text,
        editedPhoto: photo,
        downloadedAt: item.createdAt || new Date().toISOString(),
        template: item.activeTemplate || item.template || null,
        activeTemplate: item.activeTemplate || customState.activeTemplate || item.template || null,
        userPhotoUri: photo || null,
        userNameText: item.userNameText || customState.userNameText || text,
        userQuoteText: item.userQuoteText || customState.userQuoteText || '',
        selectedFrame: item.selectedFrame || customState.selectedFrame || null,
        selectedEffect: item.selectedEffect || customState.selectedEffect || null,
        photoScale: item.photoScale || customState.photoScale || 1,
        photoRotation: item.photoRotation || customState.photoRotation || 0,
        photoOffsetX: item.photoOffsetX || customState.photoOffsetX || 0,
        photoOffsetY: item.photoOffsetY || customState.photoOffsetY || 0,
        nameOffsetX: item.nameOffsetX || customState.nameOffsetX || 0,
        nameOffsetY: item.nameOffsetY || customState.nameOffsetY || 0,
        nameFontSizeScale: item.nameFontSizeScale || customState.nameFontSizeScale || 1,
        source: 'local',
      });
    }
  });

  const handleOpenInEditor = (item) => {
    const activeTemplate = item.activeTemplate || (typeof item.template === 'object' && item.template._id ? item.template : null);
    if (!activeTemplate || !activeTemplate._id) return;

    restoreCreationState({
      activeTemplate: activeTemplate,
      userPhotoUri: item.userPhotoUri || item.editedPhoto || null,
      userNameText: item.userNameText || item.editedText || '',
      userQuoteText: item.userQuoteText || '',
      selectedFrame: item.selectedFrame || null,
      selectedEffect: item.selectedEffect || null,
      photoScale: item.photoScale || 1,
      photoRotation: item.photoRotation || 0,
      photoOffsetX: item.photoOffsetX || 0,
      photoOffsetY: item.photoOffsetY || 0,
      nameOffsetX: item.nameOffsetX || 0,
      nameOffsetY: item.nameOffsetY || 0,
      nameFontSizeScale: item.nameFontSizeScale || 1,
    });

    router.push(`/template/${activeTemplate._id}`);
  };

  const handleShare = async (fileOrUrl) => {
    if (!fileOrUrl) return;
    try {
      let shareUri = fileOrUrl;

      // If remote URL, download temporarily for native sharing
      if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) {
        const fileUri = `${FileSystem.documentDirectory}statuzzz_share_${Date.now()}.jpg`;
        const downloaded = await FileSystem.downloadAsync(fileOrUrl, fileUri);
        shareUri = downloaded.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Statuzzz Creation',
        });
      } else {
        setShareAlert(true);
      }
    } catch (e) {
      console.error('Share error:', e);
      setShareAlert(true);
    }
  };

  const handleRedownload = async (item) => {
    try {
      const uri = item.image;
      if (!uri) return;

      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const targetPath = `${FileSystem.documentDirectory}statuzzz_dl_${Date.now()}.jpg`;
        await FileSystem.downloadAsync(uri, targetPath);
      }
      setRedownloadSuccessAlert(true);
    } catch (err) {
      console.error('Re-download error:', err);
      // Fallback share if direct save fails
      handleShare(item.image);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.mode === 'all') {
      clearDownloadedCreations();
      setBackendDownloads([]);
      if (user) {
        try {
          await API.delete('/creations/clear-all');
        } catch (e) {
          console.error(e);
        }
      }
    } else if (deleteTarget.mode === 'one') {
      removeDownloadedCreation(deleteTarget.id);
      setBackendDownloads((prev) => prev.filter((c) => c._id !== deleteTarget.id));
      if (user) {
        try {
          await API.delete(`/creations/${deleteTarget.id}`);
        } catch (e) {
          console.error(e);
        }
      }
    }
    setDeleteTarget(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently Saved';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recently Saved';
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <SectionHeader
          icon="📥"
          title="My Downloads"
          subtitle="All your saved & exported status creations"
          style={styles.header}
        />

        {/* Clear All Toolbar */}
        {allCreations.length > 0 && (
          <View style={styles.clearRow}>
            <Text style={styles.clearHint}>
              {allCreations.length} saved {allCreations.length === 1 ? 'creation' : 'creations'}
            </Text>
            <PressableScale
              onPress={() => setDeleteTarget({ mode: 'all' })}
              scaleTo={0.94}
              style={styles.clearBtn}
              contentStyle={styles.clearBtnContent}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.error} />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </PressableScale>
          </View>
        )}

        {loading && allCreations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <View style={styles.downloadSkeletonCard}>
              <Skeleton height={130} width={90} borderRadius={14} />
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 4 }}>
                <View>
                  <Skeleton height={18} width="75%" borderRadius={6} />
                  <Skeleton height={13} width="45%" borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Skeleton height={36} width="46%" borderRadius={10} />
                  <Skeleton height={36} width="46%" borderRadius={10} />
                </View>
              </View>
            </View>
            <View style={[styles.downloadSkeletonCard, { marginTop: 12 }]}>
              <Skeleton height={130} width={90} borderRadius={14} />
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 4 }}>
                <View>
                  <Skeleton height={18} width="65%" borderRadius={6} />
                  <Skeleton height={13} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Skeleton height={36} width="46%" borderRadius={10} />
                  <Skeleton height={36} width="46%" borderRadius={10} />
                </View>
              </View>
            </View>
          </View>
        ) : allCreations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-download-outline" size={42} color={COLORS.orange} />
            </View>
            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
            <Text style={styles.emptySub}>
              Create and export personalized status templates with your photo or name to see them here.
            </Text>
            <ExploreCta onPress={() => router.replace('/(tabs)')} style={styles.ctaWrap} />
          </View>
        ) : (
          <FlatList
            data={allCreations}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <PressableScale
                  onPress={() => handleOpenInEditor(item)}
                  scaleTo={0.94}
                  style={styles.cardLeft}
                >
                  <Image
                    source={{ uri: getCardThumbnail(item) }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={11} color={COLORS.white} />
                  </View>
                </PressableScale>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>
                    Saved on {formatDate(item.downloadedAt)}
                  </Text>

                  {item.editedText ? (
                    <View style={styles.editTag}>
                      <Text style={styles.editTagText} numberOfLines={1}>
                        ✍️ {item.editedText}
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions Bar */}
                  <View style={styles.actionRow}>
                    <PressableScale
                      onPress={() => handleRedownload(item)}
                      scaleTo={0.92}
                      style={styles.actionBtnPrimary}
                      contentStyle={styles.actionContent}
                    >
                      <Ionicons name="download-outline" size={14} color={COLORS.white} />
                      <Text style={styles.actionTextPrimary}>Re-download</Text>
                    </PressableScale>

                    <PressableScale
                      onPress={() => handleShare(item.image)}
                      scaleTo={0.92}
                      style={styles.actionBtnSecondary}
                      contentStyle={styles.actionContent}
                    >
                      <Ionicons name="share-social-outline" size={14} color={COLORS.ink} />
                      <Text style={styles.actionTextSecondary}>Share</Text>
                    </PressableScale>

                    <PressableScale
                      onPress={() => setDeleteTarget({ mode: 'one', id: item._id })}
                      scaleTo={0.88}
                      style={styles.deleteIconBtn}
                      contentStyle={styles.deleteIconContent}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    </PressableScale>
                  </View>
                </View>
              </View>
            )}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={Boolean(deleteTarget)}
          title={deleteTarget?.mode === 'all' ? 'Clear All Downloads?' : 'Delete Download?'}
          message={
            deleteTarget?.mode === 'all'
              ? 'Are you sure you want to remove all saved creations from your downloads list?'
              : 'Are you sure you want to remove this downloaded creation?'
          }
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* Share Fallback Alert */}
        <ConfirmModal
          visible={shareAlert}
          title="Share Creation"
          message="Direct device sharing is not available on this device environment."
          confirmText="Got It"
          showCancel={false}
          onConfirm={() => setShareAlert(false)}
        />

        {/* Re-download Success Alert */}
        <ConfirmModal
          visible={redownloadSuccessAlert}
          title="Downloaded Again!"
          message="Your status creation has been saved again to your device storage."
          confirmText="Great"
          showCancel={false}
          onConfirm={() => setRedownloadSuccessAlert(false)}
        />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    marginBottom: hp(0.012),
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    marginBottom: hp(0.012),
  },
  clearHint: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
  },
  clearBtn: {
    backgroundColor: '#Fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#Fca5a5',
  },
  clearBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  clearBtnText: {
    color: COLORS.error,
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  loadingContainer: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: hp(0.02),
  },
  downloadSkeletonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.1),
  },
  emptyIconWrap: {
    width: wp(0.2),
    height: wp(0.2),
    borderRadius: wp(0.1),
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.02),
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: fontScale(18),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: fontScale(19),
  },
  ctaWrap: {
    marginTop: hp(0.03),
  },
  listContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.06),
    gap: hp(0.014),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    padding: wp(0.03),
    alignItems: 'center',
    gap: wp(0.035),
    ...CARD_SHADOW,
  },
  cardLeft: {
    width: wp(0.22),
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.orange,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
  },
  cardDate: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  editTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeTint,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  editTagText: {
    color: COLORS.orangeDeep,
    fontSize: fontScale(10),
    fontFamily: FONTS.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: wp(0.02),
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 8,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  actionTextPrimary: {
    color: COLORS.white,
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  actionTextSecondary: {
    color: COLORS.ink,
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  deleteIconBtn: {
    backgroundColor: '#Fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#Fca5a5',
    marginLeft: 'auto',
  },
  deleteIconContent: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

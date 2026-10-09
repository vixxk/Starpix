import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, BackHandler } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import SectionHeader from '../../src/components/SectionHeader';
import Skeleton from '../../src/components/Skeleton';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import ConfirmModal from '../../src/components/ConfirmModal';
import ExploreCta from '../../src/components/ExploreCta';
import { COLORS } from '../../src/constants/colors';
import { SCREEN_PAD, hp } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { resolveMediaUrl } from '../../src/utils/media';
import { useCreationStore } from '../../src/store/useCreationStore';
import { useAuthStore } from '../../src/store/useAuthStore';

import {
  styles,
  getTemplateId,
  getCreationId,
  isVideoMedia,
  DownloadCard,
  DownloadPreviewModal,
} from '../../src/modules/downloads';

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const fromScreen = params.from;
  const user = useAuthStore((state) => state.user);

  const handleBack = useCallback(() => {
    if (fromScreen === 'ai-video') {
      router.replace('/ai-video');
    } else if (fromScreen === 'settings' || fromScreen === 'profile') {
      router.replace('/(tabs)/profile');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [fromScreen, router]);

  useEffect(() => {
    if (!fromScreen) return;
    const backAction = () => {
      handleBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [fromScreen, handleBack]);

  const [backendDownloads, setBackendDownloads] = useState([]);
  const [templateCatalog, setTemplateCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareAlert, setShareAlert] = useState(false);
  const [redownloadSuccessAlert, setRedownloadSuccessAlert] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [deletedIds, setDeletedIds] = useState(() => new Set());

  const downloadedCreations = useCreationStore((state) => state.downloadedCreations || []);
  const activeAiGenerations = useCreationStore((state) => state.activeAiGenerations || []);
  const removeDownloadedCreation = useCreationStore((state) => state.removeDownloadedCreation);
  const clearDownloadedCreations = useCreationStore((state) => state.clearDownloadedCreations);

  useEffect(() => {
    API.get('/templates', { params: { limit: 100 } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const map = {};
          res.data.data.forEach((t) => {
            if (t._id) map[String(t._id)] = t;
            if (t.name) map[t.name.toLowerCase().trim()] = t;
          });
          setTemplateCatalog(map);
        }
      })
      .catch(() => {});
  }, []);

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

  // Combine backend S3 downloads and local store downloads into a unified list
  const allCreations = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    backendDownloads.forEach((item) => {
      const cId = getCreationId(item);
      if (cId && deletedIds.has(String(cId))) return;
      if (cId) seenIds.add(cId);

      const tId = getTemplateId(item);
      const template = (typeof item.templateId === 'object' && item.templateId) ? item.templateId : {};
      const aiTemplate = (typeof item.aiTemplateId === 'object' && item.aiTemplateId) ? item.aiTemplateId : null;
      const customState = item.customizationState || {};
      const catalogTmpl =
        (template && template._id) ? template :
        (tId && templateCatalog[tId]) ? templateCatalog[tId] :
        (templateCatalog[(item.templateTitle || '').toLowerCase().trim()]);

      const activeTmpl = catalogTmpl || aiTemplate || customState.activeTemplate || (template._id ? template : null);
      const footers = (catalogTmpl?.footers && catalogTmpl.footers.length > 0)
        ? catalogTmpl.footers
        : (template.footers && template.footers.length > 0)
        ? template.footers
        : (customState.footers && customState.footers.length > 0)
        ? customState.footers
        : (customState.selectedFooter ? [customState.selectedFooter] : []);

      const selectedFooter = customState.selectedFooter || (footers.length > 0 ? footers[0] : null);
      const canvasConfig = catalogTmpl?.canvasConfig || template.canvasConfig || customState.canvasConfig || null;
      const isAi = Boolean(item.isAi || item.aiTemplateId || aiTemplate);
      const mediaUrl = item.imageUrl || catalogTmpl?.mainMedia || template.mainMedia || template.previewAsset;
      const mediaType = item.mediaType || (isAi && aiTemplate?.mediaType) || catalogTmpl?.type || template.type || (isVideoMedia(mediaUrl) ? 'video' : 'image');
      const displayImage = isAi
        ? (mediaType === 'image' ? (item.imageUrl || aiTemplate?.thumbnailUrl) : (aiTemplate?.thumbnailUrl || item.imageUrl))
        : (catalogTmpl?.thumbnail || template.thumbnail || aiTemplate?.thumbnailUrl || item.imageUrl || template.previewAsset || item.editedPhoto);

      list.push({
        _id: cId,
        title: item.templateTitle || catalogTmpl?.name || aiTemplate?.title || template.name || 'Personalized Status',
        nameTranslations: catalogTmpl?.nameTranslations || template.nameTranslations || customState.nameTranslations,
        image: displayImage,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        editedText: item.editedText || customState.userNameText || '',
        editedPhoto: item.editedPhoto || customState.userPhotoUri || '',
        downloadedAt: item.downloadedAt || item.createdAt,
        template: catalogTmpl || template,
        aiTemplate: aiTemplate,
        activeTemplate: activeTmpl,
        isAi: isAi,
        userPhotoUri: customState.userPhotoUri || item.editedPhoto || null,
        userNameText: customState.userNameText || item.editedText || '',
        userQuoteText: customState.userQuoteText || '',
        selectedFrame: customState.selectedFrame || (selectedFooter ? (selectedFooter.id || (selectedFooter._id ? String(selectedFooter._id) : null)) : null),
        selectedEffect: customState.selectedEffect || null,
        footers: footers,
        selectedFooter: selectedFooter,
        canvasConfig: canvasConfig,
        source: 'backend',
      });
    });

    const userLocalCreations = downloadedCreations.filter((item) => {
      if (!user) return false;
      const currentUserId = String(user._id || user.id || '');
      if (!item.userId) return true;
      return String(item.userId) === currentUserId;
    });

    userLocalCreations.forEach((item) => {
      const cId = getCreationId(item);
      if (cId && deletedIds.has(String(cId))) return;
      const tId = getTemplateId(item);
      const text = item.editedText || item.userNameText || item.customizationState?.userNameText || '';
      const photo = item.userPhotoUri || item.editedPhoto || item.customizationState?.userPhotoUri || '';

      if (cId && seenIds.has(cId)) return;

      const isSameAsBackend = list.some((bItem) => {
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
        const isAi = Boolean(item.isAi || item.aiTemplate || item.aiTemplateId || (cId && String(cId).startsWith('ai_')));
        const customState = item.customizationState || {};
        const aiTmpl = item.aiTemplate || customState.aiTemplate || null;
        const tmpl = item.template || customState.activeTemplate || item.activeTemplate || null;
        const catalogTmpl =
          (tmpl && tmpl._id) ? tmpl :
          (tId && templateCatalog[tId]) ? templateCatalog[tId] :
          (templateCatalog[(item.name || item.title || '').toLowerCase().trim()]);

        const activeTmpl = catalogTmpl || tmpl || aiTmpl;
        const footers = (catalogTmpl?.footers && catalogTmpl.footers.length > 0)
          ? catalogTmpl.footers
          : (item.footers && item.footers.length > 0)
          ? item.footers
          : (tmpl?.footers && tmpl.footers.length > 0)
          ? tmpl.footers
          : (customState.footers && customState.footers.length > 0)
          ? customState.footers
          : (item.selectedFooter ? [item.selectedFooter] : []);

        const selectedFooter = item.selectedFooter || customState.selectedFooter || (footers.length > 0 ? footers[0] : null);
        const canvasConfig = catalogTmpl?.canvasConfig || item.canvasConfig || tmpl?.canvasConfig || customState.canvasConfig || null;
        const mediaUrl = item.mediaUrl || item.localUri || item.image || catalogTmpl?.mainMedia || tmpl?.mainMedia;
        const mediaType = item.mediaType || (isAi && (aiTmpl?.mediaType || tmpl?.mediaType)) || catalogTmpl?.type || tmpl?.type || (isVideoMedia(mediaUrl) ? 'video' : 'image');

        const displayImage = isAi
          ? (mediaType === 'image' ? (item.image || item.localUri || aiTmpl?.thumbnailUrl) : (aiTmpl?.thumbnailUrl || item.image || item.localUri))
          : (catalogTmpl?.thumbnail || tmpl?.thumbnail || item.thumbnail || item.localUri || item.editedPhoto || item.image);

        list.push({
          _id: cId || `local_${Date.now()}`,
          title: item.name || catalogTmpl?.name || aiTmpl?.title || item.title || 'Personalized Status',
          nameTranslations: catalogTmpl?.nameTranslations || item.nameTranslations || tmpl?.nameTranslations,
          image: displayImage,
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          editedText: text,
          editedPhoto: photo,
          downloadedAt: item.createdAt || item.downloadedAt || new Date().toISOString(),
          template: catalogTmpl || tmpl,
          aiTemplate: aiTmpl,
          activeTemplate: activeTmpl,
          isAi: isAi,
          userPhotoUri: photo || null,
          userNameText: item.userNameText || customState.userNameText || text,
          userQuoteText: item.userQuoteText || customState.userQuoteText || '',
          selectedFrame: item.selectedFrame || customState.selectedFrame || (selectedFooter ? (selectedFooter.id || (selectedFooter._id ? String(selectedFooter._id) : null)) : null),
          selectedEffect: item.selectedEffect || customState.selectedEffect || null,
          footers: footers,
          selectedFooter: selectedFooter,
          canvasConfig: canvasConfig,
          source: 'local',
        });
      }
    });

    const activeGenerations = activeAiGenerations.map((gen) => {
      const gTmpl = gen.activeTemplate || gen.template || {};
      const catalogTmpl =
        (gTmpl && gTmpl._id && templateCatalog[String(gTmpl._id)]) ||
        (gen.templateId && templateCatalog[String(gen.templateId)]) ||
        gTmpl;

      return {
        _id: gen.id || `gen_${gen.templateId || Date.now()}`,
        title: gen.title || catalogTmpl?.name || catalogTmpl?.title || 'Personalized AI Content',
        nameTranslations: catalogTmpl?.nameTranslations || gen.nameTranslations,
        image: gen.thumbnailUrl || catalogTmpl?.thumbnailUrl || catalogTmpl?.thumbnail,
        thumbnailUrl: gen.thumbnailUrl || catalogTmpl?.thumbnailUrl || catalogTmpl?.thumbnail,
        mediaUrl: gen.thumbnailUrl || catalogTmpl?.videoUrl || catalogTmpl?.mainMedia,
        mediaType: gen.mediaType || catalogTmpl?.mediaType || 'video',
        downloadedAt: gen.startedAt || new Date().toISOString(),
        template: catalogTmpl || gTmpl,
        activeTemplate: catalogTmpl || gTmpl,
        aiTemplate: catalogTmpl || gTmpl,
        isAi: true,
        isGenerating: true,
        source: 'local',
      };
    });

    return [...activeGenerations, ...list];
  }, [backendDownloads, downloadedCreations, templateCatalog, user, deletedIds, activeAiGenerations]);

  const handleShare = async (fileOrUrl, itemId = null, itemObj = null) => {
    if (!fileOrUrl || downloadingId || sharingId) return;
    try {
      if (itemId) setSharingId(itemId);
      const isAi = Boolean(itemObj?.isAi || itemObj?.aiTemplate || itemObj?.aiTemplateId);
      const isVideo = isAi
        ? (itemObj?.mediaType === 'video' || itemObj?.aiTemplate?.mediaType === 'video' || isVideoMedia(fileOrUrl))
        : isVideoMedia(fileOrUrl);
      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let shareUri = fileOrUrl;

      if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) {
        try {
          const proxyUrl = resolveMediaUrl(fileOrUrl);
          const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;
          let downloaded = await FileSystem.downloadAsync(proxyUrl, fileUri);
          if (downloaded.status !== 200 && proxyUrl !== fileOrUrl) {
            downloaded = await FileSystem.downloadAsync(fileOrUrl, fileUri);
          }
          if (downloaded.status === 200) {
            shareUri = downloaded.uri;
          }
        } catch (shareErr) {
          console.warn('[Downloads] Share download notice:', shareErr.message);
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType,
          dialogTitle: 'Share Starpix Creation',
        });
      } else {
        setShareAlert(true);
      }
    } catch (e) {
      console.error('Share error:', e);
      setShareAlert(true);
    } finally {
      if (itemId) setSharingId(null);
    }
  };

  const handleRedownload = async (item) => {
    if (!item || downloadingId || sharingId) return;
    try {
      const isAi = Boolean(item.isAi || item.aiTemplate || item.aiTemplateId || (typeof item._id === 'string' && item._id.startsWith('ai_')) || (typeof item.id === 'string' && item.id.startsWith('ai_')));
      let uri = item.mediaUrl || item.imageUrl || item.image || item.localUri;
      if (!uri) return;
      setDownloadingId(item._id);

      // Legacy re-compose ONLY for regular non-AI templates that need dynamic server rendering
      if (!isAi) {
        const tId = getTemplateId(item);
        if (tId && (!isVideoMedia(uri)) && (item.mediaType === 'video' || item.template?.type === 'video' || item.activeTemplate?.type === 'video')) {
          try {
            const res = await API.post(`/creations/${tId}/download`, {
              userNameText: item.userNameText || item.editedText,
              userPhotoUri: item.userPhotoUri || item.editedPhoto,
              selectedFooter: item.selectedFooter,
              customizationState: item.customizationState,
            });
            if (res.data?.data?.downloadUrl) {
              uri = res.data.data.downloadUrl;
            }
          } catch (e) {
            console.warn('Legacy re-compose fallback notice:', e?.message);
          }
        }
      }

      const isVideo = isAi
        ? (item.mediaType === 'video' || item.aiTemplate?.mediaType === 'video' || isVideoMedia(uri))
        : isVideoMedia(uri);
      const ext = isVideo ? 'mp4' : 'jpg';
      let localPath = uri;

      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const targetPath = `${FileSystem.documentDirectory}starpix_dl_${Date.now()}.${ext}`;
        const downloadSourceUrl = resolveMediaUrl(uri);
        let downloaded = await FileSystem.downloadAsync(downloadSourceUrl, targetPath);
        if (downloaded.status !== 200 && downloadSourceUrl !== uri) {
          downloaded = await FileSystem.downloadAsync(uri, targetPath);
        }
        if (downloaded.status === 200) {
          localPath = downloaded.uri;
        }
      }

      try {
        let permissionGranted = false;
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync(true);
          permissionGranted = status === 'granted';
        } catch (pErr) {
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            permissionGranted = status === 'granted';
          } catch (e2) {}
        }

        if (permissionGranted) {
          await MediaLibrary.createAssetAsync(localPath);
        }
      } catch (mediaErr) {
        console.warn('MediaLibrary save notice:', mediaErr?.message);
      }

      setRedownloadSuccessAlert(true);
    } catch (err) {
      console.error('Re-download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    // 1. Immediately dismiss confirmation dialog for snappy response
    setDeleteTarget(null);

    // 2. If the preview modal was open for this item, close it immediately
    if (previewItem) {
      const previewId = String(previewItem._id || previewItem.id || '');
      if (target.mode === 'all' || previewId === String(target.id)) {
        setPreviewItem(null);
      }
    }

    if (target.mode === 'all') {
      // Optimistic instant UI update
      clearDownloadedCreations();
      setBackendDownloads([]);
      setDeletedIds(new Set());
      if (user) {
        API.delete('/creations/clear-all').catch((e) => {
          console.error('[Optimistic Delete All Background Error]:', e);
        });
      }
    } else if (target.mode === 'one') {
      const targetId = String(target.id);
      // Optimistic instant UI update
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      removeDownloadedCreation(target.id);
      setBackendDownloads((prev) =>
        prev.filter((c) => String(c._id || c.id) !== targetId)
      );
      if (user) {
        API.delete(`/creations/${targetId}`).catch((e) => {
          console.error('[Optimistic Delete Item Background Error]:', e);
        });
      }
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <SectionHeader
          icon="📥"
          title={t('my_creations')}
          subtitle={t('downloads_subtitle')}
          style={styles.header}
        />

        {/* Clear All Toolbar */}
        {!loading && allCreations.filter((c) => !c.isGenerating).length > 0 && (
          <View style={styles.clearRow}>
            <Text style={styles.clearHint}>
              {allCreations.filter((c) => !c.isGenerating).length} saved{' '}
              {allCreations.filter((c) => !c.isGenerating).length === 1 ? 'creation' : 'creations'}
            </Text>
            <PressableScale
              onPress={() => setDeleteTarget({ mode: 'all' })}
              scaleTo={0.94}
              style={styles.clearBtn}
              contentStyle={styles.clearBtnContent}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.error} />
              <Text style={styles.clearBtnText}>{t('clear_all')}</Text>
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
            <View style={[styles.downloadSkeletonCard, { marginTop: 12 }]}>
              <Skeleton height={130} width={90} borderRadius={14} />
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 4 }}>
                <View>
                  <Skeleton height={18} width="55%" borderRadius={6} />
                  <Skeleton height={13} width="35%" borderRadius={4} style={{ marginTop: 6 }} />
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
              <Ionicons name="cloud-download-outline" size={42} color={COLORS.primary || COLORS.orange} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_downloads_yet')}</Text>
            <Text style={styles.emptySub}>
              {t('no_downloads_sub')}
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
              <DownloadCard
                item={item}
                onPressThumbnail={(it) => {
                  if (it.isGenerating) return;
                  setPreviewItem(it);
                }}
                onRedownload={handleRedownload}
                onShare={(img) => handleShare(img, item._id, item)}
                onDelete={(id) => setDeleteTarget({ mode: 'one', id })}
                isRedownloading={downloadingId === item._id}
                isSharing={sharingId === item._id}
                isAnyActionBusy={Boolean(downloadingId || sharingId)}
              />
            )}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={Boolean(deleteTarget)}
          title={deleteTarget?.mode === 'all' ? t('clear_all_downloads_title') : t('delete_download_title')}
          message={
            deleteTarget?.mode === 'all'
              ? t('clear_all_downloads_msg')
              : t('delete_download_msg')
          }
          confirmText={t('yes_delete')}
          cancelText={t('cancel')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* Share Fallback Alert */}
        <ConfirmModal
          visible={shareAlert}
          title={t('share')}
          message={t('select_app_to_share')}
          confirmText={t('got_it')}
          hideCancel={true}
          onConfirm={() => setShareAlert(false)}
        />

        {/* Re-download Success Alert */}
        <ConfirmModal
          visible={redownloadSuccessAlert}
          title={t('redownloaded_title')}
          message={t('redownloaded_msg')}
          icon="document-text-outline"
          iconColor={COLORS.primary || COLORS.orange}
          confirmText={t('got_it')}
          hideCancel={true}
          onConfirm={() => setRedownloadSuccessAlert(false)}
        />

        {/* Full Screen Image/Video Preview Modal */}
        <DownloadPreviewModal
          item={previewItem}
          visible={Boolean(previewItem && !previewItem.isGenerating)}
          insets={insets}
          onClose={() => setPreviewItem(null)}
          onRedownload={handleRedownload}
          onShare={(img) => handleShare(img, previewItem?._id, previewItem)}
          onDelete={(it) => setDeleteTarget({ mode: 'one', id: it._id || it.id })}
          isRedownloading={downloadingId === previewItem?._id}
          isSharing={sharingId === previewItem?._id}
          isAnyActionBusy={Boolean(downloadingId || sharingId)}
        />
      </View>
    </AppBackground>
  );
}

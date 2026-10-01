import React, { useState, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
import API from '../../src/utils/api';
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
  const user = useAuthStore((state) => state.user);

  const [backendDownloads, setBackendDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareAlert, setShareAlert] = useState(false);
  const [redownloadSuccessAlert, setRedownloadSuccessAlert] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const downloadedCreations = useCreationStore((state) => state.downloadedCreations || []);
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

  // Combine backend S3 downloads and local store downloads into a unified list
  const allCreations = [];
  const seenIds = new Set();

  backendDownloads.forEach((item) => {
    const cId = getCreationId(item);
    if (cId) seenIds.add(cId);

    const template = (typeof item.templateId === 'object' && item.templateId) ? item.templateId : {};
    const aiTemplate = (typeof item.aiTemplateId === 'object' && item.aiTemplateId) ? item.aiTemplateId : null;
    const customState = item.customizationState || {};
    const activeTmpl = aiTemplate || customState.activeTemplate || (template._id ? template : null);

    allCreations.push({
      _id: cId,
      title: item.templateTitle || aiTemplate?.title || template.name || 'Personalized Status',
      image: item.imageUrl || item.editedPhoto || aiTemplate?.thumbnailUrl || template.previewAsset || template.thumbnail,
      editedText: item.editedText || customState.userNameText || '',
      editedPhoto: item.editedPhoto || customState.userPhotoUri || '',
      downloadedAt: item.downloadedAt || item.createdAt,
      template: template,
      aiTemplate: aiTemplate,
      activeTemplate: activeTmpl,
      userPhotoUri: customState.userPhotoUri || item.editedPhoto || null,
      userNameText: customState.userNameText || item.editedText || '',
      userQuoteText: customState.userQuoteText || '',
      selectedFrame: customState.selectedFrame || null,
      selectedEffect: customState.selectedEffect || null,
      source: 'backend',
    });
  });

  downloadedCreations.forEach((item) => {
    const cId = getCreationId(item);
    const tId = getTemplateId(item);
    const text = item.editedText || item.userNameText || item.customizationState?.userNameText || '';
    const photo = item.userPhotoUri || item.editedPhoto || item.customizationState?.userPhotoUri || '';

    if (cId && seenIds.has(cId)) return;

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
      const aiTmpl = item.aiTemplate || customState.aiTemplate || null;
      allCreations.push({
        _id: cId || `local_${Date.now()}`,
        title: item.name || aiTmpl?.title || 'Personalized Status',
        image: item.localUri || item.thumbnail || item.editedPhoto,
        editedText: text,
        editedPhoto: photo,
        downloadedAt: item.createdAt || new Date().toISOString(),
        template: item.template || null,
        aiTemplate: aiTmpl,
        activeTemplate: item.activeTemplate || customState.activeTemplate || item.template || null,
        userPhotoUri: photo || null,
        userNameText: item.userNameText || customState.userNameText || text,
        userQuoteText: item.userQuoteText || customState.userQuoteText || '',
        selectedFrame: item.selectedFrame || customState.selectedFrame || null,
        selectedEffect: item.selectedEffect || customState.selectedEffect || null,
        source: 'local',
      });
    }
  });

  const handleShare = async (fileOrUrl) => {
    if (!fileOrUrl) return;
    try {
      const isVideo = isVideoMedia(fileOrUrl);
      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let shareUri = fileOrUrl;

      if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) {
        const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(fileOrUrl, fileUri);
        shareUri = downloaded.uri;
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
    }
  };

  const handleRedownload = async (item) => {
    try {
      const uri = item.image;
      if (!uri) return;

      const isVideo = isVideoMedia(uri);
      const ext = isVideo ? 'mp4' : 'jpg';
      let localPath = uri;

      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const targetPath = `${FileSystem.documentDirectory}starpix_dl_${Date.now()}.${ext}`;
        const downloaded = await FileSystem.downloadAsync(uri, targetPath);
        localPath = downloaded.uri;
      }

      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.createAssetAsync(localPath);
        }
      } catch (mediaErr) {
        console.warn('MediaLibrary save notice:', mediaErr?.message);
      }

      setRedownloadSuccessAlert(true);
    } catch (err) {
      console.error('Re-download error:', err);
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
                onPressThumbnail={(it) => setPreviewItem(it)}
                onRedownload={handleRedownload}
                onShare={(img) => handleShare(img)}
                onDelete={(id) => setDeleteTarget({ mode: 'one', id })}
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
          visible={Boolean(previewItem)}
          insets={insets}
          onClose={() => setPreviewItem(null)}
          onRedownload={handleRedownload}
          onShare={handleShare}
        />
      </View>
    </AppBackground>
  );
}

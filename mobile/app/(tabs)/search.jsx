import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import ReelPersonalizationOverlay from '../../src/components/ReelPersonalizationOverlay';
import DownloadShareModal from '../../src/components/DownloadShareModal';
import PaidTemplateConfirmModal from '../../src/components/PaidTemplateConfirmModal';
import AppVideo, { ResizeMode } from '../../src/components/AppVideo';
import Skeleton from '../../src/components/Skeleton';
import Toast from '../../src/components/Toast';

import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { hapticTap, hapticImpact } from '../../src/utils/haptics';
import * as Haptics from 'expo-haptics';
import API from '../../src/utils/api';
import { resolveMediaUrl } from '../../src/utils/media';
import { uploadUserMedia } from '../../src/utils/upload';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCreationStore } from '../../src/store/useCreationStore';
import { checkCanAccessTemplate } from '../../src/utils/subscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = wp(0.04);
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const storeUserPhotoUri = useCreationStore((s) => s.userPhotoUri || s.defaultUserPhotoUri);
  const storeUserNameText = useCreationStore((s) => s.userNameText || s.defaultUserNameText);

  const displayName = user?.name || user?.fullName || storeUserNameText || 'User';
  const displayPhoto = user?.profilePhoto || storeUserPhotoUri || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Viewer Modal State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFooterId, setSelectedFooterId] = useState('none');
  const [isViewerMuted, setIsViewerMuted] = useState(false);
  const [isViewerPlaying, setIsViewerPlaying] = useState(true);

  // Download / Share State
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);
  const [modalActionType, setModalActionType] = useState('download'); // 'download' | 'share'
  const [modalLoadingOption, setModalLoadingOption] = useState(null); // 'personalized' | 'clean' | null
  const [paidConfirmState, setPaidConfirmState] = useState(null);
  const [payingForTemplate, setPayingForTemplate] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  // Fetch templates and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tmplRes, catRes] = await Promise.all([
          API.get('/templates', { params: { limit: 120, sort: 'trending' } }),
          API.get('/categories', { params: { active: true } }),
        ]);

        if (tmplRes.data?.success && Array.isArray(tmplRes.data.data)) {
          const parsed = tmplRes.data.data.map((item, idx) => {
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
                  userPhotoPosition: f.userPhotoPosition || null,
                  userPhotoShape: f.userPhotoShape || f.shape || null,
                  shape: f.userPhotoShape || f.shape || null,
                  isNone: false,
                  isCustom: true,
                };
              });

            const isPaid = ['premium', 'paid', 'vip'].includes(item.accessType) || Number(item.price) > 0;

            return {
              id: item._id || `tmpl_${idx}`,
              _id: item._id,
              name: item.name,
              title: item.name,
              nameTranslations: item.nameTranslations,
              category: catRaw,
              categoryId: item.categoryId,
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
          setTemplates(parsed);
        }

        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.warn('Error fetching search data:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter templates based on search query and category
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catSlug = item.categoryId?.slug || item.category || '';
        const catId = item.categoryId?._id || item.categoryId || '';
        if (catSlug !== selectedCategory && catId !== selectedCategory) {
          return false;
        }
      }

      // Query filter
      if (!q) return true;

      const nameEn = (item.name || item.title || '').toLowerCase();
      const currentLang = i18n.language || 'en';
      const nameTrans = (item.nameTranslations && item.nameTranslations[currentLang] || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      return nameEn.includes(q) || nameTrans.includes(q) || cat.includes(q);
    });
  }, [templates, searchQuery, selectedCategory, i18n.language]);

  // Open Template in Interactive Home-like Viewer
  const handleOpenTemplate = (item) => {
    hapticTap();
    setSelectedTemplate(item);
    setSelectedFooterId(item.footers && item.footers.length > 0 ? item.footers[0].id : 'none');
    setIsViewerPlaying(true);
  };

  const handleCloseViewer = () => {
    hapticTap();
    setSelectedTemplate(null);
  };

  const activeFooter = useMemo(() => {
    if (!selectedTemplate || selectedFooterId === 'none') return null;
    return (selectedTemplate.footers || []).find((f) => f.id === selectedFooterId) || null;
  }, [selectedTemplate, selectedFooterId]);

  // Download & Share Handlers
  const handleDownloadPress = () => {
    hapticTap();
    setModalActionType('download');
    setShowDownloadShareModal(true);
  };

  const handleSharePress = () => {
    hapticTap();
    setModalActionType('share');
    setShowDownloadShareModal(true);
  };

  const executeDownloadAction = async (withPersonalization) => {
    if (!selectedTemplate) return;
    try {
      const targetFooter = withPersonalization ? activeFooter : null;
      let remoteUserPhoto = withPersonalization ? displayPhoto : null;

      let downloadUrl = selectedTemplate.mediaUrl || selectedTemplate.contentUrl || selectedTemplate.posterUrl;
      let isVideo = selectedTemplate.mediaType === 'video';

      // Save via Creations API
      try {
        const res = await API.post(`/creations/${selectedTemplate.id}/download`, {
          userNameText: withPersonalization ? displayName : '',
          userPhotoUri: remoteUserPhoto,
          selectedFooter: targetFooter,
          withPersonalization,
        }, { timeout: 45000 });
        if (res.data?.data?.downloadUrl) {
          downloadUrl = res.data.data.downloadUrl;
          if (typeof res.data.data.isVideo === 'boolean') isVideo = res.data.data.isVideo;
        }
      } catch (errApi) {}

      // Download file locally & save to gallery
      const ext = isVideo ? 'mp4' : 'jpg';
      let targetUri = downloadUrl;
      if (downloadUrl && downloadUrl.startsWith('http')) {
        const fileUri = `${FileSystem.documentDirectory}starpix_${Date.now()}.${ext}`;
        const dl = await FileSystem.downloadAsync(downloadUrl, fileUri);
        targetUri = dl.uri;
      }

      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.createAssetAsync(targetUri);
        }
      } catch (e) {}

      useCreationStore.getState().addDownloadedCreation({
        id: `search_${Date.now()}`,
        templateId: selectedTemplate.id,
        name: selectedTemplate.title,
        thumbnail: selectedTemplate.thumbnailUrl || targetUri,
        localUri: targetUri,
        image: downloadUrl,
        mediaUrl: downloadUrl,
        mediaType: isVideo ? 'video' : 'image',
        userNameText: withPersonalization ? displayName : '',
        userPhotoUri: remoteUserPhoto,
        selectedFooter: targetFooter,
        createdAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
      });

      showToast(t('download_saved_msg') || 'Template saved successfully!');
    } catch (err) {
      console.warn('Search download error:', err);
      showToast(t('download_saved_msg') || 'Template saved to library!');
    }
  };

  const executeShareAction = async (withPersonalization) => {
    if (!selectedTemplate) return;
    try {
      const targetFooter = withPersonalization ? activeFooter : null;
      let remoteUserPhoto = withPersonalization ? displayPhoto : null;

      let downloadUrl = selectedTemplate.mediaUrl || selectedTemplate.contentUrl || selectedTemplate.posterUrl;
      let isVideo = selectedTemplate.mediaType === 'video';

      try {
        const res = await API.post(`/creations/${selectedTemplate.id}/download`, {
          userNameText: withPersonalization ? displayName : '',
          userPhotoUri: remoteUserPhoto,
          selectedFooter: targetFooter,
          withPersonalization,
        }, { timeout: 45000 });
        if (res.data?.data?.downloadUrl) {
          downloadUrl = res.data.data.downloadUrl;
          if (typeof res.data.data.isVideo === 'boolean') isVideo = res.data.data.isVideo;
        }
      } catch (errApi) {}

      const ext = isVideo ? 'mp4' : 'jpg';
      let targetUri = downloadUrl;
      if (downloadUrl && downloadUrl.startsWith('http')) {
        const fileUri = `${FileSystem.cacheDirectory}starpix_share_${Date.now()}.${ext}`;
        const dl = await FileSystem.downloadAsync(downloadUrl, fileUri);
        targetUri = dl.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          dialogTitle: t('share_status') || 'Share Status',
        });
      }
    } catch (err) {
      console.warn('Search share error:', err);
    }
  };

  const handleModalOptionSelect = async (withPersonalization) => {
    setModalLoadingOption(withPersonalization ? 'personalized' : 'clean');
    try {
      if (modalActionType === 'share') {
        await executeShareAction(withPersonalization);
      } else {
        await executeDownloadAction(withPersonalization);
      }
    } finally {
      setModalLoadingOption(null);
      setShowDownloadShareModal(false);
    }
  };

  const handleEditPress = () => {
    if (!selectedTemplate) return;
    hapticTap();
    useCreationStore.getState().setActiveTemplate(selectedTemplate.rawTemplate || selectedTemplate);
    handleCloseViewer();
    router.push(`/template/${selectedTemplate.id}`);
  };

  // Dimensions for Viewer Card (matching Home page 9:16 aspect ratio)
  const viewerCardWidth = Math.min(SCREEN_WIDTH * 0.76, 290);
  const viewerCardHeight = Math.round(viewerCardWidth * (16 / 9));

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
        {/* Search Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('nav_search') || 'Search'}</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_templates_placeholder') || 'Search templates by name, festival...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                hapticTap();
                setSelectedCategory('all');
              }}
              style={[
                styles.filterChip,
                selectedCategory === 'all' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                {t('all') || 'All'}
              </Text>
            </TouchableOpacity>

            {categories.map((c) => {
              const isSelected = selectedCategory === (c.slug || c._id);
              const label =
                (c.nameTranslations && c.nameTranslations[i18n.language]) ||
                c.name ||
                c.slug;

              return (
                <TouchableOpacity
                  key={c._id || c.slug}
                  activeOpacity={0.8}
                  onPress={() => {
                    hapticTap();
                    setSelectedCategory(c.slug || c._id);
                  }}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                >
                  {c.icon ? <Text style={styles.filterChipIcon}>{c.icon}</Text> : null}
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Grid: 2 templates in one row */}
        {loading ? (
          <View style={styles.skeletonGrid}>
            <View style={styles.skeletonRow}>
              <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={16} />
              <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={16} />
            </View>
            <View style={styles.skeletonRow}>
              <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={16} />
              <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={16} />
            </View>
          </View>
        ) : filteredTemplates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('no_search_results') || 'No templates found'}</Text>
            <Text style={styles.emptySubtitle}>
              {t('try_different_search') || 'Try searching for another festival, category or name.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 70 },
            ]}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => {
              const currentLang = i18n.language || 'en';
              const title =
                (item.nameTranslations && item.nameTranslations[currentLang]) ||
                item.name ||
                item.title;

              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleOpenTemplate(item)}
                  style={styles.templateCard}
                >
                  <View style={styles.thumbWrapper}>
                    <Image
                      source={{ uri: item.thumbnailUrl || item.posterUrl }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />

                    {/* Badge: Free vs Paid */}
                    <View
                      style={[
                        styles.badge,
                        item.isPaid ? styles.badgePaid : styles.badgeFree,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.isPaid ? styles.badgePaidText : styles.badgeFreeText,
                        ]}
                      >
                        {item.isPaid ? `₹${item.price || 49}` : (t('free') || 'FREE')}
                      </Text>
                    </View>

                    {/* Media Type Icon */}
                    {item.mediaType === 'video' && (
                      <View style={styles.videoBadge}>
                        <Ionicons name="play" size={11} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <Text style={styles.templateTitle} numberOfLines={1}>
                    {title}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Interactive Viewer Modal (exact Home page options, user info, footer attached) */}
        <Modal
          visible={selectedTemplate !== null}
          transparent={false}
          animationType="slide"
          onRequestClose={handleCloseViewer}
        >
          <AppBackground>
            <StatusBar style="dark" />
            {selectedTemplate && (
              <View style={[styles.viewerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
                {/* Viewer Top Bar */}
                <View style={styles.viewerHeader}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCloseViewer}
                    style={styles.viewerCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#1E293B" />
                  </TouchableOpacity>

                  <Text style={styles.viewerTitle} numberOfLines={1}>
                    {(selectedTemplate.nameTranslations && selectedTemplate.nameTranslations[i18n.language]) ||
                      selectedTemplate.name}
                  </Text>

                  {selectedTemplate.mediaType === 'video' ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticTap();
                        setIsViewerMuted((m) => !m);
                      }}
                      style={styles.viewerSoundBtn}
                    >
                      <Ionicons
                        name={isViewerMuted ? 'volume-mute' : 'volume-high'}
                        size={18}
                        color="#1E293B"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 36 }} />
                  )}
                </View>

                {/* Viewer Card with User Personalization & Footer */}
                <View style={styles.viewerCardArea}>
                  <View
                    style={[
                      styles.viewerReelCard,
                      { width: viewerCardWidth, height: viewerCardHeight },
                    ]}
                  >
                    {/* Media Layer */}
                    {selectedTemplate.mediaType === 'video' ? (
                      <AppVideo
                        source={{ uri: selectedTemplate.mediaUrl || selectedTemplate.contentUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isViewerPlaying}
                        isLooping
                        isMuted={isViewerMuted}
                      />
                    ) : (
                      <Image
                        source={{ uri: selectedTemplate.contentUrl || selectedTemplate.posterUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    )}

                    {/* Attached Footer Layer */}
                    {activeFooter && activeFooter.asset && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.viewerFooterLayer,
                          {
                            width: viewerCardWidth,
                            height: Math.round(viewerCardHeight * ((activeFooter.heightPercent || 40) / 100)),
                            bottom: 0,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: resolveMediaUrl(activeFooter.asset) }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {/* User Info & Overlay */}
                    <ReelPersonalizationOverlay
                      frameId={selectedFooterId}
                      customFooter={activeFooter}
                      canvasConfig={selectedTemplate.canvasConfig}
                      userName={displayName}
                      userPhotoUri={displayPhoto}
                      cardWidth={viewerCardWidth}
                      cardHeight={viewerCardHeight}
                      isPlaying={isViewerPlaying}
                    />
                  </View>
                </View>

                {/* Action Buttons: Download, Share, Edit (Matching Home Page) */}
                <View style={[styles.viewerActionRow, { width: viewerCardWidth }]}>
                  {/* Download Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleDownloadPress}
                    style={[styles.viewerActionBtn, styles.viewerDownloadBtn]}
                  >
                    <Ionicons name="download-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.viewerDownloadText}>{t('download') || 'Download'}</Text>
                  </TouchableOpacity>

                  {/* Share Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleSharePress}
                    style={[styles.viewerActionBtn, styles.viewerShareBtn]}
                  >
                    <Ionicons name="share-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.viewerShareText}>{t('share') || 'Share'}</Text>
                  </TouchableOpacity>

                  {/* Edit Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleEditPress}
                    style={styles.viewerEditBtn}
                  >
                    <MaterialCommunityIcons name="pencil-plus-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Footer Selector Row */}
                {selectedTemplate.footers && selectedTemplate.footers.length > 0 && (
                  <View style={[styles.viewerFootersWrap, { width: viewerCardWidth }]}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.viewerFootersScroll}
                    >
                      {/* None option */}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          hapticTap();
                          setSelectedFooterId('none');
                        }}
                        style={[
                          styles.footerThumbBox,
                          selectedFooterId === 'none' && styles.footerThumbBoxActive,
                        ]}
                      >
                        <Ionicons name="ban-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>

                      {selectedTemplate.footers.map((f, idx) => {
                        const isSelected = selectedFooterId === f.id;
                        const thumbUri = f.thumb || f.thumbnail || f.asset;
                        return (
                          <TouchableOpacity
                            key={f.id || `f_${idx}`}
                            activeOpacity={0.75}
                            onPress={() => {
                              hapticTap();
                              setSelectedFooterId(f.id);
                            }}
                            style={[
                              styles.footerThumbBox,
                              isSelected && styles.footerThumbBoxActive,
                            ]}
                          >
                            <Image
                              source={{ uri: resolveMediaUrl(thumbUri) }}
                              style={styles.footerThumbImg}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Download / Share Modal with personalization options */}
            <DownloadShareModal
              visible={showDownloadShareModal}
              actionType={modalActionType}
              activeTemplate={selectedTemplate?.rawTemplate || selectedTemplate}
              userPhotoUri={displayPhoto}
              userNameText={displayName}
              selectedFooter={activeFooter}
              onClose={() => {
                if (!modalLoadingOption) setShowDownloadShareModal(false);
              }}
              onSelect={handleModalOptionSelect}
              loadingOption={modalLoadingOption}
            />

            <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
          </AppBackground>
        </Modal>

        <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: fontScale(22),
    fontFamily: FONTS.bold,
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
    color: '#0F172A',
  },
  categoryRowWrap: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: GRID_PADDING,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#9F1239',
    borderColor: '#9F1239',
  },
  filterChipIcon: {
    fontSize: fontScale(12),
  },
  filterChipText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.semiBold,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 6,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  templateCard: {
    width: CARD_WIDTH,
  },
  thumbWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  badgeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  badgePaid: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
  },
  badgeText: {
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
  },
  badgeFreeText: {
    color: '#FFFFFF',
  },
  badgePaidText: {
    color: '#FFFFFF',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: fontScale(12),
    fontFamily: FONTS.semiBold,
    color: '#1E293B',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  skeletonGrid: {
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
    paddingTop: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Interactive Viewer Styles
  viewerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp(0.045),
    paddingBottom: 8,
  },
  viewerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerTitle: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  viewerSoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerReelCard: {
    borderRadius: wp(0.045),
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  viewerFooterLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
  },
  viewerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  viewerActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerDownloadBtn: {
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  viewerDownloadText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  viewerShareBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  viewerShareText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  viewerEditBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  viewerFootersWrap: {
    marginTop: 10,
    marginBottom: 16,
  },
  viewerFootersScroll: {
    gap: 8,
  },
  footerThumbBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerThumbBoxActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFE4E6',
  },
  footerThumbImg: {
    width: '100%',
    height: '100%',
  },
});

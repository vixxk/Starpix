import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AppVideo, { ResizeMode } from './AppVideo';
import ReelPersonalizationOverlay from './ReelPersonalizationOverlay';
import Skeleton from './Skeleton';
import { resolveMediaUrl } from '../utils/media';
import { FONTS, COLORS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticTap } from '../utils/haptics';
import { useAuthStore } from '../store/useAuthStore';

const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

/**
 * Exact replica of the template card rendered on the user app home page.
 * Displays the main template media, real custom footer overlay (asset, not icon thumbnail),
 * and personalized name/photo overlay (or clean without name/photo).
 */
function ContentPreviewCard({
  item,
  selectedFooter,
  userName,
  userPhotoUri,
  width,
  height,
  withPersonalization,
}) {
  // 1. Resolve template media candidates matching home page feed (prioritize real template media)
  const isVideo =
    isVideoMedia(item.mainMedia) ||
    isVideoMedia(item.contentUrl) ||
    isVideoMedia(item.mediaUrl) ||
    isVideoMedia(item.previewAsset) ||
    item.mediaType === 'video';

  const rawVideo = isVideo
    ? (item.mainMedia || item.contentUrl || item.mediaUrl || item.previewAsset || '')
    : '';
  const resolvedVideoUri = rawVideo ? resolveMediaUrl(rawVideo) : null;

  const rawImage = !isVideo
    ? ((item.mainMedia && !isVideoMedia(item.mainMedia) ? item.mainMedia : null) ||
       (item.contentUrl && !isVideoMedia(item.contentUrl) ? item.contentUrl : null) ||
       (item.mediaUrl && !isVideoMedia(item.mediaUrl) ? item.mediaUrl : null) ||
       (item.canvasConfig ? item.canvasConfig.backgroundImage : null) ||
       item.previewAsset ||
       item.previewImage ||
       item.previewUrl ||
       item.thumbnailUrl ||
       item.thumbnail ||
       '')
    : '';
  const resolvedImageUri = rawImage ? resolveMediaUrl(rawImage) : null;

  // 2. Custom Footer Overlay - Only if a footer was selected (never if none/null)
  const isNoneFooter =
    !selectedFooter ||
    selectedFooter === 'none' ||
    selectedFooter === false ||
    (selectedFooter && selectedFooter.isNone === true);

  // Use the actual footer asset (never the tiny selector thumbnail icon)
  const footerAsset = !isNoneFooter
    ? (selectedFooter.videoAsset || selectedFooter.asset || selectedFooter.imageUrl || '')
    : '';
  const footerUri = footerAsset ? resolveMediaUrl(footerAsset) : null;

  const isVideoFooter = Boolean(
    footerAsset && (
      (selectedFooter && selectedFooter.type === 'video') ||
      footerAsset.endsWith('.mp4') ||
      footerAsset.endsWith('.webm') ||
      footerAsset.includes('.mp4?') ||
      footerAsset.includes('/video/')
    )
  );

  const parseNorm = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return null;
    return val > 3 ? val / 100 : val;
  };

  const heightVal = (selectedFooter && selectedFooter.height !== undefined)
    ? parseNorm(selectedFooter.height)
    : (selectedFooter && typeof selectedFooter.heightPercent === 'number' ? selectedFooter.heightPercent / 100 : null);
  const heightNorm = heightVal !== null ? heightVal : 0.4;
  const isFullOverlay = heightNorm >= 0.75 || (selectedFooter && typeof selectedFooter.heightPercent === 'number' && selectedFooter.heightPercent >= 75);

  const parsedY = (selectedFooter && selectedFooter.y !== undefined) ? parseNorm(selectedFooter.y) : null;
  const yNorm = parsedY !== null ? parsedY : (1 - heightNorm / 2);

  // Stretches footer across card width matching home page line 1076
  const fWidth = width;
  const fHeight = isFullOverlay ? height : Math.round(heightNorm * height);
  const fLeft = 0;
  let fTop = isFullOverlay ? 0 : Math.round(yNorm * height - fHeight / 2);
  if (!isFullOverlay) {
    if (fTop + fHeight > height) fTop = height - fHeight;
    if (fTop < 0) fTop = 0;
  }

  const fitMode = (selectedFooter && selectedFooter.objectFit === 'cover') ? 'cover' : 'stretch';
  const videoResizeMode = (selectedFooter && selectedFooter.objectFit === 'cover') ? ResizeMode.COVER : ResizeMode.STRETCH;

  const itemId = (item && (item.id || item._id)) || '';
  const hasBgMedia = Boolean(resolvedImageUri || resolvedVideoUri);
  const hasFooterMedia = Boolean(!isNoneFooter && footerUri);

  const [bgLoaded, setBgLoaded] = React.useState(!hasBgMedia);
  const [footerLoaded, setFooterLoaded] = React.useState(!hasFooterMedia);

  React.useEffect(() => {
    setBgLoaded(!hasBgMedia);
    setFooterLoaded(!hasFooterMedia);

    // Timeout safety fallback: if network is slow or callbacks are delayed, reveal gracefully after 3.5s
    const timer = setTimeout(() => {
      setBgLoaded(true);
      setFooterLoaded(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [itemId, resolvedVideoUri, resolvedImageUri, footerUri, hasBgMedia, hasFooterMedia]);

  const isFullyLoaded = bgLoaded && footerLoaded;

  return (
    <View style={{ width, height, position: 'relative', overflow: 'hidden', borderRadius: 14, backgroundColor: '#07140B' }}>
      {/* 1. Main Background Content - EXACTLY matching home page */}
      <View style={StyleSheet.absoluteFillObject}>
        {resolvedImageUri && !isVideoMedia(resolvedImageUri) ? (
          <Image
            source={{ uri: resolvedImageUri }}
            style={{ width, height, position: 'absolute', top: 0, left: 0 }}
            resizeMode="stretch"
            onLoad={() => setBgLoaded(true)}
            onLoadEnd={() => setBgLoaded(true)}
            onError={() => setBgLoaded(true)}
          />
        ) : resolvedVideoUri ? (
          <AppVideo
            source={{ uri: resolvedVideoUri }}
            style={{ width, height, position: 'absolute', top: 0, left: 0 }}
            resizeMode={ResizeMode.STRETCH}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            onReadyForDisplay={() => setBgLoaded(true)}
            onLoad={() => setBgLoaded(true)}
            onError={() => setBgLoaded(true)}
          />
        ) : null}
      </View>

      {/* 2. Custom Footer Overlay - EXACTLY matching home page, using real asset */}
      {!isNoneFooter && footerUri ? (
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
            zIndex: (selectedFooter && selectedFooter.zIndex) || 10,
          }}
          pointerEvents="none"
        >
          {isVideoFooter ? (
            <AppVideo
              source={{ uri: footerUri }}
              style={{ width: fWidth, height: fHeight }}
              resizeMode={videoResizeMode}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              onReadyForDisplay={() => setFooterLoaded(true)}
              onLoad={() => setFooterLoaded(true)}
              onError={() => setFooterLoaded(true)}
            />
          ) : (
            <Image
              source={{ uri: footerUri }}
              style={{ width: fWidth, height: fHeight }}
              resizeMode={fitMode}
              onLoad={() => setFooterLoaded(true)}
              onLoadEnd={() => setFooterLoaded(true)}
              onError={() => setFooterLoaded(true)}
            />
          )}
        </View>
      ) : null}

      {/* 3. Personalized Overlay with User Name & Photo - EXACTLY matching home page */}
      {withPersonalization && (
        <ReelPersonalizationOverlay
          frameId={(selectedFooter && selectedFooter.id) || 'curr'}
          customFooter={!isNoneFooter ? selectedFooter : null}
          canvasConfig={item.canvasConfig}
          userName={userName}
          userPhotoUri={userPhotoUri}
          cardWidth={width}
          cardHeight={height}
          isPlaying={false}
        />
      )}

      {/* 4. Skeleton Loading Overlay: Shown until fully loaded */}
      {!isFullyLoaded && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.cardSkeletonOverlay,
          ]}
          pointerEvents="none"
        >
          <Skeleton
            width={width}
            height={height}
            borderRadius={14}
            style={{ backgroundColor: '#1E293B' }}
          >
            <View style={styles.cardSkeletonContent}>
              {withPersonalization && (
                <View style={styles.skeletonPersonalizationGroup}>
                  <View style={styles.skeletonPhotoSlot} />
                  <View style={styles.skeletonTextLine} />
                </View>
              )}
              {hasFooterMedia && (
                <View
                  style={[
                    styles.skeletonFooterStrip,
                    isFullOverlay && styles.skeletonFullOverlayBorder,
                  ]}
                />
              )}
            </View>
          </Skeleton>
        </View>
      )}
    </View>
  );
}

export default function DownloadShareModal({
  visible,
  actionType = 'download', // 'download' | 'share'
  activeTemplate,
  userPhotoUri,
  userNameText,
  userQuoteText,
  selectedFooter,
  selectedEffect,
  photoTransform,
  nameTransform,
  onClose,
  onSelect, // (withPersonalization: boolean) => void
  loadingOption = null, // 'personalized' | 'clean' | null
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  if (!visible || !activeTemplate) return null;

  const isShare = actionType === 'share';
  const actionButtonText = isShare
    ? (t('share') || 'Share')
    : (t('download') || 'Download');
  const actionIcon = isShare ? 'share-social' : 'download';

  const THUMB_WIDTH = Math.min(wp(0.38), 145);
  const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 1.35);

  const tmpl = activeTemplate.rawTemplate
    ? { ...activeTemplate.rawTemplate, ...activeTemplate }
    : activeTemplate;

  const templateFooters = (tmpl.footers && Array.isArray(tmpl.footers) && tmpl.footers.length > 0)
    ? tmpl.footers
    : ((activeTemplate.footers && Array.isArray(activeTemplate.footers) && activeTemplate.footers.length > 0)
        ? activeTemplate.footers
        : (tmpl.rawTemplate && Array.isArray(tmpl.rawTemplate.footers) ? tmpl.rawTemplate.footers : []));

  let effectiveFooter = selectedFooter !== undefined ? selectedFooter : (selectedEffect || null);
  if (effectiveFooter === 'none' || effectiveFooter === false || (effectiveFooter && effectiveFooter.isNone)) {
    effectiveFooter = null;
  } else if (typeof effectiveFooter === 'string') {
    effectiveFooter = templateFooters.find(
      (f) => String(f.id || f._id) === String(effectiveFooter) || f.name === effectiveFooter
    ) || null;
  } else if (effectiveFooter && typeof effectiveFooter === 'object') {
    const matchId = effectiveFooter._id || effectiveFooter.id;
    const dbMatch = templateFooters.find(
      (f) => (matchId && String(f._id || f.id) === String(matchId)) || (f.name && f.name === effectiveFooter.name)
    );
    if (dbMatch) {
      effectiveFooter = {
        ...dbMatch,
        ...effectiveFooter,
        asset: effectiveFooter.asset || dbMatch.asset || dbMatch.videoAsset || '',
        videoAsset: effectiveFooter.videoAsset || dbMatch.videoAsset || dbMatch.asset || '',
        imageUrl: effectiveFooter.imageUrl || dbMatch.imageUrl || '',
      };
    }
  }

  const effectiveUserName = userNameText || (authUser ? (authUser.name || authUser.displayName) : '') || '';
  const effectiveUserPhoto = userPhotoUri || (authUser ? authUser.profilePhoto : null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {/* Top Close Button (X) at Top-Right matching reference */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticTap();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2-Columns Side by Side Cards */}
          <View style={styles.cardsRow}>
            {/* Column 1: With name and photo */}
            <View style={styles.cardContainer}>
              <View style={[styles.thumbWrap, { width: THUMB_WIDTH, height: THUMB_HEIGHT }]}>
                <ContentPreviewCard
                  item={tmpl}
                  selectedFooter={effectiveFooter}
                  userName={effectiveUserName}
                  userPhotoUri={effectiveUserPhoto}
                  width={THUMB_WIDTH}
                  height={THUMB_HEIGHT}
                  withPersonalization={true}
                />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {t('with_name_and_photo') || 'With name and photo'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={Boolean(loadingOption)}
                onPress={() => {
                  hapticTap();
                  onSelect(true);
                }}
                style={[styles.actionBtn, styles.primaryBtn]}
              >
                {loadingOption === 'personalized' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name={actionIcon} size={15} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>{actionButtonText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Column 2: Without name and photo */}
            <View style={styles.cardContainer}>
              <View style={[styles.thumbWrap, { width: THUMB_WIDTH, height: THUMB_HEIGHT }]}>
                <ContentPreviewCard
                  item={tmpl}
                  selectedFooter={effectiveFooter}
                  userName=""
                  userPhotoUri={null}
                  width={THUMB_WIDTH}
                  height={THUMB_HEIGHT}
                  withPersonalization={false}
                />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {t('without_name_and_photo') || 'Without name and photo'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={Boolean(loadingOption)}
                onPress={() => {
                  hapticTap();
                  onSelect(false);
                }}
                style={[styles.actionBtn, styles.secondaryBtn]}
              >
                {loadingOption === 'clean' ? (
                  <ActivityIndicator size="small" color="#1E293B" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name={actionIcon} size={15} color="#1E293B" />
                    <Text style={styles.secondaryBtnText}>{actionButtonText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semiBold,
    color: '#1E293B',
    textAlign: 'center',
    marginVertical: 10,
    minHeight: 32,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: '100%',
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#EE1D24',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#1E293B',
  },
  cardSkeletonOverlay: {
    zIndex: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardSkeletonContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonPersonalizationGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 6,
  },
  skeletonPhotoSlot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  skeletonTextLine: {
    width: '60%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  skeletonFooterStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '24%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  skeletonFullOverlayBorder: {
    height: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

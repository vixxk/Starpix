import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Modal, Pressable, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../../../constants/colors';
import AppVideo, { ResizeMode } from '../../../components/AppVideo';
import PressableScale from '../../../components/PressableScale';
import ReelPersonalizationOverlay from '../../../components/ReelPersonalizationOverlay';
import { resolveMediaUrl } from '../../../utils/media';
import { wp, hp } from '../../../utils/responsive';
import { getLocalizedName } from '../../../utils/localized';
import { hapticTap } from '../../../utils/haptics';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCreationStore } from '../../../store/useCreationStore';
import { isVideoMedia, getCardThumbnail } from '../constants';
import { styles } from '../styles';

export default function DownloadPreviewModal({
  item,
  visible,
  insets,
  onClose,
  onRedownload,
  onShare,
  onDelete,
  isRedownloading = false,
  isSharing = false,
}) {
  const { t, i18n } = useTranslation();
  const [mediaLoading, setMediaLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const storeUserName = useCreationStore((state) => state.userNameText || state.defaultUserNameText);
  const storeUserPhoto = useCreationStore((state) => state.userPhotoUri || state.defaultUserPhotoUri);

  const lastItemRef = useRef(item);
  if (item) {
    lastItemRef.current = item;
  }
  const displayItem = item || lastItemRef.current;

  useEffect(() => {
    if (visible && item) {
      setMediaLoading(true);
      const timer = setTimeout(() => setMediaLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [visible, item]);

  if (!displayItem) return null;

  const handleClose = () => {
    hapticTap();
    onClose();
  };

  const mediaSource =
    displayItem.mediaUrl ||
    displayItem.image ||
    displayItem.localUri ||
    displayItem.imageUrl ||
    (displayItem.template && (displayItem.template.mainMedia || displayItem.template.previewAsset));

  const isVideo = displayItem.mediaType === 'video' || isVideoMedia(mediaSource);

  const templateObj = displayItem.activeTemplate || displayItem.template;
  const canvasConfig = displayItem.canvasConfig || templateObj?.canvasConfig || null;

  const cleanUrl = (url) => (typeof url === 'string' ? url.split('?')[0].trim().toLowerCase() : '');
  const rawTemplateMedia =
    templateObj?.mainMedia ||
    templateObj?.previewAsset ||
    templateObj?.contentUrl ||
    (templateObj?.canvasConfig && templateObj.canvasConfig.backgroundImage) ||
    '';
  const cleanMedia = cleanUrl(mediaSource);
  const cleanRaw = cleanUrl(rawTemplateMedia);
  const isRawTemplate = Boolean(cleanRaw && cleanMedia && cleanMedia === cleanRaw);

  const isComposedMedia = Boolean(
    mediaSource && !isRawTemplate && (
      cleanMedia.includes('/user-creations/') ||
      cleanMedia.includes('status_') ||
      cleanMedia.includes('creation_') ||
      cleanMedia.includes('starpix_') ||
      cleanMedia.includes('reel_') ||
      cleanMedia.startsWith('file:') ||
      cleanMedia.startsWith('data:') ||
      Boolean(rawTemplateMedia && cleanMedia !== cleanRaw) ||
      Boolean(displayItem.source === 'backend' || displayItem.source === 'local')
    )
  );

  const footers =
    displayItem.footers && displayItem.footers.length > 0
      ? displayItem.footers
      : templateObj?.footers && templateObj.footers.length > 0
      ? templateObj.footers
      : [];

  const customFooter =
    displayItem.selectedFooter ||
    (footers.length > 0 ? footers[0] : null);

  const normalizedFooter = customFooter
    ? {
        ...customFooter,
        id: customFooter.id || (customFooter._id ? String(customFooter._id) : 'footer_1'),
      }
    : null;

  const frameId =
    displayItem.selectedFrame ||
    (normalizedFooter ? normalizedFooter.id : (templateObj?.defaultFrame || 'durga_puja'));

  const userName =
    (displayItem.userNameText && displayItem.userNameText.trim()) ||
    (displayItem.editedText && displayItem.editedText.trim()) ||
    (storeUserName && storeUserName.trim()) ||
    user?.name ||
    user?.fullName ||
    'User';

  const userPhotoUri =
    displayItem.userPhotoUri ||
    displayItem.editedPhoto ||
    storeUserPhoto ||
    user?.profilePhoto ||
    user?.avatar ||
    null;

  const localizedTitle =
    getLocalizedName(displayItem.activeTemplate || displayItem.aiTemplate || displayItem.template, i18n.language) ||
    displayItem.title ||
    'Starpix Creation';

  const maxW = wp(0.92);
  const maxH = hp(0.68);
  let cardWidth = maxW;
  let cardHeight = cardWidth * (16 / 9);
  if (cardHeight > maxH) {
    cardHeight = maxH;
    cardWidth = cardHeight * (9 / 16);
  }

  return (
    <Modal
      visible={visible && Boolean(item)}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.fullscreenOverlay}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={[styles.fullscreenHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <Text style={styles.fullscreenTitle} numberOfLines={1}>
            {localizedTitle}
          </Text>
          <View style={styles.headerRightButtons}>
            {onDelete && (
              <TouchableOpacity
                onPress={() => {
                  hapticTap();
                  onDelete(displayItem);
                }}
                style={styles.deleteHeaderBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t('delete') || 'Delete'}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Full Screen Media Area with Attached Template Footer & Name */}
        <Pressable style={styles.fullscreenContentArea} onPress={handleClose}>
          <View
            style={{
              width: cardWidth,
              height: cardHeight,
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#07140B',
            }}
          >
            {/* 1. Base media */}
            <View style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
              {isVideo ? (
                <AppVideo
                  key={`base_vid_${displayItem._id || 'view'}`}
                  source={{ uri: resolveMediaUrl(mediaSource) }}
                  style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0 }}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay={visible}
                  isMuted={isMuted}
                  onReadyForDisplay={() => setMediaLoading(false)}
                  onLoad={() => setMediaLoading(false)}
                />
              ) : (
                <Image
                  source={{ uri: resolveMediaUrl(mediaSource || getCardThumbnail(displayItem)) }}
                  style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0 }}
                  resizeMode="cover"
                  onLoadStart={() => setMediaLoading(true)}
                  onLoadEnd={() => setMediaLoading(false)}
                />
              )}
            </View>

            {/* 2. Attached Animated Video/Image Footer (only if not already composed in base media) */}
            {!isComposedMedia && customFooter ? (() => {
              const rawAsset = customFooter.videoAsset || customFooter.asset;
              if (!rawAsset) return null;
              const footerUri = resolveMediaUrl(rawAsset);
              const isFootVid = Boolean(
                customFooter.type === 'video' ||
                customFooter.videoAsset ||
                (typeof rawAsset === 'string' && rawAsset.match(/\.(mp4|webm|mov)(\?.*)?$/i))
              );
              const heightNorm =
                typeof customFooter.height === 'number'
                  ? (customFooter.height > 1 ? customFooter.height / 100 : customFooter.height)
                  : (typeof customFooter.heightPercent === 'number' ? customFooter.heightPercent / 100 : 0.4);

              const widthNorm =
                typeof customFooter.width === 'number'
                  ? (customFooter.width > 1 ? customFooter.width / 100 : customFooter.width)
                  : 1.0;

              const fWidth = widthNorm * cardWidth;
              const fHeight = heightNorm * cardHeight;

              const xNorm = typeof customFooter.x === 'number'
                ? (customFooter.x > 1 ? customFooter.x / 100 : customFooter.x)
                : 0.5;

              const yNorm = typeof customFooter.y === 'number'
                ? (customFooter.y > 1 ? customFooter.y / 100 : customFooter.y)
                : (1 - heightNorm / 2);

              const fLeft = xNorm * cardWidth - fWidth / 2;
              const fTop = yNorm * cardHeight - fHeight / 2;

              const fitMode = customFooter.objectFit === 'cover'
                ? 'cover'
                : customFooter.objectFit === 'fill'
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
                    zIndex: 20,
                    elevation: 10,
                  }}
                  pointerEvents="none"
                >
                  {isFootVid ? (
                    <AppVideo
                      key={`foot_vid_${displayItem._id || 'view'}`}
                      source={{ uri: footerUri }}
                      style={{ width: fWidth, height: fHeight }}
                      resizeMode={fitMode === 'cover' ? ResizeMode.COVER : fitMode === 'fill' ? ResizeMode.STRETCH : ResizeMode.CONTAIN}
                      shouldPlay={visible}
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
            })() : null}

            {/* 3. Personalized User Name and Photo Overlay (only if not already composed in base media) */}
            {!isComposedMedia && (
              <ReelPersonalizationOverlay
                frameId={frameId}
                customFooter={normalizedFooter}
                canvasConfig={canvasConfig}
                userName={userName}
                userPhotoUri={userPhotoUri}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                isPlaying={true}
              />
            )}

            {mediaLoading && (
              <View
                style={{
                  position: 'absolute',
                  zIndex: 40,
                  alignSelf: 'center',
                  top: '46%',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: 20,
                  padding: 10,
                }}
                pointerEvents="none"
              >
                <ActivityIndicator size="small" color="#EE1D24" />
              </View>
            )}

            {isVideo && (
              <PressableScale
                onPress={() => {
                  hapticTap();
                  setIsMuted((prev) => !prev);
                }}
                scaleTo={0.93}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.soundBadgeContainer,
                  isMuted ? styles.soundBadgeMuted : styles.soundBadgeActive,
                  { maxWidth: cardWidth * 0.52 },
                ]}
                accessibilityLabel={
                  isMuted
                    ? t('sound_unmute', { defaultValue: 'Turn Sound On' })
                    : t('sound_mute', { defaultValue: 'Mute Sound' })
                }
              >
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={14}
                  color={isMuted ? '#F59E0B' : '#FFFFFF'}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.soundText}
                >
                  {isMuted
                    ? t('sound_off', { defaultValue: 'Sound Off' })
                    : t('sound_on', { defaultValue: 'Sound On' })}
                </Text>
              </PressableScale>
            )}
          </View>
        </Pressable>

        {/* Footer Action Controls */}
        <View style={[styles.fullscreenFooter, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          <PressableScale
            onPress={() => onRedownload(displayItem)}
            scaleTo={0.94}
            style={styles.fullscreenActionBtn}
            contentStyle={styles.fullscreenBtnContent}
            disabled={isRedownloading}
          >
            {isRedownloading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={COLORS.white} />
                <Text style={styles.fullscreenActionText}>{t('re_download')}</Text>
              </>
            )}
          </PressableScale>

          <PressableScale
            onPress={() => onShare(mediaSource)}
            scaleTo={0.94}
            style={styles.fullscreenShareBtn}
            contentStyle={styles.fullscreenBtnContent}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={COLORS.ink} />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={18} color={COLORS.ink} />
                <Text style={[styles.fullscreenActionText, { color: COLORS.ink }]}>{t('share')}</Text>
              </>
            )}
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

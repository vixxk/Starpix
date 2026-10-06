import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Share, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateRenderer from '../../src/components/TemplateRenderer';
import PaywallModal from '../../src/components/PaywallModal';
import ConfirmModal from '../../src/components/ConfirmModal';
import PaidTemplateConfirmModal from '../../src/components/PaidTemplateConfirmModal';
import DownloadShareModal from '../../src/components/DownloadShareModal';
import Skeleton from '../../src/components/Skeleton';
import BackButton from '../../src/components/BackButton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { hapticSuccess, hapticTap } from '../../src/utils/haptics';
import { useCreationStore } from '../../src/store/useCreationStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { uploadUserMedia } from '../../src/utils/upload';
import { checkCanAccessTemplate } from '../../src/utils/subscription';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH * 0.85;
const CANVAS_HEIGHT = CANVAS_WIDTH * (16 / 9);

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isEntitled, setIsEntitled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { kind: 'saved' | 'failed', message? }
  const [paidConfirmInfo, setPaidConfirmInfo] = useState(null); // { action: 'download' | 'share' }
  const [payingPaid, setPayingPaid] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);
  const [modalActionType, setModalActionType] = useState('download');
  const [modalLoadingOption, setModalLoadingOption] = useState(null); // 'personalized' | 'clean' | null

  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const {
    activeTemplate,
    userPhotoUri,
    userNameText,
    userQuoteText,
    selectedFrame,
    selectedEffect,
    selectedFooter,
    photoScale,
    photoOffsetX,
    photoOffsetY,
    photoRotation,
    nameOffsetX,
    nameOffsetY,
    nameFontSizeScale,
    setEntitlementStatus,
    addDownloadedCreation,
  } = useCreationStore();

  // Check initial entitlement status and record template view
  useEffect(() => {
    const checkStatus = async () => {
      if (!activeTemplate) return;
      const targetId = activeTemplate._id || id;
      if (targetId) {
        API.post(`/templates/${targetId}/view`).catch(() => {});
      }

      if (activeTemplate.accessType === 'free') {
        setIsEntitled(true);
        setEntitlementStatus(true);
        return;
      }

      // Check lifetime access from user's purchased templates or VIP subscription
      if (checkCanAccessTemplate(user, activeTemplate)) {
        setIsEntitled(true);
        setEntitlementStatus(true);
        return;
      }

      try {
        const res = await API.get(`/payments/verify/${targetId}`);
        if (res.data?.success && res.data.data?.isUnlocked) {
          setIsEntitled(true);
          setEntitlementStatus(true);
          if (res.data.data.isPurchased || res.data.data.lifetimeAccess) {
            useAuthStore.getState().addPurchasedTemplate(targetId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkStatus();
  }, [activeTemplate, id, user]);

  const executeDownload = async (withPersonalization = true) => {
    setDownloading(true);
    try {
      const effectiveFooter = withPersonalization
        ? (selectedFooter || selectedEffect || (activeTemplate?.footers && activeTemplate.footers[0]) || null)
        : null;

      let remoteUserPhoto = withPersonalization ? userPhotoUri : null;
      if (remoteUserPhoto && !remoteUserPhoto.startsWith('http://') && !remoteUserPhoto.startsWith('https://')) {
        try {
          const uploaded = await uploadUserMedia(remoteUserPhoto, 'user-creations');
          if (uploaded && (uploaded.startsWith('http://') || uploaded.startsWith('https://'))) {
            remoteUserPhoto = uploaded;
          } else {
            const b64 = await FileSystem.readAsStringAsync(remoteUserPhoto, { encoding: FileSystem.EncodingType?.Base64 || 'base64' });
            if (b64) remoteUserPhoto = `data:image/jpeg;base64,${b64}`;
          }
        } catch (uploadErr) {
          console.warn('Could not upload user photo to remote:', uploadErr);
          try {
            const b64 = await FileSystem.readAsStringAsync(remoteUserPhoto, { encoding: FileSystem.EncodingType?.Base64 || 'base64' });
            if (b64) remoteUserPhoto = `data:image/jpeg;base64,${b64}`;
          } catch (b64Err) {}
        }
      }

      const effectiveUserName = withPersonalization ? userNameText : '';
      const effectiveUserQuote = withPersonalization ? userQuoteText : '';

      const customizationState = {
        activeTemplate,
        userPhotoUri: remoteUserPhoto,
        userNameText: effectiveUserName,
        userQuoteText: effectiveUserQuote,
        selectedFrame: withPersonalization ? selectedFrame : null,
        selectedEffect: withPersonalization ? selectedEffect : null,
        selectedFooter: effectiveFooter,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
        footers: activeTemplate?.footers || [],
        canvasConfig: activeTemplate?.canvasConfig || null,
      };

      let downloadUrl = activeTemplate.mainMedia || activeTemplate.previewAsset || activeTemplate.thumbnail;
      let isVideo = Boolean(
        activeTemplate.type === 'video' ||
        (effectiveFooter && (effectiveFooter.type === 'video' || (effectiveFooter.videoAsset && effectiveFooter.videoAsset.match(/\.(mp4|webm|mov)(\?.*)?$/i)))) ||
        (downloadUrl && (downloadUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || downloadUrl.includes('/video/')))
      );

      try {
        const res = await API.post(`/creations/${activeTemplate._id}/download`, {
          userNameText: effectiveUserName,
          userQuoteText: effectiveUserQuote,
          userPhotoUri: remoteUserPhoto,
          selectedFooter: effectiveFooter,
          withPersonalization,
          photoTransform: {
            scale: photoScale,
            rotation: photoRotation,
            offsetX: photoOffsetX,
            offsetY: photoOffsetY,
          },
          nameTransform: {
            offsetX: nameOffsetX,
            offsetY: nameOffsetY,
            fontSizeScale: nameFontSizeScale,
          },
          customizationState,
        }, { timeout: 60000 });

        if (res.data && res.data.data && res.data.data.downloadUrl) {
          downloadUrl = res.data.data.downloadUrl;
          if (typeof res.data.data.isVideo === 'boolean') {
            isVideo = res.data.data.isVideo;
          }
        }
      } catch (errApi) {
        console.log('Download endpoint notice:', errApi?.message);
      }

      const ext = isVideo ? 'mp4' : 'jpg';
      let targetUri = downloadUrl;
      let savedToSystem = false;

      if (Platform.OS === 'web') {
        try {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `starpix_${Date.now()}.${ext}`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          savedToSystem = true;
        } catch (webErr) {
          console.warn('Web download error:', webErr);
        }
      } else {
        // Native iOS / Android download flow
        if (downloadUrl && (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://'))) {
          const fileUri = `${FileSystem.documentDirectory}starpix_${Date.now()}.${ext}`;
          const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);
          targetUri = downloaded.uri;
        }

        // Save directly to User System Gallery / Media Library
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.createAssetAsync(targetUri);
            savedToSystem = true;
          }
        } catch (mediaErr) {
          console.warn('[MediaLibrary Save Notice]:', mediaErr?.message);
        }
      }

      // Save creation entry in backend database
      let backendId = null;
      try {
        const res = await API.post('/creations/save-download', {
          templateId: activeTemplate._id,
          imageUrl: downloadUrl || targetUri,
          editedText: effectiveUserName || effectiveUserQuote || '',
          editedPhoto: remoteUserPhoto || '',
          customizationState,
        });
        if (res.data && res.data.data && res.data.data._id) {
          backendId = String(res.data.data._id);
        }
      } catch (saveErr) {
        console.warn('Backend save-download warning:', saveErr.message);
      }

      // Add to Zustand local state for Downloads tab
      addDownloadedCreation({
        id: backendId || `creation_${Date.now()}`,
        templateId: activeTemplate._id,
        name: activeTemplate.name,
        nameTranslations: activeTemplate.nameTranslations,
        thumbnail: activeTemplate.thumbnail || activeTemplate.previewAsset || targetUri,
        localUri: targetUri,
        image: downloadUrl || targetUri,
        mediaUrl: downloadUrl || targetUri,
        editedText: effectiveUserName || effectiveUserQuote || '',
        editedPhoto: remoteUserPhoto || '',
        customizationState,
        activeTemplate,
        template: activeTemplate,
        footers: activeTemplate?.footers || [],
        selectedFooter: effectiveFooter,
        canvasConfig: activeTemplate?.canvasConfig || null,
        userPhotoUri: remoteUserPhoto,
        userNameText: effectiveUserName,
        userQuoteText: effectiveUserQuote,
        selectedFrame: withPersonalization ? selectedFrame : null,
        selectedEffect: withPersonalization ? selectedEffect : null,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
        createdAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
        isPaid: ['premium', 'paid', 'vip'].includes(activeTemplate.accessType),
        price: activeTemplate.price || 49,
      });

      hapticSuccess();

      setAlertInfo({
        kind: 'saved',
        message: savedToSystem
          ? t('download_saved_msg', { defaultValue: 'Status saved to your Phone Gallery and available in your Downloads library!' })
          : t('download_saved_msg', { defaultValue: 'Your status has been saved to your Downloads library!' }),
      });
    } catch (err) {
      console.error('HD Download error:', err);
      setAlertInfo({
        kind: 'saved',
        message: t('download_saved_msg', { defaultValue: 'Your status has been saved to your downloads library!' }),
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadHD = () => {
    if (!isEntitled) {
      setPaidConfirmInfo({ action: 'download' });
      return;
    }
    setModalActionType('download');
    setShowDownloadShareModal(true);
  };

  const executeShare = async (withPersonalization = true) => {
    setSharing(true);
    try {
      const effectiveFooter = withPersonalization
        ? (selectedFooter || selectedEffect || (activeTemplate?.footers && activeTemplate.footers[0]) || null)
        : null;

      let remoteUserPhoto = withPersonalization ? userPhotoUri : null;
      if (remoteUserPhoto && !remoteUserPhoto.startsWith('http://') && !remoteUserPhoto.startsWith('https://')) {
        try {
          const uploaded = await uploadUserMedia(remoteUserPhoto, 'user-creations');
          if (uploaded && (uploaded.startsWith('http://') || uploaded.startsWith('https://'))) {
            remoteUserPhoto = uploaded;
          } else {
            const b64 = await FileSystem.readAsStringAsync(remoteUserPhoto, { encoding: FileSystem.EncodingType?.Base64 || 'base64' });
            if (b64) remoteUserPhoto = `data:image/jpeg;base64,${b64}`;
          }
        } catch (uploadErr) {
          console.warn('Could not upload user photo to remote:', uploadErr);
          try {
            const b64 = await FileSystem.readAsStringAsync(remoteUserPhoto, { encoding: FileSystem.EncodingType?.Base64 || 'base64' });
            if (b64) remoteUserPhoto = `data:image/jpeg;base64,${b64}`;
          } catch (b64Err) {}
        }
      }

      const effectiveUserName = withPersonalization ? userNameText : '';
      const effectiveUserQuote = withPersonalization ? userQuoteText : '';

      const customizationState = {
        activeTemplate,
        userPhotoUri: remoteUserPhoto,
        userNameText: effectiveUserName,
        userQuoteText: effectiveUserQuote,
        selectedFrame: withPersonalization ? selectedFrame : null,
        selectedEffect: withPersonalization ? selectedEffect : null,
        selectedFooter: effectiveFooter,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
        footers: activeTemplate?.footers || [],
        canvasConfig: activeTemplate?.canvasConfig || null,
      };

      let downloadUrl = activeTemplate.mainMedia || activeTemplate.previewAsset || activeTemplate.thumbnail;
      let isVideo = Boolean(
        activeTemplate.type === 'video' ||
        (effectiveFooter && (effectiveFooter.type === 'video' || (effectiveFooter.videoAsset && effectiveFooter.videoAsset.match(/\.(mp4|webm|mov)(\?.*)?$/i)))) ||
        (downloadUrl && (downloadUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || downloadUrl.includes('/video/')))
      );

      // Record use count on backend
      if (activeTemplate?._id) {
        API.post(`/templates/${activeTemplate._id}/use`, { action: 'share' }).catch(() => {});
      }

      try {
        const res = await API.post(`/creations/${activeTemplate._id}/download`, {
          userNameText: effectiveUserName,
          userQuoteText: effectiveUserQuote,
          userPhotoUri: remoteUserPhoto,
          selectedFooter: effectiveFooter,
          withPersonalization,
          photoTransform: {
            scale: photoScale,
            rotation: photoRotation,
            offsetX: photoOffsetX,
            offsetY: photoOffsetY,
          },
          nameTransform: {
            offsetX: nameOffsetX,
            offsetY: nameOffsetY,
            fontSizeScale: nameFontSizeScale,
          },
          customizationState,
        }, { timeout: 60000 });

        if (res.data && res.data.data) {
          const link = res.data.data.downloadUrl || res.data.data.shareUrl;
          if (link) downloadUrl = link;
          if (typeof res.data.data.isVideo === 'boolean') {
            isVideo = res.data.data.isVideo;
          }
        }
      } catch (shareErrApi) {
        console.warn('Personalized share endpoint notice:', shareErrApi?.message);
        try {
          const fallbackRes = await API.post(`/creations/${activeTemplate._id}/share`, {
            userNameText: effectiveUserName,
            userQuoteText: effectiveUserQuote,
            userPhotoUri: remoteUserPhoto,
            selectedFooter: effectiveFooter,
            photoTransform: {
              scale: photoScale,
              rotation: photoRotation,
              offsetX: photoOffsetX,
              offsetY: photoOffsetY,
            },
            nameTransform: {
              offsetX: nameOffsetX,
              offsetY: nameOffsetY,
              fontSizeScale: nameFontSizeScale,
            },
            customizationState,
          }, { timeout: 30000 });
          if (fallbackRes.data && fallbackRes.data.data) {
            const link = fallbackRes.data.data.shareUrl || fallbackRes.data.data.downloadUrl;
            if (link) downloadUrl = link;
            if (typeof fallbackRes.data.data.isVideo === 'boolean') {
              isVideo = fallbackRes.data.data.isVideo;
            }
          }
        } catch (e2) {}
      }

      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let targetUri = downloadUrl;

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: activeTemplate.name || 'Starpix Creation',
            text: 'Check out my custom status created with Starpix!',
            url: downloadUrl,
          });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(downloadUrl);
          setAlertInfo({
            kind: 'saved',
            message: 'Status link copied to clipboard!',
          });
        }
      } else {
        if (downloadUrl && (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://'))) {
          const fileUri = `${FileSystem.documentDirectory}starpix_share_${Date.now()}.${ext}`;
          const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);
          targetUri = downloaded.uri;
        }

        const canShare = await Sharing.isAvailableAsync();
        if (canShare && targetUri) {
          await Sharing.shareAsync(targetUri, {
            mimeType,
            dialogTitle: 'Share Creation',
          });
        } else {
          await Share.share({
            message: `Check out my custom status created with Starpix! ${downloadUrl}`,
          });
        }
      }

      // Save to Downloads store and backend as user shares
      let backendId = null;
      try {
        const res = await API.post('/creations/save-download', {
          templateId: activeTemplate._id,
          imageUrl: downloadUrl || targetUri,
          editedText: effectiveUserName || effectiveUserQuote || '',
          editedPhoto: remoteUserPhoto || '',
          customizationState,
        });
        if (res.data && res.data.data && res.data.data._id) {
          backendId = String(res.data.data._id);
        }
      } catch (saveErr) {}

      addDownloadedCreation({
        id: backendId || `creation_${Date.now()}`,
        templateId: activeTemplate._id,
        name: activeTemplate.name,
        nameTranslations: activeTemplate.nameTranslations,
        thumbnail: activeTemplate.thumbnail || activeTemplate.previewAsset || targetUri,
        localUri: targetUri,
        image: downloadUrl || targetUri,
        mediaUrl: downloadUrl || targetUri,
        editedText: effectiveUserName || effectiveUserQuote || '',
        editedPhoto: remoteUserPhoto || '',
        customizationState,
        activeTemplate,
        template: activeTemplate,
        footers: activeTemplate?.footers || [],
        selectedFooter: effectiveFooter,
        canvasConfig: activeTemplate?.canvasConfig || null,
        userPhotoUri: remoteUserPhoto,
        userNameText: effectiveUserName,
        userQuoteText: effectiveUserQuote,
        selectedFrame: withPersonalization ? selectedFrame : null,
        selectedEffect: withPersonalization ? selectedEffect : null,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
        createdAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
        isPaid: ['premium', 'paid', 'vip'].includes(activeTemplate.accessType),
        price: activeTemplate.price || 49,
      });
    } catch (e) {
      console.log('Direct share error:', e);
    } finally {
      setSharing(false);
    }
  };

  const handleShareDirect = () => {
    if (!isEntitled) {
      setPaidConfirmInfo({ action: 'share' });
      return;
    }
    setModalActionType('share');
    setShowDownloadShareModal(true);
  };

  const handleModalOptionSelect = async (withPersonalization) => {
    setModalLoadingOption(withPersonalization ? 'personalized' : 'clean');
    try {
      if (modalActionType === 'share') {
        await executeShare(withPersonalization);
      } else {
        await executeDownload(withPersonalization);
      }
    } catch (err) {
      console.warn('Option execution error:', err);
    } finally {
      setModalLoadingOption(null);
      setShowDownloadShareModal(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!activeTemplate) return;
    if (!user) {
      setPaidConfirmInfo(null);
      router.push('/login');
      return;
    }

    setPayingPaid(true);
    try {
      const res = await API.post('/payments/create', {
        templateId: activeTemplate._id,
        amount: activeTemplate.price || 49,
      });

      if (res.data?.success) {
        hapticSuccess();
        const targetId = activeTemplate._id || id;
        useAuthStore.getState().addPurchasedTemplate(targetId);
        setIsEntitled(true);
        setEntitlementStatus(true);
        const pendingAction = paidConfirmInfo?.action;
        setPaidConfirmInfo(null);

        if (pendingAction === 'share') {
          handleShareDirect();
        } else {
          handleDownloadHD();
        }
      } else {
        setAlertInfo({
          kind: 'failed',
          message: res.data?.message || 'Payment failed. Please try again.',
        });
      }
    } catch (err) {
      console.warn('Payment error in preview:', err);
      setAlertInfo({
        kind: 'failed',
        message: err.response?.data?.message || 'Payment failed. Please try again.',
      });
    } finally {
      setPayingPaid(false);
    }
  };

  if (!activeTemplate) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
          <View style={styles.header}>
            <Skeleton height={32} width={32} borderRadius={10} />
            <Skeleton height={20} width={130} borderRadius={6} />
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.canvasContainer}>
            <View style={[styles.canvasSkeletonWrapper, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
              <Skeleton height="100%" width="100%" borderRadius={14}>
                <View style={styles.canvasSkeletonContent}>
                  <View style={styles.skeletonPhotoSlot} />
                  <View style={styles.skeletonTextLine} />
                  <View style={styles.skeletonFooterStrip} />
                </View>
              </Skeleton>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.unlockedRow}>
              <View style={{ flex: 1 }}>
                <Skeleton height={52} width="100%" borderRadius={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton height={52} width="100%" borderRadius={16} />
              </View>
            </View>
          </View>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text numberOfLines={1} style={styles.headerTitle}>{t('preview_status')}</Text>
          {Boolean(
            activeTemplate?.type === 'video' ||
            (activeTemplate?.mainMedia && (activeTemplate.mainMedia.endsWith('.mp4') || activeTemplate.mainMedia.includes('.mp4') || activeTemplate.mainMedia.includes('/video/'))) ||
            (activeTemplate?.previewAsset && (activeTemplate.previewAsset.endsWith('.mp4') || activeTemplate.previewAsset.includes('.mp4')))
          ) ? (
            <PressableScale
              onPress={() => {
                hapticTap();
                setIsMuted((prev) => !prev);
              }}
              scaleTo={0.88}
              style={[styles.soundBtn, !isMuted && styles.soundActiveBtn]}
              contentStyle={styles.soundBtnContent}
              accessibilityLabel={isMuted ? t('sound_unmute', { defaultValue: 'Turn Sound On' }) : t('sound_mute', { defaultValue: 'Mute Sound' })}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={18}
                color={!isMuted ? COLORS.orange : '#8A7A68'}
              />
            </PressableScale>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Status preview canvas */}
        <View style={styles.canvasContainer}>
          <TemplateRenderer
            template={activeTemplate}
            userPhotoUri={userPhotoUri}
            userNameText={userNameText}
            userQuoteText={userQuoteText}
            selectedFrame={selectedFrame}
            selectedEffect={selectedEffect}
            selectedFooter={selectedFooter || selectedEffect}
            photoTransform={{ scale: photoScale, offsetX: photoOffsetX, offsetY: photoOffsetY, rotation: photoRotation }}
            nameTransform={{ offsetX: nameOffsetX, offsetY: nameOffsetY, fontSizeScale: nameFontSizeScale }}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            showWatermark={!isEntitled}
            isMuted={isMuted}
          />
          {Boolean(
            activeTemplate?.type === 'video' ||
            (activeTemplate?.mainMedia && (activeTemplate.mainMedia.endsWith('.mp4') || activeTemplate.mainMedia.includes('.mp4') || activeTemplate.mainMedia.includes('/video/'))) ||
            (activeTemplate?.previewAsset && (activeTemplate.previewAsset.endsWith('.mp4') || activeTemplate.previewAsset.includes('.mp4')))
          ) && (
            <PressableScale
              onPress={() => {
                hapticTap();
                setIsMuted((prev) => !prev);
              }}
              scaleTo={0.92}
              style={styles.canvasSoundBadge}
              contentStyle={styles.canvasSoundBadgeContent}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={13}
                color={COLORS.white}
              />
              <Text style={styles.canvasSoundText}>
                {isMuted ? t('sound_off', { defaultValue: 'Sound Off' }) : t('sound_on', { defaultValue: 'Sound On' })}
              </Text>
            </PressableScale>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!isEntitled ? (
            activeTemplate.accessType === 'vip' ? (
              <PressableScale
                onPress={() => router.push('/vip')}
                scaleTo={0.97}
                haptic="impact"
                style={[styles.unlockBtn, styles.vipBtn]}
                contentStyle={styles.unlockContent}
              >
                <View style={styles.unlockIconWrap}>
                  <Ionicons name="diamond" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.unlockTextWrap}>
                  <Text style={styles.unlockLabel}>{t('vip_title')}</Text>
                  <Text style={styles.unlockPrice}>{t('subscribe_now')} · {t('from_price_prefix', { defaultValue: 'From ₹29' })}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </PressableScale>
            ) : (
              <PressableScale onPress={() => setPaywallVisible(true)} scaleTo={0.97} haptic="impact" style={styles.unlockBtn} contentStyle={styles.unlockContent}>
                <View style={styles.unlockIconWrap}>
                  <Ionicons name="crown" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.unlockTextWrap}>
                  <Text style={styles.unlockLabel}>{t('hd_export')}</Text>
                  <Text style={styles.unlockPrice}>₹{activeTemplate.price || 49}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </PressableScale>
            )
          ) : (
            <View style={styles.unlockedRow}>
              <PressableScale
                onPress={handleShareDirect}
                disabled={sharing || downloading}
                scaleTo={0.95}
                style={[styles.actionBtn, styles.shareBtn]}
                contentStyle={styles.actionContent}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={COLORS.orange} />
                ) : (
                  <React.Fragment>
                    <Ionicons name="share-social-outline" size={19} color={COLORS.orange} />
                    <Text style={styles.shareText}>{t('share')}</Text>
                  </React.Fragment>
                )}
              </PressableScale>

              <PressableScale
                onPress={handleDownloadHD}
                disabled={sharing || downloading}
                scaleTo={0.95}
                haptic="impact"
                style={[styles.actionBtn, styles.downloadBtn]}
                contentStyle={styles.actionContent}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <React.Fragment>
                    <Ionicons name="download-outline" size={20} color={COLORS.white} />
                    <Text style={styles.downloadText}>{t('save_hd')}</Text>
                  </React.Fragment>
                )}
              </PressableScale>
            </View>
          )}
        </View>

        <DownloadShareModal
          visible={showDownloadShareModal}
          actionType={modalActionType}
          activeTemplate={activeTemplate}
          userPhotoUri={userPhotoUri}
          userNameText={userNameText}
          userQuoteText={userQuoteText}
          selectedFooter={selectedFooter}
          selectedEffect={selectedEffect}
          photoTransform={{
            scale: photoScale,
            offsetX: photoOffsetX,
            offsetY: photoOffsetY,
            rotation: photoRotation,
          }}
          nameTransform={{
            offsetX: nameOffsetX,
            offsetY: nameOffsetY,
            fontSizeScale: nameFontSizeScale,
          }}
          onClose={() => {
            if (!modalLoadingOption) {
              setShowDownloadShareModal(false);
            }
          }}
          onSelect={handleModalOptionSelect}
          loadingOption={modalLoadingOption}
        />

        <PaidTemplateConfirmModal
          key={`paid_confirm_${i18n.language}`}
          visible={paidConfirmInfo !== null}
          template={activeTemplate}
          action={paidConfirmInfo?.action || 'download'}
          loading={payingPaid}
          onConfirm={handleConfirmPaid}
          onCancel={() => setPaidConfirmInfo(null)}
        />

        <PaywallModal
          visible={paywallVisible}
          template={activeTemplate}
          onClose={() => setPaywallVisible(false)}
          onSuccess={() => {
            const targetId = activeTemplate._id || id;
            useAuthStore.getState().addPurchasedTemplate(targetId);
            setIsEntitled(true);
            setEntitlementStatus(true);
          }}
        />

        {/* Themed Alert (replaces native Alert) */}
        <ConfirmModal
          visible={alertInfo !== null}
          title={alertInfo && alertInfo.kind === 'failed' ? t('download_failed_title') : t('download_saved_title')}
          message={
            alertInfo && alertInfo.kind === 'failed'
              ? alertInfo.message
              : t('download_saved_msg')
          }
          confirmText={t('got_it')}
          icon={alertInfo && alertInfo.kind === 'failed' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
          iconColor={COLORS.orange}
          hideCancel
          onCancel={() => setAlertInfo(null)}
          onConfirm={() => setAlertInfo(null)}
        />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.012),
  },
  headerBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerSpacer: { width: 32 },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundBtnContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundActiveBtn: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.orange,
  },
  canvasSoundBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 40,
    elevation: 15,
  },
  canvasSoundBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  canvasSoundText: {
    color: '#FFFFFF',
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasSkeletonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.ink,
    elevation: 8,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  canvasSkeletonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  skeletonPhotoSlot: {
    width: '65%',
    height: '38%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    marginTop: '25%',
  },
  skeletonTextLine: {
    width: '70%',
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '28%',
  },
  skeletonFooterStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  footer: {
    padding: SCREEN_PAD,
    paddingBottom: hp(0.03),
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unlockBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.016),
    elevation: 4,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  vipBtn: {
    backgroundColor: '#7C3AED',
    shadowColor: '#5B21B6',
  },
  unlockContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  unlockLabel: {
    color: COLORS.white,
    fontSize: fontScale(14.5),
    fontFamily: FONTS.bold,
  },
  unlockPrice: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    marginTop: 1,
  },
  unlockedRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
  },
  actionContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtn: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
  },
  shareText: {
    color: COLORS.orange,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14.5),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  downloadBtn: {
    backgroundColor: COLORS.orange,
    elevation: 4,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14.5),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

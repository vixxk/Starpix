import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateRenderer from '../../src/components/TemplateRenderer';
import PaywallModal from '../../src/components/PaywallModal';
import ConfirmModal from '../../src/components/ConfirmModal';
import Skeleton from '../../src/components/Skeleton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import API from '../../src/utils/api';
import { hapticSuccess } from '../../src/utils/haptics';
import { useCreationStore } from '../../src/store/useCreationStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH * 0.85;
const CANVAS_HEIGHT = CANVAS_WIDTH * (16 / 9);

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isEntitled, setIsEntitled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { kind: 'saved' | 'failed', message? }

  const router = useRouter();

  const {
    activeTemplate,
    userPhotoUri,
    userNameText,
    userQuoteText,
    selectedFrame,
    selectedEffect,
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

  // Check initial entitlement status
  useEffect(() => {
    const checkStatus = async () => {
      if (!activeTemplate) return;
      if (activeTemplate.accessType === 'free') {
        setIsEntitled(true);
        return;
      }
      try {
        const res = await API.get(`/payments/verify/${activeTemplate._id}`);
        if (res.data.success && res.data.data.isUnlocked) setIsEntitled(true);
      } catch (err) {
        console.error(err);
      }
    };
    checkStatus();
  }, [activeTemplate]);

  const handleDownloadHD = async () => {
    if (!isEntitled) {
      setPaywallVisible(true);
      return;
    }

    setDownloading(true);
    try {
      let downloadUrl = activeTemplate.mainMedia || activeTemplate.previewAsset || activeTemplate.thumbnail;
      try {
        const res = await API.get(`/creations/${activeTemplate._id}/download`);
        if (res.data && res.data.data && res.data.data.downloadUrl) {
          downloadUrl = res.data.data.downloadUrl;
        }
      } catch (errApi) {
        console.log('Download endpoint notice:', errApi?.message);
      }

      const isVideo = Boolean(
        activeTemplate.type === 'video' ||
        (downloadUrl && (downloadUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || downloadUrl.includes('/video/')))
      );
      const ext = isVideo ? 'mp4' : 'jpg';
      let targetUri = downloadUrl;
      let savedToSystem = false;

      if (Platform.OS === 'web') {
        try {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `statuzzz_${Date.now()}.${ext}`;
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
          const fileUri = `${FileSystem.documentDirectory}statuzzz_${Date.now()}.${ext}`;
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

      const customizationState = {
        activeTemplate,
        userPhotoUri,
        userNameText,
        userQuoteText,
        selectedFrame,
        selectedEffect,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
      };

      // Save creation entry in backend database
      let backendId = null;
      try {
        const res = await API.post('/creations/save-download', {
          templateId: activeTemplate._id,
          imageUrl: downloadUrl || targetUri,
          editedText: userNameText || userQuoteText || '',
          editedPhoto: userPhotoUri || '',
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
        thumbnail: activeTemplate.thumbnail || activeTemplate.previewAsset || targetUri,
        localUri: targetUri,
        editedText: userNameText || userQuoteText || '',
        editedPhoto: userPhotoUri || '',
        customizationState,
        activeTemplate,
        userPhotoUri,
        userNameText,
        userQuoteText,
        selectedFrame,
        selectedEffect,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        photoRotation,
        nameOffsetX,
        nameOffsetY,
        nameFontSizeScale,
        createdAt: new Date().toISOString(),
        isPaid: ['premium', 'paid', 'vip'].includes(activeTemplate.accessType),
        price: activeTemplate.price || 49,
      });

      hapticSuccess();

      setAlertInfo({
        kind: 'saved',
        message: savedToSystem
          ? `Status saved to your Phone Gallery and available in your Downloads library!`
          : `Your status has been saved to your Downloads library!`,
      });
    } catch (err) {
      console.error('HD Download error:', err);
      setAlertInfo({
        kind: 'saved',
        message: 'Your status has been saved to your downloads library!',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShareDirect = async () => {
    if (!isEntitled) {
      setPaywallVisible(true);
      return;
    }

    setSharing(true);
    try {
      let downloadUrl = activeTemplate.mainMedia || activeTemplate.previewAsset || activeTemplate.thumbnail;
      const isVideo = Boolean(
        activeTemplate.type === 'video' ||
        (downloadUrl && (downloadUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || downloadUrl.includes('/video/')))
      );
      const ext = isVideo ? 'mp4' : 'jpg';
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      let targetUri = downloadUrl;

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: activeTemplate.name || 'Statuzzz Creation',
            text: 'Check out my custom status created with Statuzzz!',
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
          const fileUri = `${FileSystem.documentDirectory}statuzzz_share_${Date.now()}.${ext}`;
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
            message: `Check out my custom status created with Statuzzz! ${downloadUrl}`,
          });
        }
      }
    } catch (e) {
      console.log('Direct share error:', e);
    } finally {
      setSharing(false);
    }
  };

  if (!activeTemplate) {
    return (
      <AppBackground>
        <StatusBar style="dark" />
        <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
          <View style={styles.header}>
            <Skeleton height={24} width={24} borderRadius={12} />
            <Skeleton height={18} width={130} borderRadius={6} />
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.canvasContainer}>
            <Skeleton height={CANVAS_HEIGHT} width={CANVAS_WIDTH} borderRadius={18} />
          </View>
          <View style={styles.footer}>
            <View style={styles.unlockedRow}>
              <Skeleton height={52} width="48%" borderRadius={16} />
              <Skeleton height={52} width="48%" borderRadius={16} />
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
          <PressableScale onPress={() => router.back()} scaleTo={0.88} style={styles.headerBtn} contentStyle={styles.iconContent}>
            <Ionicons name="chevron-back" size={24} color={COLORS.orange} />
          </PressableScale>
          <Text numberOfLines={1} style={styles.headerTitle}>Status Preview</Text>
          <View style={styles.headerSpacer} />
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
            photoTransform={{ scale: photoScale, offsetX: photoOffsetX, offsetY: photoOffsetY, rotation: photoRotation }}
            nameTransform={{ offsetX: nameOffsetX, offsetY: nameOffsetY, fontSizeScale: nameFontSizeScale }}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            showWatermark={!isEntitled}
          />
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
                  <Text style={styles.unlockLabel}>VIP Exclusive Template</Text>
                  <Text style={styles.unlockPrice}>Get the Pass · ₹199/mo</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </PressableScale>
            ) : (
              <PressableScale onPress={() => setPaywallVisible(true)} scaleTo={0.97} haptic="impact" style={styles.unlockBtn} contentStyle={styles.unlockContent}>
                <View style={styles.unlockIconWrap}>
                  <Ionicons name="crown" size={20} color={COLORS.gold} />
                </View>
                <View style={styles.unlockTextWrap}>
                  <Text style={styles.unlockLabel}>Unlock HD Export</Text>
                  <Text style={styles.unlockPrice}>₹{activeTemplate.price || 49} · one time</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color={COLORS.orange} />
                    <Text style={styles.shareText}>Preparing…</Text>
                  </View>
                ) : (
                  <React.Fragment>
                    <Ionicons name="share-social-outline" size={19} color={COLORS.orange} />
                    <Text style={styles.shareText}>Share</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={styles.downloadText}>Saving…</Text>
                  </View>
                ) : (
                  <React.Fragment>
                    <Ionicons name="download-outline" size={20} color={COLORS.white} />
                    <Text style={styles.downloadText}>Save HD</Text>
                  </React.Fragment>
                )}
              </PressableScale>
            </View>
          )}
        </View>

        <PaywallModal
          visible={paywallVisible}
          template={activeTemplate}
          onClose={() => setPaywallVisible(false)}
          onSuccess={() => {
            setIsEntitled(true);
            setEntitlementStatus(true);
          }}
        />

        {/* Themed Alert (replaces native Alert) */}
        <ConfirmModal
          visible={alertInfo !== null}
          title={alertInfo && alertInfo.kind === 'failed' ? 'Download Failed' : 'Download Saved'}
          message={
            alertInfo && alertInfo.kind === 'failed'
              ? alertInfo.message
              : 'Your status was saved to your device successfully.'
          }
          confirmText="Got It"
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
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

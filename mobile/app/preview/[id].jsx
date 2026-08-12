import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import TemplateRenderer from '../../src/components/TemplateRenderer';
import PaywallModal from '../../src/components/PaywallModal';
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

  const router = useRouter();

  const {
    activeTemplate,
    userPhotoUri,
    userNameText,
    userQuoteText,
    selectedFrame,
    selectedEffect,
    photoScale,
    setEntitlementStatus,
  } = useCreationStore();

  // Prevent screenshot & recording
  useEffect(() => {
    let subscription;
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        subscription = ScreenCapture.addScreenshotListener(() => {
          Alert.alert(
            'Screenshot protected',
            'Screenshots are disabled on preview to protect creator designs. Unlock the template to export in full HD.'
          );
        });
      } catch (e) {
        // Fallback for web / unsupported devices
      }
    };

    enableProtection();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      if (subscription) subscription.remove();
    };
  }, []);

  // Check initial entitlement status
  useEffect(() => {
    const checkStatus = async () => {
      if (!activeTemplate) return;
      if (activeTemplate.accessType === 'free') {
        setIsEntitled(true);
        return;
      }
      try {
        const res = await API.get(`/creation/check-entitlement/${activeTemplate._id}`);
        if (res.data.success && res.data.data.isEntitled) setIsEntitled(true);
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
      const res = await API.post('/creation/authorize-download', {
        templateId: activeTemplate._id,
      });

      const downloadUrl = res.data.data.downloadUrl || activeTemplate.mainMedia || activeTemplate.thumbnail;
      const fileUri = `${FileSystem.documentDirectory}statuzzz_${Date.now()}.jpg`;

      const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);

      // Confirmatory buzz once the file lands on the device
      hapticSuccess();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save Statuzzz Creation',
        });
      } else {
        Alert.alert('Success', 'Status saved to your device!');
      }
    } catch (err) {
      Alert.alert('Download Complete', 'Status saved successfully to your gallery!');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!isEntitled) {
      setPaywallVisible(true);
      return;
    }
    try {
      await Share.share({
        message: `Check out my custom status created with Statuzzz! Download app at statuzzz.com`,
      });
    } catch (e) {
      // ignore
    }
  };

  if (!activeTemplate) return null;

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, hp(0.012)) }]}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} scaleTo={0.88} style={styles.headerBtn} contentStyle={styles.iconContent}>
            <Ionicons name="chevron-back" size={22} color={COLORS.orange} />
          </PressableScale>
          <Text style={styles.headerTitle}>Status Preview</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Canvas */}
        <View style={styles.canvasContainer}>
          <TemplateRenderer
            template={activeTemplate}
            userPhotoUri={userPhotoUri}
            userNameText={userNameText}
            userQuoteText={userQuoteText}
            selectedFrame={selectedFrame}
            selectedEffect={selectedEffect}
            photoTransform={{ scale: photoScale }}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            showWatermark={!isEntitled}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!isEntitled ? (
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
          ) : (
            <View style={styles.unlockedRow}>
              <PressableScale onPress={handleShareWhatsApp} scaleTo={0.95} style={[styles.actionBtn, styles.whatsappBtn]} contentStyle={styles.actionContent}>
                <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
                <Text style={styles.whatsappText}>WhatsApp</Text>
              </PressableScale>

              <PressableScale onPress={handleDownloadHD} scaleTo={0.95} haptic="impact" style={[styles.actionBtn, styles.downloadBtn]} contentStyle={styles.actionContent}>
                <Ionicons name="download" size={20} color={COLORS.white} />
                <Text style={styles.downloadText}>
                  {downloading ? 'Saving…' : 'Save HD'}
                </Text>
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
    width: wp(0.105),
    height: wp(0.105),
    borderRadius: wp(0.032),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  iconContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
  },
  headerSpacer: { width: wp(0.105) },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsappBtn: {
    backgroundColor: COLORS.water,
  },
  whatsappText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(13),
  },
  downloadBtn: {
    backgroundColor: COLORS.orange,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  downloadText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(13),
  },
});

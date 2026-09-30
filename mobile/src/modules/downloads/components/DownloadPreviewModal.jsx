import React from 'react';
import { View, Text, Image, Modal, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import AppVideo, { ResizeMode } from '../../../components/AppVideo';
import PressableScale from '../../../components/PressableScale';
import { resolveMediaUrl } from '../../../utils/media';
import { isVideoMedia, getCardThumbnail } from '../constants';
import { styles } from '../styles';

export default function DownloadPreviewModal({
  item,
  visible,
  insets,
  onClose,
  onRedownload,
  onShare,
}) {
  const { t } = useTranslation();

  if (!visible || !item) return null;

  const mediaSource = item.image || item.localUri;
  const isVideo = isVideoMedia(mediaSource);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.fullscreenOverlay}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={[styles.fullscreenHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <Text style={styles.fullscreenTitle} numberOfLines={1}>
            {item.title || 'Starpix Creation'}
          </Text>
          <PressableScale
            onPress={onClose}
            scaleTo={0.9}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </PressableScale>
        </View>

        {/* Main Full Screen Media Area */}
        <Pressable style={styles.fullscreenContentArea} onPress={onClose}>
          {isVideo ? (
            <AppVideo
              source={{ uri: resolveMediaUrl(mediaSource) }}
              style={styles.fullscreenMedia}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          ) : (
            <Image
              source={{ uri: resolveMediaUrl(mediaSource || getCardThumbnail(item)) }}
              style={styles.fullscreenMedia}
              resizeMode="contain"
            />
          )}
        </Pressable>

        {/* Footer Action Controls */}
        <View style={[styles.fullscreenFooter, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          <PressableScale
            onPress={() => onRedownload(item)}
            scaleTo={0.94}
            style={styles.fullscreenActionBtn}
            contentStyle={styles.fullscreenBtnContent}
          >
            <Ionicons name="download-outline" size={18} color={COLORS.white} />
            <Text style={styles.fullscreenActionText}>{t('re_download')}</Text>
          </PressableScale>

          <PressableScale
            onPress={() => onShare(mediaSource)}
            scaleTo={0.94}
            style={styles.fullscreenShareBtn}
            contentStyle={styles.fullscreenBtnContent}
          >
            <Ionicons name="share-social-outline" size={18} color={COLORS.ink} />
            <Text style={[styles.fullscreenActionText, { color: COLORS.ink }]}>{t('share')}</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import PressableScale from '../../../components/PressableScale';
import { getLocalizedName } from '../../../utils/localized';
import { resolveMediaUrl } from '../../../utils/media';
import { getCardThumbnail, formatDownloadDate, isVideoMedia } from '../constants';
import { styles } from '../styles';

export default function DownloadCard({
  item,
  onPressThumbnail,
  onRedownload,
  onShare,
  onDelete,
  isRedownloading = false,
  isSharing = false,
  isAnyActionBusy = false,
}) {
  const { t, i18n } = useTranslation();
  const [thumbLoading, setThumbLoading] = useState(true);

  const isGenerating = Boolean(item.isGenerating);
  const formattedDate = item.downloadedAt ? formatDownloadDate(item.downloadedAt, i18n.language) : null;
  const title = getLocalizedName(item.activeTemplate || item.aiTemplate || item.template, i18n.language) || item.title;
  const thumbUri = getCardThumbnail(item);
  const isVideo = item.mediaType === 'video' || isVideoMedia(item.mediaUrl) || isVideoMedia(item.image || item.localUri);

  const isDownloadBusy = isRedownloading;
  const isShareBusy = isSharing;
  const isDownloadDisabled = isGenerating || isRedownloading || isSharing || isAnyActionBusy;
  const isShareDisabled = isGenerating || isRedownloading || isSharing || isAnyActionBusy;
  const isDeleteDisabled = isGenerating || isRedownloading || isSharing || isAnyActionBusy;

  return (
    <View style={[styles.card, isGenerating && styles.cardGenerating]}>
      <PressableScale
        onPress={() => {
          if (isGenerating) return;
          onPressThumbnail(item);
        }}
        scaleTo={isGenerating ? 1 : 0.94}
        style={[styles.cardLeft, isGenerating && styles.cardLeftGenerating]}
        disabled={isGenerating}
      >
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={[styles.thumbnail, isGenerating && styles.thumbnailGenerating]}
            resizeMode="cover"
            onLoadStart={() => setThumbLoading(true)}
            onLoadEnd={() => setThumbLoading(false)}
          />
        ) : (
          <View style={styles.emptyThumbWrap}>
            <Ionicons name={isVideo ? "videocam-outline" : "image-outline"} size={24} color="#9CA3AF" />
          </View>
        )}

        {isGenerating ? (
          <View style={styles.generatingThumbOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <View style={styles.aiGeneratingBadge}>
              <Text style={styles.aiGeneratingBadgeText}>AI</Text>
            </View>
          </View>
        ) : thumbLoading && thumbUri ? (
          <View style={styles.thumbLoadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary || '#EE1D24'} />
          </View>
        ) : null}

        {isVideo && !isGenerating && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color="#FFFFFF" />
          </View>
        )}
      </PressableScale>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {isGenerating ? (
          <View style={styles.generatingStatusRow}>
            <ActivityIndicator size="small" color={COLORS.primary || '#EE1D24'} style={styles.miniStatusSpinner} />
            <Text style={styles.generatingStatusText} numberOfLines={1}>
              {t('generating_video') || t('generating_content_title') || 'Generating Content...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.cardDate}>
            {formattedDate ? t('saved_on', { date: formattedDate }) : t('recently_saved')}
          </Text>
        )}

        {/* Actions Bar */}
        <View style={styles.actionRow}>
          <PressableScale
            onPress={() => {
              if (isGenerating) return;
              onRedownload(item);
            }}
            scaleTo={isGenerating ? 1 : 0.96}
            style={[
              styles.actionBtnPrimary,
              isDownloadDisabled && !isDownloadBusy && styles.actionBtnDisabled,
            ]}
            contentStyle={styles.actionBtnContent}
            disabled={isDownloadDisabled}
          >
            <View style={styles.actionBtnInner}>
              <View
                style={[
                  styles.actionBtnRow,
                  isDownloadBusy && styles.actionBtnRowHidden,
                ]}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} style={styles.btnSpinner} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>
                      {t('ai_generating') || t('generating_video')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download-outline" size={14} color={COLORS.white} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>
                      {t('re_download')}
                    </Text>
                  </>
                )}
              </View>
              {isDownloadBusy && !isGenerating && (
                <View style={styles.actionLoaderOverlay}>
                  <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="small" color={COLORS.white} style={styles.btnSpinner} />
                  </View>
                </View>
              )}
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => {
              if (isGenerating) return;
              onShare(item.isAi ? (item.mediaUrl || item.imageUrl || item.localUri || item.image) : item.image);
            }}
            scaleTo={isGenerating ? 1 : 0.96}
            style={[
              styles.actionBtnSecondary,
              isShareDisabled && !isShareBusy && styles.actionBtnDisabled,
            ]}
            contentStyle={styles.actionBtnContent}
            disabled={isShareDisabled}
          >
            <View style={styles.actionBtnInner}>
              <View
                style={[
                  styles.actionBtnRow,
                  isShareBusy && styles.actionBtnRowHidden,
                ]}
              >
                <Ionicons name="share-social-outline" size={14} color={COLORS.ink} />
                <Text style={styles.actionTextSecondary} numberOfLines={1}>
                  {t('share')}
                </Text>
              </View>
              {isShareBusy && !isGenerating && (
                <View style={styles.actionLoaderOverlay}>
                  <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="small" color={COLORS.ink} style={styles.btnSpinner} />
                  </View>
                </View>
              )}
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => {
              if (isGenerating) return;
              onDelete(item._id);
            }}
            scaleTo={isGenerating ? 1 : 0.88}
            style={[
              styles.deleteIconBtn,
              isDeleteDisabled && styles.actionBtnDisabled,
            ]}
            contentStyle={styles.deleteIconContent}
            disabled={isDeleteDisabled}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

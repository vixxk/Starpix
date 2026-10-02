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
}) {
  const { t, i18n } = useTranslation();
  const [thumbLoading, setThumbLoading] = useState(true);

  const formattedDate = item.downloadedAt ? formatDownloadDate(item.downloadedAt, i18n.language) : null;
  const title = getLocalizedName(item.activeTemplate || item.aiTemplate || item.template, i18n.language) || item.title;
  const thumbUri = getCardThumbnail(item);
  const isVideo = isVideoMedia(item.image || item.localUri);

  return (
    <View style={styles.card}>
      <PressableScale
        onPress={() => onPressThumbnail(item)}
        scaleTo={0.94}
        style={styles.cardLeft}
      >
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.thumbnail}
            resizeMode="cover"
            onLoadStart={() => setThumbLoading(true)}
            onLoadEnd={() => setThumbLoading(false)}
          />
        ) : (
          <View style={styles.emptyThumbWrap}>
            <Ionicons name={isVideo ? "videocam-outline" : "image-outline"} size={24} color="#9CA3AF" />
          </View>
        )}

        {thumbLoading && thumbUri ? (
          <View style={styles.thumbLoadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary || '#EE1D24'} />
          </View>
        ) : null}

        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color="#FFFFFF" />
          </View>
        )}
      </PressableScale>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardDate}>
          {formattedDate ? t('saved_on', { date: formattedDate }) : t('recently_saved')}
        </Text>

        {/* Actions Bar */}
        <View style={styles.actionRow}>
          <PressableScale
            onPress={() => onRedownload(item)}
            scaleTo={0.92}
            style={styles.actionBtnPrimary}
            contentStyle={styles.actionContent}
            disabled={isRedownloading}
          >
            {isRedownloading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={14} color={COLORS.white} />
                <Text style={styles.actionTextPrimary}>{t('re_download')}</Text>
              </>
            )}
          </PressableScale>

          <PressableScale
            onPress={() => onShare(item.image)}
            scaleTo={0.92}
            style={styles.actionBtnSecondary}
            contentStyle={styles.actionContent}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={COLORS.ink} />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={14} color={COLORS.ink} />
                <Text style={styles.actionTextSecondary}>{t('share')}</Text>
              </>
            )}
          </PressableScale>

          <PressableScale
            onPress={() => onDelete(item._id)}
            scaleTo={0.88}
            style={styles.deleteIconBtn}
            contentStyle={styles.deleteIconContent}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

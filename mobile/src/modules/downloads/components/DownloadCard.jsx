import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import PressableScale from '../../../components/PressableScale';
import { getLocalizedName } from '../../../utils/localized';
import { getCardThumbnail, formatDownloadDate } from '../constants';
import { styles } from '../styles';

export default function DownloadCard({
  item,
  onPressThumbnail,
  onRedownload,
  onShare,
  onDelete,
}) {
  const { t, i18n } = useTranslation();

  const formattedDate = item.downloadedAt ? formatDownloadDate(item.downloadedAt, i18n.language) : null;
  const title = getLocalizedName(item.activeTemplate || item.aiTemplate || item.template, i18n.language) || item.title;

  return (
    <View style={styles.card}>
      <PressableScale
        onPress={() => onPressThumbnail(item)}
        scaleTo={0.94}
        style={styles.cardLeft}
      >
        <Image
          source={{ uri: getCardThumbnail(item) }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </PressableScale>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardDate}>
          {formattedDate ? t('saved_on', { date: formattedDate }) : t('recently_saved')}
        </Text>

        {item.editedText ? (
          <View style={styles.editTag}>
            <Text style={styles.editTagText} numberOfLines={1}>
              {item.editedText}
            </Text>
          </View>
        ) : null}

        {/* Actions Bar */}
        <View style={styles.actionRow}>
          <PressableScale
            onPress={() => onRedownload(item)}
            scaleTo={0.92}
            style={styles.actionBtnPrimary}
            contentStyle={styles.actionContent}
          >
            <Ionicons name="download-outline" size={14} color={COLORS.white} />
            <Text style={styles.actionTextPrimary}>{t('re_download')}</Text>
          </PressableScale>

          <PressableScale
            onPress={() => onShare(item.image)}
            scaleTo={0.92}
            style={styles.actionBtnSecondary}
            contentStyle={styles.actionContent}
          >
            <Ionicons name="share-social-outline" size={14} color={COLORS.ink} />
            <Text style={styles.actionTextSecondary}>{t('share')}</Text>
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

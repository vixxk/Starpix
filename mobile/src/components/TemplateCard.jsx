import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SHADOW, SINGLE_CARD_SNAP_HEIGHT, hp, wp, fontScale } from '../utils/responsive';
import { COLORS, FONTS } from '../constants/colors';
import { hapticTap } from '../utils/haptics';
import PressableScale from './PressableScale';
import TemplateRenderer from './TemplateRenderer';
import { useCreationStore } from '../store/useCreationStore';
import { resolveMediaUrl } from '../utils/media';

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

const getFooterThumbnail = (foot) => {
  if (foot && foot.thumbnail && !isVideoUrl(foot.thumbnail)) {
    return resolveMediaUrl(foot.thumbnail);
  }
  if (foot && foot.videoAsset && !isVideoUrl(foot.videoAsset)) {
    return resolveMediaUrl(foot.videoAsset);
  }
  return null;
};

const DEFAULT_FOOTERS = [];

import { useTranslation } from 'react-i18next';

export default function TemplateCard({
  template,
  onPress,
  width,
  height,
  actionWidth,
  wrapperMinHeight,
  style,
  shouldPlay = true,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const storeUserPhotoUri = useCreationStore((s) => s.userPhotoUri || s.defaultUserPhotoUri);
  const storeUserNameText = useCreationStore((s) => s.userNameText || s.defaultUserNameText);

  const availableFooters = (template && template.footers && template.footers.length > 0) ? template.footers : DEFAULT_FOOTERS;
  // By default, None (null) is selected
  const [selectedFooter, setSelectedFooter] = useState(null);

  if (!template) return null;

  const cardWidth = width || CARD_WIDTH;
  const cardHeight = height || (width ? width * (16 / 9) : CARD_HEIGHT);
  const actionContainerWidth = actionWidth || cardWidth;

  const handleEditDetails = () => {
    hapticTap();
    router.push('/edit-profile');
  };

  const handleDownload = () => {
    hapticTap();
    useCreationStore.getState().setSelectedFooter(selectedFooter);
    if (onPress) {
      onPress(selectedFooter);
    } else {
      router.push(`/template/${template._id}`);
    }
  };

  return (
    <View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          minHeight: wrapperMinHeight !== undefined ? wrapperMinHeight : SINGLE_CARD_SNAP_HEIGHT,
        },
        style,
      ]}
    >
      {/* Main Template Card Frame */}
      <PressableScale
        onPress={handleDownload}
        scaleTo={0.98}
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
          },
          CARD_SHADOW,
        ]}
        contentStyle={styles.cardContent}
      >
        <TemplateRenderer
          template={template}
          userPhotoUri={storeUserPhotoUri}
          userNameText={storeUserNameText || ''}
          selectedFooter={selectedFooter}
          canvasWidth={cardWidth}
          canvasHeight={cardHeight}
          showWatermark={false}
          isMuted={true}
          shouldPlay={shouldPlay}
        />
      </PressableScale>

      {/* Separated Action Buttons Row directly under every template card */}
      <View style={[styles.actionRow, { width: actionContainerWidth }]}>
        <PressableScale
          onPress={handleEditDetails}
          scaleTo={0.95}
          style={styles.editBtn}
          contentStyle={styles.btnContent}
        >
          <Ionicons name="create-outline" size={fontScale(14)} color={COLORS.ink} />
          <Text
            style={styles.editBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {t('edit_details')}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={handleDownload}
          scaleTo={0.95}
          style={styles.downloadBtn}
          contentStyle={styles.btnContent}
        >
          <Ionicons name="arrow-down-circle-outline" size={fontScale(15)} color={COLORS.white} />
          <Text
            style={styles.downloadBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {t('download')}
          </Text>
        </PressableScale>
      </View>

      {/* Footer Thumbnail Selector Row under the two buttons */}
      <View style={[styles.footerSelectorRow, { width: actionContainerWidth }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.footerScrollContent}
        >
          {/* Box #1: None option (Default state: selectedFooter === null) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              hapticTap();
              setSelectedFooter(null);
            }}
            style={[
              styles.footerBox,
              selectedFooter === null && styles.footerBoxActive,
            ]}
          >
            <Ionicons
              name="ban-outline"
              size={fontScale(17)}
              color={selectedFooter === null ? COLORS.orange : '#64748B'}
            />
            {selectedFooter === null && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={8} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>

          {/* Admin Uploaded Footer Thumbnail Boxes */}
          {availableFooters.map((foot, idx) => {
            const isSelected = Boolean(
              selectedFooter &&
                ((selectedFooter._id && foot._id && selectedFooter._id === foot._id) ||
                  selectedFooter.name === foot.name)
            );
            const thumbUri = getFooterThumbnail(foot);

            return (
              <TouchableOpacity
                key={foot._id || `foot_${idx}`}
                activeOpacity={0.7}
                onPress={() => {
                  hapticTap();
                  setSelectedFooter(foot);
                }}
                style={[
                  styles.footerBox,
                  isSelected && styles.footerBoxActive,
                ]}
              >
                {thumbUri ? (
                  <Image
                    source={{ uri: thumbUri }}
                    style={styles.footerBoxThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fallbackIconContainer}>
                    <Ionicons
                      name="sparkles"
                      size={fontScale(16)}
                      color={isSelected ? COLORS.orange : '#64748B'}
                    />
                  </View>
                )}

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={8} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: hp(0.01),
    minHeight: SINGLE_CARD_SNAP_HEIGHT,
    marginVertical: 0,
  },
  card: {
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1E1005',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(0.025),
    marginTop: hp(0.008),
  },
  editBtn: {
    flex: 1,
    height: hp(0.044),
    borderRadius: hp(0.012),
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  editBtnText: {
    color: COLORS.ink,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    flexShrink: 1,
  },
  downloadBtn: {
    flex: 1,
    height: hp(0.044),
    borderRadius: hp(0.012),
    backgroundColor: COLORS.orange,
    elevation: 3,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  downloadBtnText: {
    color: COLORS.white,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    flexShrink: 1,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
    width: '100%',
    paddingHorizontal: 4,
  },
  footerSelectorRow: {
    marginTop: hp(0.008),
  },
  footerScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  footerBox: {
    width: hp(0.046),
    height: hp(0.046),
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  footerBoxActive: {
    borderColor: COLORS.orange,
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  footerBoxThumb: {
    width: '100%',
    height: '100%',
  },
  fallbackIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: COLORS.orange,
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});

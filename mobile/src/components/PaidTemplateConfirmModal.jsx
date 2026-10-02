import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../utils/localized';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticImpact, hapticTap } from '../utils/haptics';
import PressableScale from './PressableScale';

export default function PaidTemplateConfirmModal({
  visible,
  template,
  action = 'download', // 'download' | 'share'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(visible);
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      hapticImpact();
      scale.setValue(0.92);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 75,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, scale, opacity]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    hapticTap();
    if (onCancel) onCancel();
  }, [onCancel, loading]);

  if (!modalVisible || !template) return null;

  const price = template.price || 49;
  const targetTemplate = template.rawTemplate || template;
  const templateName =
    getLocalizedName(targetTemplate, i18n.language) ||
    template.title ||
    template.name ||
    t('template', { defaultValue: 'Template' });
  const thumbUrl =
    template.posterUrl ||
    template.thumbnailUrl ||
    template.thumbnail ||
    template.previewAsset ||
    template.mainMedia;
  const isVideo =
    template.mediaType === 'video' ||
    template.type === 'video' ||
    Boolean(thumbUrl && typeof thumbUrl === 'string' && thumbUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i));

  const confirmButtonText =
    action === 'share'
      ? t('pay_and_share', { price, defaultValue: `Pay ₹${price} & Share` })
      : t('pay_and_download', { price, defaultValue: `Pay ₹${price} & Download` });

  const actionMsg =
    action === 'share'
      ? t('paid_template_confirm_share_msg', {
          price,
          defaultValue: `This paid template requires ₹${price} to share. Confirm payment to proceed.`,
        })
      : t('paid_template_confirm_msg', {
          price,
          defaultValue: `This paid template requires ₹${price} to download. Confirm payment to proceed.`,
        });

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlayWrap}>
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          {/* Top Header Row with Crown Badge, Title and Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons name="crown" size={24} color="#F59E0B" />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {t('paid_template_confirm_title', { defaultValue: 'Confirm Payment' })}
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={handleCancel}
              scaleTo={0.88}
              disabled={loading}
              style={styles.closeBtn}
              contentStyle={styles.closeBtnContent}
            >
              <Ionicons name="close" size={fontScale(18)} color={COLORS.inkMuted} />
            </PressableScale>
          </View>

          {/* Premium Template Showcase Card */}
          <View style={styles.templatePreviewBox}>
            <View style={styles.thumbWrapper}>
              {thumbUrl ? (
                <Image
                  source={{ uri: thumbUrl }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbImage, styles.thumbFallback]}>
                  <Ionicons name="sparkles" size={24} color={COLORS.orange} />
                </View>
              )}
              {isVideo && (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.templateMeta}>
              <Text style={styles.templateName} numberOfLines={2}>
                {templateName}
              </Text>

              {/* Feature Perks Pills */}
              <View style={styles.perksRow}>
                <View style={styles.perkPill}>
                  <Ionicons name="sparkles" size={11} color="#D97706" />
                  <Text style={styles.perkText} numberOfLines={1}>
                    {t('save_hd', { defaultValue: 'HD Quality' })}
                  </Text>
                </View>
                <View style={[styles.perkPill, styles.perkPillSuccess]}>
                  <Ionicons name="checkmark-circle" size={11} color="#059669" />
                  <Text style={[styles.perkText, styles.perkTextSuccess]} numberOfLines={1}>
                    {t('no_watermark', { defaultValue: 'No Watermark' })}
                  </Text>
                </View>
              </View>

              {/* Price Highlight */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceCurrency}>₹</Text>
                <Text style={styles.priceAmount}>{price}</Text>
              </View>
            </View>
          </View>

          {/* Clarity Notice Banner */}
          <View style={styles.noticeBox}>
            <Ionicons
              name="shield-checkmark"
              size={fontScale(17)}
              color={COLORS.orange}
              style={styles.noticeIcon}
            />
            <Text style={styles.noticeText}>
              {actionMsg}
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actions}>
            <PressableScale
              onPress={handleCancel}
              scaleTo={0.96}
              disabled={loading}
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
            >
              <Text
                style={styles.cancelText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('cancel', { defaultValue: 'Cancel' })}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={onConfirm}
              scaleTo={0.96}
              disabled={loading}
              style={styles.confirmBtn}
              contentStyle={styles.btnContent}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={action === 'share' ? 'share-social-outline' : 'download-outline'}
                    size={fontScale(17)}
                    color={COLORS.white}
                  />
                  <Text
                    style={styles.confirmText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                  >
                    {confirmButtonText}
                  </Text>
                </>
              )}
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.055),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 5, 0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 81, 30, 0.22)',
    padding: wp(0.055),
    shadowColor: '#1A0E05',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp(0.018),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(17),
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeBtnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatePreviewBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#EFE7DA',
    padding: 12,
    marginBottom: hp(0.016),
    gap: 12,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbImage: {
    width: 58,
    height: 82,
    borderRadius: 10,
    backgroundColor: '#E4DDD2',
  },
  thumbFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  templateName: {
    fontFamily: FONTS.semiBold,
    fontSize: fontScale(14),
    color: COLORS.ink,
    lineHeight: fontScale(18),
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  perkPillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  perkText: {
    fontFamily: FONTS.medium,
    fontSize: fontScale(10),
    color: '#B45309',
  },
  perkTextSuccess: {
    color: '#047857',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceCurrency: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(14),
    color: COLORS.orange,
    marginRight: 1,
  },
  priceAmount: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(18),
    color: COLORS.orange,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(244, 81, 30, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(244, 81, 30, 0.18)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 9,
    marginBottom: hp(0.02),
  },
  noticeIcon: {
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: fontScale(12),
    color: COLORS.inkSoft,
    lineHeight: fontScale(16.5),
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFE9DE',
    borderWidth: 1,
    borderColor: '#E3DCCF',
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: fontScale(14),
    color: COLORS.inkSoft,
  },
  confirmBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(13.5),
    color: COLORS.white,
    marginLeft: 5,
  },
  btnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

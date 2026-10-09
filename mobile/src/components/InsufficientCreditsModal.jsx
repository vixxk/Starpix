import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp } from '../utils/responsive';
import { hapticImpact, hapticTap } from '../utils/haptics';
import PressableScale from './PressableScale';

/**
 * Themed Insufficient AI Credits Modal
 * Matches the Starpix design system (warm cream surfaces, brand orange accents,
 * Poppins typography, spring entrance animations, and dual-tone comparison pill).
 */
export default function InsufficientCreditsModal({
  visible,
  neededCredits = 25,
  availableCredits = 0,
  onClose,
  onBuyCredits,
}) {
  const { t } = useTranslation();
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
          tension: 70,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, scale, opacity]);

  const handleClose = useCallback(() => {
    hapticTap();
    if (onClose) onClose();
  }, [onClose]);

  const handleBuy = useCallback(() => {
    hapticTap();
    if (onBuyCredits) {
      onBuyCredits();
    } else if (onClose) {
      onClose();
    }
  }, [onBuyCredits, onClose]);

  if (!modalVisible) return null;

  const shortfall = Math.max(0, neededCredits - availableCredits);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayWrap}>
        {/* Dimmed backdrop */}
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none" />

        {/* Backdrop tap-to-close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Dialog card */}
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          {/* Top Close Button */}
          <PressableScale
            onPress={handleClose}
            scaleTo={0.88}
            style={styles.closeBtn}
            contentStyle={styles.closeBtnContent}
          >
            <Ionicons name="close" size={fontScale(18)} color={COLORS.inkMuted} />
          </PressableScale>

          {/* Glowing Icon Badge */}
          <View style={styles.iconBadge}>
            <View style={styles.iconInner}>
              <Ionicons name="sparkles" size={24} color={COLORS.orange} />
            </View>
          </View>

          {/* Modal Title */}
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {t('insufficient_credits') || 'Insufficient Credits'}
          </Text>

          {/* Explanatory Message */}
          <Text style={styles.message}>
            {t('not_enough_credits_msg', {
              needed: neededCredits,
              available: availableCredits,
            }) ||
              `You need ${neededCredits} credits to generate this, but currently have ${availableCredits}. Would you like to buy more?`}
          </Text>

          {/* Credits Comparison Panel */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {/* Required Credits Column */}
              <View style={styles.statColumn}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {t('required_credits_label') || t('credits_abbr') || 'Required'}
                </Text>
                <View style={styles.valueRow}>
                  <Text style={[styles.statValue, { color: COLORS.ink }]}>
                    {neededCredits}
                  </Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>
              </View>

              {/* Vertical Divider */}
              <View style={styles.statDivider} />

              {/* Current Balance Column */}
              <View style={styles.statColumn}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {t('your_balance_label') || t('current_balance') || 'Your Balance'}
                </Text>
                <View style={styles.valueRow}>
                  <Text
                    style={[
                      styles.statValue,
                      { color: availableCredits > 0 ? COLORS.inkMuted : '#DC2626' },
                    ]}
                  >
                    {availableCredits}
                  </Text>
                  <Ionicons
                    name="wallet-outline"
                    size={fontScale(14)}
                    color={COLORS.inkMuted}
                    style={{ marginLeft: 3 }}
                  />
                </View>
              </View>
            </View>

            {/* Shortfall Pill */}
            {shortfall > 0 && (
              <View style={styles.shortfallPill}>
                <Ionicons name="alert-circle" size={13} color="#D97706" />
                <Text style={styles.shortfallText}>
                  {t('more_needed', {
                    count: shortfall,
                    abbr: t('ai_credits') || 'AI Credits',
                  }) || `+${shortfall} ${t('ai_credits') || 'AI Credits'}`}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <PressableScale
              onPress={handleClose}
              scaleTo={0.97}
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
            >
              <Text
                style={styles.cancelText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('cancel') || 'Cancel'}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={handleBuy}
              scaleTo={0.97}
              style={styles.confirmBtn}
              contentStyle={styles.btnContent}
            >
              <Ionicons name="sparkles" size={15} color={COLORS.white} />
              <Text
                style={styles.confirmText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('settings_buy_ai_credits') || t('buy_more_credits') || 'Buy Credits'}
              </Text>
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
    padding: wp(0.065),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 16, 5, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: wp(0.065),
    paddingBottom: wp(0.06),
    paddingHorizontal: wp(0.06),
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(90, 50, 20, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(17.5),
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
    paddingHorizontal: 8,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: fontScale(12.5),
    color: COLORS.inkMuted,
    textAlign: 'center',
    lineHeight: fontScale(18),
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: '#F8F4EE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(90, 50, 20, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: fontScale(11),
    color: COLORS.inkMuted,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(18),
    letterSpacing: -0.3,
  },
  aiBadge: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 4,
  },
  aiBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: fontScale(8.5),
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(90, 50, 20, 0.1)',
  },
  shortfallPill: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(90, 50, 20, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shortfallText: {
    fontFamily: FONTS.semiBold,
    fontSize: fontScale(11),
    color: '#D97706',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(90, 50, 20, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(90, 50, 20, 0.12)',
  },
  confirmBtn: {
    flex: 1.35,
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    elevation: 4,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnContent: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: fontScale(13.5),
    color: COLORS.inkMuted,
  },
  confirmText: {
    fontFamily: FONTS.semiBold,
    fontSize: fontScale(13.5),
    color: COLORS.white,
  },
});

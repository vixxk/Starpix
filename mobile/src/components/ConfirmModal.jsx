import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp } from '../utils/responsive';
import { hapticImpact } from '../utils/haptics';
import PressableScale from './PressableScale';

import { useTranslation } from 'react-i18next';

/**
 * Themed confirmation dialog that matches the Statuzzz design language
 * (warm cream surfaces, orange brand, Poppins type, spring animations).
 * Replaces the native Alert for destructive/decision prompts.
 */
export default function ConfirmModal({
  visible,
  title,
  message,
  icon = 'log-out-outline',
  iconColor = COLORS.error,
  confirmText,
  cancelText,
  confirmLoading = false,
  hideCancel = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText || t('confirm');
  const resolvedCancelText = cancelText || t('cancel');
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
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.94, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, scale, opacity]);

  const handleCancel = useCallback(() => {
    if (confirmLoading) return;
    if (onCancel) onCancel();
  }, [onCancel, confirmLoading]);

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlayWrap}>
        {/* Dimmed backdrop */}
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none" />

        {/* Backdrop tap-to-close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

        {/* Dialog card */}
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: `${iconColor}1A`, borderColor: `${iconColor}3D` },
            ]}
          >
            <Ionicons name={icon} size={26} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            {!hideCancel && (
              <PressableScale
                onPress={handleCancel}
                scaleTo={0.97}
                style={styles.cancelBtn}
                contentStyle={styles.btnContent}
              >
                <Text style={styles.cancelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{resolvedCancelText}</Text>
              </PressableScale>
            )}

            <PressableScale
              onPress={onConfirm}
              scaleTo={0.97}
              disabled={confirmLoading}
              style={[styles.confirmBtn, { backgroundColor: iconColor, shadowColor: iconColor }]}
              contentStyle={styles.btnContent}
            >
              {confirmLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.confirmText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{resolvedConfirmText}</Text>
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
    padding: wp(0.08),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 16, 5, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: wp(0.07),
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 14,
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(19),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  message: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: wp(0.055),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    elevation: 3,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  btnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  confirmText: {
    color: COLORS.white,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

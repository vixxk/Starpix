import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticImpact, hapticTap } from '../utils/haptics';

export default function PlanAlertModal({
  visible,
  onClose,
  type = 'downgrade', // 'downgrade' | 'already_active'
  currentPlanName = '',
  expiryDate = '',
}) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const isDowngrade = type === 'downgrade';

  useEffect(() => {
    if (visible) {
      hapticImpact();
      scale.setValue(0.9);
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
          toValue: 0.92,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  const handleClose = () => {
    hapticTap();
    onClose();
  };

  const title = isDowngrade
    ? t('cannot_downgrade_plan_title') || 'Plan Downgrade Not Allowed'
    : t('plan_already_active_title') || 'Subscription Already Active';

  const message = isDowngrade
    ? t('cannot_downgrade_plan_msg') ||
      'You have an active higher tier subscription. You cannot buy a lower plan until your current subscription expires.'
    : t('plan_already_active_msg') ||
      'You are already subscribed to this plan. You cannot purchase the same plan while it is active.';

  const badgeBg = isDowngrade ? '#FEF3C7' : '#DCFCE7';
  const badgeBorder = isDowngrade ? '#FDE68A' : '#BBF7D0';
  const iconColor = isDowngrade ? '#D97706' : '#16A34A';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayWrap}>
        {/* Dimmed backdrop */}
        <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Modal Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleClose}
          >
            <Ionicons name="close" size={fontScale(20)} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: badgeBg, borderColor: badgeBorder },
            ]}
          >
            {isDowngrade ? (
              <MaterialCommunityIcons name="crown" size={fontScale(32)} color={iconColor} />
            ) : (
              <Ionicons name="checkmark-circle" size={fontScale(34)} color={iconColor} />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Current Active Plan Highlight Card */}
          {Boolean(currentPlanName) && (
            <View style={styles.activePlanCard}>
              <View style={styles.activePlanRow}>
                <View style={styles.activePlanIconWrap}>
                  <MaterialCommunityIcons name="crown" size={fontScale(16)} color="#D97706" />
                </View>
                <View style={styles.activePlanInfo}>
                  <Text style={styles.activePlanLabel}>
                    {t('sub_current_active_plan') || 'CURRENT PLAN'}
                  </Text>
                  <Text style={styles.activePlanName}>{currentPlanName}</Text>
                  {Boolean(expiryDate) && (
                    <Text style={styles.activePlanExpiry}>
                      {expiryDate}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.88}
            onPress={handleClose}
          >
            <Text style={styles.actionBtnText}>{t('got_it') || 'Got It'}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: wp(0.06),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: hp(0.035),
    paddingBottom: hp(0.03),
    paddingHorizontal: wp(0.06),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconBadge: {
    width: wp(0.18),
    height: wp(0.18),
    maxWidth: 72,
    maxHeight: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.02),
  },
  title: {
    fontSize: fontScale(19),
    fontFamily: FONTS.bold,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: hp(0.01),
  },
  message: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: fontScale(20),
    marginBottom: hp(0.022),
  },
  activePlanCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: hp(0.014),
    paddingHorizontal: wp(0.035),
    marginBottom: hp(0.024),
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePlanIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.025),
  },
  activePlanInfo: {
    flex: 1,
  },
  activePlanLabel: {
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
    color: '#D97706',
    letterSpacing: 0.5,
  },
  activePlanName: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginTop: 1,
  },
  activePlanExpiry: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#78350F',
    marginTop: 2,
  },
  actionBtn: {
    width: '100%',
    height: hp(0.06),
    backgroundColor: '#EE1D24',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
});

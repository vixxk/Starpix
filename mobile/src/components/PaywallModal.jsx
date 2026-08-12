import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import API from '../utils/api';
import { hapticSuccess } from '../utils/haptics';
import AppButton from './AppButton';
import PressableScale from './PressableScale';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PaywallModal({ visible, template, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    translateY.setValue(SCREEN_HEIGHT);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 72 }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [translateY, overlayOpacity]);

  const animateOut = useCallback((done) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => done && done());
  }, [translateY, overlayOpacity]);

  useEffect(() => {
    if (visible) animateIn();
  }, [visible, animateIn]);

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  if (!template) return null;

  const handleUnlockSingle = async () => {
    setLoading(true);
    try {
      const res = await API.post('/payments/create-order', {
        templateId: template._id,
        amount: template.price || 49,
      });

      const { orderId } = res.data.data;

      const verifyRes = await API.post('/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'dev_signature_pass',
        templateId: template._id,
      });

      if (verifyRes.data.success) {
        hapticSuccess();
        animateOut(() => {
          onSuccess && onSuccess(verifyRes.data.data);
          onClose();
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing unlock request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlayWrap}>
        {/* Dimmed backdrop (animated) */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />

        {/* Backdrop tap-to-close */}
        <Pressable style={styles.overlayTouch} onPress={handleClose} />

        {/* Bottom sheet (springs up) */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <PressableScale onPress={handleClose} scaleTo={0.85} style={styles.closeBtn} contentStyle={styles.closeContent}>
            <Ionicons name="close" size={18} color={COLORS.inkMuted} />
          </PressableScale>

          <View style={styles.header}>
            <View style={styles.crownBadge}>
              <Ionicons name="crown" size={24} color="#000" />
            </View>
            <Text style={styles.title}>Unlock Premium Creation</Text>
            <Text style={styles.subtitle}>
              Get full HD, watermark-free export for "{template.name}"
            </Text>
          </View>

          {/* Pricing Options */}
          <View style={styles.optionsContainer}>
            <View style={[styles.optionCard, styles.selectedOption]}>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Single Unlock</Text>
                <Text style={styles.optionDesc}>Unlimited HD exports for this template</Text>
              </View>
              <Text style={styles.optionPrice}>₹{template.price || 49}</Text>
            </View>

            <View style={styles.optionCard}>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>VIP All-Access Pass</Text>
                <Text style={styles.optionDesc}>Unlock ALL 100+ premium status templates</Text>
              </View>
              <Text style={styles.optionPriceAlt}>₹199/mo</Text>
            </View>
          </View>

          <AppButton
            title={loading ? 'Processing Unlock...' : `Unlock Now for ₹${template.price || 49}`}
            onPress={handleUnlockSingle}
            loading={loading}
            style={{ marginTop: hp(0.02) }}
          />

          <Text style={styles.devNotice}>⚡ Development Mode · Instant Auto-Unlock</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 16, 5, 0.62)',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: wp(0.06),
    paddingBottom: wp(0.08),
    position: 'relative',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  closeContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: hp(0.026),
  },
  crownBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(20),
    fontFamily: FONTS.extrabold,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  selectedOption: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.surfaceAlt,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14.5),
    fontFamily: FONTS.bold,
  },
  optionDesc: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  optionPrice: {
    color: COLORS.orange,
    fontSize: fontScale(16),
    fontFamily: FONTS.extrabold,
  },
  optionPriceAlt: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.extrabold,
  },
  devNotice: {
    color: COLORS.inkFaint,
    fontSize: fontScale(10),
    textAlign: 'center',
    marginTop: 14,
    fontFamily: FONTS.medium,
  },
});

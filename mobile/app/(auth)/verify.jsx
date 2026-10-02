import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AuthHeader from '../../src/components/AuthHeader';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../../src/utils/haptics';

export default function VerifyScreen() {
  const { phone = '9876543210', countryCode = '+91', name = '', email = '', isNewUser = 'false' } = useLocalSearchParams();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 6 separate digits
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [alertMessage, setAlertMessage] = useState(null);
  const [resendTimer, setResendTimer] = useState(24);
  const [canResend, setCanResend] = useState(false);

  const { verifyOtp, requestOtp, isAuthenticating, error } = useAuthStore();

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Mask phone number: e.g. +91 98XXXXXX21
  const maskedPhone = React.useMemo(() => {
    const raw = String(phone || '').replace(/[^0-9]/g, '');
    if (raw.length >= 10) {
      const start = raw.slice(0, 2);
      const end = raw.slice(-2);
      return `${countryCode} ${start}XXXXXX${end}`;
    }
    return `${countryCode} ${raw}`;
  }, [phone, countryCode]);

  const handleDigitChange = (val, index) => {
    // If user pasted a multi-digit string
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setDigits(newDigits);
      const nextFocus = Math.min(cleaned.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    hapticTap();
    try {
      await requestOtp(phone, countryCode);
      setResendTimer(24);
      setCanResend(false);
    } catch (err) {
      // Handled in store
    }
  };

  const handleVerify = async () => {
    hapticTap();
    const otpCode = digits.join('');
    if (otpCode.length < 6) {
      setAlertMessage(t('auth_invalid_otp'));
      return;
    }

    try {
      const user = await verifyOtp(phone, countryCode, otpCode, name, isNewUser === 'true', email);
      // If user has not completed profile setup yet, navigate to Create Profile
      const needsProfile = !name && (!user?.name || user?.name.startsWith('Starpix User'));
      if (needsProfile) {
        router.replace({
          pathname: '/signup',
          params: { phone, countryCode },
        });
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      // Error handled in store
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const formattedTimer = `00:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Red Fluid Gradient Header with Back Arrow */}
          <AuthHeader showBack={true} onBack={() => router.back()} />

          {/* White Bottom Sheet Card */}
          <View
            style={[
              styles.card,
              { paddingBottom: Math.max(insets.bottom, 24) + hp(0.02) },
            ]}
          >
            {/* Title & Subtitle */}
            <Text style={styles.title}>{t('auth_verify_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_verify_subtitle')}</Text>
            <Text style={styles.phoneText}>{maskedPhone}</Text>

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={fontScale(16)} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 6 OTP Digit Boxes */}
            <View style={styles.otpBoxesRow}>
              {digits.map((digit, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.digitBox,
                    digit ? styles.digitBoxFilled : null,
                  ]}
                >
                  <TextInput
                    ref={(el) => (inputRefs.current[idx] = el)}
                    value={digit}
                    onChangeText={(val) => handleDigitChange(val, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={styles.digitInput}
                  />
                </View>
              ))}
            </View>

            {/* Resend OTP Row */}
            <View style={styles.resendRow}>
              <Text style={styles.resendPromptText}>{t('auth_didnt_receive')}</Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendActiveLink}>{t('auth_resend_otp')}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendCooldownText}>
                  <Text style={styles.resendUnderline}>{t('auth_resend_otp')}</Text>
                  <Text style={styles.timerColor}> in {formattedTimer}</Text>
                </Text>
              )}
            </View>

            {/* Change Mobile Number Link */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.changePhoneWrap}
            >
              <Text style={styles.changePhoneText}>{t('auth_change_mobile')}</Text>
            </TouchableOpacity>

            {/* Verify & Continue Button */}
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.88}
              disabled={isAuthenticating}
              style={[styles.primaryButton, isAuthenticating && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isAuthenticating ? '...' : t('auth_verify_continue')}
              </Text>
            </TouchableOpacity>

            {/* Security Note - Lock Icon and Text Aligned */}
            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Ionicons name="lock-closed" size={fontScale(13)} color="#6B7280" />
              </View>
              <Text style={styles.securityText}>{t('auth_verify_secure_note')}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Terms of Service & Privacy Policy Footer */}
            <View style={styles.termsFooter}>
              <Text style={styles.termsText}>
                {t('auth_terms_prefix')}
                <Text
                  style={styles.termsLink}
                  onPress={() => openLink('https://starpix.co/terms')}
                >
                  {t('auth_terms_of_service')}
                </Text>
                {t('auth_and')}
                <Text
                  style={styles.termsLink}
                  onPress={() => openLink('https://starpix.co/privacy')}
                >
                  {t('auth_privacy_policy')}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Validation Alert Modal */}
      <ConfirmModal
        visible={alertMessage !== null}
        title={t('invalid_input')}
        message={alertMessage}
        confirmText={t('got_it')}
        icon="alert-circle-outline"
        iconColor={COLORS.orange}
        hideCancel
        onCancel={() => setAlertMessage(null)}
        onConfirm={() => setAlertMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(0.08),
    borderTopRightRadius: wp(0.08),
    marginTop: -hp(0.032),
    paddingHorizontal: wp(0.065),
    paddingTop: hp(0.036),
  },
  title: {
    fontSize: fontScale(24),
    fontFamily: FONTS.bold,
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    marginTop: hp(0.006),
  },
  phoneText: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#374151',
    marginTop: hp(0.004),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.02),
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: wp(0.035),
    paddingVertical: hp(0.012),
    marginTop: hp(0.018),
  },
  errorText: {
    color: '#DC2626',
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    flex: 1,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.032),
  },
  digitBox: {
    width: wp(0.122),
    height: wp(0.138),
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFilled: {
    borderColor: '#D1D5DB',
  },
  digitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: fontScale(20),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.028),
  },
  resendPromptText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  resendActiveLink: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    color: '#EE1D24',
    textDecorationLine: 'underline',
  },
  resendCooldownText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
  },
  resendUnderline: {
    color: '#EE1D24',
    fontFamily: FONTS.semibold,
    textDecorationLine: 'underline',
  },
  timerColor: {
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  changePhoneWrap: {
    alignSelf: 'center',
    marginTop: hp(0.012),
  },
  changePhoneText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.semibold,
    color: '#EE1D24',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#EE1D24',
    height: hp(0.062),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.03),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.016),
  },
  securityIconBox: {
    width: fontScale(16),
    height: fontScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.018),
  },
  securityText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: hp(0.035),
    marginBottom: hp(0.015),
  },
  termsFooter: {
    alignItems: 'center',
    paddingHorizontal: wp(0.04),
  },
  termsText: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },
  termsLink: {
    color: '#EE1D24',
    fontFamily: FONTS.semibold,
    textDecorationLine: 'underline',
  },
});

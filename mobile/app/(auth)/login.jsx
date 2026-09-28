import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Rect, Circle } from 'react-native-svg';

import AuthHeader from '../../src/components/AuthHeader';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../../src/utils/haptics';

function IndiaFlagIcon() {
  return (
    <Svg width={wp(0.065)} height={wp(0.045)} viewBox="0 0 24 16">
      <Rect width="24" height="5.33" fill="#FF9933" />
      <Rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <Rect y="10.66" width="24" height="5.33" fill="#138808" />
      <Circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.8" fill="none" />
    </Svg>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const { requestOtp, isAuthenticating, error } = useAuthStore();

  const handleLogin = async () => {
    hapticTap();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setAlertMessage(t('auth_invalid_phone'));
      return;
    }

    try {
      await requestOtp(cleanPhone, '+91');
      router.push({
        pathname: '/verify',
        params: { phone: cleanPhone, countryCode: '+91' },
      });
    } catch (e) {
      // Error is set in store
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Red Fluid Gradient Header with tagline: "Turn moments into magic." */}
      <AuthHeader
        showBack={false}
        tagline={t('auth_tagline_login') || 'Turn moments into magic.'}
      />

      {/* Bottom Sheet Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, hp(0.025)) + hp(0.02) },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Title & Subtitle */}
            <Text style={styles.title}>{t('auth_welcome_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_welcome_subtitle')}</Text>

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={fontScale(16)} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Mobile Number Input Section */}
            <Text style={styles.inputLabel}>{t('auth_mobile_number')}</Text>
            <View style={[styles.phoneInputRow, isFocused && styles.phoneInputRowFocused]}>
              {/* Country Code Block */}
              <View style={styles.countryPicker}>
                <IndiaFlagIcon />
                <Text style={styles.countryCodeText}>+91</Text>
                <Ionicons name="chevron-down" size={fontScale(14)} color="#6B7280" />
              </View>

              {/* Subtle Vertical Divider */}
              <View style={styles.inputDivider} />

              {/* Mobile Number Input */}
              <TextInput
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder={t('auth_mobile_placeholder')}
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>

            {/* Security Note */}
            <View style={styles.securityRow}>
              <Ionicons name="lock-closed" size={fontScale(14)} color="#6B7280" />
              <Text style={styles.securityText}>
                {t('auth_security_priority') || 'Securing your personal information is our priority'}
              </Text>
            </View>

            {/* Login Button with Arrow */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={isAuthenticating}
              style={[styles.primaryButton, isAuthenticating && styles.buttonDisabled]}
            >
              <View style={styles.buttonContentRow}>
                <Text style={styles.primaryButtonText}>
                  {isAuthenticating ? '...' : (t('auth_login_btn') || 'Login')}
                </Text>
                {!isAuthenticating && (
                  <Ionicons
                    name="arrow-forward"
                    size={fontScale(18)}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
            </TouchableOpacity>

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
    backgroundColor: '#EE1D24',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(0.08),
    borderTopRightRadius: wp(0.08),
    marginTop: -hp(0.04),
    paddingHorizontal: wp(0.065),
    paddingTop: hp(0.038),
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
  inputLabel: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
    color: '#374151',
    marginTop: hp(0.032),
    marginBottom: hp(0.008),
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(0.065),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(0.035),
  },
  phoneInputRowFocused: {
    borderColor: '#EE1D24',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.018),
  },
  countryCodeText: {
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#111827',
  },
  inputDivider: {
    width: 1,
    height: hp(0.03),
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp(0.03),
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
    color: '#111827',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.02),
    marginTop: hp(0.016),
  },
  securityText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#EE1D24',
    height: hp(0.062),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.032),
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  termsFooter: {
    marginTop: hp(0.06),
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

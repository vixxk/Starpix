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
import CountryPickerModal, { COUNTRIES, IndiaFlagSvg } from '../../src/components/CountryPickerModal';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../../src/utils/haptics';

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const { requestOtp, isAuthenticating, error } = useAuthStore();

  const handleLogin = async () => {
    hapticTap();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const minLen = selectedCountry.minLen || 8;
    if (cleanPhone.length < minLen) {
      setAlertMessage(t('auth_invalid_phone'));
      return;
    }

    try {
      await requestOtp(cleanPhone, selectedCountry.dialCode);
      router.push({
        pathname: '/verify',
        params: {
          phone: cleanPhone,
          countryCode: selectedCountry.dialCode,
          isNewUser: 'false',
        },
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
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Main Scrollable Sheet with Header and Form */}
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
          {/* Top Red Fluid Gradient Header with brand logo & tagline */}
          <AuthHeader showBack={false} />

          {/* White Bottom Sheet Card */}
          <View
            style={[
              styles.card,
              { paddingBottom: Math.max(insets.bottom, 24) + hp(0.02) },
            ]}
          >
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
              {/* Country Code Dropdown Trigger */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  hapticTap();
                  setShowCountryPicker(true);
                }}
                style={styles.countryPicker}
              >
                <View style={styles.flagContainer}>
                  {selectedCountry.code === 'IN' ? (
                    <IndiaFlagSvg width={22} height={15} />
                  ) : (
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                  )}
                </View>
                <Text style={styles.countryCodeText}>{selectedCountry.dialCode}</Text>
                <Ionicons name="chevron-down" size={fontScale(12)} color="#6B7280" style={styles.chevronIcon} />
              </TouchableOpacity>

              {/* Subtle Vertical Divider */}
              <View style={styles.inputDivider} />

              {/* Mobile Number Input */}
              <TextInput
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxLen || 12}
                placeholder={t('auth_mobile_placeholder')}
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>

            {/* Security Note - Lock Icon and Text Aligned */}
            <View style={styles.securityRow}>
              <View style={styles.securityIconBox}>
                <Ionicons name="lock-closed" size={fontScale(13)} color="#6B7280" />
              </View>
              <Text style={styles.securityText}>
                {t('auth_security_note')}
              </Text>
            </View>

            {/* Primary Action Button: "Get OTP" */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={isAuthenticating}
              style={[styles.primaryButton, isAuthenticating && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isAuthenticating ? '...' : t('auth_get_otp')}
              </Text>
            </TouchableOpacity>

            {/* Switch Auth Option: Don't have an account? Sign up */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthPrompt}>
                {t('auth_dont_have_account')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  hapticTap();
                  router.push('/(auth)/signup');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchAuthLink}>
                  {t('auth_signup_link')}
                </Text>
              </TouchableOpacity>
            </View>

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

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
      />

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
    marginTop: hp(0.03),
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
    height: '100%',
    paddingRight: wp(0.01),
  },
  flagContainer: {
    width: 22,
    height: 15,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  flagEmoji: {
    fontSize: fontScale(16),
    lineHeight: fontScale(18),
    textAlign: 'center',
    includeFontPadding: false,
  },
  countryCodeText: {
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#111827',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginRight: 4,
  },
  chevronIcon: {
    marginTop: Platform.OS === 'android' ? 1 : 0,
  },
  inputDivider: {
    width: 1,
    height: hp(0.03),
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp(0.025),
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
    color: '#111827',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.014),
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
    flex: 1,
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
    fontSize: fontScale(15.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  switchAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(0.028),
  },
  switchAuthPrompt: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
    color: '#4B5563',
  },
  switchAuthLink: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
    color: '#EE1D24',
  },
  termsFooter: {
    marginTop: hp(0.045),
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

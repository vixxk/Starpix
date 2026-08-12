import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import AppButton from '../../src/components/AppButton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('Vivek Sharma');
  const { requestOtp, isAuthenticating, error } = useAuthStore();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      await requestOtp(phone);
      router.push({ pathname: '/(auth)/verify', params: { phone, name } });
    } catch (e) {
      // Error handled in store
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.brandTitle}>Statuzzz</Text>
          <Text style={styles.brandSubtitle}>Personalized statuses & creative quotes</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Sign up / Log in</Text>
            <View style={styles.otpBadge}>
              <Text style={styles.otpBadgeText}>OTP</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            New users register automatically. Enter your phone number to receive a 6-digit OTP.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Vivek Sharma"
              placeholderTextColor={COLORS.inkFaint}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="9876543210"
                placeholderTextColor={COLORS.inkFaint}
                style={[styles.textInput, styles.phoneInput]}
              />
            </View>
          </View>

          <AppButton
            title={isAuthenticating ? 'Sending OTP…' : 'Get Verification Code'}
            onPress={handleSendOtp}
            loading={isAuthenticating}
            style={{ marginTop: hp(0.014) }}
          />

          <PressableScale onPress={() => router.replace('/(tabs)')} scaleTo={0.94} style={styles.skipButton} contentStyle={styles.skipContent}>
            <Text style={styles.skipText}>Skip for now · explore as guest</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PAD,
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(0.04),
  },
  logoBadge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...CARD_SHADOW,
    shadowOpacity: 0.3,
  },
  logoLetter: {
    color: COLORS.white,
    fontSize: fontScale(33),
    fontFamily: FONTS.black,
  },
  brandTitle: {
    color: COLORS.ink,
    fontSize: fontScale(28),
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: COLORS.orange,
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: wp(0.06),
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: fontScale(19),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.3,
  },
  otpBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  otpBadgeText: {
    color: COLORS.orange,
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  cardSubtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginTop: 6,
    marginBottom: hp(0.024),
    lineHeight: 18,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: hp(0.018),
  },
  inputLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.semibold,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderRightWidth: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: COLORS.orange,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
  },
  phoneInput: {
    flex: 1,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  skipButton: {
    marginTop: 18,
    paddingVertical: 6,
  },
  skipContent: {
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.semibold,
  },
});

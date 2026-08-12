import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import AppButton from '../../src/components/AppButton';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function VerifyScreen() {
  const { phone, name } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const { verifyOtp, isAuthenticating, error } = useAuthStore();
  const router = useRouter();

  const handleVerify = async () => {
    if (otp.length < 6) {
      alert('Please enter the 6-digit OTP code');
      return;
    }
    try {
      await verifyOtp(phone, '+91', otp, name);
      router.replace('/(tabs)');
    } catch (e) {
      // Error handled in store
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="phone-portrait-outline" size={26} color={COLORS.orange} />
          </View>
          <Text style={styles.cardTitle}>Verify Phone Number</Text>
          <Text style={styles.cardSubtitle}>
            Enter the 6-digit code sent to <Text style={styles.phoneHighlight}>+91 {phone}</Text>
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>6-Digit OTP</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor={COLORS.inkFaint}
              style={styles.otpInput}
            />
          </View>

          <Text style={styles.devNote}>⚡ Dev mode · any 6-digit code works (e.g. 123456)</Text>

          <AppButton
            title={isAuthenticating ? 'Verifying…' : 'Verify & Continue'}
            onPress={handleVerify}
            loading={isAuthenticating}
            style={{ marginTop: hp(0.02) }}
          />
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: wp(0.06),
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.022),
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: fontScale(21),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    marginTop: 4,
    marginBottom: hp(0.028),
  },
  phoneHighlight: {
    color: COLORS.orange,
    fontFamily: FONTS.bold,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.semibold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  otpInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: 16,
    height: 56,
    color: COLORS.ink,
    fontSize: fontScale(22),
    fontFamily: FONTS.bold,
    textAlign: 'center',
    letterSpacing: 10,
  },
  devNote: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginVertical: 8,
  },
});

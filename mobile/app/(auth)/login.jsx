import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import AppButton from '../../src/components/AppButton';
import BrutalCard from '../../src/components/BrutalCard';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('Vivek Sharma');
  const [focusedInput, setFocusedInput] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const { requestOtp, isAuthenticating, error } = useAuthStore();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setAlertMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      await requestOtp(phone);
      router.push({ pathname: '/(auth)/verify', params: { phone, name } });
    } catch (e) {
      // Error handled in store
    }
  };

  const inputBorder = (key) => (focusedInput === key ? { borderColor: BRUTAL.flame, borderLeftWidth: 2 } : null);

  return (
    <AppBackground variant="bone">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Watermark */}
        <Text style={styles.watermark} numberOfLines={1}>
          STATUZZZ
        </Text>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoPlate} pointerEvents="none" />
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>STATUZZZ</Text>
          <Text style={styles.brandSubtitle}>CONTROL ROOM // STATUS ENGINE</Text>
        </View>

        <BrutalCard offset={wp(0.018)}>
          {/* Ink slab header strip */}
          <View style={styles.cardHeader}>
            <View style={styles.flameCorner} pointerEvents="none" />
            <Text style={styles.cardHeaderText}>Sign up / Log in</Text>
            <View style={styles.otpBadge}>
              <Text style={styles.otpBadgeText}>OTP</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardSubtitle}>
              New users register automatically. Enter your phone number to receive a 6-digit OTP.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={BRUTAL.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="e.g. Vivek Sharma"
                placeholderTextColor={BRUTAL.inkFaint}
                style={[styles.textInput, inputBorder('name')]}
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
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="9876543210"
                  placeholderTextColor={BRUTAL.inkFaint}
                  style={[styles.textInput, styles.phoneInput, inputBorder('phone')]}
                />
              </View>
            </View>

            <AppButton
              title={isAuthenticating ? 'Sending OTP…' : 'Get Verification Code'}
              onPress={handleSendOtp}
              loading={isAuthenticating}
              variant="brutal"
              style={{ marginTop: hp(0.014) }}
            />

            <PressableScale
              onPress={() => router.replace('/(tabs)')}
              scaleTo={0.94}
              style={styles.skipButton}
              contentStyle={styles.skipContent}
            >
              <Text style={styles.skipText}>Skip for now · explore as guest</Text>
            </PressableScale>
          </View>
        </BrutalCard>

        <Text style={styles.footerStamp}>© STATUZZZ · MOBILE STATUS PLATFORM</Text>
      </KeyboardAvoidingView>

      {/* Themed Validation Alert */}
      <ConfirmModal
        visible={alertMessage !== null}
        title="Invalid Input"
        message={alertMessage}
        confirmText="OK"
        icon="alert-circle-outline"
        iconColor={COLORS.orange}
        hideCancel
        onCancel={() => setAlertMessage(null)}
        onConfirm={() => setAlertMessage(null)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PAD,
    paddingVertical: hp(0.02),
  },
  watermark: {
    position: 'absolute',
    bottom: -hp(0.01),
    left: -wp(0.02),
    fontSize: fontScale(110),
    fontFamily: FONTS.display,
    color: 'rgba(23, 18, 12, 0.05)',
    letterSpacing: -2,
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(0.035),
    zIndex: 1,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  logoPlate: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 0,
    bottom: 0,
    backgroundColor: BRUTAL.ink,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 2,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    color: BRUTAL.ink,
    fontSize: fontScale(36),
    fontFamily: FONTS.display,
  },
  brandTitle: {
    color: BRUTAL.ink,
    fontSize: fontScale(30),
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: BRUTAL.flame,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.semibold,
    letterSpacing: 2.2,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  cardHeader: {
    backgroundColor: BRUTAL.ink,
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.016),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  flameCorner: {
    position: 'absolute',
    right: -22,
    top: -22,
    width: 64,
    height: 64,
    backgroundColor: BRUTAL.flame,
  },
  cardHeaderText: {
    color: BRUTAL.paper,
    fontSize: fontScale(18),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  otpBadge: {
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
  },
  otpBadgeText: {
    color: BRUTAL.ink,
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  cardBody: {
    padding: wp(0.05),
  },
  cardSubtitle: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    lineHeight: 19,
    marginBottom: hp(0.02),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEC',
    borderWidth: 2,
    borderColor: BRUTAL.error,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: hp(0.016),
  },
  errorText: {
    color: BRUTAL.error,
    fontSize: fontScale(12),
    fontFamily: FONTS.semibold,
    flex: 1,
  },
  inputGroup: {
    marginBottom: hp(0.018),
  },
  inputLabel: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  textInput: {
    backgroundColor: BRUTAL.bone,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    paddingHorizontal: 15,
    height: 52,
    color: BRUTAL.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: BRUTAL.ink,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRightWidth: 0,
    borderRadius: 2,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: BRUTAL.flame,
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
    marginTop: 16,
    paddingVertical: 6,
  },
  skipContent: {
    alignItems: 'center',
  },
  skipText: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(11),
    fontFamily: FONTS.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footerStamp: {
    color: 'rgba(23, 18, 12, 0.35)',
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: hp(0.024),
    zIndex: 1,
  },
});

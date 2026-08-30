import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import AppButton from '../../src/components/AppButton';
import BrutalCard from '../../src/components/BrutalCard';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function VerifyScreen() {
  const { phone, name, isNewUser } = useLocalSearchParams();
  const [otp, setOtp] = useState('123456');
  const [alertMessage, setAlertMessage] = useState(null);
  const { verifyOtp, isAuthenticating, error } = useAuthStore();
  const router = useRouter();

  const handleVerify = async () => {
    if (otp.length < 6) {
      setAlertMessage('Please enter the 6-digit OTP code');
      return;
    }
    try {
      await verifyOtp(phone, '+91', otp, name, isNewUser);
      router.replace('/(tabs)');
    } catch (e) {
      // Error handled in store
    }
  };

  return (
    <AppBackground variant="bone">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Watermark */}
        <Text style={styles.watermark} numberOfLines={1}>
          STARPIX
        </Text>

        <BrutalCard offset={wp(0.018)}>
          {/* Ink slab header strip */}
          <View style={styles.cardHeader}>
            <View style={styles.flameCorner} pointerEvents="none" />
            <View style={styles.iconBadge}>
              <Ionicons name="phone-portrait-outline" size={22} color={BRUTAL.ink} />
            </View>
            <Text style={styles.cardHeaderText} numberOfLines={1}>
              Verify Phone
            </Text>
            <View style={styles.phoneStamp}>
              <Text style={styles.phoneStampText} numberOfLines={1}>
                +91 {phone}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>ENTER THE CODE</Text>
            <Text style={styles.cardSubtitle}>
              We sent a 6-digit code to your number. Type it below to unlock your account.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={BRUTAL.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>6-Digit OTP</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••••"
                placeholderTextColor={BRUTAL.inkFaint}
                style={styles.otpInput}
              />
            </View>

            <View style={styles.devNote}>
              <Ionicons name="flash" size={12} color={BRUTAL.flame} />
              <Text style={styles.devNoteText}>DEV MODE · ANY 6-DIGIT CODE WORKS (E.G. 123456)</Text>
            </View>

            <AppButton
              title={isAuthenticating ? 'Verifying…' : 'Verify & Continue'}
              onPress={handleVerify}
              loading={isAuthenticating}
              variant="brutal"
              style={{ marginTop: hp(0.02) }}
            />
          </View>
        </BrutalCard>

        <Text style={styles.footerStamp}>© STARPIX · SECURE OTP VERIFICATION</Text>
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
  cardHeader: {
    backgroundColor: BRUTAL.ink,
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.016),
    flexDirection: 'row',
    alignItems: 'center',
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
  iconBadge: {
    width: 40,
    height: 40,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  cardHeaderText: {
    color: BRUTAL.paper,
    fontSize: fontScale(17),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  phoneStamp: {
    backgroundColor: BRUTAL.paper,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
    flexShrink: 0,
    maxWidth: '42%',
  },
  phoneStampText: {
    color: BRUTAL.ink,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: wp(0.05),
  },
  cardTitle: {
    color: BRUTAL.ink,
    fontSize: fontScale(20),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: hp(0.024),
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
    marginBottom: 10,
  },
  inputLabel: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  otpInput: {
    backgroundColor: BRUTAL.bone,
    borderWidth: 2,
    borderColor: BRUTAL.flame,
    borderRadius: 2,
    height: 58,
    color: BRUTAL.ink,
    fontSize: fontScale(22),
    fontFamily: FONTS.bold,
    textAlign: 'center',
    letterSpacing: 10,
  },
  devNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRUTAL.paperAlt,
    borderWidth: 2,
    borderColor: 'rgba(23, 18, 12, 0.25)',
    borderRadius: 2,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: hp(0.014),
  },
  devNoteText: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
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

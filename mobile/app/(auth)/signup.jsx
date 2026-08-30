import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import AppButton from '../../src/components/AppButton';
import BrutalCard from '../../src/components/BrutalCard';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [focusedInput, setFocusedInput] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const { requestOtp, isAuthenticating, error } = useAuthStore();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name.trim()) {
      setAlertMessage('Please enter your full name');
      return;
    }
    if (phone.length < 10) {
      setAlertMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!agreedToTerms) {
      setAlertMessage('Please agree to the Terms & Privacy Policy to continue');
      return;
    }

    try {
      await requestOtp(phone);
      router.push({
        pathname: '/verify',
        params: { phone, name: name.trim(), isNewUser: 'true' },
      });
    } catch (e) {
      // Error handled in store
    }
  };

  const inputStyle = (key) => [
    styles.textInput,
    focusedInput === key && { borderColor: BRUTAL.flame, borderLeftWidth: 3 },
  ];

  return (
    <AppBackground variant="bone">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Watermark background */}
        <Text style={styles.watermark} numberOfLines={1}>
          STARPIX
        </Text>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoPlate} pointerEvents="none" />
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="cover" />
            </View>
          </View>
          <Text style={styles.brandTitle}>STARPIX</Text>
        </View>

        <BrutalCard offset={wp(0.018)}>
          {/* Ink slab header strip */}
          <View style={styles.cardHeader}>
            <View style={styles.flameCorner} pointerEvents="none" />
            <Text style={styles.cardHeaderText}>Create Account</Text>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>SIGN UP</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardSubtitle}>
              Join Starpix to build custom status cards and video reels with your photo.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={BRUTAL.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Full Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={BRUTAL.inkFaint}
                style={inputStyle('name')}
              />
            </View>

            {/* Mobile Number Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number *</Text>
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
                  style={[styles.textInput, styles.phoneInput, inputStyle('phone')]}
                />
              </View>
            </View>



            {/* Terms Agreement */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              style={styles.termsRow}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                {agreedToTerms && <Ionicons name="checkmark-sharp" size={14} color={BRUTAL.ink} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsHighlight}>Terms of Service</Text> &{' '}
                <Text style={styles.termsHighlight}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <AppButton
              title={isAuthenticating ? 'Sending OTP…' : 'Create Account & Get OTP'}
              onPress={handleSignUp}
              loading={isAuthenticating}
              variant="brutal"
              style={{ marginTop: hp(0.016) }}
            />

            {/* Toggle to Login */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.switchLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BrutalCard>

        <Text style={styles.footerStamp}>© STARPIX · MOBILE STATUS PLATFORM</Text>
      </KeyboardAvoidingView>

      {/* Validation Modal */}
      <ConfirmModal
        visible={alertMessage !== null}
        title="Input Required"
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
    marginBottom: hp(0.025),
    zIndex: 1,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: 12,
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
    width: 62,
    height: 62,
    borderRadius: 2,
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  brandTitle: {
    color: BRUTAL.ink,
    fontSize: fontScale(28),
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: BRUTAL.flame,
    fontSize: fontScale(9),
    fontFamily: FONTS.semibold,
    letterSpacing: 2.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  cardHeader: {
    backgroundColor: BRUTAL.ink,
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.015),
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
    fontSize: fontScale(17),
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeWrap: {
    backgroundColor: BRUTAL.flame,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    color: BRUTAL.ink,
    fontSize: fontScale(9.5),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  cardBody: {
    padding: wp(0.045),
  },
  cardSubtitle: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    lineHeight: 18,
    marginBottom: hp(0.016),
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
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    flex: 1,
  },
  inputGroup: {
    marginBottom: hp(0.014),
  },
  inputLabel: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(10),
    fontFamily: FONTS.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  textInput: {
    backgroundColor: BRUTAL.bone,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    borderRadius: 2,
    paddingHorizontal: 14,
    height: 48,
    color: BRUTAL.ink,
    fontSize: fontScale(13.5),
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
    paddingHorizontal: 13,
    height: 48,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: BRUTAL.flame,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
  },
  phoneInput: {
    flex: 1,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: hp(0.01),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: BRUTAL.ink,
    backgroundColor: BRUTAL.bone,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  checkboxActive: {
    backgroundColor: BRUTAL.flame,
  },
  termsText: {
    color: BRUTAL.inkSoft,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    flex: 1,
  },
  termsHighlight: {
    color: BRUTAL.ink,
    fontFamily: FONTS.bold,
    textDecorationLine: 'underline',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: hp(0.016),
  },
  switchText: {
    color: BRUTAL.inkMute,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
  },
  switchLink: {
    color: BRUTAL.flame,
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    textDecorationLine: 'underline',
  },
  footerStamp: {
    color: 'rgba(23, 18, 12, 0.35)',
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: hp(0.02),
    zIndex: 1,
  },
});

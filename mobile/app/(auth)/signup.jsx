import React, { useState, useEffect } from 'react';
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
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

import AuthHeader from '../../src/components/AuthHeader';
import ConfirmModal from '../../src/components/ConfirmModal';
import CountryPickerModal, { COUNTRIES, IndiaFlagSvg } from '../../src/components/CountryPickerModal';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../../src/utils/haptics';
import API from '../../src/utils/api';

export default function SignupScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initialPhone, countryCode: initialCountryCode } = useLocalSearchParams();

  // Step 1: 'profile' (Name, Email), Step 2: 'phone' (Mobile Number)
  const [step, setStep] = useState('profile');

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Step 2 fields
  const [phone, setPhone] = useState(initialPhone || '');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (initialCountryCode) {
      const found = COUNTRIES.find((c) => c.dialCode === initialCountryCode);
      if (found) return found;
    }
    return COUNTRIES[0];
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const [alertMessage, setAlertMessage] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { requestOtp, isAuthenticating, error, clearError } = useAuthStore();

  useEffect(() => {
    if (clearError) clearError();
  }, [clearError]);

  const uploadPhoto = async (uri) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('file', {
        uri,
        name: filename,
        type,
      });
      formData.append('folder', 'user-profiles');
      const res = await API.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        setUploadedPhotoUrl(res.data.data.url);
      }
    } catch (err) {
      console.warn('Background avatar upload in signup:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    hapticTap();
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        setAlertMessage(t('camera_permission_required') || 'Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setProfilePhotoUri(uri);
        uploadPhoto(uri);
      }
    } catch (err) {
      console.error('Error taking photo in signup:', err);
      setAlertMessage(t('failed_pick_image') || 'Failed to capture photo');
    }
  };

  const handleChooseFromGallery = async () => {
    setShowPhotoModal(false);
    hapticTap();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setAlertMessage(t('gallery_permission_required') || 'Gallery access permission is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setProfilePhotoUri(uri);
        uploadPhoto(uri);
      }
    } catch (err) {
      console.error('Error choosing gallery photo in signup:', err);
      setAlertMessage(t('failed_pick_image') || 'Failed to pick photo');
    }
  };

  const handleRemovePhoto = () => {
    setShowPhotoModal(false);
    hapticTap();
    setProfilePhotoUri(null);
    setUploadedPhotoUrl(null);
  };

  const handleContinueProfile = () => {
    hapticTap();
    if (clearError) clearError();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setAlertMessage(t('auth_invalid_name'));
      return;
    }

    // Optional email validation: only validate format if user entered an email
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setAlertMessage(t('auth_invalid_email'));
        return;
      }
    }

    setStep('phone');
  };

  const handleRequestOtp = async () => {
    hapticTap();
    if (clearError) clearError();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const minLen = selectedCountry.minLen || 8;
    if (cleanPhone.length < minLen) {
      setAlertMessage(t('auth_invalid_phone'));
      return;
    }

    try {
      await requestOtp(cleanPhone, selectedCountry.dialCode, true);
      router.push({
        pathname: '/verify',
        params: {
          phone: cleanPhone,
          countryCode: selectedCountry.dialCode,
          name: name.trim(),
          email: email.trim(),
          profilePhoto: uploadedPhotoUrl || profilePhotoUri || '',
          isNewUser: 'true',
        },
      });
    } catch (e) {
      if (e.code === 'USER_ALREADY_EXISTS' || (e.response && e.response.status === 409)) {
        if (clearError) clearError();
        setShowLoginPrompt(true);
      }
    }
  };

  const handleBack = () => {
    hapticTap();
    if (step === 'phone') {
      setStep('profile');
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/login');
      }
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

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
          {/* Top Red Fluid Gradient Header with brand logo & back button */}
          <AuthHeader showBack={true} onBack={handleBack} />

          {/* White Bottom Sheet Card */}
          <View
            style={[
              styles.card,
              { paddingBottom: Math.max(insets.bottom, 24) + hp(0.02) },
            ]}
          >
            {step === 'profile' ? (
              <>
                {/* Step 1: Create Your Profile */}
                <Text style={styles.title}>{t('auth_create_profile_title')}</Text>
                <Text style={styles.subtitle}>{t('auth_create_profile_subtitle')}</Text>

                {/* Profile Photo Avatar Section */}
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      hapticTap();
                      setShowPhotoModal(true);
                    }}
                    style={styles.avatarWrapper}
                  >
                    {profilePhotoUri ? (
                      <View style={styles.avatarImageContainer}>
                        <Image
                          source={{ uri: profilePhotoUri }}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                        {isUploadingPhoto && (
                          <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person-outline" size={fontScale(34)} color="#9CA3AF" />
                      </View>
                    )}

                    {/* Floating Camera Badge */}
                    <View style={styles.cameraBadge}>
                      <Ionicons
                        name={profilePhotoUri ? 'camera' : 'add'}
                        size={fontScale(14)}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Caption / Action Text */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticTap();
                      setShowPhotoModal(true);
                    }}
                    style={styles.avatarLabelRow}
                  >
                    <Text style={styles.avatarActionText}>
                      {profilePhotoUri
                        ? (t('change_photo') || 'Change Photo')
                        : (t('auth_profile_photo_hint') || 'Add Profile Photo (Optional)')}
                    </Text>
                  </TouchableOpacity>

                  {profilePhotoUri && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleRemovePhoto}
                      style={styles.removePhotoBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.removePhotoText}>{t('remove_photo') || 'Remove Photo'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Full Name Input */}
                <Text style={styles.inputLabel}>{t('full_name')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder={t('enter_name_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  style={[styles.textInput, focusedInput === 'name' && styles.textInputFocused]}
                />

                {/* Email (Optional) Input */}
                <Text style={styles.inputLabel}>{t('auth_email_optional')}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t('auth_email_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  style={[styles.textInput, focusedInput === 'email' && styles.textInputFocused]}
                />

                {/* Personalisation Note */}
                <View style={styles.personaliseRow}>
                  <View style={styles.noteIconBox}>
                    <Ionicons name="person" size={fontScale(13)} color="#6B7280" />
                  </View>
                  <Text style={styles.personaliseText}>{t('auth_personalise_note')}</Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={handleContinueProfile}
                  activeOpacity={0.88}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>{t('auth_continue')}</Text>
                </TouchableOpacity>

                {/* Switch to Login */}
                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthPrompt}>
                    {t('auth_already_have_account')}{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      hapticTap();
                      router.replace('/(auth)/login');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchAuthLink}>{t('auth_login_link')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Profile Settings Notice */}
                <Text style={styles.noticeText}>{t('auth_edit_later_note')}</Text>
              </>
            ) : (
              <>
                {/* Step 2: Enter Mobile Number */}
                <Text style={styles.title}>{t('auth_mobile_step_title')}</Text>
                <Text style={styles.subtitle}>{t('auth_mobile_step_subtitle')}</Text>

                {/* Error Banner */}
                {error && !error.includes('already exists') && !showLoginPrompt && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={fontScale(16)} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Mobile Number Section */}
                <Text style={styles.inputLabel}>{t('auth_mobile_number')}</Text>
                <View style={[styles.phoneInputRow, isPhoneFocused && styles.phoneInputRowFocused]}>
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
                    <Ionicons
                      name="chevron-down"
                      size={fontScale(12)}
                      color="#6B7280"
                      style={styles.chevronIcon}
                    />
                  </TouchableOpacity>

                  {/* Subtle Vertical Divider */}
                  <View style={styles.inputDivider} />

                  {/* Mobile Number Input */}
                  <TextInput
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    keyboardType="phone-pad"
                    maxLength={selectedCountry.maxLen || 12}
                    placeholder={t('auth_mobile_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    style={styles.phoneTextInput}
                  />
                </View>

                {/* Security Note - Lock Icon and Text Aligned */}
                <View style={styles.securityRow}>
                  <View style={styles.securityIconBox}>
                    <Ionicons name="lock-closed" size={fontScale(13)} color="#6B7280" />
                  </View>
                  <Text style={styles.securityText}>{t('auth_security_note')}</Text>
                </View>

                {/* Primary Action Button: "Get OTP" */}
                <TouchableOpacity
                  onPress={handleRequestOtp}
                  activeOpacity={0.88}
                  disabled={isAuthenticating}
                  style={[styles.primaryButton, isAuthenticating && styles.buttonDisabled]}
                >
                  <Text style={styles.primaryButtonText}>
                    {isAuthenticating ? '...' : t('auth_get_otp')}
                  </Text>
                </TouchableOpacity>

                {/* Switch to Login */}
                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthPrompt}>
                    {t('auth_already_have_account')}{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      hapticTap();
                      router.replace('/(auth)/login');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchAuthLink}>{t('auth_login_link')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Terms & Privacy Policy Footer */}
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
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Picker Options Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.photoSheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}
          >
            {/* Top Pill Handle Indicator */}
            <View style={styles.sheetHandle} />

            {/* Modal Title */}
            <Text style={styles.sheetTitle}>{t('add_photo') || 'Add Photo'}</Text>

            {/* Options Group */}
            <View style={styles.sheetOptionsGroup}>
              {/* Option 1: Take Photo */}
              <TouchableOpacity
                style={styles.sheetOptionRow}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <View style={styles.sheetOptionIconCircle}>
                  <Ionicons name="camera" size={fontScale(18)} color="#EE1D24" />
                </View>
                <Text style={styles.sheetOptionText}>{t('take_photo') || 'Take Photo'}</Text>
                <Ionicons name="chevron-forward" size={fontScale(16)} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 2: Choose from Gallery */}
              <TouchableOpacity
                style={[
                  styles.sheetOptionRow,
                  !profilePhotoUri && { borderBottomWidth: 0 },
                ]}
                activeOpacity={0.7}
                onPress={handleChooseFromGallery}
              >
                <View style={styles.sheetOptionIconCircle}>
                  <Ionicons name="image" size={fontScale(18)} color="#EE1D24" />
                </View>
                <Text style={styles.sheetOptionText}>{t('choose_from_gallery') || 'Choose from Gallery'}</Text>
                <Ionicons name="chevron-forward" size={fontScale(16)} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 3: Remove Photo (if selected) */}
              {profilePhotoUri && (
                <TouchableOpacity
                  style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={handleRemovePhoto}
                >
                  <View style={[styles.sheetOptionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trash" size={fontScale(18)} color="#DC2626" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: '#DC2626' }]}>
                    {t('remove_photo') || 'Remove Photo'}
                  </Text>
                  <Ionicons name="chevron-forward" size={fontScale(16)} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.sheetCancelText}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

      {/* Account Already Exists Modal */}
      <ConfirmModal
        visible={showLoginPrompt}
        title={t('auth_account_exists_title')}
        message={t('auth_user_already_exists')}
        confirmText={t('auth_login_link')}
        cancelText={t('cancel')}
        icon="log-in-outline"
        iconColor={COLORS.orange}
        onCancel={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          router.push('/(auth)/login');
        }}
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
  inputLabel: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
    color: '#374151',
    marginTop: hp(0.026),
    marginBottom: hp(0.008),
  },
  textInput: {
    height: hp(0.065),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(0.04),
    fontSize: fontScale(14),
    fontFamily: FONTS.medium,
    color: '#111827',
    includeFontPadding: false,
  },
  textInputFocused: {
    borderColor: '#EE1D24',
  },
  personaliseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.016),
  },
  noteIconBox: {
    width: fontScale(16),
    height: fontScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.018),
  },
  personaliseText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flex: 1,
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
  phoneTextInput: {
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
    marginTop: hp(0.024),
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: hp(0.035),
    marginBottom: hp(0.018),
  },
  noticeText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },
  termsFooter: {
    marginTop: hp(0.035),
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

  /* Avatar Upload Section */
  avatarSection: {
    alignItems: 'center',
    marginVertical: hp(0.018),
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarImageContainer: {
    width: wp(0.24),
    height: wp(0.24),
    borderRadius: wp(0.12),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: wp(0.24),
    height: wp(0.24),
    borderRadius: wp(0.12),
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderStyle: 'dashed',
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(0.076),
    height: wp(0.076),
    borderRadius: wp(0.038),
    backgroundColor: '#EE1D24',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  avatarLabelRow: {
    marginTop: hp(0.008),
    paddingHorizontal: wp(0.02),
    paddingVertical: hp(0.004),
  },
  avatarActionText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semibold,
    color: '#EE1D24',
    textAlign: 'center',
  },
  removePhotoBtn: {
    marginTop: hp(0.002),
    paddingHorizontal: wp(0.02),
    paddingVertical: hp(0.003),
  },
  removePhotoText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  /* Photo Sheet Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: wp(0.05),
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: hp(0.016),
  },
  sheetTitle: {
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: hp(0.02),
  },
  sheetOptionsGroup: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: hp(0.018),
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.016),
    paddingHorizontal: wp(0.04),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.035),
  },
  sheetOptionText: {
    flex: 1,
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#1F2937',
  },
  sheetCancelBtn: {
    width: '100%',
    paddingVertical: hp(0.016),
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#4B5563',
  },
});

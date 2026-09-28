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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AuthHeader from '../../src/components/AuthHeader';
import ConfirmModal from '../../src/components/ConfirmModal';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCreationStore } from '../../src/store/useCreationStore';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '../../src/utils/haptics';

export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const setDefaultUserNameText = useCreationStore((state) => state.setDefaultUserNameText);

  const initialName = user?.name && !user.name.startsWith('Starpix User') ? user.name : '';
  const initialEmail = user?.email || '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [focusedInput, setFocusedInput] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    hapticTap();
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

    setIsSubmitting(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: trimmedName,
          email: trimmedEmail,
        });
      }
      if (setDefaultUserNameText) {
        setDefaultUserNameText(trimmedName);
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error saving profile:', e);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Red Fluid Gradient Header with Back Arrow */}
      <AuthHeader showBack={true} onBack={handleBack} />

      {/* White Bottom Sheet Card */}
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
            <Text style={styles.title}>{t('auth_create_profile_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_create_profile_subtitle')}</Text>

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
              <Ionicons name="person" size={fontScale(14)} color="#6B7280" />
              <Text style={styles.personaliseText}>{t('auth_personalise_note')}</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.88}
              disabled={isSubmitting}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? '...' : t('auth_continue')}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Profile Settings Notice */}
            <Text style={styles.noticeText}>{t('auth_edit_later_note')}</Text>
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
  inputLabel: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
    color: '#374151',
    marginTop: hp(0.028),
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
  },
  textInputFocused: {
    borderColor: '#EE1D24',
  },
  personaliseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.02),
    marginTop: hp(0.016),
  },
  personaliseText: {
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
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: hp(0.04),
    marginBottom: hp(0.02),
  },
  noticeText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },
});

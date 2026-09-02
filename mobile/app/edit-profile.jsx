import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import Toast from '../src/components/Toast';
import ConfirmModal from '../src/components/ConfirmModal';
import { COLORS, FONTS, BRUTAL } from '../src/constants/colors';
import { SCREEN_PAD, CARD_SHADOW, hp, wp } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreationStore } from '../src/store/useCreationStore';
import { resolveMediaUrl } from '../src/utils/media';
import { uploadUserMedia } from '../src/utils/upload';
import { hapticTap } from '../src/utils/haptics';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const { user, updateUserProfile } = useAuthStore();
  const defaultUserPhotoUri = useCreationStore((s) => s.defaultUserPhotoUri);
  const defaultUserNameText = useCreationStore((s) => s.defaultUserNameText);
  const setDefaultUserPhotoUri = useCreationStore((s) => s.setDefaultUserPhotoUri);
  const setDefaultUserNameText = useCreationStore((s) => s.setDefaultUserNameText);

  const [initialPhotoUri] = useState(defaultUserPhotoUri || user?.profilePhoto || null);
  const [initialNameText] = useState(defaultUserNameText || user?.name || '');

  const [photoUri, setPhotoUri] = useState(defaultUserPhotoUri || user?.profilePhoto || null);
  const [nameText, setNameText] = useState(defaultUserNameText || user?.name || '');
  const [saving, setSaving] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const hasUnsavedChanges = photoUri !== initialPhotoUri || nameText.trim() !== initialNameText.trim();

  const handleBackPress = () => {
    hapticTap();
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (hasUnsavedChanges) {
        setShowDiscardModal(true);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [hasUnsavedChanges]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handlePickImage = async () => {
    hapticTap();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('gallery_permission_required'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        showToast(t('photo_selected'));
      }
    } catch (err) {
      console.error('Error picking photo:', err);
      showToast(t('failed_pick_image'));
    }
  };

  const handleRemoveImage = () => {
    hapticTap();
    setPhotoUri(null);
    showToast(t('photo_cleared'));
  };

  const handleSave = async () => {
    hapticTap();
    setSaving(true);
    try {
      const trimmedName = nameText.trim();
      let uploadedPhotoUrl = photoUri;

      if (
        photoUri &&
        (photoUri.startsWith('file://') ||
          photoUri.startsWith('content://') ||
          photoUri.startsWith('ph://') ||
          photoUri.startsWith('data:image/'))
      ) {
        uploadedPhotoUrl = await uploadUserMedia(photoUri, 'user-profiles');
      }

      // Update global creation store
      setDefaultUserPhotoUri(uploadedPhotoUrl);
      setDefaultUserNameText(trimmedName);

      // Sync with user auth profile if logged in
      if (updateUserProfile && user) {
        await updateUserProfile({
          name: trimmedName,
          profilePhoto: uploadedPhotoUrl || '',
        });
      }

      showToast(t('profile_updated'));
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      }, 600);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast(t('error_saving_profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <PressableScale
            onPress={handleBackPress}
            scaleTo={0.9}
            style={styles.backBtn}
            contentStyle={styles.centerContent}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </PressableScale>
          <View>
            <Text style={styles.headerTitle}>{t('edit_profile_title')}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Photo Upload Section */}
          <View style={[styles.sectionCard, CARD_SHADOW]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconChip}>
                <Ionicons name="camera-outline" size={18} color={COLORS.orange} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('photo')}</Text>
              </View>
            </View>

            <View style={styles.avatarPickerWrap}>
              <PressableScale onPress={handlePickImage} scaleTo={0.95} style={styles.avatarGlowBorder}>
                {photoUri ? (
                  <Image source={{ uri: resolveMediaUrl(photoUri) }} style={styles.heroAvatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.heroAvatarPlaceholder}>
                    <Ionicons name="person-add" size={40} color={COLORS.orange} />
                    <Text style={styles.addPhotoTag}>{t('photo')}</Text>
                  </View>
                )}
                <View style={styles.cameraFloatingBadge}>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                </View>
              </PressableScale>

              <View style={styles.photoActionButtons}>
                <PressableScale onPress={handlePickImage} scaleTo={0.96} style={styles.choosePhotoBtn} contentStyle={styles.btnContent}>
                  <Ionicons name="image" size={16} color={COLORS.white} />
                  <Text style={styles.choosePhotoBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {photoUri ? t('change_photo_gallery') : t('select_photo_gallery')}
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>

          {/* Name Input Section */}
          <View style={[styles.sectionCard, CARD_SHADOW, { marginTop: 16 }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconChip}>
                <Ionicons name="text-outline" size={18} color={COLORS.orange} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('full_name')}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person" size={18} color={COLORS.orange} style={{ marginRight: 10 }} />
              <TextInput
                value={nameText}
                onChangeText={setNameText}
                placeholder={t('enter_name_placeholder')}
                placeholderTextColor={COLORS.inkMuted}
                style={styles.textInput}
                maxLength={36}
                autoCapitalize="words"
              />
              {nameText.length > 0 && (
                <PressableScale onPress={() => setNameText('')} scaleTo={0.88}>
                  <Ionicons name="close-circle" size={18} color={COLORS.inkMuted} />
                </PressableScale>
              )}
            </View>
            <Text style={styles.charCountText}>{nameText.length}/36</Text>
          </View>

          {/* Floating Save Button */}
          <PressableScale
            onPress={handleSave}
            disabled={saving}
            scaleTo={0.96}
            style={styles.primarySaveBtn}
            contentStyle={styles.centerContent}
          >
            <Text style={styles.primarySaveBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {saving ? '...' : t('save_changes')}
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>

        <ConfirmModal
          visible={showDiscardModal}
          title={t('discard_changes_title')}
          message={t('discard_changes_msg')}
          confirmText={t('discard')}
          cancelText={t('keep_editing')}
          icon="alert-circle-outline"
          iconColor={COLORS.orange}
          onCancel={() => setShowDiscardModal(false)}
          onConfirm={handleConfirmDiscard}
        />

        <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  centerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 80,
    paddingTop: 4,
  },

  /* Live Preview Card */
  previewCard: {
    backgroundColor: '#1E1005',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginBottom: 16,
  },
  previewLabel: {
    color: COLORS.orange,
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.orange,
    overflow: 'hidden',
  },
  previewAvatarImg: {
    width: '100%',
    height: '100%',
  },
  previewAvatarPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextWrap: {
    flex: 1,
  },
  previewNameText: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  previewSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  sectionSub: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },

  /* Avatar Picker */
  avatarPickerWrap: {
    alignItems: 'center',
  },
  avatarGlowBorder: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: COLORS.orange,
    position: 'relative',
    elevation: 4,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  heroAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoTag: {
    color: COLORS.orange,
    fontSize: 10,
    fontFamily: FONTS.bold,
    marginTop: 4,
  },
  cameraFloatingBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionButtons: {
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  choosePhotoBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    width: '100%',
  },
  choosePhotoBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    flexShrink: 1,
    paddingHorizontal: 4,
  },
  removePhotoBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    width: '100%',
  },
  removePhotoBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    flexShrink: 1,
  },

  /* Name Input */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  charCountText: {
    color: COLORS.inkMuted,
    fontSize: 11,
    fontFamily: FONTS.medium,
    textAlign: 'right',
    marginTop: 6,
  },

  /* Save Button */
  primarySaveBtn: {
    backgroundColor: COLORS.orange,
    marginTop: 24,
    height: 52,
    borderRadius: 18,
    elevation: 6,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  primarySaveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    paddingHorizontal: 12,
    flexShrink: 1,
  },
});

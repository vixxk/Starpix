import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import BackButton from '../src/components/BackButton';
import Toast from '../src/components/Toast';
import ConfirmModal from '../src/components/ConfirmModal';
import { COLORS, FONTS, BRUTAL } from '../src/constants/colors';
import { SCREEN_PAD, CARD_SHADOW, hp, wp, fontScale } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreationStore } from '../src/store/useCreationStore';
import { resolveMediaUrl } from '../src/utils/media';
import { uploadUserMedia } from '../src/utils/upload';
import { hapticTap, hapticImpact } from '../src/utils/haptics';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const { user, updateUserProfile } = useAuthStore();
  const defaultUserPhotoUri = useCreationStore((s) => s.defaultUserPhotoUri);
  const defaultUserNameText = useCreationStore((s) => s.defaultUserNameText);
  const setDefaultUserPhotoUri = useCreationStore((s) => s.setDefaultUserPhotoUri);
  const setDefaultUserNameText = useCreationStore((s) => s.setDefaultUserNameText);
  const setUserPhotoUri = useCreationStore((s) => s.setUserPhotoUri);
  const setUserNameText = useCreationStore((s) => s.setUserNameText);

  const [initialPhotoUri] = useState(user?.profilePhoto || defaultUserPhotoUri || null);
  const [initialNameText] = useState(user?.name || defaultUserNameText || '');
  const [initialEmailText] = useState(user?.email || '');

  const [photoUri, setPhotoUri] = useState(user?.profilePhoto || defaultUserPhotoUri || null);
  const [nameText, setNameText] = useState(user?.name || defaultUserNameText || '');
  const [emailText, setEmailText] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const hasUnsavedChanges =
    photoUri !== initialPhotoUri ||
    nameText.trim() !== initialNameText.trim() ||
    emailText.trim() !== initialEmailText.trim();

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

  // Option 1: Take Photo with device camera
  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    hapticTap();
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('camera_permission_required') || 'Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        showToast(t('photo_selected') || 'Photo selected! Tap Save to apply.');
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      showToast(t('failed_pick_image') || 'Failed to capture photo');
    }
  };

  // Option 2: Choose from Gallery
  const handleChooseFromGallery = async () => {
    setShowPhotoModal(false);
    hapticTap();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('gallery_permission_required') || 'Gallery access permission is required!');
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
        showToast(t('photo_selected') || 'Photo selected! Tap Save to apply.');
      }
    } catch (err) {
      console.error('Error picking photo from gallery:', err);
      showToast(t('failed_pick_image') || 'Failed to choose image from gallery');
    }
  };

  // Option 3: Remove Photo
  const handleRemovePhoto = () => {
    setShowPhotoModal(false);
    hapticTap();
    setPhotoUri(null);
    showToast(t('photo_cleared') || 'Photo cleared.');
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
          photoUri.startsWith('ph://'))
      ) {
        try {
          const remoteUrl = await uploadUserMedia(photoUri, 'user-profiles');
          if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
            uploadedPhotoUrl = remoteUrl;
          }
        } catch (upErr) {
          console.warn('uploadUserMedia direct error:', upErr);
        }
      }

      // If photoUri is local and remote upload couldn't produce an http url,
      // prepare base64 for backend upload to S3 without bloating local state
      let profilePhotoForBackend = uploadedPhotoUrl || '';
      if (
        uploadedPhotoUrl &&
        (uploadedPhotoUrl.startsWith('file://') || uploadedPhotoUrl.startsWith('content://'))
      ) {
        try {
          const base64 = await FileSystem.readAsStringAsync(uploadedPhotoUrl, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
          const mimeType = uploadedPhotoUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
          profilePhotoForBackend = `data:${mimeType};base64,${base64}`;
        } catch (b64Err) {
          console.warn('Base64 encoding fallback error:', b64Err);
        }
      }

      // Update global creation store with clean URI (local file URI or S3 URL, NOT raw base64!)
      setDefaultUserPhotoUri(uploadedPhotoUrl);
      setDefaultUserNameText(trimmedName);
      setUserPhotoUri(uploadedPhotoUrl);
      setUserNameText(trimmedName);

      // Sync with user auth profile in backend
      if (updateUserProfile) {
        await updateUserProfile({
          name: trimmedName,
          email: emailText.trim(),
          profilePhoto: profilePhotoForBackend,
        });
      }

      showToast(t('profile_updated') || 'Profile updated successfully!');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      }, 600);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast(t('error_saving_profile') || 'Error Saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Top Header Bar with Standardized VIP-style Back Button on Top Left */}
        <View style={styles.headerBar}>
          <BackButton onPress={handleBackPress} />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{t('edit_profile_title') || 'Edit Profile'}</Text>
          </View>
          <View style={{ width: wp(0.1) }} />
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
                  <Ionicons name="camera-outline" size={18} color="#E11D48" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{t('photo') || 'Photo'}</Text>
                </View>
              </View>

              <View style={styles.avatarPickerWrap}>
                <PressableScale
                  onPress={() => setShowPhotoModal(true)}
                  scaleTo={0.95}
                  style={styles.avatarGlowBorder}
                >
                  {photoUri ? (
                    <Image
                      source={{ uri: resolveMediaUrl(photoUri) }}
                      style={styles.heroAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.heroAvatarPlaceholder}>
                      <Ionicons name="person-add" size={38} color="#E11D48" />
                      <Text style={styles.addPhotoTag}>{t('add_photo') || 'Add Photo'}</Text>
                    </View>
                  )}
                  <View style={styles.cameraFloatingBadge}>
                    <Ionicons name="camera" size={13} color="#FFFFFF" />
                  </View>
                </PressableScale>

                <View style={styles.photoActionButtons}>
                  <PressableScale
                    onPress={() => setShowPhotoModal(true)}
                    scaleTo={0.96}
                    style={styles.choosePhotoBtn}
                    contentStyle={styles.btnContent}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.choosePhotoBtnText} numberOfLines={1}>
                      {photoUri ? (t('change_photo_gallery') || 'Change Photo') : (t('add_photo') || 'Add Photo')}
                    </Text>
                  </PressableScale>
                </View>
              </View>
            </View>

            {/* Name Input Section */}
            <View style={[styles.sectionCard, CARD_SHADOW, { marginTop: 16 }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconChip}>
                  <Ionicons name="text-outline" size={18} color="#E11D48" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{t('full_name') || 'Full Name'}</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person" size={18} color="#E11D48" style={{ marginRight: 10 }} />
                <TextInput
                  value={nameText}
                  onChangeText={setNameText}
                  placeholder={t('enter_name_placeholder') || 'Enter your name'}
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                  maxLength={36}
                  autoCapitalize="words"
                />
                {nameText.length > 0 && (
                  <PressableScale onPress={() => setNameText('')} scaleTo={0.88}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </PressableScale>
                )}
              </View>
              <Text style={styles.charCountText}>{nameText.length}/36</Text>
            </View>

            {/* Email (Optional) Input Section */}
            <View style={[styles.sectionCard, CARD_SHADOW, { marginTop: 16 }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconChip}>
                  <Ionicons name="mail-outline" size={18} color="#E11D48" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{t('auth_email_optional') || 'Email (Optional)'}</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={18} color="#E11D48" style={{ marginRight: 10 }} />
                <TextInput
                  value={emailText}
                  onChangeText={setEmailText}
                  placeholder={t('auth_email_placeholder') || 'Enter your email address'}
                  placeholderTextColor="#9CA3AF"
                  style={styles.textInput}
                  maxLength={64}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {emailText.length > 0 && (
                  <PressableScale onPress={() => setEmailText('')} scaleTo={0.88}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </PressableScale>
                )}
              </View>
            </View>

            {/* Save Changes Button */}
            <PressableScale
              onPress={handleSave}
              disabled={saving}
              scaleTo={0.97}
              style={styles.primarySaveBtn}
              contentStyle={styles.btnContent}
            >
              <Text style={styles.primarySaveBtnText}>
                {saving ? (t('saving') || 'Saving...') : (t('save_changes') || 'Save Changes')}
              </Text>
            </PressableScale>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* 3-Options "Add Photo" Bottom Sheet Modal Matching Reference */}
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

            {/* 3 Options Group */}
            <View style={styles.sheetOptionsGroup}>
              {/* Option 1: Take Photo */}
              <TouchableOpacity
                style={styles.sheetOptionRow}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <View style={styles.sheetOptionIconCircle}>
                  <Ionicons name="camera" size={20} color="#E11D48" />
                </View>
                <Text style={styles.sheetOptionText}>{t('take_photo') || 'Take Photo'}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 2: Choose from Gallery */}
              <TouchableOpacity
                style={styles.sheetOptionRow}
                activeOpacity={0.7}
                onPress={handleChooseFromGallery}
              >
                <View style={styles.sheetOptionIconCircle}>
                  <Ionicons name="image" size={20} color="#E11D48" />
                </View>
                <Text style={styles.sheetOptionText}>{t('choose_from_gallery') || 'Choose from Gallery'}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 3: Remove Photo */}
              <TouchableOpacity
                style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={handleRemovePhoto}
              >
                <View style={styles.sheetOptionIconCircle}>
                  <Ionicons name="trash" size={20} color="#E11D48" />
                </View>
                <Text style={styles.sheetOptionText}>{t('remove_photo') || 'Remove Photo'}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
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

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        visible={showDiscardModal}
        title={t('discard_changes_title') || 'Discard Changes?'}
        message={t('discard_changes_msg') || 'You have unsaved changes. Are you sure you want to discard them?'}
        confirmText={t('discard') || 'Discard'}
        cancelText={t('keep_editing') || 'Keep Editing'}
        icon="alert-circle-outline"
        iconColor="#EF4444"
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={handleConfirmDiscard}
      />

      <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.04),
    paddingBottom: hp(0.012),
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: hp(0.01),
    paddingBottom: hp(0.06),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  avatarPickerWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarGlowBorder: {
    position: 'relative',
    borderRadius: 55,
    padding: 3,
  },
  heroAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: '#E11D48',
  },
  heroAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF1F2',
    borderWidth: 2,
    borderColor: '#FDA4AF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoTag: {
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
    color: '#E11D48',
    marginTop: 4,
  },
  cameraFloatingBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E11D48',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionButtons: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  choosePhotoBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    width: '100%',
  },
  choosePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    color: '#111827',
    fontSize: fontScale(14.5),
    fontFamily: FONTS.medium,
  },
  charCountText: {
    color: '#9CA3AF',
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    textAlign: 'right',
    marginTop: 6,
  },
  primarySaveBtn: {
    backgroundColor: '#EE1D24',
    marginTop: 24,
    height: 50,
    borderRadius: 25,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },

  /* "Add Photo" Bottom Sheet Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  photoSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetOptionsGroup: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetOptionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: fontScale(15),
    fontFamily: FONTS.semiBold,
    color: '#1F2937',
  },
  sheetCancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  sheetCancelText: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
});

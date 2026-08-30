import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, SPACING, CARD_SHADOW } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCreationStore } from '../../src/store/useCreationStore';
import { resolveMediaUrl } from '../../src/utils/media';
import ConfirmModal from '../../src/components/ConfirmModal';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import Toast from '../../src/components/Toast';
import ReportModal from '../../src/components/ReportModal';
import API from '../../src/utils/api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTranslation } from 'react-i18next';
import LanguageModal from '../../src/components/LanguageModal';
import { SUPPORTED_LANGUAGES } from '../../src/i18n';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, logout, fetchUser, updateUserProfile, isLoading } = useAuthStore();
  const defaultUserPhotoUri = useCreationStore((state) => state.defaultUserPhotoUri);
  const setDefaultUserPhotoUri = useCreationStore((state) => state.setDefaultUserPhotoUri);

  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showIssueReportModal, setShowIssueReportModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const effectivePhotoUri = defaultUserPhotoUri || user?.profilePhoto || null;
  const currentLangCode = i18n.language || 'en';
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const menuItems = [
    { icon: 'heart-outline', label: t('my_saved_favorites'), route: '/favorites' },
    { icon: 'card-outline', label: t('unlocked_entitlements'), route: '/entitlements' },
    { icon: 'trophy-outline', label: t('vip_pass_subscription'), route: '/vip' },
    {
      icon: 'alert-circle-outline',
      label: t('report_an_issue'),
      onPress: () => setShowIssueReportModal(true),
    },
    {
      icon: 'document-text-outline',
      label: t('my_issues_reports'),
      route: '/my-reports',
    },
    {
      icon: 'language-outline',
      label: t('app_language'),
      sublabel: `${currentLangObj.flag} ${currentLangObj.nativeName}`,
      onPress: () => setShowLanguageModal(true),
    },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleToastDone = useCallback(() => setToastMessage(null), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (fetchUser) {
      try {
        await fetchUser();
      } catch (e) {
        console.error(e);
      }
    }
    setRefreshing(false);
  }, [fetchUser]);

  const handlePickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('gallery_permission_required'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setDefaultUserPhotoUri(uri);
        if (updateUserProfile) {
          await updateUserProfile({ profilePhoto: uri });
        }
        showToast(t('default_photo_updated'));
      }
    } catch (err) {
      console.error('Error picking profile image:', err);
      showToast(t('failed_pick_image'));
    }
  };

  const handleRemoveProfileImage = async () => {
    setDefaultUserPhotoUri(null);
    if (updateUserProfile) {
      await updateUserProfile({ profilePhoto: '' });
    }
    showToast(t('photo_cleared'));
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await API.post('/auth/delete-account', { reason: 'User requested account deletion' });
      setShowDeleteModal(false);
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      showToast(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return <View style={{ flex: 1, backgroundColor: BRUTAL.bone }} />;
  }

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Profile header */}
          <PressableScale onPress={() => router.push('/edit-profile')} scaleTo={0.98} style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatarWrapper}>
                {effectivePhotoUri ? (
                  <Image
                    source={{ uri: resolveMediaUrl(effectivePhotoUri) }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name ? user.name.substring(0, 1) : 'U'}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="pencil" size={12} color={COLORS.white} />
                </View>
              </View>

              <View style={styles.identity}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
                <Text style={styles.userPhone}>{user.phoneNumber || '+91'}</Text>
              </View>

              <View style={[styles.badge, user.isPremium ? styles.premiumBadge : styles.freeBadge]}>
                <Text style={[styles.badgeText, user.isPremium ? styles.premiumText : styles.freeText]}>
                  {user.isPremium ? t('vip') : t('free')}
                </Text>
              </View>
            </View>
          </PressableScale>

          {/* Menu */}
          <Text style={styles.sectionLabel}>{t('your_account')}</Text>
          <View style={styles.optionsCard}>
            {menuItems.map((item, idx) => (
              <PressableScale
                key={item.label}
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  } else if (item.route) {
                    router.push(item.route);
                  }
                }}
                scaleTo={0.97}
                style={[styles.optionRow, idx === menuItems.length - 1 && styles.optionRowLast]}
                contentStyle={styles.optionContent}
              >
                <View style={styles.optionIconWrap}>
                  <Ionicons name={item.icon} size={19} color={COLORS.orange} />
                </View>
                <Text style={styles.optionLabel}>{item.label}</Text>
                {item.sublabel && (
                  <View style={styles.sublabelPill}>
                    <Text style={styles.optionSublabel} numberOfLines={1}>
                      {item.sublabel}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={17} color={COLORS.inkFaint} />
              </PressableScale>
            ))}
          </View>

          <PressableScale onPress={handleLogoutPress} scaleTo={0.97} haptic="impact" style={styles.logoutButton} contentStyle={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.orange} />
            <Text style={styles.logoutText}>{t('log_out_account')}</Text>
          </PressableScale>

          <PressableScale onPress={() => setShowDeleteModal(true)} scaleTo={0.97} haptic="impact" style={styles.deleteAccountButton} contentStyle={styles.deleteAccountContent}>
            <Ionicons name="trash-outline" size={17} color={COLORS.error || '#ef4444'} />
            <Text style={styles.deleteAccountText}>{t('delete_account')}</Text>
          </PressableScale>
        </ScrollView>
      </View>

      {/* Report Issue Modal */}
      <ReportModal
        visible={showIssueReportModal}
        type="issue"
        onClose={() => setShowIssueReportModal(false)}
        onSuccess={() => showToast('Issue report submitted successfully!')}
      />

      {/* Language Selector Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={() => showToast(t('language_updated'))}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />

      {/* Themed Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutModal}
        title={t('confirm_logout')}
        message={t('confirm_logout_msg')}
        confirmText={t('log_out_account')}
        cancelText={t('cancel')}
        icon="log-out-outline"
        iconColor={COLORS.orange}
        confirmLoading={logoutLoading}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Themed Account Delete Confirmation */}
      <ConfirmModal
        visible={showDeleteModal}
        title={t('delete_account_title')}
        message={t('delete_account_msg')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        icon="trash-outline"
        iconColor={COLORS.error || '#ef4444'}
        confirmLoading={deleteLoading}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteAccount}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: SCREEN_PAD,
    paddingBottom: hp(0.05),
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: wp(0.05),
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: wp(0.05),
    marginTop: hp(0.01),
    ...CARD_SHADOW,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: wp(0.16),
    height: wp(0.16),
    borderRadius: wp(0.08),
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.orangeSoft,
  },
  avatarImage: {
    width: wp(0.16),
    height: wp(0.16),
    borderRadius: wp(0.08),
    borderWidth: 3,
    borderColor: COLORS.orange,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: fontScale(24),
    fontFamily: FONTS.extrabold,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.orangeDeep || '#d97706',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  identity: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    color: COLORS.ink,
    fontSize: fontScale(18),
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  userPhone: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  changePhotoBtn: {
    marginTop: 6,
  },
  changePhotoText: {
    color: COLORS.orange,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: COLORS.gold,
  },
  freeBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  badgeText: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.5,
  },
  premiumText: {
    color: '#000',
  },
  freeText: {
    color: COLORS.orange,
  },
  memberSince: {
    color: COLORS.inkFaint,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 14,
  },
  sectionLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: hp(0.028),
    marginBottom: 10,
    marginLeft: 4,
  },
  photoSettingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: wp(0.045),
    ...CARD_SHADOW,
  },
  photoSettingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoPreviewThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.orangeSoft,
  },
  photoPreviewThumb: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSettingsTextWrap: {
    flex: 1,
  },
  photoSettingsTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
  },
  photoSettingsSub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    marginTop: 2,
    lineHeight: fontScale(16),
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  pickPhotoBtn: {
    flex: 1,
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pickPhotoBtnText: {
    color: COLORS.white,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
  },
  removePhotoBtn: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  optionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: wp(0.045),
    ...CARD_SHADOW,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    color: COLORS.ink,
    fontSize: fontScale(14.5),
    fontFamily: FONTS.semibold,
  },
  sublabelPill: {
    backgroundColor: '#FFF0E0',
    paddingHorizontal: wp(0.022),
    paddingVertical: hp(0.004),
    borderRadius: wp(0.03),
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    marginRight: wp(0.01),
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionSublabel: {
    color: COLORS.orangeDeep,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  logoutButton: {
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    marginTop: SPACING.xxl,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: COLORS.orange,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
  },
  deleteAccountButton: {
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 12,
  },
  deleteAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteAccountText: {
    color: COLORS.error || '#ef4444',
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
  },
});


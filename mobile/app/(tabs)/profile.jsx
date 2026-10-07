import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Linking,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import ConfirmModal from '../../src/components/ConfirmModal';
import LanguageModal from '../../src/components/LanguageModal';
import IssueFeedbackModal from '../../src/components/IssueFeedbackModal';
import AppRefreshControl from '../../src/components/AppRefreshControl';
import Toast from '../../src/components/Toast';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../../src/utils/responsive';
import { hapticTap, hapticImpact } from '../../src/utils/haptics';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCreationStore } from '../../src/store/useCreationStore';
import { resolveMediaUrl } from '../../src/utils/media';
import { SUPPORTED_LANGUAGES } from '../../src/i18n';
import API from '../../src/utils/api';

function SettingItem({ icon, label, sublabel, badge, onPress, isLast = false, isDestructive = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        hapticTap();
        onPress && onPress();
      }}
      style={[styles.itemRow, !isLast && styles.itemRowBorder]}
    >
      <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
        <Ionicons
          name={icon}
          size={fontScale(18)}
          color={isDestructive ? '#EF4444' : '#E11D48'}
        />
      </View>
      <View style={styles.itemTextCol}>
        <Text style={[styles.itemLabel, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.itemSublabel}>{sublabel}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.creditItemBadge}>
          <Ionicons name="sparkles" size={11} color="#D97706" style={{ marginRight: 4 }} />
          <Text style={styles.creditItemBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={fontScale(16)} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { user, token, logout, fetchUser, isLoading } = useAuthStore();
  const defaultUserPhotoUri = useCreationStore((state) => state.defaultUserPhotoUri);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const effectivePhotoUri = user?.profilePhoto || defaultUserPhotoUri || null;
  const currentLangCode = i18n.language || 'en';
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

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
      const baseUrl = API.defaults?.baseURL || 'http://localhost:5000/api';
      const webDeleteUrl = `${baseUrl.replace(/\/api\/?$/, '')}/delete${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      setShowDeleteModal(false);
      await Linking.openURL(webDeleteUrl);
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      showToast(err.message || 'Failed to open account deletion page');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast(url);
      }
    } catch {
      showToast(url);
    }
  };

  const handleShareApp = async () => {
    try {
      hapticTap();
      await Share.share({
        message:
          t('share_app_message') ||
          'Download Starpix App for beautiful status, festival & greeting posts! https://play.google.com/store/apps/details?id=com.starpix.app',
      });
    } catch (err) {
      console.warn('Share app error:', err);
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
          {/* Top Bar Header */}
          <View style={styles.topHeaderRow}>
            <Text style={styles.screenTitle}>{t('settings_title') || 'Settings'}</Text>
          </View>

          {/* User Profile Card */}
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  hapticTap();
                  router.push('/edit-profile');
                }}
                style={styles.profileIdentityRow}
              >
                <View style={styles.avatarWrapper}>
                  {effectivePhotoUri ? (
                    <Image
                      source={{ uri: resolveMediaUrl(effectivePhotoUri) }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cameraBadge}>
                    <Ionicons name="pencil" size={12} color={COLORS.white} />
                  </View>
                </View>

                <View style={styles.identity}>
                  <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                    {user.name || 'Starpix User'}
                  </Text>
                  <Text style={styles.userPhone}>{user.phoneNumber || '+91'}</Text>
                </View>
              </TouchableOpacity>

              {/* Top Section Right Side Badge: Clicking Free opens subscriptions page */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticTap();
                  router.push('/vip');
                }}
                style={[styles.badge, user.isPremium ? styles.premiumBadge : styles.freeBadge]}
              >
                <Text style={[styles.badgeText, user.isPremium ? styles.premiumText : styles.freeText]}>
                  {user.isPremium ? t('vip') : t('free')}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={user.isPremium ? '#D97706' : '#E11D48'}
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 1: General */}
          <Text style={styles.sectionHeader}>{t('settings_section_general') || 'General'}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="download-outline"
              label={t('settings_downloads') || 'Downloads'}
              onPress={() => router.push({ pathname: '/(tabs)/downloads', params: { from: 'settings' } })}
            />
            <SettingItem
              icon="globe-outline"
              label={t('settings_preferred_language') || 'Preferred Language'}
              sublabel={currentLangObj.nativeName || currentLangObj.name}
              onPress={() => setShowLanguageModal(true)}
              isLast={true}
            />
          </View>

          {/* Section 2: Support & Community */}
          <Text style={styles.sectionHeader}>{t('settings_section_support') || 'Support & Community'}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="chatbubble-ellipses-outline"
              label={t('settings_issues_feedbacks') || t('settings_feedback_issues') || 'Issues & Feedback'}
              onPress={() => setShowFeedbackModal(true)}
            />
            <SettingItem
              icon="headset-outline"
              label={t('settings_contact_us') || 'Contact Us'}
              onPress={() => router.push('/contact')}
            />
            <SettingItem
              icon="share-social-outline"
              label={t('settings_share_app') || 'Share App'}
              onPress={handleShareApp}
              isLast={true}
            />
          </View>

          {/* Section 3: Legal */}
          <Text style={styles.sectionHeader}>{t('settings_section_legal') || 'Legal'}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="shield-checkmark-outline"
              label={t('settings_privacy_policy') || 'Privacy Policy'}
              onPress={() => openUrl('https://starpix.co/privacy')}
            />
            <SettingItem
              icon="document-text-outline"
              label={t('settings_terms_conditions') || 'Terms & Conditions'}
              onPress={() => openUrl('https://starpix.co/terms')}
            />
            <SettingItem
              icon="refresh-outline"
              label={t('settings_refund_policy') || 'Refund Policy'}
              onPress={() => openUrl('https://starpix.co/refund')}
              isLast={true}
            />
          </View>

          {/* Section 3: Actions */}
          <Text style={styles.sectionHeader}>{t('settings_section_actions') || 'Actions'}</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="trophy-outline"
              label={t('settings_buy_plan') || 'Buy Plan'}
              onPress={() => router.push('/vip')}
            />
            <SettingItem
              icon="sparkles-outline"
              label={t('settings_buy_ai_credits') || 'Buy AI Credits'}
              onPress={() => router.push('/buy-credits')}
            />
            <SettingItem
              icon="receipt-outline"
              label={t('settings_transaction_history') || 'Transaction History'}
              onPress={() => router.push('/transaction-history')}
            />
            <SettingItem
              icon="trash-outline"
              label={t('delete_account') || 'Delete Account'}
              onPress={() => setShowDeleteModal(true)}
              isDestructive={true}
              isLast={true}
            />
          </View>

          {/* Red Pill Logout Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
              setShowLogoutModal(true);
            }}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={fontScale(20)} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>{t('settings_logout') || 'Logout'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Language Selector Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={() => showToast(t('language_updated'))}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutModal}
        title={t('confirm_logout')}
        message={t('confirm_logout_msg')}
        confirmText={t('settings_logout') || t('log_out_account') || 'Logout'}
        cancelText={t('cancel')}
        icon="log-out-outline"
        iconColor={COLORS.orange}
        confirmLoading={logoutLoading}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Account Delete Confirmation */}
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

      {/* Issues & Feedback Modal Popup */}
      <IssueFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: hp(0.01),
    paddingBottom: hp(0.06),
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.012),
  },
  screenTitle: {
    fontSize: fontScale(22),
    fontFamily: FONTS.bold,
    color: '#111827',
  },

  /* User Profile Card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#E11D48',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF1F2',
    borderWidth: 2,
    borderColor: '#FDA4AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontScale(20),
    fontFamily: FONTS.bold,
    color: '#E11D48',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E11D48',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
  },
  userName: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  profileIdentityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 2,
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
  },
  freeBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.2,
    borderColor: '#FDA4AF',
  },
  badgeText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.bold,
  },
  premiumText: {
    color: '#D97706',
  },
  freeText: {
    color: '#E11D48',
  },

  /* Section Header */
  sectionHeader: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  /* Item Row */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIconBox: {
    backgroundColor: '#FEF2F2',
  },
  itemTextCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.semiBold,
    color: '#1F2937',
  },
  destructiveLabel: {
    color: '#EF4444',
  },
  itemSublabel: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    marginTop: 1,
  },
  creditItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  creditItemBadgeText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.extrabold,
    color: '#92400E',
  },

  /* Red Pill Logout Button */
  logoutBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EE1D24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnText: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});

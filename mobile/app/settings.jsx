import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp } from '../src/utils/responsive';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../src/i18n';
import LanguageModal from '../src/components/LanguageModal';
import ConfirmModal from '../src/components/ConfirmModal';
import BackButton from '../src/components/BackButton';
import Toast from '../src/components/Toast';
import { hapticTap, hapticImpact } from '../src/utils/haptics';
import * as Haptics from 'expo-haptics';
import API from '../src/utils/api';

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
          color={isDestructive ? '#EF4444' : '#EE1D24'}
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
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, token, logout } = useAuthStore();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const currentLangCode = i18n.language || 'en';
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => {
      showToast('Could not open link');
    });
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
      const webDeleteUrl = `${baseUrl.replace(/\/api\/?$/, '')}/delete${
        token ? `?token=${encodeURIComponent(token)}` : ''
      }`;
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

  const displayPhone = user?.phoneNumber || '8763594039';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Ambient glowing fluid background curves */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={wp(1.0)} height={hp(1.0)}>
          <Defs>
            <RadialGradient id="pinkGlow" cx="0%" cy="15%" r="60%">
              <Stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FAF7F5" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="peachGlow" cx="100%" cy="30%" r="50%">
              <Stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FAF7F5" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="bottomPinkGlow" cx="0%" cy="90%" r="50%">
              <Stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#FAF7F5" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={wp(0.05)} cy={hp(0.18)} r={wp(0.4)} fill="url(#pinkGlow)" />
          <Circle cx={wp(0.95)} cy={hp(0.32)} r={wp(0.45)} fill="url(#peachGlow)" />
          <Circle cx={wp(0.1)} cy={hp(0.88)} r={wp(0.45)} fill="url(#bottomPinkGlow)" />
        </Svg>
      </View>

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, hp(0.015)) + hp(0.008) }]}>
        <BackButton />

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{t('settings_title') || 'Settings'}</Text>
          <Text style={styles.headerPhoneText}>{displayPhone}</Text>
        </View>
      </View>

      {/* Content Scroll */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, hp(0.02)) + hp(0.1) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: General */}
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
            sublabel={currentLangObj.name}
            onPress={() => setShowLanguageModal(true)}
            isLast={true}
          />
        </View>

        {/* Section: Support & Community */}
        <Text style={styles.sectionHeader}>{t('settings_section_support') || 'Support & Community'}</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon="chatbubble-ellipses-outline"
            label={t('settings_feedback_issues') || 'Feedback & Issues'}
            onPress={() => router.push('/feedback')}
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

        {/* Section: Legal */}
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

        {/* Section: Actions */}
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
      </ScrollView>

      {/* Floating Logout Button at Bottom */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, hp(0.015)) + hp(0.008) },
        ]}
      >
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
      </View>

      {/* Language Selector Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={() => showToast(t('language_updated'))}
      />

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
        iconColor="#EF4444"
        confirmLoading={deleteLoading}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteAccount}
      />

      {/* Toast */}
      <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(0.05),
    paddingBottom: hp(0.016),
  },
  backCircleBtn: {
    width: wp(0.11),
    height: wp(0.11),
    borderRadius: wp(0.055),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: wp(0.035),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontFamily: FONTS.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerPhoneText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginTop: 1,
  },
  scrollBody: {
    paddingHorizontal: wp(0.05),
    paddingTop: hp(0.01),
  },
  sectionHeader: {
    fontSize: fontScale(14.5),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginTop: hp(0.022),
    marginBottom: hp(0.01),
    marginLeft: wp(0.01),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: hp(0.006),
    paddingHorizontal: wp(0.035),
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(243, 244, 246, 0.8)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.016),
    paddingHorizontal: wp(0.015),
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  iconBox: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIconBox: {
    backgroundColor: '#FEE2E2',
  },
  itemTextCol: {
    flex: 1,
    marginLeft: wp(0.035),
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    color: '#1F2937',
  },
  destructiveLabel: {
    color: '#EF4444',
  },
  itemSublabel: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    marginTop: 2,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: wp(0.05),
    paddingTop: hp(0.012),
    backgroundColor: 'rgba(250, 247, 245, 0.94)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EE1D24',
    height: hp(0.062),
    borderRadius: 16,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
  },
});

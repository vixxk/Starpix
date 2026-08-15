import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import { COLORS, FONTS, BRUTAL } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, SPACING, CARD_SHADOW } from '../../src/utils/responsive';
import { useAuthStore } from '../../src/store/useAuthStore';
import ConfirmModal from '../../src/components/ConfirmModal';
import AppRefreshControl from '../../src/components/AppRefreshControl';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const MENU = [
  { icon: 'heart-outline', label: 'My Saved Favorites', route: '/favorites' },
  { icon: 'card-outline', label: 'Unlocked Entitlements', route: '/entitlements' },
  { icon: 'trophy-outline', label: 'VIP Pass Subscription', route: '/vip' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, fetchUser, isLoading } = useAuthStore();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

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

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/(auth)/login');
    } finally {
      setLogoutLoading(false);
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
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name ? user.name.substring(0, 1) : 'U'}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
                <Text style={styles.userPhone}>{user.phoneNumber || '+91'}</Text>
              </View>
              <View style={[styles.badge, user.isPremium ? styles.premiumBadge : styles.freeBadge]}>
                <Text style={[styles.badgeText, user.isPremium ? styles.premiumText : styles.freeText]}>
                  {user.isPremium ? 'VIP' : 'FREE'}
                </Text>
              </View>
            </View>
            <Text style={styles.memberSince}>Member — Statuzzz Community</Text>
          </View>

          {/* Menu */}
          <Text style={styles.sectionLabel}>Your Account</Text>
          <View style={styles.optionsCard}>
            {MENU.map((item, idx) => (
              <PressableScale
                key={item.label}
                onPress={() => router.push(item.route)}
                scaleTo={0.97}
                style={[styles.optionRow, idx === MENU.length - 1 && styles.optionRowLast]}
                contentStyle={styles.optionContent}
              >
                <View style={styles.optionIconWrap}>
                  <Ionicons name={item.icon} size={19} color={COLORS.orange} />
                </View>
                <Text style={styles.optionLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={17} color={COLORS.inkFaint} />
              </PressableScale>
            ))}
          </View>

          <PressableScale onPress={handleLogoutPress} scaleTo={0.97} haptic="impact" style={styles.logoutButton} contentStyle={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.orange} />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </PressableScale>
        </ScrollView>
      </View>

      {/* Themed Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of your Statuzzz account? You can sign back in anytime with your phone number."
        confirmText="Log Out"
        cancelText="Cancel"
        icon="log-out-outline"
        iconColor={COLORS.orange}
        confirmLoading={logoutLoading}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
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
  avatar: {
    width: wp(0.15),
    height: wp(0.15),
    borderRadius: wp(0.075),
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.orangeSoft,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: fontScale(24),
    fontFamily: FONTS.extrabold,
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
    marginTop: hp(0.032),
    marginBottom: 10,
    marginLeft: 4,
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
});

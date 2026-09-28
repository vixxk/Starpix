import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale } from '../../src/utils/responsive';
import { hapticTap, hapticImpact } from '../../src/utils/haptics';
import { useAuthStore } from '../../src/store/useAuthStore';

import { useTranslation } from 'react-i18next';

const TAB_KEYS = {
  index: { translationKey: 'nav_home', active: 'home', inactive: 'home-outline' },
  explore: { translationKey: 'nav_search_status', active: 'search', inactive: 'search-outline' },
  downloads: { translationKey: 'nav_downloads', active: 'time', inactive: 'time-outline' },
  profile: { translationKey: 'nav_profile', active: 'person-circle', inactive: 'person-circle-outline' },
};

function useFocusPop(focused) {
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      pop.setValue(0.82);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 14 }).start();
    }
  }, [focused, pop]);

  return pop;
}

function TabIcon({ route, focused, color }) {
  const { t } = useTranslation();
  const config = TAB_KEYS[route];
  if (!config) return null;
  const pop = useFocusPop(focused);

  return (
    <Animated.View style={[styles.iconWrap, { transform: [{ scale: pop }] }]}>
      <Ionicons name={focused ? config.active : config.inactive} size={22} color={color} />
      <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {t(config.translationKey)}
      </Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#E11D48',
        tabBarInactiveTintColor: '#6B7280',
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          elevation: 6,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarItemStyle: styles.tabItem,
        screenListeners: {
          tabPress: (e) => {
            if (e.target && e.target.startsWith('profile') && !user) {
              e.preventDefault();
              hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/login');
              return;
            }
            hapticTap();
          },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon route="index" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon route="explore" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="downloads"
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon route="downloads" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon route="profile" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="trending"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    paddingTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  label: {
    fontSize: fontScale(10),
    marginTop: 3,
    fontFamily: FONTS.semibold,
    textAlign: 'center',
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    borderWidth: 4,
    borderColor: COLORS.surface,
    elevation: 8,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import ScreenHeader from '../src/components/ScreenHeader';
import TemplateCard from '../src/components/TemplateCard';
import ExploreCta from '../src/components/ExploreCta';
import Skeleton from '../src/components/Skeleton';
import Toast from '../src/components/Toast';
import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, CARD_WIDTH, CARD_SHADOW } from '../src/utils/responsive';
import API from '../src/utils/api';
import { useCreationStore } from '../src/store/useCreationStore';
import { useAuthStore } from '../src/store/useAuthStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const fetchFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setFavorites(res.data.data.favorites || []);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleToastDone = useCallback(() => setToastMessage(null), []);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push({ pathname: `/template/${template._id}` });
  };

  const handleUnfavorite = async (template) => {
    const prevList = [...favorites];
    setFavorites((prev) => prev.filter((t) => t._id !== template._id));
    showToast('Removed from favorites');

    const storeUser = useAuthStore.getState().user;
    if (storeUser && Array.isArray(storeUser.favorites)) {
      const updatedStoreFavs = storeUser.favorites.filter((f) => (typeof f === 'string' ? f !== template._id : f._id !== template._id));
      useAuthStore.setState({ user: { ...storeUser, favorites: updatedStoreFavs } });
    }

    try {
      await API.post(`/templates/${template._id}/favorite`);
    } catch (err) {
      setFavorites(prevList);
      if (storeUser) {
        useAuthStore.setState({ user: storeUser });
      }
      console.error('Error unfavoriting:', err);
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <ScreenHeader icon="❤️" title="My Saved Favorites" subtitle="Your loved status templates" onBack={() => router.back()} />

        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCol}>
              <Skeleton height={200} width="100%" borderRadius={16} />
              <Skeleton height={200} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
            </View>
            <View style={styles.loadingCol}>
              <Skeleton height={200} width="100%" borderRadius={16} />
              <Skeleton height={200} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
            </View>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={40} color={COLORS.orange} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySub}>
              Tap the heart on any status template to save it here for quick access.
            </Text>
            <ExploreCta onPress={() => router.replace('/(tabs)')} style={styles.ctaWrap} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {favorites.map((item) => (
                <View key={item._id} style={styles.cardWrap}>
                  <TemplateCard template={item} onPress={() => handleTemplatePress(item)} />
                  <PressableScale
                    onPress={() => handleUnfavorite(item)}
                    scaleTo={0.85}
                    haptic="impact"
                    style={styles.heartBtn}
                    contentStyle={styles.heartContent}
                  >
                    <Ionicons name="heart" size={15} color={COLORS.error} weight="fill" />
                  </PressableScale>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: hp(0.05),
    paddingTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    rowGap: GRID_GAP,
  },
  cardWrap: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    bottom: 48,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 20,
    ...CARD_SHADOW,
  },
  heartContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    marginTop: 8,
  },
  loadingCol: {
    width: wp(0.435),
  },
  emptyState: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.04),
    paddingHorizontal: SCREEN_PAD,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: fontScale(17),
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: fontScale(19),
    paddingHorizontal: 16,
  },
  ctaWrap: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: hp(0.03),
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import ScreenHeader from '../src/components/ScreenHeader';
import ExploreCta from '../src/components/ExploreCta';
import Skeleton from '../src/components/Skeleton';
import Toast from '../src/components/Toast';
import ConfirmModal from '../src/components/ConfirmModal';
import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, CARD_SHADOW } from '../src/utils/responsive';
import API from '../src/utils/api';
import { useCreationStore } from '../src/store/useCreationStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { resolveMediaUrl } from '../src/utils/media';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const FAV_CARD_WIDTH = (wp(1) - SCREEN_PAD * 2 - GRID_GAP) / 2;
const THUMB_HEIGHT = FAV_CARD_WIDTH * 1.35;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);

  // Helper to extract cached favorite template objects from auth store
  const getInitialFavObjects = () => {
    if (user && Array.isArray(user.favorites)) {
      return user.favorites.filter((f) => typeof f === 'object' && f !== null && f._id);
    }
    return [];
  };

  const initialList = getInitialFavObjects();
  const [favorites, setFavorites] = useState(initialList);
  const [loading, setLoading] = useState(initialList.length === 0);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  // State for branded removal confirmation popup
  const [itemToRemove, setItemToRemove] = useState(null);

  // Fetch full favorites from API and update local & auth store
  const fetchFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await API.get('/auth/me');
      if (res.data.success && Array.isArray(res.data.data.favorites)) {
        const fullFavs = res.data.data.favorites;
        setFavorites(fullFavs);

        // Update auth store with populated objects
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const newUser = { ...currentUser, favorites: fullFavs };
          useAuthStore.setState({ user: newUser });
          AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(newUser)).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Synchronize state when user.favorites in auth store changes externally
  useEffect(() => {
    if (user && Array.isArray(user.favorites)) {
      const parsedFavs = user.favorites.filter((f) => typeof f === 'object' && f !== null && f._id);
      if (parsedFavs.length > 0) {
        setFavorites(parsedFavs);
        setLoading(false);
      }
    }
  }, [user?.favorites]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleToastDone = useCallback(() => setToastMessage(null), []);

  const handleTemplatePress = (template) => {
    setActiveTemplate(template);
    router.push({ pathname: `/template/${template._id}` });
  };

  // Optimistic UI Unfavorite handler called upon modal confirmation
  const confirmUnfavorite = async () => {
    if (!itemToRemove) return;
    const target = itemToRemove;
    setItemToRemove(null);

    const prevFavorites = [...favorites];
    const storeUser = useAuthStore.getState().user;
    const prevStoreUser = storeUser ? { ...storeUser } : null;

    // 1. Immediate local state update (0ms delay)
    setFavorites((prev) => prev.filter((t) => t._id !== target._id));
    showToast('Removed from favorites');

    // 2. Immediate Auth store state update
    if (storeUser && Array.isArray(storeUser.favorites)) {
      const updatedStoreFavs = storeUser.favorites.filter((f) =>
        typeof f === 'string' ? f !== target._id : f._id !== target._id
      );
      const newUser = { ...storeUser, favorites: updatedStoreFavs };
      useAuthStore.setState({ user: newUser });
      AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(newUser)).catch(() => {});
    }

    // 3. Backend API sync with rollback on failure
    try {
      await API.post(`/templates/${target._id}/favorite`);
    } catch (err) {
      // Rollback on failure
      setFavorites(prevFavorites);
      if (prevStoreUser) {
        useAuthStore.setState({ user: prevStoreUser });
        AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(prevStoreUser)).catch(() => {});
      }
      showToast('Failed to update favorite');
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
              <Skeleton height={THUMB_HEIGHT + 54} width="100%" borderRadius={16} />
              <Skeleton height={THUMB_HEIGHT + 54} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
            </View>
            <View style={styles.loadingCol}>
              <Skeleton height={THUMB_HEIGHT + 54} width="100%" borderRadius={16} />
              <Skeleton height={THUMB_HEIGHT + 54} width="100%" borderRadius={16} style={{ marginTop: GRID_GAP }} />
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
              {favorites.map((item) => {
                const imageUri = resolveMediaUrl(item.thumbnail || item.previewAsset || item.mainMedia);
                const isVip = item.accessType === 'vip';
                const isPaid = item.accessType === 'paid' || item.accessType === 'premium';

                return (
                  <PressableScale
                    key={item._id}
                    onPress={() => handleTemplatePress(item)}
                    scaleTo={0.97}
                    style={styles.cardWrap}
                    contentStyle={styles.cardInner}
                  >
                    {/* Top Thumbnail Image Section */}
                    <View style={styles.imageWrap}>
                      <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />

                      {/* Top Access Badge */}
                      <View style={styles.badgeRow}>
                        {isVip ? (
                          <View style={[styles.accessBadge, styles.vipBadge]}>
                            <Ionicons name="diamond" size={10} color={COLORS.white} />
                            <Text style={styles.accessBadgeText}>VIP</Text>
                          </View>
                        ) : isPaid ? (
                          <View style={[styles.accessBadge, styles.paidBadge]}>
                            <Text style={styles.accessBadgeText}>₹{item.price || 49}</Text>
                          </View>
                        ) : (
                          <View style={[styles.accessBadge, styles.freeBadge]}>
                            <Text style={styles.accessBadgeText}>FREE</Text>
                          </View>
                        )}
                      </View>

                      {/* Unfavorite Heart Button */}
                      <PressableScale
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setItemToRemove(item);
                        }}
                        scaleTo={0.85}
                        haptic="impact"
                        style={styles.heartBtn}
                        contentStyle={styles.heartContent}
                      >
                        <Ionicons name="heart" size={16} color={COLORS.error} />
                      </PressableScale>
                    </View>

                    {/* Bottom Content Body displaying FULL template name */}
                    <View style={styles.cardBody}>
                      <Text style={styles.templateFullName}>{item.name}</Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </ScrollView>
        )}

        <Toast message={toastMessage} toastKey={toastKey} onDone={handleToastDone} />

        {/* Themed Confirmation Modal for Removing Favorites */}
        <ConfirmModal
          visible={itemToRemove !== null}
          title="Remove Favorite?"
          message={itemToRemove ? `Are you sure you want to remove "${itemToRemove.name}" from your saved favorites?` : ''}
          confirmText="Remove"
          cancelText="Cancel"
          icon="heart-dislike-outline"
          iconColor={COLORS.error}
          onCancel={() => setItemToRemove(null)}
          onConfirm={confirmUnfavorite}
        />
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
    paddingHorizontal: SCREEN_PAD,
    gap: GRID_GAP,
  },
  cardWrap: {
    width: FAV_CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    position: 'relative',
    ...CARD_SHADOW,
  },
  cardInner: {
    width: '100%',
    flexDirection: 'column',
  },
  imageWrap: {
    width: '100%',
    height: THUMB_HEIGHT,
    backgroundColor: '#1E1005',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  accessBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vipBadge: {
    backgroundColor: '#7C3AED',
  },
  paidBadge: {
    backgroundColor: COLORS.orange,
  },
  freeBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
  },
  accessBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(9.5),
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
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
  cardBody: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
  },
  templateFullName: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: fontScale(12),
    lineHeight: fontScale(16.5),
  },
  loadingWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    marginTop: 8,
  },
  loadingCol: {
    width: FAV_CARD_WIDTH,
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

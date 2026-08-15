import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../src/components/AppBackground';
import PressableScale from '../src/components/PressableScale';
import ScreenHeader from '../src/components/ScreenHeader';
import Skeleton from '../src/components/Skeleton';
import InvoiceModal from '../src/components/InvoiceModal';
import AppRefreshControl from '../src/components/AppRefreshControl';
import { hapticTap } from '../src/utils/haptics';
import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, GRID_GAP, CARD_SHADOW } from '../src/utils/responsive';
import API from '../src/utils/api';
import { useCreationStore } from '../src/store/useCreationStore';
import { useAuthStore } from '../src/store/useAuthStore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function EntitlementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setActiveTemplate = useCreationStore((state) => state.setActiveTemplate);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoicePurchase, setInvoicePurchase] = useState(null);

  const fetchPurchases = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await API.get('/payments/my-purchases');
      if (res.data.success) {
        setPurchases(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading entitlements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPurchases();
  }, [fetchPurchases]);

  const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleTemplatePress = (template) => {
    if (!template) return;
    setActiveTemplate(template);
    router.push({ pathname: `/template/${template._id}` });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <ScreenHeader icon="💳" title="Unlocked Entitlements" subtitle="Your paid unlocks & purchases" onBack={() => router.back()} />

        {loading ? (
          <View style={styles.loadingWrap}>
            <Skeleton height={80} width="100%" borderRadius={18} style={{ marginBottom: 16 }} />

            <View style={styles.entitlementSkeletonCard}>
              <Skeleton height={74} width={74} borderRadius={14} />
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 2 }}>
                <Skeleton height={18} width="70%" borderRadius={6} />
                <Skeleton height={14} width="40%" borderRadius={4} />
                <Skeleton height={12} width="30%" borderRadius={4} />
              </View>
            </View>

            <View style={[styles.entitlementSkeletonCard, { marginTop: 12 }]}>
              <Skeleton height={74} width={74} borderRadius={14} />
              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between', paddingVertical: 2 }}>
                <Skeleton height={18} width="65%" borderRadius={6} />
                <Skeleton height={14} width="35%" borderRadius={4} />
                <Skeleton height={12} width="25%" borderRadius={4} />
              </View>
            </View>
          </View>
        ) : purchases.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="card-outline" size={40} color={COLORS.orange} />
            </View>
            <Text style={styles.emptyTitle}>No unlocks yet</Text>
            <Text style={styles.emptySub}>
              Unlock premium templates to get HD, watermark-free exports. They'll be listed here.
            </Text>
            <PressableScale
              onPress={() => router.replace('/(tabs)')}
              scaleTo={0.95}
              style={styles.browseBtn}
              contentStyle={styles.browseContent}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
              <Text style={styles.browseBtnText}>Explore Status Templates</Text>
            </PressableScale>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Summary strip */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{purchases.length}</Text>
                <Text style={styles.summaryLabel}>Unlocks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>Total Invested</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>HD</Text>
                <Text style={styles.summaryLabel}>Quality</Text>
              </View>
            </View>

            <View style={styles.list}>
              {purchases.map((p) => {
                const t = p.templateId;
                return (
                  <View key={p._id} style={styles.card}>
                    <View style={styles.cardContent}>
                      <PressableScale
                        onPress={() => handleTemplatePress(t)}
                        scaleTo={0.97}
                        style={styles.thumbWrap}
                      >
                        {t && (t.thumbnail || t.mainMedia) ? (
                          <Image source={{ uri: t.thumbnail || t.mainMedia }} style={styles.thumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.thumbPlaceholder}>
                            <Ionicons name="image-outline" size={22} color={COLORS.inkFaint} />
                          </View>
                        )}
                      </PressableScale>

                      <PressableScale
                        onPress={() => handleTemplatePress(t)}
                        scaleTo={0.98}
                        style={styles.cardBody}
                      >
                        <Text style={styles.cardTitle} numberOfLines={1}>{t ? t.name : 'Purchased Template'}</Text>
                        <Text style={styles.cardSub}>
                          ₹{p.amount || 49} · {formatDate(p.createdAt)}
                        </Text>
                      </PressableScale>

                      <PressableScale
                        onPress={() => {
                          hapticTap();
                          setInvoicePurchase(p);
                        }}
                        scaleTo={0.92}
                        style={styles.receiptBtn}
                        contentStyle={styles.receiptContent}
                      >
                        <Ionicons name="document-text-outline" size={13} color={COLORS.orangeDeep} />
                        <Text style={styles.receiptBtnText}>Invoice</Text>
                      </PressableScale>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Brutalist invoice for a purchase */}
      <InvoiceModal
        visible={!!invoicePurchase}
        purchase={invoicePurchase}
        user={user}
        onClose={() => setInvoicePurchase(null)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: hp(0.05),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SCREEN_PAD,
    paddingVertical: 14,
    ...CARD_SHADOW,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  summaryValue: {
    color: COLORS.orange,
    fontSize: fontScale(17),
    fontFamily: FONTS.extrabold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  summaryLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10),
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
  },
  loadingWrap: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: 12,
  },
  entitlementSkeletonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  list: {
    paddingHorizontal: SCREEN_PAD,
    gap: GRID_GAP,
    marginTop: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    ...CARD_SHADOW,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrap: {
    width: 58,
    height: 74,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#15803D',
    fontSize: fontScale(8.5),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
  },
  cardSub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  receiptBtn: {
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  receiptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptBtnText: {
    color: COLORS.orangeDeep,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
  },
  loadingWrap: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.09),
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
  browseBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  browseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(13),
  },
});

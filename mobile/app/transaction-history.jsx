import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AppBackground from '../src/components/AppBackground';
import ScreenHeader from '../src/components/ScreenHeader';
import AppRefreshControl from '../src/components/AppRefreshControl';
import PressableScale from '../src/components/PressableScale';
import Skeleton from '../src/components/Skeleton';
import { COLORS, FONTS, BRUTAL } from '../src/constants/colors';
import { fontScale, wp, hp, CARD_SHADOW, SCREEN_PAD } from '../src/utils/responsive';
import { hapticTap, hapticImpact } from '../src/utils/haptics';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCreditBalanceSSE } from '../src/hooks/useCreditBalanceSSE';
import API from '../src/utils/api';

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const [filter, setFilter] = useState('all'); // 'all' | 'bought' | 'spent'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    currentBalance: user?.credits !== undefined ? user.credits : 240,
    totalBought: 0,
    totalSpent: 0,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await API.get('/payments/credit-transactions');
      if (res.data?.success && res.data?.data) {
        setTransactions(res.data.data.transactions || []);
        setSummary({
          currentBalance: res.data.data.currentBalance ?? (user?.credits || 240),
          totalBought: res.data.data.totalBought || 0,
          totalSpent: res.data.data.totalSpent || 0,
        });
        if (res.data.data.currentBalance !== undefined) {
          useAuthStore.getState().setUserCredits(res.data.data.currentBalance);
        }
      }
    } catch (err) {
      console.warn('Error fetching credit transactions:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Real-time balance streaming via Server-Sent Events (SSE)
  const handleSSEBalanceUpdate = useCallback(
    (data) => {
      if (!data) return;
      setSummary((prev) => ({
        currentBalance: data.credits !== undefined ? data.credits : prev.currentBalance,
        totalBought: data.totalBought !== undefined ? data.totalBought : prev.totalBought,
        totalSpent: data.totalSpent !== undefined ? data.totalSpent : prev.totalSpent,
      }));
      // Auto-refresh transaction list when a credit debit/credit event occurs
      if (data.reason && data.reason !== 'connected') {
        fetchTransactions();
      }
    },
    [fetchTransactions]
  );

  useCreditBalanceSSE(handleSSEBalanceUpdate);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleBack = () => {
    hapticTap();
    if (params.from === 'ai-video') {
      router.replace('/ai-video');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'bought') return tx.type === 'credit';
    if (filter === 'spent') return tx.type === 'debit';
    return true;
  });

  const langLocaleMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    bn: 'bn-IN',
    pa: 'pa-IN',
    ml: 'ml-IN',
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const activeLocale = langLocaleMap[i18n.language] || 'en-IN';
      return d.toLocaleDateString(activeLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getTransactionTitle = (tx, isCredit) => {
    if (isCredit) {
      if (tx.title) {
        const match = tx.title.match(/(\d+)\s*AI Credits/i);
        if (match) {
          return `${match[1]} AI ${t('credits_abbr') || 'Credits'}`;
        }
      }
      return t('credits_added') || 'Credits Added';
    } else {
      const rawTitle = (tx.title || '').trim().toLowerCase();
      if (rawTitle === 'ai video') return t('ai_video') || 'AI Video';
      if (rawTitle === 'ai image') return t('ai_image') || 'AI Image';
      if (rawTitle === 'ai creation') return t('ai_creation') || 'AI Creation';
      if (tx.title) return tx.title;
      return t('ai_creation') || 'AI Creation';
    }
  };

  const getTransactionDesc = (tx, isCredit) => {
    if (isCredit) {
      const priceMatch = (tx.description || '').match(/₹\s*\d+/);
      if (priceMatch) {
        return `${t('credit_pack_purchase') || 'Credit Pack Purchase'} (${priceMatch[0]})`;
      }
      return t('credit_pack_purchase') || 'Credit Pack Purchase';
    } else {
      if (tx.description) {
        if (/^AI Face Swap/i.test(tx.description)) {
          return `${t('ai_face_swap') || 'AI Face Swap'} (-${tx.amount} ${t('credits_abbr') || 'Credits'})`;
        }
        const credMatch = tx.description.match(/^(.*?)(\s*\(-?\d+\s*Credits\))?$/i);
        if (credMatch && credMatch[1]) {
          return `${credMatch[1]} (-${tx.amount} ${t('credits_abbr') || 'Credits'})`;
        }
        return tx.description;
      }
      return t('generated_asset') || 'Generated Asset';
    }
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <ScreenHeader
          icon="⚡"
          title={t('transaction_history') || 'Transaction History'}
          subtitle={t('transaction_history_subtitle') || 'Credit purchases & spent history'}
          onBack={handleBack}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Top Summary Balance Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryContentRow}>
              {/* Left Side: Available Balance */}
              <View style={styles.balanceLeftCol}>
                <Text style={styles.summaryLabel} numberOfLines={1}>
                  {t('current_balance') || 'Available Balance'}
                </Text>
                <View style={styles.balanceRow}>
                  <View style={styles.coinIconWrap}>
                    <Ionicons name="sparkles" size={17} color="#D97706" />
                  </View>
                  <Text style={styles.balanceNumber}>
                    {user?.credits !== undefined ? user.credits : summary.currentBalance}
                  </Text>
                  <Text style={styles.balanceUnits} numberOfLines={1}>
                    {t('credits_abbr') || 'Credits'}
                  </Text>
                </View>
              </View>

              {/* Right Side: Bought & Spent Stats */}
              <View style={styles.statsRightContainer}>
                <View style={styles.statRightItem}>
                  <View style={[styles.statDot, { backgroundColor: '#16A34A' }]} />
                  <Text style={styles.statRightLabel} numberOfLines={1}>
                    {t('credits_bought') || 'Bought'}
                  </Text>
                  <Text style={[styles.statRightValue, { color: '#16A34A' }]}>
                    +{summary.totalBought}
                  </Text>
                </View>

                <View style={styles.statRightDivider} />

                <View style={styles.statRightItem}>
                  <View style={[styles.statDot, { backgroundColor: '#EE1D24' }]} />
                  <Text style={styles.statRightLabel} numberOfLines={1}>
                    {t('credits_spent') || 'Spent'}
                  </Text>
                  <Text style={[styles.statRightValue, { color: '#EE1D24' }]}>
                    -{summary.totalSpent}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            {[
              { id: 'all', label: t('all') || 'All' },
              { id: 'bought', label: t('credits_bought') || 'Bought' },
              { id: 'spent', label: t('credits_spent') || 'Spent' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => {
                    hapticTap();
                    setFilter(tab.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transactions List */}
          {loading ? (
            <View style={{ marginTop: 12 }}>
              {[1, 2, 3, 4].map((k) => (
                <View key={k} style={styles.skeletonCard}>
                  <Skeleton width={44} height={44} borderRadius={12} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={10} borderRadius={4} />
                  </View>
                  <Skeleton width={50} height={20} borderRadius={8} />
                </View>
              ))}
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="receipt-outline" size={36} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>{t('no_transactions') || 'No Transactions Found'}</Text>
              <Text style={styles.emptySubtitle}>
                {t('no_transactions_sub') || 'Your credit purchases and spent history will appear here.'}
              </Text>
              <PressableScale
                onPress={() => {
                  hapticTap();
                  router.push('/buy-credits');
                }}
                scaleTo={0.92}
                style={styles.emptyCta}
                contentStyle={styles.emptyCtaContent}
              >
                <Text style={styles.emptyCtaText}>{t('settings_buy_ai_credits') || 'Buy AI Credits'}</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredTransactions.map((tx, idx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <View
                    key={tx._id || idx}
                    style={[
                      styles.txItem,
                      idx === filteredTransactions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View
                      style={[
                        styles.txIconBox,
                        isCredit ? styles.txIconBoxCredit : styles.txIconBoxDebit,
                      ]}
                    >
                      <Ionicons
                        name={isCredit ? 'arrow-down-circle' : 'sparkles'}
                        size={20}
                        color={isCredit ? '#16A34A' : '#E11D48'}
                      />
                    </View>

                    <View style={styles.txMainCol}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {getTransactionTitle(tx, isCredit)}
                      </Text>
                      <Text style={styles.txDesc} numberOfLines={1}>
                        {getTransactionDesc(tx, isCredit)}
                      </Text>
                      <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                    </View>

                    <View style={styles.txRightCol}>
                      <View
                        style={[
                          styles.txBadge,
                          isCredit ? styles.txBadgeCredit : styles.txBadgeDebit,
                        ]}
                      >
                        <Text
                          style={[
                            styles.txBadgeText,
                            isCredit ? styles.txBadgeTextCredit : styles.txBadgeTextDebit,
                          ]}
                        >
                          {isCredit ? `+${tx.amount}` : `-${tx.amount}`}
                        </Text>
                      </View>
                      {tx.balanceAfter !== undefined && (
                        <Text style={styles.txBalanceAfter}>
                          {t('balance_abbr') || 'Bal'}: {tx.balanceAfter}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.06),
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    paddingVertical: hp(0.018),
    paddingHorizontal: wp(0.04),
    marginTop: hp(0.015),
    marginBottom: hp(0.02),
    ...CARD_SHADOW,
  },
  summaryContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeftCol: {
    flex: 1,
    paddingRight: wp(0.02),
  },
  summaryLabel: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(0.006),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.02),
  },
  balanceNumber: {
    fontSize: fontScale(26),
    fontFamily: FONTS.extraBold,
    color: '#111827',
    letterSpacing: -0.5,
  },
  balanceUnits: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semiBold,
    color: '#9CA3AF',
    marginLeft: 6,
    alignSelf: 'flex-end',
    marginBottom: 3,
  },
  statsRightContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: hp(0.008),
    paddingHorizontal: wp(0.03),
    minWidth: wp(0.33),
    justifyContent: 'center',
  },
  statRightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statRightLabel: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    flex: 1,
  },
  statRightValue: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.extraBold,
  },
  statRightDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },

  /* Filter Pills */
  filtersRow: {
    flexDirection: 'row',
    gap: wp(0.025),
    marginBottom: hp(0.015),
  },
  filterPill: {
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.008),
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterPillText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semiBold,
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* Transactions List */
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(0.035),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.03),
  },
  txIconBoxCredit: {
    backgroundColor: '#DCFCE7',
  },
  txIconBoxDebit: {
    backgroundColor: '#FFF1F2',
  },
  txMainCol: {
    flex: 1,
    paddingRight: wp(0.02),
  },
  txTitle: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 2,
  },
  txDesc: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginBottom: 3,
  },
  txDate: {
    fontSize: fontScale(10),
    fontFamily: FONTS.regular,
    color: '#9CA3AF',
  },
  txRightCol: {
    alignItems: 'flex-end',
  },
  txBadge: {
    paddingHorizontal: wp(0.025),
    paddingVertical: hp(0.003),
    borderRadius: 10,
    marginBottom: 3,
  },
  txBadgeCredit: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  txBadgeDebit: {
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  txBadgeText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.extraBold,
  },
  txBadgeTextCredit: {
    color: '#15803D',
  },
  txBadgeTextDebit: {
    color: '#BE123C',
  },
  txBalanceAfter: {
    fontSize: fontScale(9.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
  },

  /* Skeleton */
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(0.03),
    marginBottom: hp(0.01),
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Empty state */
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: hp(0.06),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(0.06),
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.018),
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontScale(12),
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: hp(0.024),
  },
  emptyCta: {
    backgroundColor: '#EE1D24',
    borderRadius: 16,
  },
  emptyCtaContent: {
    paddingHorizontal: wp(0.05),
    paddingVertical: hp(0.012),
  },
  emptyCtaText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});

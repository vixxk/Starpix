import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../src/components/AppBackground';
import ScreenHeader from '../src/components/ScreenHeader';
import AppRefreshControl from '../src/components/AppRefreshControl';
import Skeleton from '../src/components/Skeleton';
import { COLORS, FONTS, BRUTAL } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../src/utils/responsive';
import API from '../src/utils/api';
import { resolveMediaUrl } from '../src/utils/media';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_MAP = {
  pending: { label: 'Pending Review', bg: '#FEF3C7', fg: '#B45309', icon: 'time-outline' },
  in_progress: { label: 'Working On It', bg: '#E0F2FE', fg: '#0369A1', icon: 'sync-outline' },
  resolved: { label: 'Resolved', bg: '#DCFCE7', fg: '#15803D', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', fg: '#B91C1C', icon: 'close-circle-outline' },
};

const REASON_TRANSLATION_MAP = {
  'Inappropriate Content': 'reason_inappropriate_content',
  'Copyright / IP Violation': 'reason_copyright',
  'Low Quality / Broken Media': 'reason_low_quality',
  'Misleading Information': 'reason_misleading',
  'Other Issue': 'reason_other_issue',
  'App Bug / Crash': 'reason_app_bug',
  'Payment & Billing Problem': 'reason_billing',
  'Template / Download Issue': 'reason_download_issue',
  'Account Problem': 'reason_account_problem',
  'Feature Suggestion': 'reason_suggestion',
  'Other': 'reason_other',
};

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports/my-reports');
      if (res.data && res.data.success) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const getStatusInfo = (statusKey) => {
    switch (statusKey) {
      case 'pending':
        return { label: t('status_pending'), bg: '#FEF3C7', fg: '#B45309', icon: 'time-outline' };
      case 'in_progress':
        return { label: t('status_in_progress'), bg: '#E0F2FE', fg: '#0369A1', icon: 'sync-outline' };
      case 'resolved':
        return { label: t('status_resolved'), bg: '#DCFCE7', fg: '#15803D', icon: 'checkmark-circle-outline' };
      case 'rejected':
        return { label: t('status_rejected'), bg: '#FEE2E2', fg: '#B91C1C', icon: 'close-circle-outline' };
      default:
        return { label: t('status_pending'), bg: '#FEF3C7', fg: '#B45309', icon: 'time-outline' };
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top, hp(0.015)),
            paddingBottom: Math.max(insets.bottom, hp(0.02)),
          },
        ]}
      >
        <ScreenHeader
          icon="📋"
          title={t('my_issues_reports')}
          subtitle={t('my_reports_subtitle')}
          onBack={() => router.back()}
        />

        {/* Filter Pills */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { key: 'all', label: t('all_reports') },
              { key: 'pending', label: t('status_pending') },
              { key: 'in_progress', label: t('status_in_progress') },
              { key: 'resolved', label: t('status_resolved') },
              { key: 'rejected', label: t('status_rejected') },
            ].map((item) => {
              const active = filterStatus === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={() => setFilterStatus(item.key)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <View style={styles.skeletonStack}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton height={20} width="60%" borderRadius={6} />
                  <Skeleton height={14} width="90%" borderRadius={4} style={{ marginTop: 10 }} />
                  <Skeleton height={40} width="100%" borderRadius={8} style={{ marginTop: 12 }} />
                </View>
              ))}
            </View>
          ) : filteredReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={32} color={COLORS.orange} />
              </View>
              <Text style={styles.emptyTitle}>{t('no_reports_found')}</Text>
              <Text style={styles.emptySub}>
                {filterStatus === 'all'
                  ? t('no_reports_sub_all')
                  : t('no_reports_sub_filter')}
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => {
              const st = getStatusInfo(report.status);
              const isTemplate = report.type === 'template' && report.templateId;
              const templateObj = report.templateId;
              const reasonKey = REASON_TRANSLATION_MAP[report.reason];
              const displayReason = reasonKey ? t(reasonKey) : report.reason;

              return (
                <View key={report._id} style={styles.reportCard}>
                  {/* Top Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.typeTag}>
                      <Ionicons
                        name={isTemplate ? 'image-outline' : 'bug-outline'}
                        size={12}
                        color={COLORS.orange}
                      />
                      <Text style={styles.typeTagText}>
                        {isTemplate ? t('template_report') : t('general_issue')}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Ionicons name={st.icon} size={12} color={st.fg} />
                      <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Reported Template Banner if applicable */}
                  {isTemplate && templateObj && (
                    <View style={styles.templateBox}>
                      <Image
                        source={{
                          uri: resolveMediaUrl(
                            templateObj.thumbnail ||
                              templateObj.previewAsset ||
                              templateObj.mainMedia
                          ),
                        }}
                        style={styles.templateThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName} numberOfLines={1}>
                          {templateObj.name}
                        </Text>
                        <Text style={styles.templateMeta}>{t('reported_content')}</Text>
                      </View>
                    </View>
                  )}

                  {/* Reason & Description */}
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>{t('reason_label')}</Text>
                    <Text style={styles.reasonTitle}>{displayReason}</Text>
                    {!!report.description && (
                      <Text style={styles.descriptionText}>{report.description}</Text>
                    )}
                  </View>

                  {/* Date Submitted */}
                  <Text style={styles.dateText}>{t('submitted_on')}: {fmtDate(report.createdAt)}</Text>

                  {/* Admin Reply Box */}
                  {!!report.adminResponse && (
                    <View style={styles.adminReplyCard}>
                      <View style={styles.adminHeaderRow}>
                        <View style={styles.adminAvatar}>
                          <Ionicons name="headset" size={14} color={COLORS.white} />
                        </View>
                        <Text style={styles.adminTitle}>{t('support_reply')}</Text>
                        {!!report.adminRespondedAt && (
                          <Text style={styles.adminTime}>{fmtDate(report.adminRespondedAt)}</Text>
                        )}
                      </View>
                      <Text style={styles.adminMessageText}>{report.adminResponse}</Text>
                    </View>
                  )}
                </View>
              );
            })
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
  filterBar: {
    paddingHorizontal: SCREEN_PAD,
    marginVertical: hp(0.01),
  },
  filterScroll: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orangeDeep,
  },
  filterText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.semibold,
    color: COLORS.inkMuted,
  },
  filterTextActive: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: hp(0.06),
  },
  skeletonStack: {
    gap: 14,
    marginTop: 10,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: wp(0.08),
    alignItems: 'center',
    marginTop: hp(0.04),
    ...CARD_SHADOW,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: wp(0.045),
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeTagText: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    color: COLORS.ink,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: fontScale(10),
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  templateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  templateThumb: {
    width: 40,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.ink,
  },
  templateInfo: {
    flex: 1,
    marginLeft: 10,
  },
  templateName: {
    color: COLORS.ink,
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
  },
  templateMeta: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    marginTop: 1,
  },
  reasonBox: {
    marginTop: 2,
  },
  reasonLabel: {
    color: COLORS.inkFaint,
    fontSize: fontScale(9),
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  reasonTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  descriptionText: {
    color: COLORS.inkMuted,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    marginTop: 4,
    lineHeight: 18,
  },
  dateText: {
    color: COLORS.inkFaint,
    fontSize: fontScale(10),
    fontFamily: FONTS.medium,
    marginTop: 10,
  },
  adminReplyCard: {
    backgroundColor: COLORS.ink,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminAvatar: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
  },
  adminTime: {
    color: COLORS.orangeLight || '#fdba74',
    fontSize: fontScale(9.5),
    fontFamily: FONTS.medium,
  },
  adminMessageText: {
    color: '#f3f4f6',
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
});

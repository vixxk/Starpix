import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import BackButton from '../src/components/BackButton';
import Toast from '../src/components/Toast';
import ConfirmModal from '../src/components/ConfirmModal';
import AppRefreshControl from '../src/components/AppRefreshControl';
import { COLORS, FONTS } from '../src/constants/colors';
import { fontScale, wp, hp } from '../src/utils/responsive';
import { hapticTap, hapticSuccess } from '../src/utils/haptics';
import API from '../src/utils/api';

const FEEDBACK_CATEGORIES = [
  { id: 'feature_suggestion', key: 'cat_feature_suggestion', label: 'Feature Suggestion' },
  { id: 'app_experience', key: 'cat_app_experience', label: 'App Experience' },
  { id: 'template_request', key: 'cat_template_request', label: 'Template Request' },
  { id: 'other_feedback', key: 'cat_other_feedback', label: 'Other Feedback' },
];

const ISSUE_CATEGORIES = [
  { id: 'app_bug', key: 'cat_app_bug', label: 'App Bug / Crash' },
  { id: 'download_issue', key: 'cat_download_issue', label: 'Download Issue' },
  { id: 'billing_problem', key: 'cat_billing_problem', label: 'Payment Problem' },
  { id: 'account_problem', key: 'cat_account_problem', label: 'Account Issue' },
  { id: 'other_issue', key: 'cat_other_issue', label: 'Other Issue' },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function FeedbackAndIssuesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [submissionType, setSubmissionType] = useState('feedback'); // 'feedback' | 'issue'
  const [selectedCategory, setSelectedCategory] = useState(FEEDBACK_CATEGORIES[0].id);
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [reports, setReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await API.get('/reports/my-reports');
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const currentCategories = submissionType === 'feedback' ? FEEDBACK_CATEGORIES : ISSUE_CATEGORIES;

  const handleTypeChange = (type) => {
    hapticTap();
    setSubmissionType(type);
    setSelectedCategory(type === 'feedback' ? FEEDBACK_CATEGORIES[0].id : ISSUE_CATEGORIES[0].id);
  };

  const handleSubmit = async () => {
    const activeCatObj = currentCategories.find((c) => c.id === selectedCategory);
    const categoryName = activeCatObj ? (t(activeCatObj.key) || activeCatObj.label) : selectedCategory;
    const finalReason = customReason.trim() ? `${categoryName}: ${customReason.trim()}` : categoryName;

    if (!description.trim()) {
      showToast(t('feedback_enter_description') || 'Please enter description details');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/reports', {
        type: submissionType,
        reason: finalReason,
        description: description.trim(),
      });

      if (res.data?.success) {
        hapticSuccess();
        setShowSuccessModal(true);
        setDescription('');
        setCustomReason('');
      } else {
        showToast(res.data?.message || t('submit_failed') || 'Failed to submit');
      }
    } catch (err) {
      console.error('Submit report error:', err);
      showToast(err.response?.data?.message || t('submit_failed') || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return { label: t('status_resolved') || 'Resolved', bg: '#DCFCE7', fg: '#15803D', icon: 'checkmark-circle' };
      case 'in_progress':
        return { label: t('status_in_progress') || 'In Progress', bg: '#E0F2FE', fg: '#0369A1', icon: 'sync' };
      case 'rejected':
        return { label: t('status_rejected') || 'Rejected', bg: '#FEE2E2', fg: '#B91C1C', icon: 'close-circle' };
      default:
        return { label: t('status_pending') || 'Pending', bg: '#FEF3C7', fg: '#B45309', icon: 'time' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Ambient curves background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={wp(1.0)} height={hp(1.0)}>
          <Defs>
            <RadialGradient id="feedPinkGlow" cx="0%" cy="15%" r="60%">
              <Stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FAF7F5" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="feedPeachGlow" cx="100%" cy="30%" r="50%">
              <Stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FAF7F5" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={wp(0.05)} cy={hp(0.18)} r={wp(0.4)} fill="url(#feedPinkGlow)" />
          <Circle cx={wp(0.95)} cy={hp(0.32)} r={wp(0.45)} fill="url(#feedPeachGlow)" />
        </Svg>
      </View>

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, hp(0.015)) + hp(0.008) }]}>
        <BackButton />
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{t('settings_feedback_issues') || 'Feedback & Issues'}</Text>
          <Text style={styles.headerSubtitle}>
            {t('feedback_header_subtitle') || 'Help us improve Starpix'}
          </Text>
        </View>
      </View>

      {/* Segmented Tab Controls */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            hapticTap();
            setActiveTab('new');
          }}
          style={[styles.segmentBtn, activeTab === 'new' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={activeTab === 'new' ? '#EE1D24' : '#6B7280'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'new' && styles.segmentTextActive]}>
            {t('feedback_tab_submit') || 'Submit New'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            hapticTap();
            setActiveTab('history');
          }}
          style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === 'history' ? '#EE1D24' : '#6B7280'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'history' && styles.segmentTextActive]}>
            {t('feedback_tab_history') || 'My Submissions'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, hp(0.03)) + hp(0.04) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Feedback vs Issue Toggle */}
            <Text style={styles.sectionLabel}>{t('feedback_select_type') || 'What would you like to share?'}</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTypeChange('feedback')}
                style={[
                  styles.typeCard,
                  submissionType === 'feedback' && styles.typeCardActiveFeedback,
                ]}
              >
                <View style={[styles.typeIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="chatbubbles" size={20} color="#16A34A" />
                </View>
                <Text style={styles.typeTitle}>{t('type_feedback') || 'Feedback'}</Text>
                <Text style={styles.typeDesc}>{t('type_feedback_desc') || 'Suggestions & praise'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTypeChange('issue')}
                style={[
                  styles.typeCard,
                  submissionType === 'issue' && styles.typeCardActiveIssue,
                ]}
              >
                <View style={[styles.typeIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                </View>
                <Text style={styles.typeTitle}>{t('type_issue') || 'Report Issue'}</Text>
                <Text style={styles.typeDesc}>{t('type_issue_desc') || 'Bugs & problems'}</Text>
              </TouchableOpacity>
            </View>

            {/* Category selection */}
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              {t('feedback_choose_category') || 'Choose a Category'}
            </Text>
            <View style={styles.chipRow}>
              {currentCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const label = t(cat.key) || cat.label;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      hapticTap();
                      setSelectedCategory(cat.id);
                    }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom topic / subject */}
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              {t('feedback_title_optional') || 'Title / Topic (Optional)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('feedback_title_placeholder') || 'Brief summary...'}
              placeholderTextColor="#9CA3AF"
              value={customReason}
              onChangeText={setCustomReason}
              maxLength={80}
            />

            {/* Details */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              {t('feedback_details_label') || 'Details & Description'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder={
                submissionType === 'feedback'
                  ? (t('feedback_placeholder_idea') || 'Describe your idea or what you love about Starpix...')
                  : (t('feedback_placeholder_issue') || 'Describe what happened and how we can reproduce it...')
              }
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={1500}
            />

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              onPress={() => {
                hapticTap();
                handleSubmit();
              }}
              style={styles.submitBtn}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.submitBtnInner}>
                  <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>{t('feedback_submit_btn') || 'Submit'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* History Tab */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, hp(0.03)) + hp(0.04) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loadingHistory ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#EE1D24" />
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>{t('feedback_no_history_title') || 'No Submissions Yet'}</Text>
              <Text style={styles.emptySubtitle}>
                {t('feedback_no_history_subtitle') || 'Any feedback or issues you report will appear here with live updates.'}
              </Text>
            </View>
          ) : (
            reports.map((item) => {
              const status = getStatusBadge(item.status);
              const isFeedbackItem = item.type === 'feedback';

              return (
                <View key={item._id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyTypeRow}>
                      <Ionicons
                        name={isFeedbackItem ? 'chatbubble-ellipses' : 'alert-circle'}
                        size={15}
                        color={isFeedbackItem ? '#16A34A' : '#EF4444'}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.historyTypeText}>
                        {isFeedbackItem ? (t('type_feedback') || 'Feedback') : (t('type_issue') || 'Issue')}
                      </Text>
                      <Text style={styles.historyDot}>•</Text>
                      <Text style={styles.historyDate}>{fmtDate(item.createdAt)}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon} size={11} color={status.fg} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusBadgeText, { color: status.fg }]}>{status.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.historyReason}>{item.reason}</Text>

                  {item.description ? (
                    <Text style={styles.historyDescription}>{item.description}</Text>
                  ) : null}

                  {item.adminResponse ? (
                    <View style={styles.adminReplyBox}>
                      <View style={styles.adminReplyHeader}>
                        <Ionicons name="shield-checkmark" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.adminReplyTitle}>{t('feedback_admin_reply') || 'Admin Response'}</Text>
                      </View>
                      <Text style={styles.adminReplyText}>{item.adminResponse}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Success Modal */}
      <ConfirmModal
        visible={showSuccessModal}
        title={t('feedback_success_title') || 'Thank You!'}
        message={
          t('feedback_success_msg') ||
          'Your submission has been received. Our team will review it and take appropriate action.'
        }
        confirmText={t('got_it') || 'Got it'}
        icon="checkmark-circle-outline"
        iconColor="#16A34A"
        hideCancel
        onConfirm={() => {
          setShowSuccessModal(false);
          setActiveTab('history');
        }}
        onCancel={() => setShowSuccessModal(false)}
      />

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
  headerSubtitle: {
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginTop: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(0.05),
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: hp(0.012),
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.semibold,
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: wp(0.05),
    paddingTop: hp(0.01),
  },
  sectionLabel: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
    color: '#374151',
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  typeCardActiveFeedback: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  typeCardActiveIssue: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  typeDesc: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#EE1D24',
    borderColor: '#EE1D24',
  },
  chipText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.semibold,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.medium,
    color: '#111827',
  },
  textArea: {
    height: 120,
  },
  submitBtn: {
    backgroundColor: '#EE1D24',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(243, 244, 246, 0.9)',
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTypeText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    color: '#374151',
  },
  historyDot: {
    marginHorizontal: 5,
    color: '#9CA3AF',
    fontSize: fontScale(12),
  },
  historyDate: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
  },
  historyReason: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.regular,
    color: '#4B5563',
    lineHeight: 18,
  },
  adminReplyBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  adminReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  adminReplyTitle: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.bold,
    color: '#1D4ED8',
  },
  adminReplyText: {
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    color: '#1E3A8A',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticTap, hapticSuccess, hapticImpact } from '../utils/haptics';
import PressableScale from './PressableScale';
import API from '../utils/api';

const FEEDBACK_CATEGORIES = [
  { id: 'feature_suggestion', key: 'cat_feature_suggestion', label: 'Feature Suggestion', icon: 'bulb-outline' },
  { id: 'app_experience', key: 'cat_app_experience', label: 'App Experience', icon: 'heart-outline' },
  { id: 'template_request', key: 'cat_template_request', label: 'Template Request', icon: 'images-outline' },
  { id: 'other_feedback', key: 'cat_other_feedback', label: 'Other Feedback', icon: 'chatbubbles-outline' },
];

const ISSUE_CATEGORIES = [
  { id: 'app_bug', key: 'cat_app_bug', label: 'App Bug / Crash', icon: 'bug-outline' },
  { id: 'download_issue', key: 'cat_download_issue', label: 'Download Issue', icon: 'download-outline' },
  { id: 'billing_problem', key: 'cat_billing_problem', label: 'Payment Problem', icon: 'card-outline' },
  { id: 'other_issue', key: 'cat_other_issue', label: 'Other Issue', icon: 'alert-circle-outline' },
];

export default function IssueFeedbackModal({
  visible,
  initialType = 'feedback', // 'feedback' | 'issue'
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [submissionType, setSubmissionType] = useState(initialType);
  const [selectedCategory, setSelectedCategory] = useState(
    initialType === 'issue' ? ISSUE_CATEGORIES[0].id : FEEDBACK_CATEGORIES[0].id
  );
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setSubmissionType(initialType);
      setSelectedCategory(initialType === 'issue' ? ISSUE_CATEGORIES[0].id : FEEDBACK_CATEGORIES[0].id);
      setSubject('');
      setDescription('');
      setErrorMsg('');
      setIsSuccess(false);
      setSubmitting(false);
    }
  }, [visible, initialType]);

  const categories = submissionType === 'feedback' ? FEEDBACK_CATEGORIES : ISSUE_CATEGORIES;

  const handleTypeChange = (type) => {
    hapticTap();
    setSubmissionType(type);
    setSelectedCategory(type === 'feedback' ? FEEDBACK_CATEGORIES[0].id : ISSUE_CATEGORIES[0].id);
    setErrorMsg('');
  };

  const handleCategorySelect = (id) => {
    hapticTap();
    setSelectedCategory(id);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      hapticImpact();
      setErrorMsg(t('feedback_enter_description') || 'Please enter details');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    hapticTap();

    try {
      const activeCat = categories.find((c) => c.id === selectedCategory);
      const catLabel = activeCat ? (t(activeCat.key) || activeCat.label) : selectedCategory;
      const finalReason = subject.trim() ? `${catLabel}: ${subject.trim()}` : catLabel;

      const res = await API.post('/reports', {
        type: submissionType,
        reason: finalReason,
        description: description.trim(),
      });

      if (res.data?.success) {
        hapticSuccess();
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      } else {
        setErrorMsg(res.data?.message || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('Submit report error:', err);
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    hapticTap();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlayWrap}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBadge, submissionType === 'issue' ? styles.issueIconBadge : styles.feedbackIconBadge]}>
                <Ionicons
                  name={submissionType === 'issue' ? 'alert-circle' : 'chatbubble-ellipses'}
                  size={fontScale(20)}
                  color={submissionType === 'issue' ? '#EF4444' : '#EE1D24'}
                />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.modalTitle}>
                  {t('settings_issues_feedbacks') || 'Issues & Feedback'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {t('feedback_header_subtitle') || 'Help us improve Starpix'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={COLORS.inkMuted} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            /* Success View */
            <View style={styles.successContainer}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={54} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>
                {t('feedback_success_title') || 'Thank You!'}
              </Text>
              <Text style={styles.successMessage}>
                {t('feedback_success_msg') || 'Your submission has been received. Our team will review it and take appropriate action.'}
              </Text>
              <PressableScale
                onPress={handleClose}
                scaleTo={0.96}
                style={styles.successDoneBtn}
                contentStyle={styles.btnContent}
              >
                <Text style={styles.successDoneBtnText}>
                  {t('feedback_done') || 'Done'}
                </Text>
              </PressableScale>
            </View>
          ) : (
            /* Main Form View */
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Toggle Tabs */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTypeChange('feedback')}
                  style={[
                    styles.typeTab,
                    submissionType === 'feedback' && styles.typeTabActive,
                  ]}
                >
                  <View style={styles.typeTabIconWrap}>
                    <Ionicons
                      name="sparkles"
                      size={15}
                      color={submissionType === 'feedback' ? '#EE1D24' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeTabText,
                      submissionType === 'feedback' && styles.typeTabTextActive,
                    ]}
                  >
                    {t('type_feedback') || 'Feedback'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTypeChange('issue')}
                  style={[
                    styles.typeTab,
                    submissionType === 'issue' && styles.typeTabActiveIssue,
                  ]}
                >
                  <View style={styles.typeTabIconWrap}>
                    <Ionicons
                      name="bug"
                      size={15}
                      color={submissionType === 'issue' ? '#EF4444' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeTabText,
                      submissionType === 'issue' && styles.typeTabTextActiveIssue,
                    ]}
                  >
                    {t('type_issue') || 'Report Issue'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category Pills */}
              <Text style={styles.fieldLabel}>
                {t('feedback_choose_category') || 'Choose a Category'}
              </Text>
              <View style={styles.categoryPillsWrap}>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catLabel = t(cat.key) || cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => handleCategorySelect(cat.id)}
                      style={[
                        styles.catPill,
                        isSelected && (submissionType === 'issue' ? styles.catPillActiveIssue : styles.catPillActive),
                      ]}
                    >
                      <View style={styles.catPillIconWrap}>
                        <Ionicons
                          name={cat.icon}
                          size={13}
                          color={isSelected ? '#FFFFFF' : '#475569'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextActive,
                        ]}
                      >
                        {catLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subject (Optional) */}
              <Text style={styles.fieldLabel}>
                {t('feedback_title_optional') || 'Title / Topic (Optional)'}
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder={t('feedback_title_placeholder') || 'Brief summary...'}
                placeholderTextColor="#94A3B8"
                style={styles.subjectInput}
                maxLength={100}
                returnKeyType="next"
              />

              {/* Details multiline text area */}
              <View style={styles.detailsHeaderRow}>
                <Text style={styles.fieldLabel}>
                  {t('feedback_details_label') || 'Details & Description'}
                  <Text style={{ color: '#EF4444' }}> *</Text>
                </Text>
                <Text style={styles.charCountText}>{description.length}/500</Text>
              </View>

              <TextInput
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={
                  submissionType === 'issue'
                    ? (t('feedback_placeholder_issue') || 'Describe what happened...')
                    : (t('feedback_placeholder_idea') || 'Describe your idea or what you love about Starpix...')
                }
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                style={[
                  styles.detailsInput,
                  Boolean(errorMsg) && styles.detailsInputError,
                ]}
              />

              {/* Error Message */}
              {Boolean(errorMsg) && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Actions Bottom Bar */}
              <View style={styles.actionsRow}>
                <PressableScale
                  onPress={handleClose}
                  scaleTo={0.96}
                  style={styles.cancelBtn}
                  contentStyle={styles.btnContent}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>
                    {t('cancel') || 'Cancel'}
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={handleSubmit}
                  scaleTo={0.96}
                  style={[
                    styles.submitBtn,
                    submissionType === 'issue' && styles.submitBtnIssue,
                    submitting && styles.submitBtnDisabled,
                  ]}
                  contentStyle={styles.btnContent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitBtnText}>
                        {t('feedback_submit_btn') || 'Submit'}
                      </Text>
                    </>
                  )}
                </PressableScale>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.04),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: hp(0.85),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedbackIconBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  issueIconBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerTextCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontScale(16),
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    gap: 6,
    paddingHorizontal: 8,
  },
  typeTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECDD3',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeTabActiveIssue: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeTabIconWrap: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semibold,
    color: '#64748B',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: fontScale(18),
  },
  typeTabTextActive: {
    color: '#EE1D24',
    fontFamily: FONTS.bold,
  },
  typeTabTextActiveIssue: {
    color: '#EF4444',
    fontFamily: FONTS.bold,
  },
  fieldLabel: {
    fontSize: fontScale(12),
    fontFamily: FONTS.bold,
    color: '#334155',
    marginBottom: 8,
  },
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 20,
    gap: 5,
  },
  catPillActive: {
    backgroundColor: '#EE1D24',
    borderColor: '#EE1D24',
  },
  catPillActiveIssue: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  catPillIconWrap: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPillText: {
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    color: '#334155',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: fontScale(16),
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  subjectInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: fontScale(13),
    fontFamily: FONTS.regular,
    color: '#0F172A',
    marginBottom: 16,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCountText: {
    fontSize: fontScale(11),
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },
  detailsInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontScale(13),
    fontFamily: FONTS.regular,
    color: '#0F172A',
    minHeight: 110,
    maxHeight: 160,
    marginBottom: 14,
  },
  detailsInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: fontScale(12),
    fontFamily: FONTS.medium,
    color: '#B91C1C',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: '#475569',
  },
  submitBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EE1D24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnIssue: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: fontScale(13),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  btnContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  successBadge: {
    marginBottom: 14,
  },
  successTitle: {
    fontSize: fontScale(18),
    fontFamily: FONTS.bold,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fontScale(19),
    marginBottom: 24,
  },
  successDoneBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EE1D24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successDoneBtnText: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});

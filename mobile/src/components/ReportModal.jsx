import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BRUTAL } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticTap, hapticImpact } from '../utils/haptics';
import PressableScale from './PressableScale';
import API from '../utils/api';
import { useTranslation } from 'react-i18next';

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

const TEMPLATE_REASONS = [
  'Inappropriate Content',
  'Copyright / IP Violation',
  'Low Quality / Broken Media',
  'Misleading Information',
  'Other Issue',
];

const ISSUE_REASONS = [
  'App Bug / Crash',
  'Payment & Billing Problem',
  'Template / Download Issue',
  'Account Problem',
  'Feature Suggestion',
  'Other',
];

export default function ReportModal({
  visible,
  type = 'issue', // 'template' | 'issue'
  template = null,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isTemplateMode = type === 'template';
  const reasons = isTemplateMode ? TEMPLATE_REASONS : ISSUE_REASONS;
  const isOtherReason = Boolean(selectedReason && selectedReason.toLowerCase().includes('other'));
  const isSubmitDisabled = loading || !selectedReason || (isOtherReason && !description.trim());

  useEffect(() => {
    if (visible) {
      hapticTap();
      setSelectedReason(reasons[0]);
      setDescription('');
      setErrorMsg('');
      setLoading(false);
    }
  }, [visible, type]);

  const getReasonText = (r) => {
    const key = REASON_TRANSLATION_MAP[r];
    return key ? t(key) : r;
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setErrorMsg(t('err_select_reason'));
      return;
    }

    if (isOtherReason && !description.trim()) {
      setErrorMsg(t('err_other_details'));
      return;
    }

    setLoading(true);
    setErrorMsg('');
    hapticImpact();

    try {
      const payload = {
        type: isTemplateMode ? 'template' : 'issue',
        templateId: isTemplateMode && template ? (template._id || template.id) : null,
        reason: selectedReason,
        description: description.trim(),
      };

      const res = await API.post('/reports', payload);
      if (res.data && res.data.success) {
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        setErrorMsg(res.data?.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Report submission error:', err);
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlayWrap}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          {/* Top Header Badge */}
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <Ionicons
                name={isTemplateMode ? 'flag-outline' : 'alert-circle-outline'}
                size={22}
                color={COLORS.orange}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>
                {isTemplateMode ? t('report_template') : t('report_an_issue')}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {isTemplateMode ? template?.name || t('content_feedback') : t('help_us_improve')}
              </Text>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.88} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.inkMuted} />
            </PressableScale>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Reason selector pills */}
            <Text style={styles.sectionLabel}>{t('select_reason')}</Text>
            <View style={styles.reasonsGrid}>
              {reasons.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticTap();
                      setSelectedReason(r);
                    }}
                    style={[styles.reasonPill, isSelected && styles.reasonPillActive]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                      size={16}
                      color={isSelected ? COLORS.white : COLORS.inkMuted}
                    />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {getReasonText(r)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Details input */}
            <Text style={styles.sectionLabel}>
              {isOtherReason ? t('details_required') : t('details_optional')}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={isOtherReason ? t('placeholder_other_details') : t('placeholder_general_details')}
              placeholderTextColor={COLORS.inkFaint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.textInput, isOtherReason && !description.trim() && styles.textInputRequired]}
            />

            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <PressableScale
              onPress={onClose}
              scaleTo={0.97}
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
            >
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </PressableScale>

            <PressableScale
              onPress={handleSubmit}
              scaleTo={0.97}
              disabled={isSubmitDisabled}
              style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]}
              contentStyle={styles.btnContent}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="paper-plane-outline"
                    size={16}
                    color={isSubmitDisabled ? COLORS.inkMuted : COLORS.white}
                  />
                  <Text style={[styles.submitBtnText, isSubmitDisabled && styles.submitBtnTextDisabled]}>
                    {t('submit_report')}
                  </Text>
                </>
              )}
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    backgroundColor: 'rgba(23, 18, 12, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(0.05),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: hp(0.85),
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: wp(0.055),
    elevation: 12,
    shadowColor: '#3A2210',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1,
    borderColor: COLORS.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(17),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    maxHeight: hp(0.52),
  },
  sectionLabel: {
    color: COLORS.inkMuted,
    fontSize: fontScale(10.5),
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  reasonsGrid: {
    gap: 8,
  },
  reasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonPillActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orangeDeep,
  },
  reasonText: {
    color: COLORS.ink,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semibold,
  },
  reasonTextActive: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  textInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: fontScale(12.5),
    fontFamily: FONTS.medium,
    color: COLORS.ink,
    minHeight: 70,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  submitBtn: {
    flex: 1.4,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    elevation: 3,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  btnContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cancelBtnText: {
    color: COLORS.ink,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.surfaceAlt || '#E2E8F0',
    borderColor: COLORS.border || '#CBD5E1',
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.75,
  },
  submitBtnTextDisabled: {
    color: COLORS.inkMuted || '#94A3B8',
  },
  textInputRequired: {
    borderColor: COLORS.orange,
    borderWidth: 1.5,
  },
});

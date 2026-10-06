import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import TemplateRenderer from './TemplateRenderer';
import { FONTS, COLORS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import { hapticTap } from '../utils/haptics';

export default function DownloadShareModal({
  visible,
  actionType = 'download', // 'download' | 'share'
  activeTemplate,
  userPhotoUri,
  userNameText,
  userQuoteText,
  selectedFooter,
  selectedEffect,
  photoTransform,
  nameTransform,
  onClose,
  onSelect, // (withPersonalization: boolean) => void
  loadingOption = null, // 'personalized' | 'clean' | null
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!visible || !activeTemplate) return null;

  const isShare = actionType === 'share';
  const actionButtonText = isShare
    ? (t('share') || 'Share')
    : (t('download') || 'Download');
  const actionIcon = isShare ? 'share-social' : 'download';

  const THUMB_WIDTH = Math.min(wp(0.38), 145);
  const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 1.35);

  const effectiveFooter = selectedFooter || selectedEffect || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {/* Top Close Button (X) at Top-Right matching reference */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticTap();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2-Columns Side by Side Cards */}
          <View style={styles.cardsRow}>
            {/* Column 1: With name and photo */}
            <View style={styles.cardContainer}>
              <View style={[styles.thumbWrap, { width: THUMB_WIDTH, height: THUMB_HEIGHT }]}>
                <TemplateRenderer
                  template={activeTemplate}
                  userPhotoUri={userPhotoUri}
                  userNameText={userNameText}
                  userQuoteText={userQuoteText}
                  selectedFooter={effectiveFooter}
                  photoTransform={photoTransform}
                  nameTransform={nameTransform}
                  canvasWidth={THUMB_WIDTH}
                  canvasHeight={THUMB_HEIGHT}
                  showWatermark={false}
                  isMuted={true}
                />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {t('with_name_and_photo') || 'With name and photo'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={Boolean(loadingOption)}
                onPress={() => {
                  hapticTap();
                  onSelect(true);
                }}
                style={[styles.actionBtn, styles.primaryBtn]}
              >
                {loadingOption === 'personalized' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name={actionIcon} size={15} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>{actionButtonText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Column 2: Without name and photo */}
            <View style={styles.cardContainer}>
              <View style={[styles.thumbWrap, { width: THUMB_WIDTH, height: THUMB_HEIGHT }]}>
                <TemplateRenderer
                  template={activeTemplate}
                  userPhotoUri={null}
                  userNameText=""
                  userQuoteText=""
                  selectedFooter={effectiveFooter}
                  canvasWidth={THUMB_WIDTH}
                  canvasHeight={THUMB_HEIGHT}
                  showWatermark={false}
                  isMuted={true}
                />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {t('without_name_and_photo') || 'Without name and photo'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={Boolean(loadingOption)}
                onPress={() => {
                  hapticTap();
                  onSelect(false);
                }}
                style={[styles.actionBtn, styles.secondaryBtn]}
              >
                {loadingOption === 'clean' ? (
                  <ActivityIndicator size="small" color="#1E293B" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name={actionIcon} size={15} color="#1E293B" />
                    <Text style={styles.secondaryBtnText}>{actionButtonText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.semiBold,
    color: '#1E293B',
    textAlign: 'center',
    marginVertical: 10,
    minHeight: 32,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: '100%',
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#EE1D24',
    shadowColor: '#EE1D24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: fontScale(12.5),
    fontFamily: FONTS.bold,
    color: '#1E293B',
  },
});

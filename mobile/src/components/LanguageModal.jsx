import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, BRUTAL } from '../constants/colors';
import { wp, hp, fontScale } from '../utils/responsive';
import PressableScale from './PressableScale';
import { SUPPORTED_LANGUAGES, changeAppLanguage } from '../i18n';
import { hapticTap } from '../utils/haptics';

export default function LanguageModal({ visible, onClose, onSelectLanguage }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!visible) return null;

  const handleSelect = (code) => {
    hapticTap();
    changeAppLanguage(code);
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    onClose();
  };

  const scrollableDist = Math.max(1, contentHeight - visibleHeight);
  const thumbHeight = Math.max(28, (visibleHeight / Math.max(1, contentHeight)) * visibleHeight);
  const maxThumbTop = Math.max(0, visibleHeight - thumbHeight);
  const thumbTop = scrollY.interpolate({
    inputRange: [0, scrollableDist],
    outputRange: [0, maxThumbTop],
    extrapolate: 'clamp',
  });
  const showScrollbar = contentHeight > visibleHeight + 5;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Backdrop touchable to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Dialog content is a pure View, never intercepts ScrollView gestures */}
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconChip}>
                <Ionicons name="language" size={wp(0.05)} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={styles.dialogTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {t('select_preferable_language')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={wp(0.05)} color={COLORS.inkMuted} />
            </TouchableOpacity>
          </View>

          {/* Language Options List */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              overScrollMode="always"
              scrollEventThrottle={16}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0) setVisibleHeight(h);
              }}
              onContentSizeChange={(_, h) => {
                const ch = Math.round(h);
                if (ch > 0) setContentHeight(ch);
              }}
              onScroll={(e) => {
                const y = e.nativeEvent?.contentOffset?.y ?? 0;
                scrollY.setValue(y);
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.7}
                    delayPressIn={40}
                    onPress={() => handleSelect(lang.code)}
                    style={[
                      styles.langItem,
                      isSelected && styles.langItemActive,
                    ]}
                  >
                    <View style={styles.langItemContent}>
                      <View style={styles.langLeft}>
                        <Text style={styles.flagIcon}>{lang.flag}</Text>
                        <View style={styles.langNameWrap}>
                          <Text style={[styles.nativeName, isSelected && styles.nativeNameActive]}>
                            {lang.nativeName}
                          </Text>
                          <Text style={[styles.englishName, isSelected && styles.englishNameActive]}>
                            {lang.name}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={wp(0.04)} color={COLORS.white} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {showScrollbar && (
              <View style={styles.customScrollTrack} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.customScrollThumb,
                    {
                      height: thumbHeight,
                      transform: [{ translateY: thumbTop }],
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Footer Close Button */}
          <PressableScale
            onPress={onClose}
            scaleTo={0.96}
            style={styles.doneBtn}
            contentStyle={styles.doneBtnContent}
          >
            <Text style={styles.doneBtnText}>{t('got_it')}</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 5, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(0.05),
  },
  dialogContainer: {
    width: wp(0.9),
    maxHeight: hp(0.72),
    backgroundColor: COLORS.surface,
    borderRadius: wp(0.06),
    padding: wp(0.048),
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    elevation: 12,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.015),
    paddingBottom: hp(0.012),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.025),
    marginRight: 8,
  },
  iconChip: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.047),
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogTitle: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    includeFontPadding: false,
    flexShrink: 1,
  },
  dialogSub: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11),
    fontFamily: FONTS.regular,
    marginTop: 1,
    includeFontPadding: false,
  },
  closeBtn: {
    padding: wp(0.015),
  },
  scrollWrapper: {
    position: 'relative',
    maxHeight: hp(0.48),
    marginVertical: hp(0.005),
  },
  scrollList: {
    maxHeight: hp(0.48),
    paddingRight: wp(0.035),
  },
  scrollContent: {
    gap: hp(0.01),
    paddingVertical: hp(0.005),
  },
  customScrollTrack: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderRadius: 3,
  },
  customScrollThumb: {
    width: 5,
    backgroundColor: COLORS.orange,
    borderRadius: 3,
  },
  langItem: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: wp(0.038),
    borderWidth: 1.2,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: wp(0.038),
    paddingVertical: hp(0.012),
  },
  langItemActive: {
    backgroundColor: '#FFF1F2',
    borderColor: COLORS.orange,
  },
  langItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.032),
  },
  flagIcon: {
    fontSize: fontScale(20),
  },
  langNameWrap: {},
  nativeName: {
    color: COLORS.ink,
    fontSize: fontScale(14),
    fontFamily: FONTS.semibold,
    includeFontPadding: false,
  },
  nativeNameActive: {
    color: COLORS.orangeDeep,
  },
  englishName: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    includeFontPadding: false,
  },
  englishNameActive: {
    color: COLORS.orange,
  },
  radioCircle: {
    width: wp(0.06),
    height: wp(0.06),
    borderRadius: wp(0.03),
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  radioCircleActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  doneBtn: {
    marginTop: hp(0.016),
    height: hp(0.058),
    backgroundColor: COLORS.orange,
    borderRadius: wp(0.04),
    elevation: 3,
    shadowColor: COLORS.orangeDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  doneBtnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

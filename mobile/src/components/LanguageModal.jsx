import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, BRUTAL } from '../constants/colors';
import { wp, hp, fontScale } from '../utils/responsive';
import PressableScale from './PressableScale';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { hapticTap } from '../utils/haptics';

export default function LanguageModal({ visible, onClose, onSelectLanguage }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [contentHeight, setContentHeight] = React.useState(1);
  const [visibleHeight, setVisibleHeight] = React.useState(1);
  const [scrollY, setScrollY] = React.useState(0);

  if (!visible) return null;

  const handleSelect = (code) => {
    hapticTap();
    i18n.changeLanguage(code);
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    onClose();
  };

  const scrollableDist = Math.max(1, contentHeight - visibleHeight);
  const thumbHeight = Math.max(28, (visibleHeight / contentHeight) * visibleHeight);
  const maxThumbTop = Math.max(0, visibleHeight - thumbHeight);
  const thumbTop = Math.min(maxThumbTop, Math.max(0, (scrollY / scrollableDist) * maxThumbTop));
  const showScrollbar = contentHeight > visibleHeight + 5;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.dialogContainer}
        >
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
            <PressableScale onPress={onClose} scaleTo={0.88} style={styles.closeBtn}>
              <Ionicons name="close" size={wp(0.05)} color={COLORS.inkMuted} />
            </PressableScale>
          </View>

          {/* Language Options List */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onLayout={(e) => setVisibleHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(_, h) => setContentHeight(h)}
              onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <PressableScale
                    key={lang.code}
                    onPress={() => handleSelect(lang.code)}
                    scaleTo={0.97}
                    style={[
                      styles.langItem,
                      isSelected && styles.langItemActive,
                    ]}
                    contentStyle={styles.langItemContent}
                  >
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
                  </PressableScale>
                );
              })}
            </ScrollView>

            {showScrollbar && (
              <View style={styles.customScrollTrack}>
                <View
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
        </TouchableOpacity>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
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
    backgroundColor: '#FFF0E0',
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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { fontScale, wp, hp } from '../utils/responsive';
import PressableScale from './PressableScale';

/**
 * Themed sub-screen header (back button + icon + title + subtitle).
 * Used by the profile sub-pages so navigation feels consistent across the app.
 */
export default function ScreenHeader({ icon, title, subtitle, onBack }) {
  return (
    <View style={styles.header}>
      <PressableScale onPress={onBack} scaleTo={0.88} style={styles.backBtn} contentStyle={styles.backContent}>
        <Ionicons name="chevron-back" size={24} color={COLORS.orange} />
      </PressableScale>

      {icon && (
        <View style={styles.iconChip}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      )}

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(0.04),
    paddingVertical: hp(0.012),
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  backContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChip: {
    width: wp(0.095),
    height: wp(0.095),
    borderRadius: wp(0.028),
    backgroundColor: COLORS.orangeTint,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(0.025),
  },
  iconText: {
    fontSize: fontScale(16),
    textAlign: 'center',
  },
  titleWrap: {
    flex: 1,
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
    marginTop: 2,
  },
});

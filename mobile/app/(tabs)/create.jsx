import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../src/components/AppBackground';
import PressableScale from '../../src/components/PressableScale';
import { COLORS, FONTS } from '../../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../../src/utils/responsive';
import AppButton from '../../src/components/AppButton';

const STEPS = [
  { num: '1', title: 'Pick a Template', desc: 'Choose Good Morning, Motivation, Festival or Quotes' },
  { num: '2', title: 'Upload Your Photo', desc: 'Zoom, rotate & position inside responsive frame slot' },
  { num: '3', title: 'HD Export & Share', desc: 'Direct 1-tap sharing to WhatsApp Status & Gallery' },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function CreateHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.container}>
          <View style={styles.sparkleBadge}>
            <Ionicons name="sparkles" size={30} color={COLORS.white} />
          </View>

          <Text style={styles.title}>Create your status</Text>
          <Text style={styles.subtitle}>
            Pick a template, add your photo & name, then export in HD — no design skills needed.
          </Text>

          <View style={styles.stepsContainer}>
            {STEPS.map((s, i) => (
              <View key={s.num}>
                {i > 0 && <View style={styles.connector} />}
                <View style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumText}>{s.num}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepDesc}>{s.desc}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <AppButton
            title="Browse Templates"
            onPress={() => router.push('/(tabs)/explore')}
            style={{ marginTop: hp(0.03) }}
          />

          <PressableScale onPress={() => router.push('/(tabs)/trending')} scaleTo={0.94} style={styles.browseRow} contentStyle={styles.browseContent}>
            <Text style={styles.browseLink}>or see what's trending</Text>
            <Ionicons name="flame" size={14} color={COLORS.orangeDeep} />
          </PressableScale>
        </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: wp(0.05),
    paddingTop: hp(0.02),
    justifyContent: 'center',
  },
  sparkleBadge: {
    width: wp(0.16),
    height: wp(0.16),
    borderRadius: wp(0.05),
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: hp(0.02),
    ...CARD_SHADOW,
    shadowOpacity: 0.3,
  },
  title: {
    color: COLORS.ink,
    fontSize: fontScale(26),
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.inkMuted,
    fontSize: fontScale(13),
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: wp(0.05),
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: hp(0.03),
    ...CARD_SHADOW,
  },
  connector: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.borderStrong,
    marginLeft: 15,
    marginVertical: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: COLORS.white,
    fontFamily: FONTS.extrabold,
    fontSize: fontScale(14),
  },
  stepContent: {
    flex: 1,
    marginLeft: 14,
  },
  stepTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: fontScale(14.5),
  },
  stepDesc: {
    color: COLORS.inkMuted,
    fontSize: fontScale(11.5),
    fontFamily: FONTS.medium,
    marginTop: 2,
    lineHeight: 17,
  },
  browseRow: {
    marginTop: 18,
    paddingVertical: 6,
  },
  browseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  browseLink: {
    color: COLORS.orangeDeep,
    fontFamily: FONTS.semibold,
    fontSize: fontScale(12.5),
  },
});

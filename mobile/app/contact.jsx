import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import AppBackground from '../src/components/AppBackground';
import ScreenHeader from '../src/components/ScreenHeader';
import Toast from '../src/components/Toast';
import { COLORS, FONTS, BRUTAL } from '../src/constants/colors';
import { fontScale, wp, hp, SCREEN_PAD, CARD_SHADOW } from '../src/utils/responsive';
import { hapticTap } from '../src/utils/haptics';

const SUPPORT_EMAIL = 'support@starpix.co';
const SUPPORT_PHONE = '+91 98765 43210';
const SUPPORT_WHATSAPP = '919876543210';

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleEmailPress = () => {
    hapticTap();
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Starpix Support Request')}`;
    Linking.openURL(mailUrl).catch(() => {
      showToast(t('contact_open_email_failed') || 'Could not open email client');
    });
  };

  const handlePhonePress = () => {
    hapticTap();
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`).catch(() => {
      showToast(t('contact_call_failed') || 'Could not open phone dialer');
    });
  };

  const handleWhatsAppPress = () => {
    hapticTap();
    const url = `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${encodeURIComponent(
      'Hello Starpix Support, I need help with...'
    )}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`).catch(() => {
        showToast(t('contact_whatsapp_failed') || 'Could not open WhatsApp');
      });
    });
  };

  return (
    <AppBackground>
      <StatusBar style="dark" />
      <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Screen Header with Headset Icon */}
        <ScreenHeader
          icon="headset-outline"
          title={t('settings_contact_us') || 'Contact Us'}
          subtitle={t('contact_we_are_here') || "We're here to help you"}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, hp(0.04)) + hp(0.02) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Get in Touch */}
          <Text style={styles.sectionTitle}>{t('contact_direct_channels') || 'Get in Touch'}</Text>

          {/* Channels Grid: Email & WhatsApp */}
          <View style={styles.channelGrid}>
            {/* Email Card */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleEmailPress}
              style={styles.channelCard}
            >
              <View style={[styles.channelIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="mail" size={fontScale(22)} color="#EF4444" />
              </View>
              <Text style={styles.channelLabel}>{t('contact_email_title') || 'Email Us'}</Text>
              <Text style={styles.channelValue} numberOfLines={1}>
                {SUPPORT_EMAIL}
              </Text>
              <Text style={styles.channelHint}>{t('contact_email_hint') || 'Response within 24h'}</Text>
            </TouchableOpacity>

            {/* WhatsApp Card */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleWhatsAppPress}
              style={styles.channelCard}
            >
              <View style={[styles.channelIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="logo-whatsapp" size={fontScale(22)} color="#16A34A" />
              </View>
              <Text style={styles.channelLabel}>{t('contact_whatsapp_title') || 'WhatsApp'}</Text>
              <Text style={styles.channelValue} numberOfLines={1}>
                {SUPPORT_PHONE}
              </Text>
              <Text style={styles.channelHint}>{t('contact_whatsapp_hint') || 'Quick Chat'}</Text>
            </TouchableOpacity>
          </View>

          {/* Call / Helpline Card */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handlePhonePress}
            style={styles.fullWidthCard}
          >
            <View style={[styles.channelIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call" size={fontScale(22)} color="#D97706" />
            </View>
            <View style={styles.fullWidthTextCol}>
              <Text style={styles.channelLabel}>{t('contact_call_title') || 'Call Support'}</Text>
              <Text style={styles.fullWidthValue}>{SUPPORT_PHONE}</Text>
              <Text style={styles.channelHint}>
                {t('contact_working_hours') || 'Mon - Sat: 9:00 AM - 7:00 PM IST'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={fontScale(18)} color="#9CA3AF" />
          </TouchableOpacity>
        </ScrollView>

        <Toast message={toastMessage} toastKey={toastKey} onDone={() => setToastMessage(null)} />
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
    paddingTop: hp(0.012),
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontFamily: FONTS.bold,
    color: '#111827',
    marginBottom: hp(0.014),
    marginLeft: wp(0.01),
  },
  channelGrid: {
    flexDirection: 'row',
    gap: wp(0.03),
    marginBottom: hp(0.015),
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: wp(0.042),
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    ...CARD_SHADOW,
  },
  channelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelLabel: {
    fontSize: fontScale(14),
    fontFamily: FONTS.bold,
    color: '#111827',
  },
  channelValue: {
    fontSize: fontScale(12),
    fontFamily: FONTS.semibold,
    color: '#EA580C',
    marginTop: 2,
  },
  channelHint: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.medium,
    color: '#9CA3AF',
    marginTop: 4,
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: wp(0.042),
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    ...CARD_SHADOW,
  },
  fullWidthTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  fullWidthValue: {
    fontSize: fontScale(13.5),
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginTop: 1,
  },
});

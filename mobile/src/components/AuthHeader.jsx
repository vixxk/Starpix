import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fontScale } from '../utils/responsive';
import { FONTS } from '../constants/colors';
import { useTranslation } from 'react-i18next';

export default function AuthHeader({ showBack = false, onBack, tagline }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Header height: around 37% of screen height + safe top inset
  const headerHeight = Math.max(Math.round(hp(0.37)) + insets.top, 290);

  return (
    <View style={[styles.headerContainer, { height: headerHeight }]}>
      {/* Brand Header Image from assets/Red Part.png */}
      <Image
        source={require('../../assets/Red Part.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />

      {/* Back Button */}
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={[styles.backButton, { top: Math.max(insets.top, 16) + 8 }]}
        >
          <Ionicons name="chevron-back" size={fontScale(22)} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#EE1D24',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: wp(0.05),
    zIndex: 10,
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});


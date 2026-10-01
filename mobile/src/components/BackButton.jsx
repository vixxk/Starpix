import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fontScale, wp } from '../utils/responsive';
import { hapticTap } from '../utils/haptics';

/**
 * Standardized Back Button used consistently across all pages of the app.
 * Matches the design of the Starpix Premium Subscriptions (VIP) back button.
 */
export default function BackButton({ onPress, color = '#111827', style }) {
  const router = useRouter();

  const handlePress = () => {
    hapticTap();
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.headerBackBtn, style]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={fontScale(22)} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerBackBtn: {
    width: wp(0.1),
    height: wp(0.1),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

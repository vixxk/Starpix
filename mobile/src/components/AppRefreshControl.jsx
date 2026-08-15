import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { hapticImpact } from '../utils/haptics';

/**
 * Pull-to-refresh indicator styled with the orange brand theme:
 * orange spinner, white backdrop circle (Android), orange title (Android).
 * Fires a medium impact haptic when the refresh gesture triggers.
 *
 * NOTE: ScrollView wraps its scrollable content INSIDE the refreshControl
 * element (Android & web via React.cloneElement). We must forward `children`
 * and `style` to the underlying RefreshControl, otherwise the ScrollView's
 * content is silently dropped and the screen renders empty.
 */
export default function AppRefreshControl({ refreshing, onRefresh, title = 'Updating…', style, children }) {
  const handleRefresh = useCallback(() => {
    // A pull-and-release deserves more than a tick — give it a tactile snap
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    onRefresh && onRefresh();
  }, [onRefresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={COLORS.orange}
      colors={[COLORS.orange]}
      progressBackgroundColor={COLORS.surface}
      title={title}
      titleColor={COLORS.orange}
      style={style}
    >
      {children}
    </RefreshControl>
  );
}

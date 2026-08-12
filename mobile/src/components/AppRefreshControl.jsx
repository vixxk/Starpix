import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { hapticImpact } from '../utils/haptics';

/**
 * Pull-to-refresh indicator styled with the orange brand theme:
 * orange spinner, white backdrop circle (Android), orange title (Android).
 * Fires a medium impact haptic when the refresh gesture triggers.
 */
export default function AppRefreshControl({ refreshing, onRefresh, title = 'Updating…' }) {
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
    />
  );
}

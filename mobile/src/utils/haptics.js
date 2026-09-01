import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isSupported = Platform.OS !== 'web';

// Subtle tick — good default for most taps/buttons.
export const hapticTap = () => {
  if (!isSupported) return;
  try {
    Haptics.selectionAsync();
  } catch (e) {
    // ignore — haptics are a nicety
  }
};

// Slightly stronger pulse for prominent actions (unlock, save, primary CTA).
export const hapticImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (!isSupported) return;
  try {
    Haptics.impactAsync(style);
  } catch (e) {
    // ignore
  }
};

// Confirmatory buzz for completed actions (e.g. unlock success).
export const hapticSuccess = () => {
  if (!isSupported) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // ignore
  }
};

// Warning / Error buzz for failed actions.
export const hapticError = () => {
  if (!isSupported) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    // ignore
  }
};

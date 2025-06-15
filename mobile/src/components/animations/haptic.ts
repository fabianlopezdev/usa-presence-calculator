import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const HAPTIC_FEEDBACK = {
  light: () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  success: () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  
  selection: () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.selectionAsync();
    }
  },
  
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(style);
    }
  },
};

export function withHapticFeedback<T extends (...args: unknown[]) => unknown>(
  hapticType: keyof typeof HAPTIC_FEEDBACK,
  callback: T
): T {
  return ((...args: Parameters<T>) => {
    HAPTIC_FEEDBACK[hapticType]();
    return callback(...args);
  }) as T;
}

export function useHapticFeedback(): typeof HAPTIC_FEEDBACK {
  return HAPTIC_FEEDBACK;
}
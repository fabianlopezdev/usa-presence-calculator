import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { AnimatePresence, MotiView } from 'moti';
import { Portal, styled, View } from 'tamagui';

import { ANIMATION_PRESETS } from '@/components/animations/presets';
import { HAPTIC_FEEDBACK } from '@/components/animations/haptic';
import { Body } from '@/components/base/Typography';
import { TOAST_DURATION_LONG, TOAST_DURATION_SHORT, TOAST_TOP_OFFSET } from '@/constants/ui';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ToastContainer = styled(View, {
  name: 'ToastContainer',
  position: 'absolute',
  top: TOAST_TOP_OFFSET,
  left: 16,
  right: 16,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '$charcoal',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  shadowColor: '$charcoal',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  
  variants: {
    type: {
      success: {
        backgroundColor: '$successGreen',
      },
      error: {
        backgroundColor: '$warningOrange',
      },
      warning: {
        backgroundColor: '$warningOrange',
      },
      info: {
        backgroundColor: '$primaryBlue',
      },
    },
  },
});

const ToastContent = styled(View, {
  name: 'ToastContent',
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
});

const ToastAction = styled(Body, {
  name: 'ToastAction',
  color: '$white',
  fontWeight: '600',
  textDecorationLine: 'underline',
  marginLeft: 12,
});

interface ToastItemProps {
  config: ToastConfig;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ config, onDismiss }) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  React.useEffect(() => {
    const duration = config.duration || 0;
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config.duration, onDismiss]);
  
  const handleDismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);
  
  const gesture = Gesture.Pan()
    .onUpdate(({ translationY }) => {
      if (translationY < -10) {
        runOnJS(handleDismiss)();
      }
    });
  
  return (
    <GestureDetector gesture={gesture}>
      <MotiView
        from={{
          opacity: 0,
          translateY: -20,
          scale: 0.95,
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          translateY: isVisible ? 0 : -20,
          scale: isVisible ? 1 : 0.95,
        }}
        transition={ANIMATION_PRESETS.quick}
      >
        <ToastContainer type={config.type}>
          <ToastContent>
            <Body color="$white" flex={1}>
              {config.message}
            </Body>
            {config.action && (
              <ToastAction
                onPress={() => {
                  config.action?.onPress();
                  handleDismiss();
                }}
              >
                {config.action.label}
              </ToastAction>
            )}
          </ToastContent>
        </ToastContainer>
      </MotiView>
    </GestureDetector>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  
  const showToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = Date.now().toString();
    const duration = config.duration ?? (config.type === 'error' ? TOAST_DURATION_LONG : TOAST_DURATION_SHORT);
    
    HAPTIC_FEEDBACK.light();
    
    setToasts((prev) => [...prev, { ...config, id, duration }]);
  }, []);
  
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Portal>
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              config={toast}
              onDismiss={() => hideToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </Portal>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const showSuccessToast = (message: string, action?: ToastConfig['action']): void => {
  const { showToast } = useToast();
  showToast({ message, type: 'success', action });
};

export const showErrorToast = (message: string, action?: ToastConfig['action']): void => {
  const { showToast } = useToast();
  showToast({ message, type: 'error', action });
};

export const showInfoToast = (message: string, action?: ToastConfig['action']): void => {
  const { showToast } = useToast();
  showToast({ message, type: 'info', action });
};

export const showWarningToast = (message: string, action?: ToastConfig['action']): void => {
  const { showToast } = useToast();
  showToast({ message, type: 'warning', action });
};
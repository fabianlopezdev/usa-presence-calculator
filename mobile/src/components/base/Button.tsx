import React, { forwardRef } from 'react';
import { MotiView } from 'moti';
import { GestureResponderEvent } from 'react-native';
import { Button as TamaguiButton, ButtonProps as TamaguiButtonProps, styled, Text } from 'tamagui';

import { ANIMATION_PRESETS, PRESS_ANIMATION_FROM } from '@/components/animations/presets';
import { HAPTIC_FEEDBACK } from '@/components/animations/haptic';
import { 
  BUTTON_BORDER_RADIUS, 
  BUTTON_MIN_HEIGHT, 
  BUTTON_PADDING_HORIZONTAL, 
  BUTTON_PADDING_VERTICAL 
} from '@/constants/ui';

export interface ButtonProps extends Omit<TamaguiButtonProps, 'size' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
}

const StyledButton = styled(TamaguiButton, {
  name: 'Button',
  backgroundColor: '$primaryBlue',
  borderRadius: BUTTON_BORDER_RADIUS,
  minHeight: BUTTON_MIN_HEIGHT,
  paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
  paddingVertical: BUTTON_PADDING_VERTICAL,
  borderWidth: 0,
  pressStyle: {
    backgroundColor: '$primaryBlue',
  },
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primaryBlue',
        color: '$white',
        pressStyle: {
          backgroundColor: '$primaryBlue',
        },
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$primaryBlue',
        color: '$primaryBlue',
        pressStyle: {
          backgroundColor: '$primaryBlue',
          opacity: 0.1,
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$primaryBlue',
        pressStyle: {
          backgroundColor: '$stone',
          opacity: 0.1,
        },
      },
      danger: {
        backgroundColor: '$warningOrange',
        color: '$white',
        pressStyle: {
          backgroundColor: '$warningOrange',
        },
      },
    },
    
    size: {
      small: {
        minHeight: 32,
        paddingHorizontal: 16,
        paddingVertical: 6,
      },
      medium: {
        minHeight: BUTTON_MIN_HEIGHT,
        paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
        paddingVertical: BUTTON_PADDING_VERTICAL,
      },
      large: {
        minHeight: 56,
        paddingHorizontal: 32,
        paddingVertical: 16,
      },
    },
    
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    
    loading: {
      true: {
        opacity: 0.7,
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onPress, haptic = true, loading, disabled, ...props }, ref) => {
    const handlePress = React.useCallback(
      (event: GestureResponderEvent) => {
        if (haptic && !disabled && !loading) {
          HAPTIC_FEEDBACK.light();
        }
        onPress?.(event);
      },
      [onPress, haptic, disabled, loading]
    );
    
    return (
      <MotiView
        animate={disabled || loading ? PRESS_ANIMATION_FROM : PRESS_ANIMATION_FROM}
        transition={ANIMATION_PRESETS.quick}
        style={{ width: props.fullWidth ? '100%' : 'auto' }}
      >
        <StyledButton
          ref={ref}
          disabled={disabled || loading}
          loading={loading}
          onPress={handlePress}
          {...props}
        >
          {typeof children === 'string' ? (
            <Text
              fontSize={16}
              fontWeight="500"
              letterSpacing={0.32}
              color={props.variant === 'secondary' || props.variant === 'ghost' ? '$primaryBlue' : '$white'}
            >
              {loading ? 'Loading...' : children}
            </Text>
          ) : (
            children
          )}
        </StyledButton>
      </MotiView>
    );
  }
);

Button.displayName = 'Button';
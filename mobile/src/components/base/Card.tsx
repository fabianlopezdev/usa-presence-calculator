import React, { forwardRef } from 'react';
import { MotiView } from 'moti';
import { Card as TamaguiCard, CardProps as TamaguiCardProps, styled } from 'tamagui';

import { ANIMATION_PRESETS, ENTER_ANIMATION_FROM, ENTER_ANIMATION_TO } from '@/components/animations/presets';
import { HAPTIC_FEEDBACK } from '@/components/animations/haptic';
import {
  CARD_BORDER_RADIUS,
  CARD_PADDING,
  CARD_SHADOW_OFFSET_Y,
  CARD_SHADOW_OPACITY,
  CARD_SHADOW_RADIUS,
} from '@/constants/ui';

export interface CardProps extends TamaguiCardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  animateIn?: boolean;
  onPress?: () => void;
  haptic?: boolean;
}

const StyledCard = styled(TamaguiCard, {
  name: 'Card',
  backgroundColor: '$white',
  borderRadius: CARD_BORDER_RADIUS,
  padding: CARD_PADDING,
  
  variants: {
    variant: {
      default: {
        backgroundColor: '$white',
        shadowColor: '$stone',
        shadowOffset: { width: 0, height: CARD_SHADOW_OFFSET_Y },
        shadowOpacity: CARD_SHADOW_OPACITY,
        shadowRadius: CARD_SHADOW_RADIUS,
        elevation: 4,
      },
      elevated: {
        backgroundColor: '$white',
        shadowColor: '$stone',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
      outlined: {
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$stone',
        shadowOpacity: 0,
        elevation: 0,
      },
    },
    
    pressable: {
      true: {
        cursor: 'pointer',
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'default',
  },
});

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, animateIn = true, onPress, haptic = true, variant = 'default', ...props }, ref) => {
    const handlePress = React.useCallback(() => {
      if (onPress) {
        if (haptic) {
          HAPTIC_FEEDBACK.light();
        }
        onPress();
      }
    }, [onPress, haptic]);
    
    return (
      <MotiView
        from={animateIn ? ENTER_ANIMATION_FROM : undefined}
        animate={animateIn ? ENTER_ANIMATION_TO : undefined}
        transition={ANIMATION_PRESETS.enterGently}
      >
        <StyledCard
          ref={ref}
          variant={variant}
          pressable={!!onPress}
          onPress={handlePress}
          {...props}
        >
          {children}
        </StyledCard>
      </MotiView>
    );
  }
);

Card.displayName = 'Card';
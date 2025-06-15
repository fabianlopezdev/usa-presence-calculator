import React, { forwardRef, useState } from 'react';
import { AnimatePresence, MotiView } from 'moti';
import { NativeSyntheticEvent, TextInputFocusEventData, TextInput } from 'react-native';
import { Input as TamaguiInput, InputProps as TamaguiInputProps, styled, Text, View } from 'tamagui';

import { ANIMATION_PRESETS } from '@/components/animations/presets';
import { HAPTIC_FEEDBACK } from '@/components/animations/haptic';
import {
  INPUT_BORDER_RADIUS,
  INPUT_BORDER_WIDTH,
  INPUT_BORDER_WIDTH_FOCUSED,
  INPUT_MIN_HEIGHT,
  INPUT_PADDING,
} from '@/constants/ui';

export interface InputProps extends TamaguiInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  haptic?: boolean;
}

const StyledInput = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$white',
  borderColor: '$stone',
  borderRadius: INPUT_BORDER_RADIUS,
  borderWidth: INPUT_BORDER_WIDTH,
  color: '$charcoal',
  fontSize: 16,
  minHeight: INPUT_MIN_HEIGHT,
  paddingHorizontal: INPUT_PADDING,
  paddingVertical: INPUT_PADDING,
  
  focusStyle: {
    borderColor: '$primaryBlue',
    borderWidth: INPUT_BORDER_WIDTH_FOCUSED,
    paddingHorizontal: INPUT_PADDING - 1,
    paddingVertical: INPUT_PADDING - 1,
  },
  
  placeholderTextColor: '$stone',
  
  variants: {
    error: {
      true: {
        borderColor: '$warningOrange',
        focusStyle: {
          borderColor: '$warningOrange',
        },
      },
    },
    
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,
});

const InputContainer = styled(View, {
  name: 'InputContainer',
  flexDirection: 'column',
  gap: 4,
});

const Label = styled(Text, {
  name: 'InputLabel',
  color: '$charcoal',
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 4,
});

const HelperText = styled(Text, {
  name: 'InputHelperText',
  color: '$stone',
  fontSize: 12,
  marginTop: 4,
});

const ErrorText = styled(Text, {
  name: 'InputErrorText',
  color: '$warningOrange',
  fontSize: 12,
  marginTop: 4,
});

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, onFocus, onBlur, haptic = true, fullWidth, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const handleFocus = React.useCallback(
      (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setIsFocused(true);
        if (haptic) {
          HAPTIC_FEEDBACK.selection();
        }
        onFocus?.(event);
      },
      [onFocus, haptic]
    );
    
    const handleBlur = React.useCallback(
      (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setIsFocused(false);
        onBlur?.(event);
      },
      [onBlur]
    );
    
    return (
      <InputContainer style={{ width: fullWidth ? '100%' : 'auto' }}>
        {label && <Label>{label}</Label>}
        
        <MotiView
          animate={{
            shadowColor: isFocused ? '$primaryBlue' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isFocused ? 0.2 : 0,
            shadowRadius: isFocused ? 8 : 0,
          }}
          transition={ANIMATION_PRESETS.gentle}
        >
          <StyledInput
            ref={ref}
            error={!!error}
            fullWidth={fullWidth}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </MotiView>
        
        <AnimatePresence>
          {error && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -4 }}
              transition={ANIMATION_PRESETS.quick}
            >
              <ErrorText>{error}</ErrorText>
            </MotiView>
          )}
          
          {!error && helperText && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={ANIMATION_PRESETS.gentle}
            >
              <HelperText>{helperText}</HelperText>
            </MotiView>
          )}
        </AnimatePresence>
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';
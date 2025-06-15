import React from 'react';
import { MotiView } from 'moti';
import { styled, View } from 'tamagui';

import { ANIMATION_PRESETS, ENTER_ANIMATION_FROM, ENTER_ANIMATION_TO } from '@/components/animations/presets';
import { Button, ButtonProps } from '@/components/base/Button';
import { Body, ErrorText, ScreenTitle } from '@/components/base/Typography';

export interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
    variant?: ButtonProps['variant'];
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  fullHeight?: boolean;
}

const Container = styled(View, {
  name: 'ErrorStateContainer',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 32,
  paddingVertical: 48,
  gap: 16,
  
  variants: {
    fullHeight: {
      true: {
        flex: 1,
      },
    },
  },
});

const IconContainer = styled(View, {
  name: 'ErrorStateIconContainer',
  width: 120,
  height: 120,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
});

const TextContainer = styled(View, {
  name: 'ErrorStateTextContainer',
  alignItems: 'center',
  gap: 8,
  maxWidth: 280,
});

const ActionsContainer = styled(View, {
  name: 'ErrorStateActionsContainer',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  marginTop: 16,
});

const ErrorIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <MotiView
    from={{ ...ENTER_ANIMATION_FROM, scale: 0.8 }}
    animate={{ ...ENTER_ANIMATION_TO, scale: 1 }}
    transition={ANIMATION_PRESETS.enterGently}
  >
    <IconContainer>{icon}</IconContainer>
  </MotiView>
);

const ErrorActions: React.FC<{ 
  action?: ErrorStateProps['action'];
  secondaryAction?: ErrorStateProps['secondaryAction'];
  delay: number;
}> = ({ action, secondaryAction, delay }) => {
  if (!action && !secondaryAction) return null;
  
  return (
    <MotiView
      from={ENTER_ANIMATION_FROM}
      animate={ENTER_ANIMATION_TO}
      transition={{
        ...ANIMATION_PRESETS.enterGently,
        delay,
      }}
    >
      <ActionsContainer>
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onPress={action.onPress}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="ghost"
            onPress={secondaryAction.onPress}
          >
            {secondaryAction.label}
          </Button>
        )}
      </ActionsContainer>
    </MotiView>
  );
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  details,
  icon,
  action,
  secondaryAction,
  fullHeight = false,
}) => (
    <Container fullHeight={fullHeight}>
      {icon && <ErrorIcon icon={icon} />}
      
      <MotiView
        from={ENTER_ANIMATION_FROM}
        animate={ENTER_ANIMATION_TO}
        transition={{
          ...ANIMATION_PRESETS.enterGently,
          delay: icon ? 100 : 0,
        }}
      >
        <TextContainer>
          <ScreenTitle textAlign="center">{title}</ScreenTitle>
          <Body textAlign="center" muted>
            {message}
          </Body>
          {details && (
            <ErrorText textAlign="center" fontSize={12}>
              {details}
            </ErrorText>
          )}
        </TextContainer>
      </MotiView>
      
      <ErrorActions 
        action={action} 
        secondaryAction={secondaryAction} 
        delay={icon ? 200 : 100} 
      />
    </Container>
);

export const NetworkErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Connection error"
    message="No connection, but your data is safe offline."
    action={{
      label: "Try Again",
      onPress: onRetry,
    }}
  />
);

export const SyncErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Sync failed"
    message="Changes saved locally. We'll sync when you're back online."
    action={{
      label: "Retry Sync",
      onPress: onRetry,
      variant: 'secondary',
    }}
  />
);

export const GenericErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    message="Let's try that again."
    action={onRetry ? {
      label: "Retry",
      onPress: onRetry,
    } : undefined}
  />
);

export const LoadingErrorState: React.FC<{ 
  onRetry: () => void;
  onGoBack?: () => void;
}> = ({ onRetry, onGoBack }) => (
  <ErrorState
    title="Failed to load"
    message="We couldn't load this content."
    action={{
      label: "Try Again",
      onPress: onRetry,
    }}
    secondaryAction={onGoBack ? {
      label: "Go Back",
      onPress: onGoBack,
    } : undefined}
  />
);
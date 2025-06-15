import React from 'react';
import { MotiView } from 'moti';
import { styled, View } from 'tamagui';

import { ANIMATION_PRESETS, ENTER_ANIMATION_FROM, ENTER_ANIMATION_TO } from '@/components/animations/presets';
import { Button, ButtonProps } from '@/components/base/Button';
import { Body, ScreenTitle } from '@/components/base/Typography';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
    variant?: ButtonProps['variant'];
  };
  fullHeight?: boolean;
}

const Container = styled(View, {
  name: 'EmptyStateContainer',
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
  name: 'EmptyStateIconContainer',
  width: 120,
  height: 120,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
});

const TextContainer = styled(View, {
  name: 'EmptyStateTextContainer',
  alignItems: 'center',
  gap: 8,
  maxWidth: 280,
});

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  fullHeight = false,
}) => (
    <Container fullHeight={fullHeight}>
      {icon && (
        <MotiView
          from={{ ...ENTER_ANIMATION_FROM, scale: 0.8 }}
          animate={{ ...ENTER_ANIMATION_TO, scale: 1 }}
          transition={ANIMATION_PRESETS.enterGently}
        >
          <IconContainer>{icon}</IconContainer>
        </MotiView>
      )}
      
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
          {description && (
            <Body textAlign="center" muted>
              {description}
            </Body>
          )}
        </TextContainer>
      </MotiView>
      
      {action && (
        <MotiView
          from={ENTER_ANIMATION_FROM}
          animate={ENTER_ANIMATION_TO}
          transition={{
            ...ANIMATION_PRESETS.enterGently,
            delay: icon ? 200 : 100,
          }}
          style={{ marginTop: 16 }}
        >
          <Button
            variant={action.variant || 'primary'}
            onPress={action.onPress}
          >
            {action.label}
          </Button>
        </MotiView>
      )}
    </Container>
);

export const NoTripsEmptyState: React.FC<{ onAddTrip: () => void }> = ({ onAddTrip }) => (
  <EmptyState
    title="No trips yet!"
    description="Tap the + button to log your first journey."
    action={{
      label: "Add Your First Trip",
      onPress: onAddTrip,
    }}
  />
);

export const NoResultsEmptyState: React.FC = () => (
  <EmptyState
    title="No results found"
    description="Try adjusting your search or filters."
  />
);

export const OfflineEmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <EmptyState
    title="You're offline"
    description="Check your connection and try again."
    action={{
      label: "Retry",
      onPress: onRetry,
      variant: 'secondary',
    }}
  />
);
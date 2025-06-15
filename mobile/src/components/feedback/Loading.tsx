import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Spinner, styled, View, ViewProps } from 'tamagui';

import { ANIMATION_PRESETS } from '@/components/animations/presets';
import { SKELETON_ANIMATION_DURATION, SKELETON_GRADIENT_WIDTH } from '@/constants/ui';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '$primaryBlue' 
}) => {
  const sizeMap = {
    small: 'small',
    medium: 'small',
    large: 'large',
  } as const;
  
  return (
    <Spinner
      size={sizeMap[size]}
      color={color}
    />
  );
};

export interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  animated?: boolean;
}

const SkeletonContainer = styled(View, {
  name: 'SkeletonContainer',
  backgroundColor: '$stone',
  opacity: 0.1,
  overflow: 'hidden',
});

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = 4,
  animated = true,
  ...props
}) => (
    <SkeletonContainer
      width={width}
      height={height}
      borderRadius={radius}
      {...props}
    >
      {animated && (
        <MotiView
          from={{ translateX: -SKELETON_GRADIENT_WIDTH }}
          animate={{ translateX: width }}
          transition={{
            type: 'timing',
            duration: SKELETON_ANIMATION_DURATION,
            loop: true,
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: SKELETON_GRADIENT_WIDTH,
          }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </MotiView>
      )}
    </SkeletonContainer>
);

export interface SkeletonTextProps {
  lines?: number;
  width?: string;
  lastLineWidth?: string;
  spacing?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  width = '100%',
  lastLineWidth = '60%',
  spacing = 8,
}) => (
    <View gap={spacing}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : width}
          height={16}
        />
      ))}
    </View>
);

export interface SkeletonCardProps {
  showAvatar?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  showTitle = true,
  showDescription = true,
  showActions = false,
}) => (
    <View
      backgroundColor="$white"
      borderRadius={16}
      padding={16}
      gap={12}
      shadowColor="$stone"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.1}
      shadowRadius={12}
    >
      {showAvatar && (
        <View flexDirection="row" alignItems="center" gap={12}>
          <Skeleton width={48} height={48} radius={24} />
          <View flex={1}>
            <Skeleton width="60%" height={20} />
          </View>
        </View>
      )}
      
      {showTitle && <Skeleton width="80%" height={24} />}
      
      {showDescription && <SkeletonText lines={2} />}
      
      {showActions && (
        <View flexDirection="row" gap={8} marginTop={8}>
          <Skeleton width={80} height={32} radius={8} />
          <Skeleton width={80} height={32} radius={8} />
        </View>
      )}
    </View>
);

export interface LoadingContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  skeleton?: React.ReactNode;
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  children,
  loading = false,
  skeleton,
}) => {
  if (loading) {
    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIMATION_PRESETS.fadeIn}
      >
        {skeleton || <LoadingSpinner />}
      </MotiView>
    );
  }
  
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ANIMATION_PRESETS.enterGently}
    >
      {children}
    </MotiView>
  );
};
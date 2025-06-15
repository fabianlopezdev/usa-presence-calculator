import { MotiTransitionProp } from 'moti';

import { ANIMATION_DURATION_GENTLE, ANIMATION_DURATION_QUICK, ANIMATION_DURATION_SLOW } from '@/constants/ui';

const SPRING_CONFIG_GENTLE = {
  type: 'spring' as const,
  damping: 20,
  mass: 0.9,
  stiffness: 100,
};

const SPRING_CONFIG_QUICK = {
  type: 'spring' as const,
  damping: 20,
  mass: 1.2,
  stiffness: 250,
};

const SPRING_CONFIG_LAZY = {
  type: 'spring' as const,
  damping: 18,
  stiffness: 60,
};

export const ANIMATION_PRESETS = {
  gentle: {
    ...SPRING_CONFIG_GENTLE,
  } as MotiTransitionProp,
  
  enterGently: {
    ...SPRING_CONFIG_GENTLE,
  } as MotiTransitionProp,
  
  quick: {
    ...SPRING_CONFIG_QUICK,
  } as MotiTransitionProp,
  
  lazy: {
    ...SPRING_CONFIG_LAZY,
  } as MotiTransitionProp,
  
  fadeIn: {
    type: 'timing',
    duration: ANIMATION_DURATION_GENTLE,
  } as MotiTransitionProp,
  
  fadeOut: {
    type: 'timing',
    duration: ANIMATION_DURATION_QUICK,
  } as MotiTransitionProp,
  
  slideUpFadeIn: {
    ...SPRING_CONFIG_GENTLE,
  } as MotiTransitionProp,
  
  scalePress: {
    ...SPRING_CONFIG_QUICK,
  } as MotiTransitionProp,
  
  celebration: {
    damping: 14,
    mass: 0.8,
    stiffness: 80,
    type: 'spring',
  } as MotiTransitionProp,
  
  numberCount: {
    type: 'timing',
    duration: ANIMATION_DURATION_SLOW,
  } as MotiTransitionProp,
};

export const ENTER_ANIMATION_FROM = {
  opacity: 0,
  translateY: 8,
};

export const ENTER_ANIMATION_TO = {
  opacity: 1,
  translateY: 0,
};

export const PRESS_ANIMATION_TO = {
  scale: 0.97,
  opacity: 0.9,
};

export const PRESS_ANIMATION_FROM = {
  scale: 1,
  opacity: 1,
};

export const CELEBRATION_ANIMATION_FROM = {
  scale: 0,
  opacity: 0,
  rotate: '-15deg',
};

export const CELEBRATION_ANIMATION_TO = {
  scale: 1,
  opacity: 1,
  rotate: '0deg',
};

export function getReducedMotionPreset(preset: MotiTransitionProp): MotiTransitionProp {
  if (typeof preset === 'object' && 'type' in preset && preset.type === 'spring') {
    return {
      type: 'timing',
      duration: ANIMATION_DURATION_QUICK,
    };
  }
  return preset;
}
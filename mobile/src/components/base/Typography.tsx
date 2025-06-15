import { Text as TamaguiText, TextProps as TamaguiTextProps, styled } from 'tamagui';

const BaseText = styled(TamaguiText, {
  name: 'BaseText',
  color: '$charcoal',
  variants: {
    muted: {
      true: {
        color: '$stone',
      },
    },
  },
});

export interface TypographyProps extends TamaguiTextProps {
  muted?: boolean;
}

export const DisplayTitle = styled(BaseText, {
  name: 'DisplayTitle',
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.64,
  lineHeight: 40,
  opacity: 1,
});

export const ScreenTitle = styled(BaseText, {
  name: 'ScreenTitle',
  fontSize: 24,
  fontWeight: '600',
  letterSpacing: -0.24,
  lineHeight: 32,
  opacity: 0.95,
});

export const WidgetTitle = styled(BaseText, {
  name: 'WidgetTitle',
  fontSize: 18,
  fontWeight: '500',
  letterSpacing: 0,
  lineHeight: 24,
  opacity: 0.95,
});

export const CardTitle = WidgetTitle;

export const Body = styled(BaseText, {
  name: 'Body',
  fontSize: 16,
  fontWeight: '400',
  letterSpacing: 0,
  lineHeight: 24,
  opacity: 0.9,
});

export const Caption = styled(BaseText, {
  name: 'Caption',
  fontSize: 14,
  fontWeight: '400',
  letterSpacing: 0.14,
  lineHeight: 20,
  color: '$stone',
  opacity: 1,
});

export const Subtext = Caption;

export const ButtonText = styled(BaseText, {
  name: 'ButtonText',
  fontSize: 16,
  fontWeight: '500',
  letterSpacing: 0.32,
  lineHeight: 20,
  opacity: 1,
});

export const Label = styled(BaseText, {
  name: 'Label',
  fontSize: 12,
  fontWeight: '500',
  letterSpacing: 0.24,
  lineHeight: 16,
  textTransform: 'uppercase',
  opacity: 0.8,
});

export const NumberDisplay = styled(BaseText, {
  name: 'NumberDisplay',
  fontSize: 48,
  fontWeight: '700',
  letterSpacing: -0.96,
  lineHeight: 56,
  opacity: 1,
  fontVariant: ['tabular-nums'],
});

export const NumberLarge = styled(BaseText, {
  name: 'NumberLarge',
  fontSize: 32,
  fontWeight: '600',
  letterSpacing: -0.64,
  lineHeight: 40,
  opacity: 1,
  fontVariant: ['tabular-nums'],
});

export const NumberMedium = styled(BaseText, {
  name: 'NumberMedium',
  fontSize: 24,
  fontWeight: '600',
  letterSpacing: -0.48,
  lineHeight: 32,
  opacity: 1,
  fontVariant: ['tabular-nums'],
});

export const Link = styled(BaseText, {
  name: 'Link',
  fontSize: 16,
  fontWeight: '500',
  color: '$primaryBlue',
  textDecorationLine: 'underline',
  opacity: 1,
  pressStyle: {
    opacity: 0.8,
  },
});

export const ErrorText = styled(BaseText, {
  name: 'ErrorText',
  fontSize: 14,
  fontWeight: '400',
  color: '$warningOrange',
  lineHeight: 20,
  opacity: 1,
});

export const SuccessText = styled(BaseText, {
  name: 'SuccessText',
  fontSize: 14,
  fontWeight: '400',
  color: '$successGreen',
  lineHeight: 20,
  opacity: 1,
});

export const CelebrationText = styled(BaseText, {
  name: 'CelebrationText',
  fontSize: 24,
  fontWeight: '700',
  color: '$celebrationGold',
  letterSpacing: -0.48,
  lineHeight: 32,
  opacity: 1,
});
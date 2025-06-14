import { Card as TamaguiCard, styled } from 'tamagui';

export const Card = styled(TamaguiCard, {
  elevate: true,
  bordered: true,
  p: '$4',
  br: '$4',
  bg: '$background',
  shadowColor: '$shadowColor',
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
});
import { Card as TamaguiCard, styled } from 'tamagui';

export const Card = styled(TamaguiCard, {
  // Following style guide for Dashboard Widgets / Cards
  padding: '$md',           // 1rem internal padding
  borderRadius: '$card',    // 1rem (16px) for soft, modern look
  backgroundColor: '$white',
  
  // Soft, layered shadow from style guide
  shadowColor: '$stone',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  
  // Animation for entering
  animation: 'enterGently',
  enterStyle: {
    opacity: 0,
    y: 8,
  },
});

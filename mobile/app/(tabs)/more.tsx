import React from 'react';
import { H1, YStack } from 'tamagui';

export default function MoreScreen(): React.ReactElement {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
      <H1>More</H1>
    </YStack>
  );
}
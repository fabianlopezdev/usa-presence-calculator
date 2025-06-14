import React from 'react';
import { H1, Paragraph, YStack } from 'tamagui';

export default function HomeScreen(): React.ReactElement {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor="$background">
      <H1 marginBottom="$2">USA Presence Calculator</H1>
      <Paragraph size="$6">
        Track your path to citizenship
      </Paragraph>
    </YStack>
  );
}

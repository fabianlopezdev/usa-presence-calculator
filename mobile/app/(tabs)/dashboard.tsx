import React from 'react';
import { H1, YStack } from 'tamagui';

export default function DashboardScreen(): React.ReactElement {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
      <H1>Dashboard</H1>
    </YStack>
  );
}
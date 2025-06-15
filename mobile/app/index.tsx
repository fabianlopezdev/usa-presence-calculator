import { Redirect } from 'expo-router';
import React from 'react';

import { useUserStore } from '@/stores/user';

export default function HomeScreen(): React.ReactElement {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}

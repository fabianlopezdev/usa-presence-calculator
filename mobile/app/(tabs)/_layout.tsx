import { Tabs } from 'expo-router';
import React from 'react';
import { Home, Calendar, Plane, Menu } from '@tamagui/lucide-icons';

import { useAuthGuard } from '@/navigation/guards';

const tabScreenOptions = {
  tabBarActiveTintColor: '#3A86FF',
  tabBarInactiveTintColor: '#A0AEC0',
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  headerShown: false,
};

export default function TabLayout(): React.ReactElement {
  const isAuthenticated = useAuthGuard();

  if (!isAuthenticated) {
    return <></>;
  }

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Plane size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
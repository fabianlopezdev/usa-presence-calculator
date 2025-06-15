import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'usa-presence://'],
  config: {
    screens: {
      '(auth)': {
        screens: {
          login: 'login',
          'magic-link': 'auth/verify',
          passkey: 'auth/passkey',
        },
      },
      '(tabs)': {
        screens: {
          dashboard: 'dashboard',
          trips: 'trips',
          calendar: 'calendar',
          more: 'more',
        },
      },
      'trip/[id]': 'trip/:id',
      'trip/add': 'trip/add',
      simulator: 'simulator',
      settings: {
        screens: {
          index: 'settings',
          profile: 'settings/profile',
          notifications: 'settings/notifications',
          security: 'settings/security',
        },
      },
    },
  },
};

export function useDeepLinkHandler(): string | null {
  const url = Linking.useURL();
  
  if (url) {
    console.warn('Deep link URL:', url);
  }
  
  return url;
}
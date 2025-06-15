import type { Href } from 'expo-router';

// Route parameter types for typed navigation
export type RouteParams = {
  '/(auth)/magic-link': { email: string };
  '/trip/[id]': { id: string };
  '/trip/add': { date?: string };
  '/simulator': { tripId?: string };
  '/calendar': { year: number; month: number };
};

// Helper type for getting params of a specific route
export type RouteParamsOf<T extends keyof RouteParams> = RouteParams[T];

// Valid app routes
export type AppRoute = 
  | '/'
  | '/(auth)/login'
  | '/(auth)/magic-link'
  | '/(auth)/passkey'
  | '/(tabs)'
  | '/(tabs)/dashboard'
  | '/(tabs)/trips' 
  | '/(tabs)/calendar'
  | '/(tabs)/more'
  | '/trip/[id]'
  | '/trip/add'
  | '/settings'
  | '/settings/profile'
  | '/settings/notifications'
  | '/settings/security'
  | '/simulator'
  | '/calendar'
  | '/export';

// Type-safe href helper
export function createHref<T extends AppRoute>(route: T): Href<T> {
  return route as Href<T>;
}

// Type for tab routes
export type TabRoute = 
  | '/dashboard'
  | '/trips'
  | '/calendar' 
  | '/more';
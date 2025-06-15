import { useEffect } from 'react';
import { router } from 'expo-router';

import { useUserStore } from '@/stores/user';
import { useUIStore } from '@/stores/ui';

export function useAuthGuard(): boolean {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return isAuthenticated;
}

export function useOnboardingGuard(): boolean {
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user && !user.greenCardDate) {
      router.replace('/onboarding');
    }
  }, [user]);

  return !!(user && user.greenCardDate);
}

export function useNavigationReady(): void {
  const setNavigationReady = useUIStore((state) => state.setNavigationReady);

  useEffect(() => {
    setNavigationReady(true);
    
    return () => {
      setNavigationReady(false);
    };
  }, [setNavigationReady]);
}
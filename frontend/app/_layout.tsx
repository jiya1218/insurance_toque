import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Hide splash when loading finishes
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Simple route guard — only fires once per auth state change
  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const timer = setTimeout(() => {
      try {
        const inProtectedGroup = segments[0] === '(protected)';

        if (!user && inProtectedGroup) {
          // Not logged in but on protected page → go to login
          router.replace('/');
        } else if (user && !inProtectedGroup) {
          // Logged in but on login/onboarding page → go to dashboard
          // Skip PIN auth for now to ensure basic flow works
          router.replace('/(protected)/dashboard');
        }
      } catch (err) {
        console.warn('Navigation error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [user, segments, navigationState?.key, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

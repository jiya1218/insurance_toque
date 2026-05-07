import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { user, isLoading, isPinAuthenticated, setPinAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Route guard: redirect based on auth state
  useEffect(() => {
    // Wait until navigation state is initialized and loading is done
    if (!navigationState?.key || isLoading) return;

    const timer = setTimeout(() => {
      try {
        const isWeb = Platform.OS === 'web';
        const inProtectedGroup = segments[0] === '(protected)';
        const inPinAuth = segments[0] === 'pin-auth';
        const inLogin = !segments[0] || segments[0] === 'login' || segments[0] === 'index';

        if (!user && inProtectedGroup) {
          // Not logged in but trying to access protected routes
          router.replace('/');
        } else if (user && !isPinAuthenticated && !inPinAuth && !isWeb) {
          // Logged in but PIN not verified yet (mobile only)
          router.replace('/pin-auth');
        } else if (user && (isPinAuthenticated || isWeb) && inLogin) {
          // Fully authenticated, redirect to dashboard
          router.replace('/(protected)/dashboard');
        }
      } catch (err) {
        console.warn('Route guard error:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isPinAuthenticated, segments, navigationState?.key, isLoading, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

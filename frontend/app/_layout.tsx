import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#e94560', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
            App Error
          </Text>
          <ScrollView>
            <Text style={{ color: '#eee', fontSize: 13 }}>{this.state.error}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;
    const timer = setTimeout(() => {
      try {
        const inProtectedGroup = segments[0] === '(protected)';
        if (!user && inProtectedGroup) {
          router.replace('/');
        } else if (user && !inProtectedGroup) {
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
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}

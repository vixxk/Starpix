import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { useAuthStore } from '../src/store/useAuthStore';
import { hydrateDownloadedCreations } from '../src/store/useCreationStore';
import { BRUTAL } from '../src/constants/colors';
import * as SplashScreen from 'expo-splash-screen';
import '../src/i18n';

// Immediately dismiss native splash screen so app opens with zero delay
try {
  SplashScreen.hideAsync().catch(() => {});
} catch (e) {}

/**
 * Central auth guard for every route.
 *
 * If user is not signed in, redirect to the sign in page.
 * If user is signed in and accesses auth pages, redirect to main app.
 */
function AuthGate({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const isAuthRoute =
    pathname.startsWith('/(auth)') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify') ||
    pathname.includes('(auth)') ||
    pathname.includes('login') ||
    pathname.includes('signup') ||
    pathname.includes('verify');

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (user && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthRoute, user, pathname, router]);

  if (isLoading || (!user && !isAuthRoute)) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return children;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user);

  useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Anton_400Regular,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    initializeAuth();
    hydrateDownloadedCreations();
  }, [initializeAuth]);

  return (
    <AuthGate>
      <React.Fragment>
        <StatusBar style="dark" backgroundColor={BRUTAL.bone} />
        <Stack
          initialRouteName={user ? '(tabs)' : '(auth)'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: BRUTAL.bone },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="ai-video" options={{ headerShown: false }} />
          <Stack.Screen name="template/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="preview/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="campaign/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="buy-credits" options={{ headerShown: false }} />
          <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
          <Stack.Screen name="vip" options={{ headerShown: false }} />
        </Stack>
      </React.Fragment>
    </AuthGate>
  );
}

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
import { checkHasActiveSubscription } from '../src/utils/subscription';
import { BRUTAL } from '../src/constants/colors';
import * as SplashScreen from 'expo-splash-screen';
import { setAudioModeAsync } from 'expo-audio';
import '../src/i18n';

// Configure audio playback across the app (enable sound even in iOS/Android silent mode)
try {
  setAudioModeAsync({
    playsInSilentMode: true,
  }).catch(() => {});
} catch (e) {}

// Immediately dismiss native splash screen so app opens with zero delay
try {
  SplashScreen.hideAsync().catch(() => {});
} catch (e) {}

/**
 * Central auth guard for every route.
 *
 * - If user is not signed in, redirect to the sign in page.
 * - If user is signed in but has no active subscription, redirect to the subscription (VIP) paywall page.
 * - If user has an active subscription, allow access to main app routes.
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

  const isSubscriptionRoute =
    pathname === '/vip' ||
    pathname.startsWith('/vip') ||
    pathname.includes('vip');

  const hasActiveSub = checkHasActiveSubscription(user);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!isAuthRoute) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Authenticated user with no active subscription must remain on VIP paywall
    if (!hasActiveSub) {
      if (!isSubscriptionRoute) {
        router.replace('/vip');
      }
    } else {
      // Authenticated user with active subscription:
      if (isAuthRoute) {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, isAuthRoute, isSubscriptionRoute, hasActiveSub, user, pathname, router]);

  if (isLoading || (!user && !isAuthRoute)) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  // Prevent flash of any main app page when logged in without active subscription
  if (user && !hasActiveSub && !isSubscriptionRoute) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return children;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user);
  const hasActiveSub = checkHasActiveSubscription(user);

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
          initialRouteName={user && hasActiveSub ? '(tabs)' : (user ? 'vip' : '(auth)')}
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
          <Stack.Screen name="feedback" options={{ headerShown: false }} />
          <Stack.Screen name="contact" options={{ headerShown: false }} />
          <Stack.Screen name="my-reports" options={{ headerShown: false }} />
          <Stack.Screen name="buy-credits" options={{ headerShown: false }} />
          <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
          <Stack.Screen name="vip" options={{ headerShown: false }} />
        </Stack>
      </React.Fragment>
    </AuthGate>
  );
}

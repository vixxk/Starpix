import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { useAuthStore } from '../src/store/useAuthStore';
import { hydrateDownloadedCreations } from '../src/store/useCreationStore';
import { BRUTAL } from '../src/constants/colors';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenAnimation from '../src/components/SplashScreenAnimation';
import '../src/i18n';

// Keep native splash screen active until our animated splash takes over
try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

let hasAppSplashFinished = false;

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
    // Auth state restoring or redirecting — white background matching splash
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return children;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const [isSplashDone, setIsSplashDone] = useState(() => hasAppSplashFinished);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Anton_400Regular,
  });

  useEffect(() => {
    initializeAuth();
    hydrateDownloadedCreations();
  }, []);

  const isAppReady = Boolean(fontsLoaded && !isLoading);

  // Exclusively display the animated splash screen BEFORE any app screens mount
  if (!isSplashDone && !hasAppSplashFinished) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <SplashScreenAnimation
          isReady={isAppReady}
          onFinish={() => {
            hasAppSplashFinished = true;
            setIsSplashDone(true);
          }}
        />
      </View>
    );
  }

  return (
    <AuthGate>
      <React.Fragment>
        <StatusBar style="dark" backgroundColor={BRUTAL.bone} />
        <Stack
          initialRouteName={user ? "(tabs)" : "(auth)"}
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

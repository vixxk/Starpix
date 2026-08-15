import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { useAuthStore } from '../src/store/useAuthStore';
import { hydrateDownloadedCreations } from '../src/store/useCreationStore';
import { BRUTAL } from '../src/constants/colors';

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
    pathname.startsWith('/verify') ||
    pathname.includes('(auth)') ||
    pathname.includes('login') ||
    pathname.includes('verify');

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (user && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthRoute, user, router]);

  if (isLoading || (!user && !isAuthRoute)) {
    // Auth state restoring or redirecting — render blank background to avoid UI flashes
    return <View style={{ flex: 1, backgroundColor: BRUTAL.bone }} />;
  }

  return children;
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

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

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: BRUTAL.bone }} />;
  }

  return (
    <AuthGate>
      <React.Fragment>
        <StatusBar style="dark" backgroundColor={BRUTAL.bone} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: BRUTAL.bone },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="template/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="preview/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="campaign/[id]" options={{ headerShown: false }} />
        </Stack>
      </React.Fragment>
    </AuthGate>
  );
}

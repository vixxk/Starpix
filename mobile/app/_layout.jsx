import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { useAuthStore } from '../src/store/useAuthStore';
import { hydrateDownloadedCreations } from '../src/store/useCreationStore';
import { BRUTAL } from '../src/constants/colors';

// Routes that require an authenticated user. Prefixes match the first path
// segment(s), so `/template/...` and `/preview/...` are covered too.
// Everything else (home, explore, trending, campaigns, VIP pricing) stays
// browsable as a guest.
const PROTECTED_ROUTE_PREFIXES = [
  '/profile',
  '/favorites',
  '/entitlements',
  '/downloads',
  '/create',
  '/template/',
  '/preview/',
];

/**
 * Central auth guard for every route.
 *
 * While the current route requires auth and no user is signed in, the app
 * content is not rendered (avoids flashes / null-user crashes) and the stale
 * auth state is cleared before redirecting to the login page.
 */
function AuthGate({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

  const requiresAuth = PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (isLoading || !requiresAuth || user) return;
    logout();
    router.replace('/(auth)/login');
  }, [isLoading, requiresAuth, user, logout, router]);

  if (requiresAuth && !user) {
    // Auth is still restoring or the redirect is in flight — render nothing.
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

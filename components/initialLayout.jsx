import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export default function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; // 等待 Clerk 加載完成

    const isAuthScreen = segments[0] === "(auth)";

    if (isSignedIn && isAuthScreen) {
      router.replace("/(tabs)"); // 如果已登入且在認證頁面，則重定向到主頁
    } else if (!isSignedIn && !isAuthScreen) {
      router.replace("/(auth)/sign-in"); // 如果未登入且不在認證頁面，則重定向到登入頁
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

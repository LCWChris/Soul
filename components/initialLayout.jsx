import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

export default function InitialLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isQuestionnaireChecked, setIsQuestionnaireChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      console.log("⏳ Clerk 還在載入...");
      return;
    }

    const checkFlow = async () => {
      const isAuthScreen = segments[0] === "(auth)";
      const isOnboarding = segments[0] === "onboarding";

      console.log("✅ Auth 狀態:", {
        isSignedIn,
        userId,
        currentSegment: segments[0],
      });

      if (!isSignedIn) {
        console.log("➡️ 使用者未登入 → 準備導向登入頁");
        if (!isAuthScreen) {
          router.replace("/(auth)/sign-in");
        }
        setIsQuestionnaireChecked(true);
        return;
      }

      // 已登入
      if (userId) {
        const filled = await AsyncStorage.getItem(
          `questionnaireFilled_${userId}`
        );
        console.log("📋 問卷是否已填:", filled);

        if (!filled && !isOnboarding) {
          console.log("➡️ 已登入但未填問卷 → 導向 /onboarding/preference");
          router.replace("/onboarding/preference");
        } else if (filled && isAuthScreen) {
          console.log("➡️ 已登入且問卷已填 → 導向 /tabs");
          router.replace("/(tabs)");
        } else {
          console.log("✅ 保持在目前頁面:", segments[0]);
        }
      }

      setIsQuestionnaireChecked(true);
    };

    checkFlow();
  }, [isLoaded, isSignedIn, userId, segments, router]);

  if (!isLoaded || !isQuestionnaireChecked) {
    console.log("⏳ 畫面暫時 return null 等待判斷完成");
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

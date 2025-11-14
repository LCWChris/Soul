import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

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
      try {
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
      } catch (error) {
        console.error("❌ 導航流程錯誤:", error);
        // 發生錯誤時仍然設置為已檢查，避免永久卡在載入畫面
        setIsQuestionnaireChecked(true);
        // 導向登入頁作為 fallback
        if (segments[0] !== "(auth)") {
          router.replace("/(auth)/sign-in");
        }
      }
    };

    checkFlow();
  }, [isLoaded, isSignedIn, userId, segments, router]);

  if (!isLoaded || !isQuestionnaireChecked) {
    console.log("⏳ 畫面暫時 return null 等待判斷完成");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5FF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6366F1",
    fontWeight: "600",
  },
});

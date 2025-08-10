import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasFilled, setHasFilled] = useState(false);
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    const checkQuestionnaire = async () => {
      if (!userId) return;

      const key = `questionnaireFilled_${userId}`;
      console.log("[Index] 登入後檢查問卷 → key:", key);

      try {
        const filled = await AsyncStorage.getItem(key);
        console.log(`[Index] 讀取問卷狀態 → key: ${key}，值:`, filled);
        setHasFilled(filled === "true");
      } catch (e) {
        console.error("[Index] 讀取問卷狀態失敗", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkQuestionnaire();
  }, [userId]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return hasFilled ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding/preference" />;
}

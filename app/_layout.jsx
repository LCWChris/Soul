// app/_layout.jsx
import InitialLayout from "@/components/initialLayout";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

/** 全域問卷閘門：任何頁面都會經過它 */
function QuestionnaireGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, userId } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // 未登入：放行（交給各自頁面導去登入）
      if (!isSignedIn) {
        if (mounted) setChecking(false);
        return;
      }

      // 問卷/登入區域：放行（避免重導迴圈）
      const inOnboarding = pathname?.startsWith("/onboarding");
      const inAuth = pathname?.startsWith("/(auth)");
      if (inOnboarding || inAuth) {
        if (mounted) setChecking(false);
        return;
      }

      // 其他頁面：檢查是否已填問卷
      try {
        const key = `questionnaireFilled_${userId}`;
        const filled = await AsyncStorage.getItem(key);
        if (filled !== "true") {
          router.replace("/onboarding/preference");
        }
      } catch (e) {
        console.warn("[Gate] 檢查問卷失敗：", e);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, userId, pathname, router]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <QuestionnaireGate>
            <InitialLayout />
          </QuestionnaireGate>
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

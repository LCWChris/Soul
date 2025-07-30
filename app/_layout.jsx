import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"; // 導入 SafeAreaProvider
import "./globals.css"; // 確保全局 CSS 導入

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false, // 隱藏所有頁面的標題欄
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

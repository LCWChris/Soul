import InitialLayout from "@/components/initialLayout"; // 導入初始布局組件
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"; // 導入 SafeAreaProvider
import "./globals.css"; // 確保全局 CSS 導入

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <InitialLayout />
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

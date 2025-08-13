import InitialLayout from '@/components/initialLayout'; // 導入初始布局組件
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { StatusBar } from 'expo-status-bar'; // 導入狀態欄組件
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'; // 導入 SafeAreaProvider
import './globals.css'; // 確保全局 CSS 導入

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <InitialLayout />
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

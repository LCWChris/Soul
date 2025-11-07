import InitialLayout from "@/components/initialLayout";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper"; // ⬅️ 新增
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <PaperProvider>  
            <StatusBar style="dark" />
            <InitialLayout />
          </PaperProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

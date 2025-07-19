import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { Stack } from "expo-router/stack"; // 確保導入路徑正確
import "./globals.css"; // 確保全局 CSS 導入

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
// app/_layout.jsx

export default function Layout() {
  return <Stack />;
}

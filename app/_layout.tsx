// app/_layout.tsx
import { Stack } from "expo-router/stack"; // 確保導入路徑正確
import './globals.css'; // 確保全局 CSS 導入

export default function RootLayout() {
  return (
    <Stack>
      {/* 這個 Stack.Screen 的 name 必須是 "(tabs)"，它告訴 Expo Router 渲染該文件夾下的 _layout.tsx */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* 如果未來有其他不需要底部 Tab 的獨立頁面，可以在這裡添加 */}
    </Stack>
  );
}
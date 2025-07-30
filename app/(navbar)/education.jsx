import { router } from 'expo-router';
import { Button, StyleSheet, Text, View } from "react-native"; // 導入 StyleSheet
export default function ScrollViewTestScreen() {
  return (
    <View>
      <Text>學習主頁</Text>
      <Button title="進入單字學習" onPress={() => router.navigate("/WordLearningPage")} />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    // 應用內容的居中樣式到 contentContainerStyle
    // 注意：您不能直接在這裡寫 Tailwind 類名，需要用 StyleSheet.create 轉換
    // 或者使用 NativeWind 的 `useTailwind` Hook 或 `tw` 函數來轉換
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1, // 讓內容容器在內容不足時也能佔滿可用空間，以實現居中
  },
});

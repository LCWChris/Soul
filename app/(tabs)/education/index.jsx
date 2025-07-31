import { Link } from "expo-router"; // ← 正確的 Link 來源
import { Button, StyleSheet, Text, View } from "react-native"; // 導入 StyleSheet
export default function Education() {
  return (
    <View className="flex-1 justify-center items-center bg-yellow-100">
      <Text className="text-3xl text-yellow-800 font-bold">學習主頁</Text>
      <Link href="/education/WordLearningPage" push asChild>
        <Button title="進入單字學習" />
      </Link>
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

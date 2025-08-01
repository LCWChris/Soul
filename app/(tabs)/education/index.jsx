import { useRouter } from "expo-router"; // 導入 useRouter 以便導航
import { Button, StyleSheet, Text, View } from "react-native"; // 導入 StyleSheet
export default function Education() {
  const router = useRouter();
  return (
    <View className="flex-1 justify-center items-center bg-yellow-100">
      <Text style={{ fontSize: 24, marginBottom: 20 }}>學習首頁</Text>
      <Button
        title="前往單字學習頁面"
        onPress={() => router.push("education/word-learning-screen")}
      />
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

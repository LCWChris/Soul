// app/index.tsx
import { Text, View } from "react-native";

export default function IndexScreen() { // 將 Index 改為 IndexScreen 以遵循組件命名約定
  return (
    <View className = "flex-1 justify-center items-center bg-red-100"> {/* 添加 bg-red-100 */}
      <Text className="text-5xl text-red-800 font-bold">Welcome!? (首頁)</Text> {/* text-primary 替換為 text-red-800 確保有顏色 */}
    </View>
  );
}
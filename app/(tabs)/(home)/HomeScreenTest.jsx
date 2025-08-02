import { styles } from "@/styles/auth.styles";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
const lessons = [
  { id: 1, title: "基礎問候語", desc: "學習打招呼的手語" },
  { id: 2, title: "日常對話", desc: "常見生活用語" },
  { id: 3, title: "數字與時間", desc: "從1數到100" },
];
export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white" style={{ marginBottom: 60 }}>
      {/* 🎉 Hero 區塊 */}
      <View className="items-center justify-center py-10 bg-yellow-100">
        <Image
          source={require("@/assets/images/hero.png")}
          resizeMode="contain"
          style={styles.illustration}
        />
        <Text className="text-2xl font-extrabold text-center text-orange-600 mt-4">
          一手學手語，雙手說世界
        </Text>
      </View>

      {/* 💡 理念介紹 */}
      <View className="px-6 py-6 bg-white">
        <Text className="text-xl font-semibold text-purple-700 mb-2">
          我們的理念
        </Text>
        <Text className="text-base text-gray-700 leading-relaxed">
          我們相信手語應該被更多人了解與學習。這個 App 結合 AI
          與教育，幫助你輕鬆學習與使用手語。
        </Text>
      </View>

      {/* 📚 推薦學習內容 */}
      <View className="px-6 py-4">
        <Text className="text-xl font-semibold text-green-700 mb-2">
          推薦學習內容
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {lessons.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="mr-4 p-4 bg-green-100 rounded-xl w-44 drop-shadow-md"
              onPress={() => router.push("/learning")}
            >
              <Text className="text-lg font-bold text-green-800">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 📷 翻譯功能介紹 */}
      <View className="px-6 py-6 bg-blue-50">
        <Text className="text-xl font-semibold text-blue-700 mb-6">
          手語翻譯功能
        </Text>
        <Image
          source={require("@/assets/images/translate-demo.png")}
          resizeMode="contain"
          style={{
            height: 350,
            width: "100%",
            marginBottom: 24,
            borderRadius: 16,
          }}
        />
        <Text className="text-base text-gray-700">
          使用相機拍攝手語，App 將自動翻譯為中文，快速又方便。
        </Text>
      </View>

      {/* 🚀 CTA 區塊 */}
      <View className="flex-row justify-around px-6 py-6 bg-white">
        <TouchableOpacity
          className="bg-purple-500 px-6 py-3 rounded-full shadow-md"
          onPress={() => router.push("/learning")}
        >
          <Text className="text-white font-bold">立即學習</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-full shadow-md"
          onPress={() => router.push("/translation/translate-screen")}
        >
          <Text className="text-white font-bold">開始翻譯</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

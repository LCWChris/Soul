// ✅ 顯示翻譯結果畫面
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";

export default function TranslationResultScreen() {
  const { translatedText = "未取得翻譯結果" } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>翻譯結果</Text>
      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{translatedText}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/(tabs)/translation/translate-screen")}>
        <Text style={styles.buttonText}>再翻譯一段</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  resultBox: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 18,
    color: "#333",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#4285F4",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

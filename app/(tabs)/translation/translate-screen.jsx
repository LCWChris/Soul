// ✅ app/(tabs)/translation/translate-screen.jsx
import ArrowBack from "@/components/ArrowBack";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
export default function TranslateScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* 模擬相機畫面區塊 */}
      <View style={styles.cameraPlaceholder}>
        <View style={styles.overlayBox}>
          <Text style={styles.overlayText}>請將雙手放在框內</Text>
        </View>
      </View>
      <ArrowBack />
      {/* 結果區塊 */}
      <View style={styles.resultArea}>
        <Text style={styles.resultText}>翻譯結果將顯示於此</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>開始翻譯</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>播放語音</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  cameraPlaceholder: {
    flex: 3,
    backgroundColor: "#dfefff",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayBox: {
    width: "80%",
    height: "60%",
    borderColor: "lightblue",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  overlayText: {
    color: "lightblue",
    fontSize: 16,
  },
  resultArea: {
    flex: 2,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },
  resultText: {
    fontSize: 18,
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  button: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#4285F4",
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

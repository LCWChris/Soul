import { SignOutButton } from "@/components/SignOutButton"; // ✅ 匯入共用登出按鈕
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* 個人檔案設定 */}
      <Text style={styles.sectionTitle}>個人檔案設定</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>修改使用者名稱</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>設定身分（聽障 / 聽人）</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>更改 Email / 密碼</Text>
      </TouchableOpacity>

      {/* ✅ 帳號管理 */}
      <Text style={styles.sectionTitle}>帳號管理</Text>
      <View style={[styles.button, { backgroundColor: "#f87171" }]}>
        <SignOutButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#065f46",
  },
  button: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

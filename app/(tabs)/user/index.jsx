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
    <ScrollView className="flex-1 bg-white px-6 py-8">
      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          個人檔案設定
        </Text>
        <TouchableOpacity className="bg-blue-100 rounded-lg p-4 mb-4 w-64 self-center">
          <Text className="text-base text-blue-700 font-semibold text-center">
            修改使用者名稱
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-blue-100 rounded-lg p-4 mb-4 w-64 self-center">
          <Text className="text-base text-blue-700 font-semibold text-center">
            設定身分（聽障 / 聽人）
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-blue-100 rounded-lg p-4 mb-4 w-64 self-center">
          <Text className="text-base text-blue-700 font-semibold text-center">
            更改 Email / 密碼
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">帳號管理</Text>
        <View>
          <SignOutButton />
        </View>
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

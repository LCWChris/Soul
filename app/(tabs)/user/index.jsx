import { SignOutButton } from "@/components/SignOutButton";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function SettingScreen() {
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // ✅ 自動生成 username
  const autoGenerateUsername = async () => {
    if (user && !user.username) {
      const randomId = Math.floor(100000000 + Math.random() * 900000000); // 9位數
      const generatedUsername = `user${randomId}`;
      try {
        await user.update({ username: generatedUsername });
        console.log("已自動設定 username:", generatedUsername);
      } catch (error) {
        console.error("自動生成 username 失敗:", error);
      }
    }
  };

  // 進入 Setting 頁面時，檢查是否需要自動設定 username
  useEffect(() => {
    autoGenerateUsername();
  }, [user]);

  // ✅ 手動更新 username
  const handleSaveUsername = async () => {
    if (!tempUsername.trim()) {
      Alert.alert("錯誤", "請輸入有效的使用者名稱");
      return;
    }
    try {
      await user.update({ username: tempUsername });
      Alert.alert("成功", "使用者名稱已更新");
      setShowModal(false);
    } catch (error) {
      console.error("更新失敗:", error);
      Alert.alert("錯誤", "設定失敗，請稍後再試");
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 py-8">
      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          個人檔案設定
        </Text>

        {/* ✅ 手動修改使用者名稱 */}
        <TouchableOpacity
          className="bg-blue-100 rounded-lg p-4 mb-4 w-64 self-center"
          onPress={() => setShowModal(true)}
        >
          <Text className="text-base text-blue-700 font-semibold text-center">
            修改使用者名稱
          </Text>
        </TouchableOpacity>
      </View>

      {/* 帳號管理 */}
      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">帳號管理</Text>
        <View>
          <SignOutButton />
        </View>
      </View>

      {/* ✅ Modal：手動修改 username */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>輸入新的使用者名稱</Text>
            <TextInput
              style={styles.input}
              placeholder="新使用者名稱"
              value={tempUsername}
              onChangeText={setTempUsername}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#10b981" }]}
              onPress={handleSaveUsername}
            >
              <Text style={styles.buttonText}>儲存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#ccc" }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

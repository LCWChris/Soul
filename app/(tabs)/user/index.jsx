import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Card,
  Dialog,
  HelperText,
  PaperProvider,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";

export default function SettingScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [showDialog, setShowDialog] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [inputError, setInputError] = useState("");

  // ✅ 即時檢查輸入內容
  const validateInput = (value) => {
    setTempUsername(value);
    if (!value.trim()) {
      setInputError("請輸入有效的使用者名稱");
    } else {
      const regex = /^[a-zA-Z0-9-_]+$/;
      if (!regex.test(value)) {
        setInputError("只能使用英數字、減號(-)、底線(_)，不能包含空格或中文");
      } else {
        setInputError("");
      }
    }
  };

  // ✅ 儲存 username
  const handleSaveUsername = async () => {
    if (inputError || !tempUsername.trim()) return;

    try {
      await user.update({ username: tempUsername });
      setShowDialog(false);
    } catch (error) {
      console.error("更新失敗:", error);
      setInputError("更新失敗，請稍後再試");
    }
  };

  // ✅ 登出功能 (取代 SignOutButton)
  const handleSignOut = async () => {
    try {
      await user.signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  // ✅ 註銷帳號功能
  const handleDeleteAccount = async () => {
    try {
      await user.delete();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("刪除帳號失敗:", error);
    }
  };

  return (
    <PaperProvider>
      <ScrollView style={styles.container}>
        {/* 個人檔案設定 */}
        <Text variant="headlineMedium" style={styles.title}>
          個人檔案設定
        </Text>
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained-tonal"
              onPress={() => setShowDialog(true)}
            >
              修改使用者名稱
            </Button>
          </Card.Content>
        </Card>

        {/* 帳號管理 */}
        <Text variant="headlineMedium" style={styles.title}>
          帳號管理
        </Text>
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              style={{ marginBottom: 10 }}
              onPress={handleSignOut}
            >
              登出
            </Button>

            <Button
              mode="contained"
              buttonColor="red"
              onPress={handleDeleteAccount}
            >
              註銷帳號
            </Button>
          </Card.Content>
        </Card>

        {/* 修改使用者名稱 Dialog */}
        <Portal>
          <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
            <Dialog.Title>輸入新的使用者名稱</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="新使用者名稱"
                mode="outlined"
                value={tempUsername}
                onChangeText={validateInput}
                error={!!inputError}
              />
              <HelperText type="error" visible={!!inputError}>
                {inputError}
              </HelperText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDialog(false)}>取消</Button>
              <Button onPress={handleSaveUsername}>儲存</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "white" },
  title: { marginVertical: 12 },
  card: { marginBottom: 16 },
});

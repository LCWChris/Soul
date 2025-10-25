import { API_CONFIG } from "@/constants/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Divider,
  HelperText,
  Paragraph,
  Portal,
  Snackbar,
  Text,
  TextInput,
  Title,
} from "react-native-paper";

export default function UserScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useAuth();

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  // === 修改使用者名稱 Dialog ===
  const [showDialog, setShowDialog] = useState(false);
  const [tempUsername, setTempUsername] = useState(user?.username || "");
  const [inputError, setInputError] = useState("");

  // === 註銷帳號 Dialog ===
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // === Snackbar 狀態 ===
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // ✅ 共用 API fetch 工具
  async function apiFetch(url, options = {}) {
    const defaultHeaders = { "ngrok-skip-browser-warning": "true" };
    const res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    });

    const contentType = res.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch (err) {
        console.error("❌ JSON 解析失敗:", err);
      }
    } else {
      const text = await res.text();
      console.warn("⚠️ 回應不是 JSON，取回原始文字:", text.slice(0, 300));
    }

    return { res, data };
  }


  // 問卷題目 key -> 中文標題
  const labels = {
    purpose: "使用本 App 的主要目的",
    frequency: "使用翻譯功能的頻率",
    experience: "是否有學習手語的經驗",
    studyTime: "每日希望學習時間",
    interestCategory: "最感興趣的主題",
    learningLevel: "目前的手語程度",
    useContext: "最常使用手語的情境",
  };

  // 額外對應：英文值 -> 中文顯示
  const valueLabels = {
    learningLevel: {
      beginner: "初級",
      intermediate: "中級",
      advanced: "高級",
    },
    useContext: {
      daily: "日常",
      school: "學校",
      workplace: "職場",
      home_school: "學校", // 修正異常值
    },

  };

  // ✅ 即時檢查使用者名稱
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

  // ✅ 儲存使用者名稱
  const handleSaveUsername = async () => {
    if (inputError || !tempUsername.trim()) return;
    try {
      await user.update({ username: tempUsername });
      setShowDialog(false);
      setSnackbarMessage("✅ 使用者名稱已更新");
      setSnackbarVisible(true);
    } catch (error) {
      console.error("更新失敗:", error);
      setInputError("更新失敗，請稍後再試");
    }
  };

  // ✅ 登出
  const handleSignOut = async () => {
    try {
      await signOut();
      setSnackbarMessage("✅ 已登出");
      setSnackbarVisible(true);
      router.replace("/(auth)/sign-in");
    } catch (e) {
      console.error("登出失敗:", e);
      setSnackbarMessage("❌ 登出失敗，請稍後再試");
      setSnackbarVisible(true);
    }
  };

  // ✅ 確認註銷帳號（先刪 MongoDB → 再刪 Clerk）
  const handleConfirmDelete = async () => {
    try {
      // 1) 刪除 MongoDB 偏好
      await apiFetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}/${user.id}`,
        { method: "DELETE" }
      );



      // 2) 刪除 Clerk 帳號
      await user.delete();

      setDeleteDialogVisible(false);
      setSnackbarMessage("✅ 帳號與偏好資料已刪除");
      setSnackbarVisible(true);
      router.replace("/(auth)/sign-up");
    } catch (e) {
      console.error("註銷失敗:", e);
      setSnackbarMessage("❌ 註銷失敗，請稍後再試");
      setSnackbarVisible(true);
    }
  };

  // ✅ 取得問卷
  const fetchPreferences = async () => {
    if (!user?.id) return;
    setLoading(true);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}/${user.id}`;

    try {
      const { res, data } = await apiFetch(url, { method: "GET" });


      if (!res.ok) {
        setPreferences(null);
        setSnackbarMessage(`❌ 取得問卷失敗（${res.status}）`);
        setSnackbarVisible(true);
        return;
      }

      if (data?.success && data.data) {
        setPreferences(data.data.answers);
        setSnackbarMessage("✅ 已載入問卷答案");
        setSnackbarVisible(true);
      } else {
        setPreferences(null);
        setSnackbarMessage("ℹ️ 尚未填寫問卷");
        setSnackbarVisible(true);
      }
    } catch (err) {
      console.error("❌ 取得問卷失敗（網路/解析）:", err, { url });
      setSnackbarMessage("❌ 取得問卷失敗，請稍後再試");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 清除問卷
  const clearPreferences = async () => {
    if (!user?.id) return;
    try {
      const { data } = await apiFetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}/${user.id}`,
        { method: "DELETE" }
      );

      if (data.success) {
        setPreferences(null);
        await AsyncStorage.removeItem(`questionnaireFilled_${user.id}`);
        setSnackbarMessage("✅ 問卷資料已清除");
        setSnackbarVisible(true);
        router.replace("/onboarding/preference");
      } else {
        setSnackbarMessage("❌ 清除問卷失敗");
        setSnackbarVisible(true);
      }
    } catch (err) {
      console.error("❌ 刪除問卷失敗:", err);
      setSnackbarMessage("❌ 刪除問卷失敗，請稍後再試");
      setSnackbarVisible(true);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >

        <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
          使用者設定
        </Text>

        {/* 區塊：帳號設定 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>👤 帳號設定</Title>
            <Paragraph>帳號：{user?.primaryEmailAddress?.emailAddress}</Paragraph>
            <Paragraph>使用者名稱：{user?.username || "未設定"}</Paragraph>
            <Divider style={{ marginVertical: 8 }} />
            <Button mode="contained-tonal" onPress={() => setShowDialog(true)}>
              修改使用者名稱
            </Button>
          </Card.Content>
        </Card>

        {/* 區塊：問卷偏好 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>📝 問卷偏好</Title>
            <Button
              mode="contained-tonal"
              style={{ marginTop: 8 }}
              onPress={() => router.push("/onboarding/preference")}
            >
              修改偏好問卷
            </Button>
            <Button
              mode="contained-tonal"
              style={{ marginTop: 8 }}
              onPress={fetchPreferences}
              loading={loading}
            >
              查看已儲存的問卷
            </Button>
            <Button
              mode="contained-tonal"
              buttonColor="#dc2626"
              textColor="white"
              style={{ marginTop: 8 }}
              onPress={clearPreferences}
            >
              清除問卷答案
            </Button>

            {preferences && (
              <Card style={{ marginTop: 12, backgroundColor: "#f3f4f6" }}>
                <Card.Content>
                  <Title>📋 問卷答案</Title>
                  {Object.entries(preferences).map(([key, value], index) => {
                    const label = labels[key] || key;
                    const displayValue = valueLabels[key]?.[value] ?? value;

                    return (
                      <Paragraph key={key}>
                        {index + 1}. {label}：{displayValue}
                      </Paragraph>
                    );
                  })}


                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>

        {/* 區塊：安全性 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>🔐 安全性</Title>
            <Button mode="contained" style={{ marginTop: 8 }} onPress={handleSignOut}>
              登出
            </Button>
            <Button
              mode="contained"
              buttonColor="#b91c1c"
              style={{ marginTop: 8 }}
              onPress={() => setDeleteDialogVisible(true)}
            >
              註銷帳號
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

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

      {/* 註銷帳號 Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>⚠️ 確認註銷帳號</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              此動作無法恢復，帳號及相關資料將永久刪除。確定要繼續嗎？
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>取消</Button>
            <Button onPress={handleConfirmDelete} textColor="white" buttonColor="#b91c1c">
              確定刪除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar 提示 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: "#333" }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
});

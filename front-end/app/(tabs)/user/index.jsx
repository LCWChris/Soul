import { API_CONFIG } from "@/constants/api";
import { getTranslationApiUrl, saveTranslationApiUrl } from "@/utils/settings";
import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

export default function UserScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useAuth();

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [translationApiUrl, setTranslationApiUrl] = useState("");
  const [isApiSectionExpanded, setIsApiSectionExpanded] = useState(false);

  // === Snackbar 狀態 ===
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const loadApiUrl = async () => {
      const storedUrl = await getTranslationApiUrl();
      if (storedUrl) {
        setTranslationApiUrl(storedUrl);
      }
    };
    loadApiUrl();
  }, []);

  const handleSaveApiUrl = async () => {
    await saveTranslationApiUrl(translationApiUrl);
    setSnackbarMessage("✅ 翻譯 API URL 已儲存");
    setSnackbarVisible(true);
  };

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
      setSnackbarMessage("✅ 帳號與偏好資料已刪除");
      setSnackbarVisible(true);
      router.replace("/(auth)/sign-up");
    } catch (e) {
      console.error("註銷失敗:", e);
      setSnackbarMessage("❌ 註銷失敗，請稍後再試");
      setSnackbarVisible(true);
    }
  };

  const showDeleteConfirmation = () => {
    Alert.alert(
      "⚠️ 確認註銷帳號", // 標題
      "此動作無法恢復，帳號及相關資料將永久刪除。確定要繼續嗎？", // 訊息
      [
        // 按鈕陣列
        {
          text: "取消",
          onPress: () => console.log("取消註銷"),
          style: "cancel",
        },
        {
          text: "確定刪除",
          onPress: handleConfirmDelete, // 按下後執行刪除邏輯
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
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
        style={{ flex: 1, padding: 16, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        <Text variant="headlineLarge" style={styles.pageTitle}>
          使用者設定
        </Text>
        <Text variant="bodyMedium" style={styles.pageSubtitle}>
          管理您的帳號、偏好設定與安全性選項
        </Text>

        {/* 區塊：帳號設定 */}
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              👤 帳號設定
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              查看和管理您的帳號資訊
            </Text>
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                帳號
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>
                使用者名稱
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {user?.username || "未設定"}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <Button
              mode="contained"
              icon="pencil"
              onPress={() => router.push("/user/update-username")}
              style={styles.primaryButton}
              labelStyle={styles.buttonLabel}
            >
              修改使用者名稱
            </Button>
          </Card.Content>
        </Card>

        {/* 區塊：問卷偏好 */}
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📝 問卷偏好
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              個性化您的學習體驗
            </Text>
            
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                icon="file-edit"
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
                onPress={() => router.push("/onboarding/preference")}
              >
                修改偏好問卷
              </Button>
              
              <Button
                mode="outlined"
                icon="eye"
                style={styles.outlinedButton}
                labelStyle={styles.outlinedButtonLabel}
                onPress={fetchPreferences}
                loading={loading}
              >
                查看已儲存的問卷
              </Button>
              
              <Button
                mode="text"
                icon="delete"
                style={styles.dangerButton}
                labelStyle={styles.dangerButtonLabel}
                onPress={clearPreferences}
              >
                清除問卷答案
              </Button>
            </View>

            {preferences && (
              <Card style={styles.nestedCard} elevation={1}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.nestedCardTitle}>
                    📋 問卷答案
                  </Text>
                  <View style={styles.preferencesContainer}>
                    {Object.entries(preferences).map(([key, value], index) => {
                      const label = labels[key] || key;
                      const displayValue = valueLabels[key]?.[value] ?? value;

                      return (
                        <View key={key} style={styles.preferenceItem}>
                          <Text variant="bodySmall" style={styles.preferenceLabel}>
                            {label}
                          </Text>
                          <Text variant="bodyLarge" style={styles.preferenceValue}>
                            {displayValue}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>

        {/* 區塊：安全性 */}
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🔐 安全性
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              管理您的登入與帳號安全
            </Text>
            
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                icon="logout"
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
                onPress={handleSignOut}
              >
                登出
              </Button>
              
              <Button
                mode="outlined"
                icon="alert-circle"
                style={[styles.outlinedButton, styles.deleteButton]}
                labelStyle={styles.deleteButtonLabel}
                onPress={showDeleteConfirmation}
              >
                註銷帳號
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 區塊：開發者設定 */}
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <TouchableOpacity
              onPress={() => setIsApiSectionExpanded(!isApiSectionExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.expandableHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>
                    ⚙️ 開發者設定
                  </Text>
                  <Text variant="bodySmall" style={styles.sectionSubtitle}>
                    進階使用者選項
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {isApiSectionExpanded ? "▼" : "▶"}
                </Text>
              </View>
            </TouchableOpacity>
            
            {isApiSectionExpanded && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium" style={styles.apiDescription}>
                  手動設定翻譯模型的 API 位址
                </Text>
                <TextInput
                  label="翻譯 API URL"
                  value={translationApiUrl}
                  onChangeText={setTranslationApiUrl}
                  mode="outlined"
                  style={styles.textInput}
                  autoCapitalize="none"
                  placeholder="https://your-api-url.com"
                  dense
                />
                <Button
                  mode="contained"
                  icon="content-save"
                  style={styles.primaryButton}
                  labelStyle={styles.buttonLabel}
                  onPress={handleSaveApiUrl}
                >
                  儲存 API 位址
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Snackbar 提示*/}
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
  // Page header styles
  pageTitle: {
    marginBottom: 8,
    marginTop: 8,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    marginBottom: 24,
    color: "#64748B",
    lineHeight: 20,
  },
  
  // Card styles
  card: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  cardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  
  // Section header styles
  sectionTitle: {
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 18,
  },
  
  // Info row styles (for account info)
  infoRow: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
  },
  infoLabel: {
    color: "#64748B",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 15,
  },
  
  // Button styles
  buttonGroup: {
    gap: 10,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  outlinedButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    paddingVertical: 4,
  },
  outlinedButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
    letterSpacing: 0.3,
  },
  dangerButton: {
    borderRadius: 12,
  },
  dangerButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    letterSpacing: 0.3,
  },
  deleteButton: {
    borderColor: "#DC2626",
  },
  deleteButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
    letterSpacing: 0.3,
  },
  
  // Divider style
  divider: {
    marginVertical: 16,
    backgroundColor: "#E2E8F0",
  },
  
  // Nested card (for preferences display)
  nestedCard: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nestedCardTitle: {
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  preferencesContainer: {
    gap: 12,
  },
  preferenceItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  preferenceLabel: {
    color: "#64748B",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  preferenceValue: {
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 15,
  },
  
  // Expandable section styles
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expandIcon: {
    fontSize: 18,
    color: "#64748B",
    marginLeft: 12,
  },
  apiDescription: {
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 20,
  },
  textInput: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
});

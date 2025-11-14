import { API_CONFIG } from "@/constants/api";
import { getTranslationApiUrl, saveTranslationApiUrl } from "@/utils/settings";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [translationApiUrl, setTranslationApiUrl] = useState("");

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
    setTimeout(() => setSnackbarVisible(false), 2000);
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
      setTimeout(() => setSnackbarVisible(false), 2000);
      router.replace("/(auth)/sign-in");
    } catch (e) {
      console.error("登出失敗:", e);
      setSnackbarMessage("❌ 登出失敗，請稍後再試");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 2000);
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
      setTimeout(() => setSnackbarVisible(false), 2000);
      router.replace("/(auth)/sign-up");
    } catch (e) {
      console.error("註銷失敗:", e);
      setSnackbarMessage("❌ 註銷失敗，請稍後再試");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 2000);
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
        setTimeout(() => setSnackbarVisible(false), 2000);
        return;
      }
      if (data?.success && data.data) {
        setPreferences(data.data.answers);
        setSnackbarMessage("✅ 已載入問卷答案");
        setSnackbarVisible(true);
        setTimeout(() => setSnackbarVisible(false), 2000);
      } else {
        setPreferences(null);
        setSnackbarMessage("ℹ️ 尚未填寫問卷");
        setSnackbarVisible(true);
        setTimeout(() => setSnackbarVisible(false), 2000);
      }
    } catch (err) {
      console.error("❌ 取得問卷失敗（網路/解析）:", err, { url });
      setSnackbarMessage("❌ 取得問卷失敗，請稍後再試");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 2000);
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
        setTimeout(() => setSnackbarVisible(false), 2000);
        router.replace("/onboarding/preference");
      } else {
        setSnackbarMessage("❌ 清除問卷失敗");
        setSnackbarVisible(true);
        setTimeout(() => setSnackbarVisible(false), 2000);
      }
    } catch (err) {
      console.error("❌ 刪除問卷失敗:", err);
      setSnackbarMessage("❌ 刪除問卷失敗，請稍後再試");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 2000);
    }
  };

  return (
    <LinearGradient colors={["#F0F9FF", "#E0F2FE"]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>使用者設定</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 區塊：帳號設定 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>帳號設定</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>帳號：</Text>
            <Text style={styles.infoValue}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>使用者名稱：</Text>
            <Text style={styles.infoValue}>{user?.username || "未設定"}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/user/update-username")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#A78BFA", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>修改使用者名稱</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 區塊：問卷偏好 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="clipboard" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>問卷偏好</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/onboarding/preference")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>修改偏好問卷</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={fetchPreferences}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonSecondaryText}>
              {loading ? "載入中..." : "查看已儲存的問卷"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={clearPreferences}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>清除問卷答案</Text>
          </TouchableOpacity>

          {preferences && (
            <View style={styles.answersContainer}>
              <Text style={styles.answersTitle}>📋 問卷答案</Text>
              {Object.entries(preferences).map(([key, value], index) => {
                const label = labels[key] || key;
                const displayValue = valueLabels[key]?.[value] ?? value;

                return (
                  <View key={key} style={styles.answerItem}>
                    <View style={styles.answerDot} />
                    <Text style={styles.answerText}>
                      {label}：
                      <Text style={styles.answerValue}>{displayValue}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 區塊：安全性 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={24} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>安全性</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#818CF8", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>登出</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={showDeleteConfirmation}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>註銷帳號</Text>
          </TouchableOpacity>
        </View>

        {/* 區塊：開發者設定 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="code-slash" size={24} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>開發者設定</Text>
          </View>
          <Text style={styles.cardSubtitle}>手動設定翻譯模型的 API 位址</Text>
          <TextInput
            placeholder="翻譯 API URL"
            value={translationApiUrl}
            onChangeText={setTranslationApiUrl}
            style={styles.textInput}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveApiUrl}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#34D399", "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>儲存 API 位址</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Snackbar 提示*/}
      {snackbarVisible && (
        <View style={[styles.snackbar, { bottom: insets.bottom + 80 }]}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#1E293B",
    flex: 1,
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondaryText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDanger: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  answersContainer: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  answerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  answerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    marginTop: 6,
  },
  answerText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
    lineHeight: 22,
  },
  answerValue: {
    fontWeight: "600",
    color: "#1E293B",
  },
  snackbar: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  snackbarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});

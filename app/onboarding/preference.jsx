// app/onboarding/preference.jsx
import { API_CONFIG } from "@/constants/api";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Snackbar } from "react-native-paper";

// ---- 本地預設（後端抓不到時的備援） ----
const FALLBACK = {
  categories: ["日常生活", "學校", "家庭", "朋友", "購物", "醫療"],
  levels: ["beginner", "intermediate", "advanced"], // 保留英文值，畫面用 DISPLAY_LABELS 翻成中文
  contexts: ["daily", "school", "workplace"],
};

// ---- 顯示字典：英文值 -> 中文標籤 ----
const DISPLAY_LABELS = {
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
  // 後續若有需要也可加：useContext、interestCategory 等
  // useContext: { daily: "日常", school: "學校", workplace: "職場" }
};

// 將純字串選項轉成 { value, label }；若沒有字典則原樣顯示
const toDisplayOptions = (key, rawOptions) =>
  (rawOptions || []).map((v) => ({
    value: v,
    label: DISPLAY_LABELS[key]?.[v] ?? v,
  }));

export default function PreferenceQuestionnaire() {
  const router = useRouter();
  const { user } = useUser();

  // 問卷與流程
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const FIXED_LEVELS = ["beginner", "intermediate", "advanced"];

  // 後端中繼資料（主題/程度/情境）
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [contexts, setContexts] = useState([]);

  // UI
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [snackbarType, setSnackbarType] = useState("success");

  // 依照中繼資料組合題目
  const questions = useMemo(() => {
    const q = [
      {
        key: "purpose",
        title: "使用本 App 的主要目的為何？",
        options: ["學習手語", "進行手語翻譯", "兩者皆是"],
      },
      {
        key: "frequency",
        title: "你預期使用「手語翻譯」功能的頻率？",
        options: ["每天", "每週數次", "偶爾", "幾乎不會"],
      },
      {
        key: "experience",
        title: "你是否有學習手語的經驗？",
        options: ["是，曾經上過課或自學過", "否，完全沒有經驗"],
      },
      {
        key: "studyTime",
        title: "若使用此 App 學習手語，每日希望學習時間？",
        options: ["5 分鐘內", "約 10 分鐘", "10～20 分鐘", "超過 20 分鐘"],
      },

      // —— 用於推薦主題：主題 / 程度 / 情境 ——
      {
        key: "interestCategory",
        title: "你對哪些主題最感興趣？（先選一個作為起點）",
        options: (categories?.length ? categories : FALLBACK.categories).slice(0, 12),
      },
      {
        key: "learningLevel",
        title: "目前的手語程度？",
        // 將英文值包成 { value, label }，畫面顯示中文但仍送英文值
        options: toDisplayOptions(
          "learningLevel",
          (levels?.length ? levels : FALLBACK.levels).sort(
            (a, b) => FIXED_LEVELS.indexOf(a) - FIXED_LEVELS.indexOf(b)
          )
        ),
      },
      {
        key: "useContext",
        title: "最常在哪種情境需要手語？",
        options: toDisplayOptions(
          "useContext",
          contexts?.length ? contexts : FALLBACK.contexts
        ),
      },
    ];

    return q;
  }, [categories, levels, contexts]);

  const total = questions.length;
  const currentQuestion = questions?.[step];

  // 讀取「主題/程度/情境」中繼資料
  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`);
        const data = await res.json();

        // 你的後端會回 { categories:[{name,count}], learning_levels:[...], contexts:[...] }
        const catNames = (data?.categories || []).map((c) => c.name).filter(Boolean);
        if (!cancelled) {
          const VALID_CONTEXTS = ["daily", "school", "workplace"];
          setCategories(catNames);
          setLevels(data?.learning_levels || []);
          setContexts(
            (data?.contexts?.length ? data.contexts : FALLBACK.contexts).filter((c) =>
              VALID_CONTEXTS.includes(c)
            )
          );

        }
      } catch (err) {
        if (!cancelled) setMetaError(err?.message || "載入分類失敗");
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  // 檢查是否已填過問卷
  useEffect(() => {
    const checkIfFilled = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}/${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setAnswers(data.data.answers || {});
            setEditMode(true);
          }
        }
      } catch (err) {
        console.error("❌ 檢查問卷狀態失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    checkIfFilled();
  }, [user]);

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (!answers[currentQuestion?.key]) {
      setSnackbarMessage("⚠️ 請先選擇一個選項");
      setSnackbarType("info");
      setSnackbarVisible(true);
      return;
    }

    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      const un = questions.filter((q) => !answers[q.key]);
      if (un.length) {
        setSnackbarMessage("⚠️ 請完成所有題目再送出");
        setSnackbarType("info");   // ✅ 加上這行
        setSnackbarVisible(true);
        return;
      }
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // 跳過 ngrok 警告頁
        },
        body: JSON.stringify({ userId: user?.id, answers }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.success) {
          await AsyncStorage.setItem(`questionnaireFilled_${user?.id}`, "true");
          setSnackbarMessage(editMode ? "✅ 問卷已更新" : "✅ 問卷已提交");
          setSnackbarType("success");
          setSnackbarVisible(true);
          setTimeout(() => router.replace("/(tabs)"), 1200);
        } else {
          setSnackbarMessage("❌ 儲存失敗：" + (data?.error || "未知錯誤"));
          setSnackbarVisible(true);
        }
      } else {
        const text = await res.text();
        console.error("❌ 伺服器回應不是 JSON:", text);
        setSnackbarMessage("⚠️ 伺服器暫時無法處理，請稍後再試");
        setSnackbarVisible(true);
      }
    } catch (err) {
      console.error("❌ 提交問卷失敗:", err);
      setSnackbarMessage("❌ 提交問卷失敗，請稍後再試");
      setSnackbarType("error");
      setSnackbarVisible(true);

    } finally {
      setSubmitting(false);
    }
  };

  if (loading || metaLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: "#374151" }}>
          {loading ? "載入中..." : metaError ? "載入分類失敗，使用預設選項" : "載入選項中..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{editMode ? "編輯使用者偏好問卷" : "使用者偏好問卷"}</Text>

      {/* Stepper */}
      <View style={styles.stepper}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
          />
        ))}
      </View>

      {/* 題目 */}
      <Text style={styles.question}>{currentQuestion?.title}</Text>

      {/* 選項（同時支援字串或 {value,label} 物件） */}
      {(currentQuestion?.options || []).map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const selected = answers[currentQuestion.key] === val;

        return (
          <TouchableOpacity
            key={val}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() =>
              setAnswers((prev) => ({ ...prev, [currentQuestion.key]: val }))
            }
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* 導覽 */}
      <View style={styles.nav}>
        {step > 0 && (
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: "#9ca3af" }]} onPress={handlePrev}>
            <Text style={styles.navBtnText}>上一題</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navBtn, submitting && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={submitting}
        >
          <Text style={styles.navBtnText}>
            {step === total - 1 ? (editMode ? "更新" : "送出") : "下一題"}
          </Text>
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1600}
        style={[
          snackbarType === "success" && styles.snackbarSuccess,
          snackbarType === "error" && styles.snackbarError,
          snackbarType === "info" && styles.snackbarInfo,
        ]}
      >
        {snackbarMessage}
      </Snackbar>

    </View>
  );
}

const styles = StyleSheet.create({
  snackbarSuccess: { backgroundColor: "#10b981" }, // 綠色
  snackbarError: { backgroundColor: "#ef4444" },   // 紅色
  snackbarInfo: { backgroundColor: "#f59e0b" },    // 黃色

  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#1E3A8A" },

  stepper: { flexDirection: "row", justifyContent: "center", marginBottom: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#d1d5db", marginHorizontal: 6 },
  dotActive: { backgroundColor: "#3b82f6" },
  dotDone: { backgroundColor: "#10b981" },

  question: { fontSize: 18, marginBottom: 14, color: "#111827" },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f3f4f6",
  },
  optionSelected: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  optionText: { fontSize: 16, color: "#111827" },
  optionTextSelected: { color: "#fff", fontWeight: "bold" },

  nav: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  navBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  navBtnText: { color: "#fff", fontWeight: "bold" },

});

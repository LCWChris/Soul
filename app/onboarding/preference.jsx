import { API_CONFIG } from "@/constants/api"; // ✅ 引入 API_CONFIG
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Snackbar } from "react-native-paper";

const questions = [
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
];

export default function PreferenceQuestionnaire() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const router = useRouter();
  const { user } = useUser();

  const total = questions.length;
  const currentQuestion = questions?.[step];

  // ✅ 檢查是否已填過問卷（後端 + 本地）
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
            console.log("✅ 已有問卷答案:", data.data);
            setAnswers(data.data.answers);
            setEditMode(true);
          }
        }
      } catch (err) {
        console.error("❌ 檢查問卷狀態失敗:", err);
      }

      setLoading(false);
    };

    checkIfFilled();
  }, [user]);

  const handleNext = async () => {
    if (!answers[currentQuestion?.key]) {
      return alert("請先選擇一個選項");
    }

    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // ✅ 最後一題時檢查是否所有題目都有回答
      const unanswered = questions.filter((q) => !answers[q.key]);
      if (unanswered.length > 0) {
        setSnackbarMessage("⚠️ 請完成所有題目再送出");
        setSnackbarVisible(true);
        return;
      }
      await handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  // ✅ 提交或更新問卷
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREFERENCES}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            answers,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ 問卷已儲存:", data.data);

        await AsyncStorage.setItem(`questionnaireFilled_${user?.id}`, "true");

        setSnackbarMessage(editMode ? "✅ 問卷已更新" : "✅ 問卷已提交");
        setSnackbarVisible(true);

        setTimeout(() => router.replace("/(tabs)"), 1500);
      } else {
        setSnackbarMessage("❌ 儲存失敗：" + (data.error || "未知錯誤"));
        setSnackbarVisible(true);
      }
    } catch (err) {
      console.error("❌ 提交問卷失敗:", err);
      setSnackbarMessage("❌ 提交問卷失敗，請稍後再試");
      setSnackbarVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>檢查中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editMode ? "編輯使用者偏好問卷" : "使用者偏好問卷"}
      </Text>

      {/* Stepper Dots */}
      <View style={styles.stepper}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === step && styles.dotActive,
              index < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* 題目 */}
      <Text style={styles.question}>{currentQuestion?.title}</Text>

      {/* 選項 */}
      {(currentQuestion?.options || []).map((option) => {
        const selected = answers[currentQuestion?.key] === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() =>
              setAnswers((prev) => ({ ...prev, [currentQuestion.key]: option }))
            }
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* 導覽按鈕 */}
      <View style={styles.navButtons}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: "#9ca3af" }]}
            onPress={handlePrev}
          >
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

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#1E3A8A" },

  stepper: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d1d5db",
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: "#3b82f6" },
  dotDone: { backgroundColor: "#10b981" },

  question: { fontSize: 18, marginBottom: 16, color: "#111827" },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f3f4f6",
  },
  optionSelected: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  optionText: { fontSize: 16, color: "#111827" },
  optionTextSelected: { color: "white", fontWeight: "bold" },

  navButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  navBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  navBtnText: { color: "white", fontWeight: "bold" },

  snackbar: { backgroundColor: "#10b981" },
});

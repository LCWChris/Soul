import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  const router = useRouter();
  const { user } = useUser();

  const total = questions.length;
  const currentQuestion = questions?.[step];

  const handleNext = async () => {
    if (!answers[currentQuestion?.key]) {
      return alert("請先選擇一個選項");
    }

    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // 完成問卷
      setSubmitting(true);
      await AsyncStorage.setItem(`questionnaireFilled_${user?.id}`, "true");
      setSubmitting(false);
      setSnackbarVisible(true); // 顯示提示
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSnackbarDismiss = () => {
    setSnackbarVisible(false);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <Text style={styles.title}>使用者偏好問卷</Text>

      {/* Stepper dots */}
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
      <Text style={styles.question}>
        {currentQuestion?.title || "❌ 沒有題目"}
      </Text>

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
            <Text style={{ color: "white", fontWeight: "bold" }}>上一題</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navBtn, submitting && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={submitting}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {step === total - 1 ? "送出" : "下一題"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Snackbar 成功提示 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={handleSnackbarDismiss}
        duration={1500} // 1.5 秒後自動消失
        style={styles.snackbar}
      >
        ✅ 問卷已提交
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#1E3A8A" },

  /* Stepper dots */
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d1d5db",
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: "#3b82f6" },
  dotDone: { backgroundColor: "#10b981" },

  question: { fontSize: 18, marginBottom: 16, color: "black" },
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

  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },

  snackbar: {
    backgroundColor: "#10b981", // 成功綠色
  },
});

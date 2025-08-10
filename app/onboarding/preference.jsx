import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const questions = [
  { key: "purpose", title: "使用本 App 的主要目的為何？", options: ["學習手語", "進行手語翻譯", "兩者皆是"] },
  { key: "frequency", title: "你預期使用「手語翻譯」功能的頻率？", options: ["每天", "每週數次", "偶爾", "幾乎不會"] },
  { key: "experience", title: "你是否有學習手語的經驗？", options: ["是，曾經上過課或自學過", "否，完全沒有經驗"] },
  { key: "studyTime", title: "若使用此 App 學習手語，每日希望學習時間？", options: ["5 分鐘內", "約 10 分鐘", "10～20 分鐘", "超過 20 分鐘"] },
];

export default function PreferenceQuestionnaire() {
  const [answers, setAnswers] = useState({});
  const router = useRouter();
  const { userId } = useAuth();

  const selectAnswer = (questionKey, option) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: option }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.find((q) => !answers[q.key]);
    if (unanswered) {
      Alert.alert("請完成所有問題", `尚未作答：${unanswered.title}`);
      return;
    }

    console.log("[Questionnaire] 使用者偏好：", answers);

    try {
      const key = `questionnaireFilled_${userId}`;
      console.log("[Questionnaire] 問卷提交 → key:", key);
      await AsyncStorage.setItem(key, "true");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("[Questionnaire] 問卷提交失敗：", error);
      Alert.alert("錯誤", "提交問卷時發生錯誤，請稍後再試");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>使用者偏好問卷</Text>
      {questions.map((question) => (
        <View key={question.key} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>{question.title}</Text>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => selectAnswer(question.key, option)}
              style={{
                backgroundColor: answers[question.key] === option ? "#60a5fa" : "#e5e7eb",
                padding: 12,
                borderRadius: 8,
                marginVertical: 4,
              }}
            >
              <Text style={{ color: answers[question.key] === option ? "white" : "#1f2937" }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity
        onPress={handleSubmit}
        style={{ backgroundColor: "#10b981", padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>送出</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

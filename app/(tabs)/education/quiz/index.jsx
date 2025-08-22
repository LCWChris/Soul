import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

// ===== 預設題庫（之後可改打 API）=====
const MOCK_QUIZZES = {
  L1: {
    title: "第1單元 測驗（預設）",
    questions: [
      {
        id: "q1",
        type: "single_choice",
        prompt: "「你好」的手語是哪一個？",
        media: { image: "https://placehold.co/800x400?text=%E8%B3%87%E6%BA%90%E5%9C%96%E7%89%87" },
        options: [
          { id: "A", label: "選項 A" },
          { id: "B", label: "選項 B" },
          { id: "C", label: "選項 C" },
        ],
        answer: ["B"],
      },
      {
        id: "q2",
        type: "multi_select",
        prompt: "哪些屬於問候語？（可複選）",
        options: [
          { id: "A", label: "你好" },
          { id: "B", label: "再見" },
          { id: "C", label: "謝謝" },
        ],
        answer: ["A", "B"],
      },
      {
        id: "q3",
        type: "true_false",
        prompt: "本課的『謝謝』是由上往前。",
        options: [
          { id: "true", label: "對" },
          { id: "false", label: "錯" },
        ],
        answer: ["true"],
      },
      {
        id: "q4",
        type: "order",
        prompt: "請將手語動作步驟排序。",
        items: [
          { id: "1", label: "手型準備" },
          { id: "2", label: "向前推" },
          { id: "3", label: "回到起始" },
        ],
        answer: ["1", "2", "3"],
      },
    ],
  },
};

export default function QuizScreen() {
  const { lessonId } = useLocalSearchParams(); // 可有可無；沒有就用 L1
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 有傳且存在就用；否則用 L1
  const activeLessonId = useMemo(() => {
    const id = String(lessonId || "L1");
    return MOCK_QUIZZES[id] ? id : "L1";
  }, [lessonId]);

  useEffect(() => {
    setLoading(true);
    const data = MOCK_QUIZZES[activeLessonId] || null;
    setQuiz(data);
    setAnswers({});
    setIndex(0);
    setLoading(false);
  }, [activeLessonId]);

  const q = useMemo(() => quiz?.questions?.[index], [quiz, index]);

  // —— 核心：作答處理（單選/是非：立即跳；複選：達到正解數量後跳）——
  const handleAnswerChange = (qid, val, type) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));

    if (type === "single_choice" || type === "true_false") {
      // 單選/是非：自動前進
      setTimeout(() => {
        setIndex((i) => {
          const next = i + 1;
          return next < (quiz?.questions?.length ?? 0) ? next : i;
        });
      }, 150);
      return;
    }

    if (type === "multi_select") {
      // 複選：若已選數量 >= 正解數量，則自動前進
      const currentQ = quiz?.questions?.find((x) => x.id === qid);
      const need = Array.isArray(currentQ?.answer) ? currentQ.answer.length : 0;
      const chosenCount = Array.isArray(val) ? val.length : 0;
      if (need > 0 && chosenCount >= need) {
        setTimeout(() => {
          setIndex((i) => {
            const next = i + 1;
            return next < (quiz?.questions?.length ?? 0) ? next : i;
          });
        }, 150);
      }
      // 若你想「至少選1個就自動跳」→ 把上面條件改成 `chosenCount >= 1`
    }
  };

  // 是否已作答（控制下一題按鈕禁用）
  const hasAnswer = !!(
    q &&
    answers[q.id] &&
    (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : true)
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={s.muted}>載入中...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={s.center}>
        <Text style={s.title}>找不到測驗</Text>
        <Text style={s.muted}>請稍後再試</Text>
      </View>
    );
  }

  const onSubmit = () => {
    const { score, correct, total } = gradeQuiz(quiz, answers);
    Alert.alert("完成！", `分數：${score} 分（${correct}/${total}）`);
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{quiz.title}</Text>
        <Text style={s.headerSub}>
          {index + 1} / {quiz.questions.length}
        </Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 24 }}>
        {!!q?.media?.image && <Image source={{ uri: q.media.image }} style={s.media} />}
        <Text style={s.prompt}>{q?.prompt}</Text>

        <QuestionRenderer
          q={q}
          value={answers[q?.id]}
          onChange={(val) => handleAnswerChange(q.id, val, q.type)}
        />
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          style={[s.btn, index === 0 && s.btnDisabled]}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <Text style={s.btnTextDark}>上一題</Text>
        </Pressable>

        {index < quiz.questions.length - 1 ? (
          <Pressable
            style={[s.btn, s.btnPrimary, !hasAnswer && s.btnDisabled]}
            onPress={() => setIndex((i) => i + 1)}
            disabled={!hasAnswer}
          >
            <Text style={s.btnTextLight}>下一題</Text>
          </Pressable>
        ) : (
          <Pressable style={[s.btn, s.btnSuccess]} onPress={onSubmit}>
            <Text style={s.btnTextLight}>交卷</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ===== 題型渲染器 =====
function QuestionRenderer({ q, value, onChange }) {
  if (!q) return null;

  switch (q.type) {
    case "single_choice":
    case "true_false":
      return (
        <View>
          {q.options?.map((opt) => {
            const selected = Array.isArray(value) && value[0] === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[s.card, selected && s.cardSelected]}
                onPress={() => onChange([opt.id])}
              >
                <Text style={s.cardText}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );

    case "multi_select":
      return (
        <View>
          {q.options?.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={[s.card, selected && s.cardSelected]}
                onPress={() => {
                  const set = new Set(Array.isArray(value) ? value : []);
                  selected ? set.delete(opt.id) : set.add(opt.id);
                  onChange([...set]);
                }}
              >
                <Text style={s.cardText}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );

    case "order":
      // 初版：上下移；之後可換拖曳
      const list = value?.length ? value : q.items.map((i) => i.id);
      return (
        <View>
          {list.map((id, idx) => {
            const item = q.items.find((i) => i.id === id);
            return (
              <View key={id} style={s.orderItem}>
                <Text style={s.orderText}>{item?.label}</Text>
                <View style={s.orderBtns}>
                  <Pressable
                    style={s.orderBtn}
                    onPress={() => {
                      if (idx === 0) return;
                      const copy = [...list];
                      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                      onChange(copy);
                    }}
                  >
                    <Text>上移</Text>
                  </Pressable>
                  <Pressable
                    style={s.orderBtn}
                    onPress={() => {
                      if (idx === list.length - 1) return;
                      const copy = [...list];
                      [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                      onChange(copy);
                    }}
                  >
                    <Text>下移</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      );

    default:
      return <Text style={{ color: "red" }}>未知題型：{q.type}</Text>;
  }
}

// ===== 簡易評分 =====
function gradeQuiz(quiz, answers) {
  let correct = 0;
  const gradable = quiz.questions.filter((q) => !["video_response", "hotspot"].includes(q.type));
  for (const q of gradable) {
    const user = answers[q.id];
    if (!user) continue;
    if (q.type === "single_choice" || q.type === "true_false" || q.type === "order") {
      if (JSON.stringify(user) === JSON.stringify(q.answer)) correct++;
    } else if (q.type === "multi_select") {
      const a = JSON.stringify((user ?? []).slice().sort());
      const b = JSON.stringify((q.answer ?? []).slice().sort());
      if (a === b) correct++;
    }
  }
  const total = gradable.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score };
}

// ===== 樣式 =====
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1E3A8A" },
  headerSub: { marginTop: 4, color: "#6B7280" },
  body: { paddingHorizontal: 20, marginTop: 8 },
  media: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12, resizeMode: "cover" },
  prompt: { fontSize: 16, marginBottom: 12, color: "#111827" },

  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  cardSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  cardText: { fontSize: 16, color: "#111827" },

  orderItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  orderText: { fontSize: 16, marginBottom: 8 },
  orderBtns: { flexDirection: "row" },
  orderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    marginRight: 8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: "#E5E7EB" },
  btnDisabled: { opacity: 0.5 },
  btnPrimary: { backgroundColor: "#3B82F6" },
  btnSuccess: { backgroundColor: "#10B981" },
  btnTextLight: { color: "#fff", fontWeight: "700" },
  btnTextDark: { color: "#111827", fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6B7280", marginTop: 6 },
});

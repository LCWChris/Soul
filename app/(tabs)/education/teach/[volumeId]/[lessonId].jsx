import { API_CONFIG } from "@/constants/api";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function LessonPage() {
  const { lessonId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("📦 進入教材頁面，lessonId：", lessonId);
    axios
      .get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAL}/${lessonId}`)
      .then((res) => {
        console.log("✅ 成功取得教材資料", res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error("❌ 讀取教材失敗", err);
        setError(true);
      });
  }, [lessonId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>無法載入教材資料，請稍後再試。</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  const resolvedLessonId = String(lessonId || data?._id || "");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image
        source={{
          uri: data.image || "https://placehold.co/600x300?text=無圖片",
        }}
        style={styles.background}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.unit}>{data.unit}</Text>

        {data.content && data.content.length > 0 ? (
          data.content.map((item, index) => (
            <View key={index} style={styles.line}>
              <Text style={styles.sign}>✋ {item.sign_text}</Text>
              <Text style={styles.speak}>🗣 {item.spoken_text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>⚠️ 此單元尚無內容。</Text>
        )}

        {/* 開始測驗按鈕 */}
        <Pressable
          style={styles.quizBtn}
          onPress={() => {
            if (!resolvedLessonId) return;
            router.push({ pathname: "/education/quiz" });
          }}
        >
          <Text style={styles.quizBtnText}>開始測驗</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  background: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  contentContainer: {
    padding: 20,
  },
  unit: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E3A8A", // 深藍
    marginBottom: 12,
  },
  line: {
    marginBottom: 16,
  },
  sign: {
    fontSize: 16,
    color: "#374151", // 深灰
  },
  speak: {
    fontSize: 16,
    color: "#6B7280", // 淺灰
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  // ====== 測驗按鈕 ======
  quizBtn: {
    marginTop: 20,
    backgroundColor: "#3B82F6", // 藍色 (Tailwind: bg-blue-500)
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  quizBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LessonPage() {
  const { lessonId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("📦 進入教材頁面，lessonId：", lessonId);
    axios
      .get(`http://192.168.1.182:3001/api/material/${lessonId}`)
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

  return (
    <ScrollView style={styles.container}>
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
    color: "#1E3A8A",
    marginBottom: 12,
  },
  line: {
    marginBottom: 16,
  },
  sign: {
    fontSize: 16,
    color: "#374151",
  },
  speak: {
    fontSize: 16,
    color: "#6B7280",
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
});

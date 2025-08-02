import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// 模擬教材資料（後續可改為 API 取得）
const mockData = {
  "1": {
    "1": { title: "第一課：手語字母 A-E", content: "這是第1冊第1課的內容..." },
    "2": { title: "第二課：手語字母 F-J", content: "這是第1冊第2課的內容..." },
    // ...
  },
  // 冊別 2、3、4 ...
};

export default function LessonScreen() {
  const { volumeId, lessonId } = useLocalSearchParams();
  const lesson = mockData?.[volumeId]?.[lessonId];

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>找不到這課的內容</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.content}>{lesson.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1E3A8A",
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  error: {
    fontSize: 18,
    color: "red",
  },
});

// app/education/index.jsx
import ArrowBack from "@/components/ArrowBack";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  MD3LightTheme,
  PaperProvider,
  Text,
} from "react-native-paper";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // 改掉 paper 預設的紫色，統一走藍色系
    primary: "#1E3A8A", // 主色：深藍
    secondary: "#2563EB", // 次要：亮藍
    tertiary: "#0EA5E9", // 裝飾：青藍
  },
};

export default function Education() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.navigateTo === "quiz" && params.volumeId && params.lessonId) {
      router.push({
        pathname: "/(tabs)/education/quiz/[volumeId]/[lessonId]",
        params: { volumeId: params.volumeId, lessonId: params.lessonId },
      });
    }
  }, [params]);

  // 定義返回函式
  const goBack = () => {
    // 使用 expo-router 的 back 方法實現導航回上一頁
    if (router.canGoBack()) {
      router.back();
    } else {
      // 如果沒有上一頁，可以導航到應用程式的根目錄或特定頁面
      router.replace("/");
    }
  };

  return (
    <PaperProvider theme={theme}>
      {/* 為了讓 ArrowBack 不受 ScrollView 影響，我們將它放在 ScrollView 外部的 View 中 */}
      <View style={styles.screenContainer}>
        {" "}
        {/* 【修改處 1】：新增一個外部容器 View 來包含所有內容 */}
        {/* 【修改處 2】：將 ArrowBack 放在畫面上方，並傳入返回事件 */}
        {/* 假設您的 ArrowBack 元件接受一個 onPress 屬性來處理點擊事件 */}
        <View style={styles.backButtonContainer}>
          <ArrowBack onPress={goBack} />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {" "}
          {/* 【修改處 3】：調整 ScrollView 的樣式引用 */}
          {/* Hero 區 - 導航列已獨立，這裡不需要 Header 樣式再加額外空間 */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              教育專區
            </Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              一手學手語、雙手說世界。開始你的學習旅程吧！
            </Text>
          </View>
          {/* 快速入口按鈕（加高 + 大字） */}
          <Button
            mode="contained"
            style={styles.button}
            contentStyle={styles.buttonContent} // 控制高度
            labelStyle={styles.buttonLabel} // 控制字體大小
            onPress={() => router.push("education/teach-screen")}
          >
            進入教學區
          </Button>
          <Button
            mode="contained-tonal"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => router.push("education/word-learning")}
          >
            進入單字學習區
          </Button>
          {/* 建議多放一些導引元素 */}
          <Divider style={styles.divider} />
          {/* 推薦/最近進度 卡片 */}
          <Card mode="elevated" style={styles.card}>
            <Card.Title
              title="最近進度"
              subtitle="上次學到：第 4 冊 第 2 單元"
            />
            <Card.Content>
              <Text variant="bodyMedium">
                建議你延續「學校生活」主題，熟悉常見句型與手勢連貫。
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push("education/teach-screen")}>
                繼續學習
              </Button>
            </Card.Actions>
          </Card>
        </ScrollView>
      </View>{" "}
      {/* 【修改處 4】：新增的外部容器 View 結束 */}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // 【修改處 5】：新增 screenContainer 樣式
  screenContainer: { flex: 1, backgroundColor: "#F9FAFB" },

  // 【修改處 6】：調整原本的 container 樣式為 ScrollView
  scrollView: { flex: 1 },

  // 【修改處 7】：新增 ArrowBack 容器樣式，用於定位和內邊距
  backButtonContainer: {
    paddingTop: 40, // 確保在 iOS 和 Android 頂部安全區域之下
    paddingHorizontal: 20,
    marginBottom: 8, // 與下方內容留點間距
  },

  content: { padding: 20, gap: 16 },
  header: { gap: 6, marginBottom: 4 },
  title: { color: "#1E3A8A", fontWeight: "700" },
  subTitle: { color: "#475569" },

  // Button：更高更厚實 + 大字 + 大圓角
  button: {
    borderRadius: 18,
    overflow: "hidden",
  },
  buttonContent: {
    height: 64, // ← 增加高度
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 18, // ← 字體更大
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  divider: { marginVertical: 8 },
  sectionTitle: { marginTop: 8, marginBottom: 4, color: "#1F2937" },

  card: { borderRadius: 16, overflow: "hidden" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 14 },
});

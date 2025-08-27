// app/education/index.jsx
import { useRouter } from "expo-router";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  PaperProvider,
  MD3LightTheme,
  Text,
  Button,
  Divider,
  Card,
  Chip,
} from "react-native-paper";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // 改掉 paper 預設的紫色，統一走藍色系
    primary: "#1E3A8A",   // 主色：深藍
    secondary: "#2563EB", // 次要：亮藍
    tertiary: "#0EA5E9",  // 裝飾：青藍
  },
};

export default function Education() {
  const router = useRouter();

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero 區 */}
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
          contentStyle={styles.buttonContent}    // 控制高度
          labelStyle={styles.buttonLabel}        // 控制字體大小
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
          <Card.Title title="最近進度" subtitle="上次學到：第 4 冊 第 2 單元" />
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
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
    height: 64,              // ← 增加高度
    justifyContent: "center"
  },
  buttonLabel: {
    fontSize: 18,            // ← 字體更大
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  divider: { marginVertical: 8 },
  sectionTitle: { marginTop: 8, marginBottom: 4, color: "#1F2937" },

  card: { borderRadius: 16, overflow: "hidden" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 14 },
});

// app/education/index.jsx
import { API_CONFIG } from "@/constants/api";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MD3LightTheme, PaperProvider, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { initialRoute } = params;
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // 學習進度狀態
  const [userProgress, setUserProgress] = useState({
    lastLesson: { volume: 1, lesson: 1, title: "基礎手語" },
    progress: 0,
    isNewUser: true,
  });
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (params.navigateTo === "quiz" && params.volumeId && params.lessonId) {
      router.push({
        pathname: "/(tabs)/education/quiz/[volumeId]/[lessonId]",
        params: { volumeId: params.volumeId, lessonId: params.lessonId },
      });
    }
  }, [params]);

  useEffect(() => {
    if (initialRoute && typeof initialRoute === "string") {
      router.replace(initialRoute);
    }
  }, [initialRoute]);

  // 載入學習進度
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user?.id) {
      console.log("📍 用戶未登入，無法載入學習進度");
      setLoadingProgress(false);
      return;
    }
    try {
      setLoadingProgress(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/learning-stats/last-lesson/${user.id}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("✅ 成功載入用戶進度 (教學主頁):", data);
      setUserProgress(data);
    } catch (error) {
      console.error("❌ 載入用戶進度失敗:", error.message);
      setUserProgress({
        lastLesson: { volume: 1, lesson: 1, title: "基礎手語" },
        progress: 0,
        isNewUser: true,
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // 學習路徑數據
  const learningPaths = [
    {
      id: 1,
      title: "系統化教學",
      description: "從基礎到進階，跟著課程一步步學習",
      icon: "school",
      color: "#6366F1",
      gradient: ["#6366F1", "#4F46E5"],
      route: "/(tabs)/education/teach-screen",
      badge: "推薦",
    },
    {
      id: 2,
      title: "單字速學",
      description: "快速學習常用手語單字",
      icon: "flash",
      color: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      route: "/(tabs)/education/word-learning",
    },
  ];

  // 快速功能
  const quickActions = [
    {
      icon: "book",
      label: "課程總覽",
      route: "/(tabs)/education/teach-screen",
    },
    {
      icon: "flash",
      label: "單字學習",
      route: "/(tabs)/education/word-learning",
    },
    {
      icon: "heart",
      label: "我的收藏",
      route: "/(tabs)/education/word-learning/favorites",
    },
    {
      icon: "bar-chart",
      label: "學習統計",
      route: "/(tabs)/education/word-learning/progress",
    },
  ];

  return (
    <PaperProvider theme={theme}>
      <LinearGradient
        colors={["#EEF2FF", "#E0E7FF", "#F9FAFB"]}
        style={styles.screenContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero 區 - 帶圖標 */}
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={36} color="#6366F1" />
            </View>
            <Text style={styles.title}>教育專區</Text>
            <Text style={styles.subTitle}>
              一手學手語、雙手說世界。開始你的學習旅程吧！
            </Text>
          </View>

          {/* 主要學習路徑 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>🎯 開始學習</Text>
            </View>

            {learningPaths.map((path) => (
              <TouchableOpacity
                key={path.id}
                activeOpacity={0.9}
                onPress={() => router.push(path.route)}
              >
                <LinearGradient
                  colors={path.gradient}
                  style={styles.pathCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {path.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{path.badge}</Text>
                    </View>
                  )}
                  <View style={styles.pathIconContainer}>
                    <Ionicons name={path.icon} size={32} color="#FFF" />
                  </View>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  <Text style={styles.pathDescription}>{path.description}</Text>
                  <View style={styles.pathArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* 快速功能 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>⚡ 快速功能</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionItem}
                  onPress={() => action.route && router.push(action.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={24} color="#6366F1" />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 最近進度卡片 - 使用真實數據 */}
          {!userProgress.isNewUser && !loadingProgress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>📚 繼續學習</Text>
              </View>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressBadge}>
                    <Ionicons name="bookmark" size={16} color="#6366F1" />
                    <Text style={styles.progressBadgeText}>上次進度</Text>
                  </View>
                  <Text style={styles.progressChapter}>
                    第 {userProgress.lastLesson?.volume || 1} 冊 • 第{" "}
                    {userProgress.lastLesson?.lesson || 1} 單元
                  </Text>
                </View>

                <Text style={styles.progressTitle}>
                  {userProgress.lastLesson?.title || "手語學習"}
                </Text>
                <Text style={styles.progressDescription}>
                  繼續學習「{userProgress.lastLesson?.title || "手語"}
                  」單元，一步步精進你的手語技能。
                </Text>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    const volumeId = userProgress.lastLesson?.volume || 1;
                    const lessonId = userProgress.lastLesson?.lesson || 1;
                    router.push(
                      `/(tabs)/education/teach/${volumeId}/${lessonId}`
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>繼續學習</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 新用戶提示 */}
          {userProgress.isNewUser && !loadingProgress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>🎉 開始你的學習之旅</Text>
              </View>
              <View style={styles.progressCard}>
                <View style={styles.newUserIconContainer}>
                  <Ionicons name="rocket" size={40} color="#6366F1" />
                </View>
                <Text style={styles.progressTitle}>歡迎來到手語學習！</Text>
                <Text style={styles.progressDescription}>
                  還沒有學習紀錄，點擊下方按鈕開始你的第一堂手語課吧！
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    router.push("/(tabs)/education/teach/1/1");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>開始學習</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 載入中狀態 */}
          {loadingProgress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>📚 繼續學習</Text>
              </View>
              <View style={styles.progressCard}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>載入學習進度...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </PaperProvider>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Hero 區域
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 0,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // 區塊樣式
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionBar: {
    width: 4,
    height: 20,
    backgroundColor: "#6366F1",
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  // 學習路徑卡片
  pathCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    minHeight: 160,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  pathIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
  },
  pathDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    marginBottom: 12,
  },
  pathArrow: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 快速功能網格
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionItem: {
    width: (width - 64) / 2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },

  // 進度卡片
  progressCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
  },
  progressChapter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  progressDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  newUserIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
});

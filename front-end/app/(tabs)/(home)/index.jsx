import AIChatbot from "@/components/AIChatbot";
import FloatingAIButton from "@/components/FloatingAIButton";
import { API_CONFIG } from "@/constants/api";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useUser();

  // 個人化推薦狀態
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // 每日一句狀態
  const [dailySign, setDailySign] = useState(null);
  const [loadingDailySign, setLoadingDailySign] = useState(true);

  // AI Chatbot 狀態
  const [showChatbot, setShowChatbot] = useState(false);

  // 今日任務狀態
  const [todayTasks, setTodayTasks] = useState({
    completedTasks: 0,
    totalTasks: 3,
    tasks: {
      learn: false,
      review: false,
      quiz: false,
    },
  });
  const [loadingTasks, setLoadingTasks] = useState(true);

  // 新增：繼續學習狀態
  const [userProgress, setUserProgress] = useState({
    lastLesson: { volume: 1, lesson: 1, title: "基礎手語" },
    progress: 0,
    isNewUser: true,
  });
  const [loadingProgress, setLoadingProgress] = useState(true);

  // 模擬用戶數據 - 添加更多實用信息
  const mockUserData = {
    name: "仕彥",
    lastLesson: { volume: 4, unit: 2, title: "學校生活" },
    progress: 0.45,
    weeklyTarget: 20,
    weeklyCompleted: 9,
    isNewUser: false, // 設為 true 來測試新用戶歡迎
    streakDays: 5, // 連續學習天數
  };

  // 載入數據
  useEffect(() => {
    if (user) {
      loadPersonalizedRecommendations();
      loadDailySign();
      loadTodayTasks();
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
      console.log("✅ 成功載入用戶進度:", data);
      setUserProgress(data);
    } catch (error) {
      console.error("❌ 載入用戶進度失敗:", error.message);
      // 失敗時使用預設值
      setUserProgress({
        lastLesson: { volume: 1, lesson: 1, title: "基礎手語" },
        progress: 0,
        isNewUser: true,
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadTodayTasks = async () => {
    if (!user?.id) {
      console.log("📍 用戶未登入，無法載入今日任務");
      setLoadingTasks(false);
      return;
    }

    try {
      setLoadingTasks(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/learning-stats/today-tasks/${user.id}`,
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
      console.log("✅ 成功載入今日任務:", data);
      setTodayTasks(data);
    } catch (error) {
      console.error("❌ 載入今日任務失敗:", error.message);
      // 失敗時使用預設值
      setTodayTasks({
        completedTasks: 0,
        totalTasks: 3,
        tasks: { learn: false, review: false, quiz: false },
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadPersonalizedRecommendations = async () => {
    if (!user?.id) {
      console.log("📍 用戶未登入，使用預設推薦");
      setPersonalizedRecs(recommendedList);
      setLoadingRecs(false);
      return;
    }

    try {
      setLoadingRecs(true);

      // 檢查 API 配置是否存在
      if (!API_CONFIG.BASE_URL) {
        console.warn("⚠️ API_CONFIG.BASE_URL 未設定，使用預設推薦");
        setPersonalizedRecs(recommendedList);
        return;
      }

      console.log(
        `🌐 正在請求個人化推薦: ${API_CONFIG.BASE_URL}/api/recommendations/personalized/${user.id}`
      );

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/recommendations/personalized/${user.id}?limit=4`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("⚠️ API 返回非 JSON 內容，可能是伺服器錯誤頁面");
        setPersonalizedRecs(recommendedList);
        return;
      }

      const data = await response.json();
      console.log("✅ 成功載入個人化推薦:", data);

      if (data.recommendations && data.recommendations.length > 0) {
        setPersonalizedRecs(data.recommendations);
        console.log(`🎯 載入了 ${data.recommendations.length} 個個人化推薦`);
      } else {
        console.log("📋 沒有個人化推薦，使用預設推薦");
        setPersonalizedRecs(recommendedList);
      }
    } catch (error) {
      console.error("❌ 載入個人化推薦失敗:", error.message);
      setPersonalizedRecs(recommendedList);
    } finally {
      setLoadingRecs(false);
    }
  };

  // 載入每日一句
  const loadDailySign = async () => {
    try {
      setLoadingDailySign(true);

      // 檢查 API 配置是否存在
      if (!API_CONFIG.BASE_URL) {
        console.warn("⚠️ API_CONFIG.BASE_URL 未設定，使用預設每日一句");
        setDailySign(defaultDailySign);
        return;
      }

      console.log(
        `🌐 正在請求每日一句: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DAILY_SIGN}`
      );

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DAILY_SIGN}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("⚠️ API 返回非 JSON 內容，使用預設每日一句");
        setDailySign(defaultDailySign);
        return;
      }

      const data = await response.json();
      console.log("✅ 成功載入每日一句:", data);

      if (data && data.word) {
        setDailySign({
          word: data.word,
          chinese: data.chinese || data.word,
          image: data.image || data.gif || data.imageUrl,
          description: data.description,
          category: data.category,
        });
        console.log(`🎯 載入每日一句: ${data.word}`);
      } else {
        console.log("📋 沒有每日一句數據，使用預設");
        setDailySign(defaultDailySign);
      }
    } catch (error) {
      console.error("❌ 載入每日一句失敗:", error.message);

      // 使用預設的每日一句作為後備
      setDailySign(defaultDailySign);
    } finally {
      setLoadingDailySign(false);
    }
  };

  const handleRecommendationPress = (recommendation) => {
    console.log("🔘 點擊推薦:", recommendation);

    if (recommendation.action) {
      // 處理來自後端的個人化推薦（有完整的 action 結構）
      const { action } = recommendation;
      if (action.type === "navigate") {
        console.log(`🔗 跳轉到: ${action.route}`, action.params);
        if (action.params && Object.keys(action.params).length > 0) {
          router.push({
            pathname: action.route,
            params: action.params,
          });
        } else {
          router.push(action.route);
        }
      }
    } else if (recommendation.category) {
      // 處理靜態推薦（根據 title/category 決定跳轉）
      console.log(`🔗 跳轉到分類學習: ${recommendation.category}`);
      router.push({
        pathname: "/(tabs)/education/word-learning",
        params: { category: recommendation.category },
      });
    } else {
      // 備用：跳到教育頁面
      console.log("🔗 跳轉到教育頁面");
      router.push("/(tabs)/education");
    }
  };

  // 模擬推薦課程資料 - 添加 category 字段以支援正確跳轉
  const recommendedList = [
    {
      id: 1,
      title: "日常對話",
      category: "日常用語",
      image:
        "https://www.shutterstock.com/image-vector/students-sitting-having-conversation-600nw-2584238303.jpg",
      description: "學習常見日常手勢，提升表達流暢度",
    },
    {
      id: 2,
      title: "餐廳用語",
      category: "餐廳",
      image:
        "https://static.vecteezy.com/system/resources/previews/047/553/671/non_2x/a-yellow-and-red-building-with-a-red-awning-and-a-black-door-vector.jpg",
      description: "掌握餐廳常用手語，點餐更方便",
    },
    {
      id: 3,
      title: "交通出行",
      category: "交通",
      image:
        "https://goldcard.nat.gov.tw/cms-uploads/public-transportation-getting-around-taiwan.jpg",
      description: "學會出行相關手語，問路搭車更輕鬆",
    },
  ];

  // 預設每日一句（API 失敗時的後備）
  const defaultDailySign = {
    word: "謝謝",
    chinese: "謝謝 (Thank you)",
    image: null, // 沒有圖片時會顯示手語圖標
    description: "表達感謝的基本手語",
    category: "日常用語",
  };

  return (
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + tabBarHeight + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      >
        {/* Header 歡迎區 - 簡化版 */}
        <View style={styles.welcomeSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              👋 Hi，{user?.firstName || mockUserData.name}
            </Text>
            {mockUserData.streakDays > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>
                  🔥 {mockUserData.streakDays} 天
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>今天再學一點點，就更接近目標</Text>
        </View>

        {/* 今日任務 - 簡化版 */}
        {!userProgress.isNewUser && !loadingProgress && (
          <View style={styles.todaySection}>
            {loadingTasks ? (
              <ActivityIndicator
                size="small"
                color="#6366F1"
                style={{ paddingVertical: 20 }}
              />
            ) : (
              <>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>今日任務</Text>
                  <Text style={styles.taskProgress}>
                    {todayTasks.completedTasks}/{todayTasks.totalTasks}
                  </Text>
                </View>
                <View style={styles.taskGrid}>
                  <TaskItem label="新手語" isDone={todayTasks.tasks.learn} />
                  <TaskItem label="複習" isDone={todayTasks.tasks.review} />
                  <TaskItem label="測驗" isDone={todayTasks.tasks.quiz} />
                </View>
              </>
            )}
          </View>
        )}

        {/* 主要學習卡片 - 簡化版 */}
        <Card style={styles.mainCard} mode="contained">
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            style={styles.cardGradient}
          >
            {loadingProgress ? (
              <ActivityIndicator color="#fff" style={{ paddingVertical: 40 }} />
            ) : (
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {userProgress.isNewUser
                    ? "開始你的學習之旅"
                    : `繼續「${userProgress.lastLesson.title}」`}
                </Text>
                {!userProgress.isNewUser && (
                  <>
                    <Text style={styles.cardSubtitle}>
                      第 {userProgress.lastLesson.volume} 冊 • 第{" "}
                      {userProgress.lastLesson.lesson} 單元
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.round(
                                userProgress.progress * 100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(userProgress.progress * 100)}%
                      </Text>
                    </View>
                  </>
                )}
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    if (userProgress.isNewUser) {
                      router.navigate("(tabs)/education", {
                        screen: "teach-screen",
                        params: { volume: 1, lesson: 1 },
                      });
                    } else {
                      router.navigate("(tabs)/education", {
                        screen: "teach-screen",
                        params: {
                          volume: userProgress.lastLesson.volume,
                          lesson: userProgress.lastLesson.lesson,
                        },
                      });
                    }
                  }}
                >
                  <Text style={styles.continueText}>
                    {userProgress.isNewUser ? "開始學習" : "繼續學習"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#6366F1" />
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Card>

        {/* 快速功能 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🧭 快速功能</Text>
        </View>
        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickCard, styles.quickPrimary]}
            onPress={() => router.push("/(tabs)/translation")}
          >
            <Ionicons
              name="camera"
              size={24}
              color="#1E40AF"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.quickTitle}>即時翻譯</Text>
            <Text style={styles.quickDesc}>手語 ↔ 文字 / 語音</Text>
            <Button
              mode="contained"
              buttonColor="#1E40AF"
              style={styles.quickBtn}
              labelStyle={{ fontSize: 13 }}
            >
              開啟
            </Button>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickCard, styles.quickOutline]}
            onPress={() => router.push("/(tabs)/education/quiz")}
          >
            <Ionicons
              name="school"
              size={24}
              color="#000"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.quickTitle}>練習測驗</Text>
            <Text style={styles.quickDesc}>測試已學內容掌握度</Text>
            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={[styles.quickBtn, styles.blackButton]}
              labelStyle={{ fontSize: 13 }}
            >
              開始
            </Button>
          </TouchableOpacity>
        </View>

        {/* 推薦課程 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>
            {personalizedRecs.length > 0 && personalizedRecs[0].type
              ? "🎯 為你推薦"
              : "📖 推薦課程"}
          </Text>
        </View>

        {loadingRecs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>載入推薦內容...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendScrollContent}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={240}
          >
            {personalizedRecs.map((item, index) => (
              <RecommendCard
                key={item.id || `rec-${index}`}
                item={item}
                onPress={() => handleRecommendationPress(item)}
                isPersonalized={!!item.type}
              />
            ))}
          </ScrollView>
        )}

        {/* 每日一句 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>✍️ 每日一句</Text>
        </View>
        <Card style={[styles.flatCard, styles.dailyCard]} mode="contained">
          <Card.Content style={styles.dailyContent}>
            {loadingDailySign ? (
              <View style={styles.dailyLoadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.dailyLoadingText}>載入每日一句...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.dailyWord}>
                  {dailySign?.chinese ||
                    dailySign?.word ||
                    defaultDailySign.chinese}
                </Text>
                <DailySignImage dailySign={dailySign || defaultDailySign} />
                <Button
                  compact
                  mode="text"
                  textColor="#6366F1"
                  onPress={() => {
                    const wordToLearn =
                      dailySign?.word ||
                      dailySign?.chinese ||
                      defaultDailySign.word;
                    router.push({
                      pathname: "/(tabs)/education/word-learning",
                      params: { word: wordToLearn },
                    });
                  }}
                  style={{ marginTop: 6 }}
                  labelStyle={{ fontSize: 13, fontWeight: "600" }}
                >
                  學習這個手語
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* 學習統計 - 改進版 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>📊 學習統計</Text>
        </View>
        <Card
          style={[styles.flatCard, styles.progressCardLite]}
          mode="contained"
        >
          <Card.Content style={styles.progressLiteContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{mockUserData.streakDays}</Text>
                <Text style={styles.statLabel}>連續天數</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {mockUserData.weeklyCompleted}
                </Text>
                <Text style={styles.statLabel}>本週完成</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round(mockUserData.progress * 100)}%
                </Text>
                <Text style={styles.statLabel}>整體進度</Text>
              </View>
            </View>

            <View style={styles.progressBarWrap}>
              <Text style={styles.progressLabel}>本週目標進度</Text>
              <View style={styles.weeklyProgressTrack}>
                <View
                  style={[
                    styles.weeklyProgressFill,
                    {
                      width: `${Math.round(
                        (mockUserData.weeklyCompleted /
                          mockUserData.weeklyTarget) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressTextBottom}>
                {mockUserData.weeklyCompleted}/{mockUserData.weeklyTarget} 課程
              </Text>
            </View>

            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={styles.progressActionBtn}
              labelStyle={{ fontSize: 13, fontWeight: "600" }}
              onPress={() => router.push("/education/word-learning/progress")}
            >
              查看詳細統計
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* AI Chatbot 浮動按鈕 - 始終顯示 */}
      <FloatingAIButton
        onPress={() => setShowChatbot(true)}
        bottom={tabBarHeight + 20}
      />

      {/* AI Chatbot 對話視窗 */}
      <AIChatbot
        visible={showChatbot}
        onClose={() => setShowChatbot(false)}
        userContext={{
          userName: user?.firstName || mockUserData.name,
          streakDays: mockUserData.streakDays,
          progress: userProgress.progress,
          lastLesson: userProgress.lastLesson,
          isNewUser: userProgress.isNewUser,
        }}
      />
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 簡化的歡迎區
  welcomeSection: {
    marginBottom: 24,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
  },
  streakBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
  },

  // 今日任務 - 簡化版
  todaySection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  taskProgress: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4F46E5",
  },
  taskGrid: {
    flexDirection: "row",
    gap: 12,
  },
  taskItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  taskDone: {
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  taskPending: {
    borderLeftWidth: 3,
    borderLeftColor: "#E5E7EB",
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },

  // 主卡片 - 重新設計
  mainCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    minWidth: 35,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366F1",
  },

  // 區塊標題
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
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

  // 快速功能 - 簡化
  quickRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickPrimary: {
    borderColor: "#6366F1",
    backgroundColor: "#F8FAFF",
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 4,
  },
  quickDesc: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  quickBtn: {
    borderRadius: 10,
    minWidth: 70,
    height: 36,
  },

  // 載入狀態
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  // 推薦內容
  recommendScrollContent: {
    paddingRight: 16,
    paddingVertical: 4,
  },

  // 每日一句
  flatCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  dailyCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dailyContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  dailyLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  dailyLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  dailyWord: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1F2937",
  },
  gif: {
    width: 250,
    height: 250,
    borderRadius: 15,
  },
  dailyImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  dailyImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  imageLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 8,
  },

  // 學習統計 - 簡化
  progressCardLite: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressLiteContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366F1",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  progressBarWrap: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  weeklyProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  weeklyProgressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 4,
  },
  progressTextBottom: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "right",
  },
  progressActionBtn: {
    borderRadius: 12,
    backgroundColor: "#1F2937",
  },

  // 推薦卡片
  recOuter: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  recImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  recImage: {
    width: "100%",
    height: "100%",
  },
  recOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 8,
    justifyContent: "flex-end",
  },
  recTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  recBody: {
    padding: 12,
  },
  recDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 8,
  },
  recLinkBtn: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F8FAFF",
  },
  personalizedCard: {
    borderColor: "#6366F1",
    backgroundColor: "#F8FAFF",
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // 舊樣式保留（暫時）
  blackButton: {
    backgroundColor: "#1F2937",
  },
});

// 將 TaskItem 提取為獨立組件
function TaskItem({ label, isDone }) {
  return (
    <View
      style={[styles.taskItem, isDone ? styles.taskDone : styles.taskPending]}
    >
      <Ionicons
        name={isDone ? "checkmark" : "ellipse-outline"}
        size={16}
        color={isDone ? "#4CAF50" : "#9CA3AF"}
      />
      <Text style={[styles.taskLabel, !isDone && { color: "#9CA3AF" }]}>
        {label}
      </Text>
    </View>
  );
}

function RecommendCard({ item, onPress, isPersonalized = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const title = item.title;
  const description = item.description;
  const imageUrl = item.image || item.image_url;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.recOuter, isPersonalized && styles.personalizedCard]}
    >
      <View style={styles.recImageWrap}>
        {error || !imageUrl ? (
          <View style={styles.placeholderImage}>
            <Ionicons
              name={
                item.type === "vocabulary"
                  ? "book"
                  : item.type === "material"
                  ? "school"
                  : "apps"
              }
              size={32}
              color="#666"
            />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.recImage}
            resizeMode="cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={styles.recOverlay}
        >
          <Text style={styles.recTitle} numberOfLines={1}>
            {title}
          </Text>
        </LinearGradient>
      </View>
      <View style={styles.recBody}>
        <Text style={styles.recDesc} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.recLinkBtn}>
          {isPersonalized ? "開始學習" : "查看"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// 每日手語圖片組件 - 支持資料庫圖片
function DailySignImage({ dailySign }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 檢查是否有圖片 URL
  const imageUrl = dailySign?.image || dailySign?.gif || dailySign?.imageUrl;

  return (
    <View style={styles.dailyImageContainer}>
      {!imageUrl || imageError ? (
        // 沒有圖片或載入失敗時顯示圖標
        <View style={styles.dailyImagePlaceholder}>
          <Ionicons name="hand-right" size={40} color="#6366F1" />
          <Text style={styles.placeholderText}>
            {dailySign?.category || "手語圖示"}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.gif}
          resizeMode="contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
            console.log("❌ 每日一句圖片載入失敗:", imageUrl);
          }}
        />
      )}
      {isLoading && imageUrl && !imageError && (
        <View style={styles.imageLoading}>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      )}
    </View>
  );
}

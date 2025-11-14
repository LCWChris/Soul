import AIChatbot from "@/components/AIChatbot";
import FloatingAIButton from "@/components/FloatingAIButton";
import { API_CONFIG } from "@/constants/api";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
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
  const [dailySignFavorited, setDailySignFavorited] = useState(false);
  const [refreshingDaily, setRefreshingDaily] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Swiper動畫值
  const swipeAnimation = new Animated.Value(0);
  const opacityAnimation = new Animated.Value(1);

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

  // 連續天數狀態
  const [streakDays, setStreakDays] = useState(0);
  const [loadingStreak, setLoadingStreak] = useState(true);

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

  // 載入數據 - 初次載入
  useEffect(() => {
    if (user) {
      loadDailySign();
      loadTodayTasks();
      loadUserProgress();
      loadStreakDays();
    }
  }, [user]);

  // 每次進入主頁都重新載入推薦內容
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log("🔄 進入主頁，重新載入推薦內容");
        loadPersonalizedRecommendations();
      }
    }, [user])
  );

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
        `${API_CONFIG.BASE_URL}/api/recommendations/personalized/${user.id}?limit=8`,
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
  const loadDailySign = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingDailySign(true);
      }

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
        // 處理 category，確保是有效字符串
        let categoryText = "日常生活";
        if (data.category) {
          let category = data.category;

          // 如果是 JSON 字符串格式的數組，先解析
          if (typeof category === "string" && category.startsWith("[")) {
            try {
              category = JSON.parse(category);
            } catch (e) {
              // 解析失敗，保持原值
            }
          }

          if (Array.isArray(category)) {
            // 遍歷數組找到第一個有效分類
            for (const cat of category) {
              if (cat && typeof cat === "string") {
                const trimmed = cat.trim();
                if (
                  trimmed.length > 1 &&
                  !["[", "]", "{", "}", ",", ".", ";"].includes(trimmed) &&
                  trimmed !== ","
                ) {
                  categoryText = trimmed;
                  break;
                }
              }
            }
          } else if (typeof category === "string") {
            // 過濾掉無效的分類名稱
            const trimmed = category.trim();
            if (
              trimmed &&
              trimmed.length > 1 &&
              !["[", "]", "{", "}", ","].includes(trimmed)
            ) {
              categoryText = trimmed;
            }
          }
        }
        console.log("📂 分類資訊:", data.category, "→", categoryText);

        setDailySign({
          word: data.word,
          chinese: data.chinese || data.word,
          image: data.image || data.gif || data.imageUrl,
          description: data.description,
          category: categoryText,
        });
        setDailySignFavorited(false);
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
      if (!silent) {
        setLoadingDailySign(false);
      }
    }
  };

  const refreshDailySign = async (isSwipe = false) => {
    if (isSwipe) {
      // 滑動觸發的刷新，靜默載入（不改變 loading 狀態）
      await loadDailySign(true);
    } else {
      // 按鈕觸發的刷新，顯示 loading
      setRefreshingDaily(true);
      await loadDailySign(false);
      setTimeout(() => setRefreshingDaily(false), 300);
    }
  };

  const toggleDailySignFavorite = () => {
    const newState = !dailySignFavorited;
    setDailySignFavorited(newState);

    // 添加簡單的觸覺反饋（如果支持）
    if (newState) {
      // 收藏時的動畫效果可以在這裡添加
      console.log("❤️ 已收藏:", dailySign?.word);
    }
    // TODO: 實際保存到後端
  };

  // PanResponder處理滑動 - 優化：只在水平滑動時攔截手勢
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false, // 不在開始時攔截
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // 只有當水平滑動距離明顯大於垂直滑動時才攔截（避免影響垂直滾動）
      const isHorizontalSwipe =
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      const isSufficientDistance = Math.abs(gestureState.dx) > 20;
      return (
        !loadingDailySign &&
        !refreshingDaily &&
        isHorizontalSwipe &&
        isSufficientDistance
      );
    },
    onPanResponderMove: (_, gestureState) => {
      swipeAnimation.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      // 滑動超過100px就觸發換一個
      if (Math.abs(gestureState.dx) > 100) {
        // 滑動出去的動畫
        Animated.parallel([
          Animated.timing(swipeAnimation, {
            toValue: gestureState.dx > 0 ? 500 : -500,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(async () => {
          // 先載入新的每日一句（不改變 loading 狀態）
          await refreshDailySign(true);
          // 立即重置位置和透明度，準備淡入
          swipeAnimation.setValue(0);
          opacityAnimation.setValue(0);
          // 淡入動畫
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      } else {
        // 回彈動畫
        Animated.spring(swipeAnimation, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      }
    },
  });

  const loadStreakDays = async () => {
    if (!user?.id) {
      console.log("📍 用戶未登入，無法載入連續天數");
      setLoadingStreak(false);
      return;
    }
    try {
      setLoadingStreak(true);
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
      console.log("✅ 成功載入連續天數:", data.streak);
      setStreakDays(data.streak || 0);
    } catch (error) {
      console.error("❌ 載入連續天數失敗:", error);
      setStreakDays(0);
    } finally {
      setLoadingStreak(false);
    }
  };

  const handleRecommendationPress = (recommendation) => {
    console.log("🔘 點擊推薦:", recommendation);
    const { action, id } = recommendation;

    // 優先處理 action 導航
    if (action && action.type === "navigate") {
      console.log("📍 使用 action 導航:", action.route, action.params);
      if (action.params) {
        router.navigate({
          pathname: action.route,
          params: action.params,
        });
      } else {
        router.navigate(action.route);
      }
    }
    // 處理主題分類推薦（例如：日常對話、餐廳用語等）
    else if (recommendation.category) {
      console.log("📚 跳轉到單字學習 - 分類:", recommendation.category);
      router.navigate({
        pathname: "/(tabs)/education/word-learning",
        params: { category: recommendation.category },
      });
    }
    // 處理 ID 為純數字的預設推薦（fallback）
    else if (id && typeof id === "number") {
      console.log("📖 預設推薦，跳轉到單字學習");
      router.navigate("/(tabs)/education/word-learning");
    } else {
      console.log("⚠️ 未知的推薦格式，預設跳轉到教育頁面", recommendation);
      router.navigate("/(tabs)/education");
    }
  };

  // 模擬推薦課程資料 - category 必須與資料庫中的分類名稱一致
  const recommendedList = [
    {
      id: 1,
      title: "日常用語",
      category: "日常用語", // 與資料庫分類一致
      image:
        "https://www.shutterstock.com/image-vector/students-sitting-having-conversation-600nw-2584238303.jpg",
      description: "學習常見日常手勢，提升表達流暢度",
    },
    {
      id: 2,
      title: "餐廳用語",
      category: "餐廳", // 與資料庫分類一致
      image:
        "https://static.vecteezy.com/system/resources/previews/047/553/671/non_2x/a-yellow-and-red-building-with-a-red-awning-and-a-black-door-vector.jpg",
      description: "掌握餐廳常用手語，點餐更方便",
    },
    {
      id: 3,
      title: "交通出行",
      category: "交通", // 與資料庫分類一致
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
          <Image
            source={require("@/assets/images/auth-bh-2.png")}
            style={styles.welcomeImage}
          />
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              👋 嗨，{user?.firstName || mockUserData.name}
            </Text>
            {!loadingStreak && streakDays > 0 && (
              <View
                style={[
                  styles.streakBadge,
                  streakDays >= 30 && styles.streakBadgeLegendary,
                  streakDays >= 7 &&
                    streakDays < 30 &&
                    styles.streakBadgeAmazing,
                ]}
              >
                <Text style={styles.streakText}>
                  {streakDays >= 30 ? "🏆" : streakDays >= 7 ? "⭐" : "🔥"}{" "}
                  {streakDays}
                </Text>
                <Text style={styles.streakLabel}>天連續</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>一手學手語、雙手說世界。</Text>
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
                      router.navigate({
                        pathname:
                          "/(tabs)/education/teach/[volumeId]/[lessonId]",
                        params: { volumeId: "1", lessonId: "1" },
                      });
                    } else {
                      router.navigate({
                        pathname:
                          "/(tabs)/education/teach/[volumeId]/[lessonId]",
                        params: {
                          volumeId: userProgress.lastLesson.volume.toString(),
                          lessonId: userProgress.lastLesson.lesson.toString(),
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

        {/* 每日一句 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>✍️ 每日一句</Text>
          <TouchableOpacity
            onPress={refreshDailySign}
            style={styles.refreshBtn}
            disabled={loadingDailySign || refreshingDaily}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#6366F1"
              style={{
                transform: [{ rotate: refreshingDaily ? "360deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        </View>
        {loadingDailySign ? (
          <Card style={[styles.flatCard, styles.dailyCard]} mode="contained">
            <Card.Content style={styles.dailyContent}>
              <View style={styles.dailyLoadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.dailyLoadingText}>載入每日一句...</Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              {
                transform: [
                  { translateX: swipeAnimation },
                  {
                    rotate: swipeAnimation.interpolate({
                      inputRange: [-200, 0, 200],
                      outputRange: ["-10deg", "0deg", "10deg"],
                    }),
                  },
                ],
                opacity: opacityAnimation,
              },
            ]}
          >
            <Card style={[styles.flatCard, styles.dailyCard]} mode="contained">
              <Card.Content style={styles.dailyContent}>
                {/* 滑動提示 - 永久顯示 */}
                <View style={styles.swipeHintContainer}>
                  <Ionicons name="chevron-back" size={20} color="#6366F1" />
                  <Text style={styles.swipeHintText}>左右滑動換一個</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                </View>

                {/* 標籤和收藏區 */}
                <View style={styles.dailyHeader}>
                  <View style={styles.dailyTagsRow}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>🌟 初級</Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {dailySign?.category || "日常生活"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={toggleDailySignFavorite}
                    style={styles.favoriteBtn}
                  >
                    <Ionicons
                      name={dailySignFavorited ? "heart" : "heart-outline"}
                      size={24}
                      color={dailySignFavorited ? "#EF4444" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>

                {/* 主要內容 */}
                <Text style={styles.dailyWord}>
                  {dailySign?.chinese ||
                    dailySign?.word ||
                    defaultDailySign.chinese}
                </Text>

                {/* 使用情境說明 */}
                <Text style={styles.dailyContext}>
                  💬 常用於日常交流、社交場合
                </Text>

                <DailySignImage dailySign={dailySign || defaultDailySign} />

                {/* 學習按鈕 */}
                <Button
                  mode="contained"
                  buttonColor="#6366F1"
                  style={styles.dailyPrimaryBtn}
                  labelStyle={{ fontSize: 14, fontWeight: "700" }}
                  onPress={() => {
                    const wordToLearn =
                      dailySign?.word ||
                      dailySign?.chinese ||
                      defaultDailySign.word;
                    router.navigate({
                      pathname: "/(tabs)/education/word-learning",
                      params: { word: wordToLearn },
                    });
                  }}
                >
                  📚 學習這個手語
                </Button>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* 快速功能 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🧭 快速功能</Text>
        </View>
        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.quickCard, styles.quickPrimary]}
            onPress={() => router.navigate("/(tabs)/translation")}
          >
            <View style={styles.quickIconWrapper}>
              <LinearGradient
                colors={["#6366F1", "#4F46E5"]}
                style={styles.quickIconBg}
              >
                <Ionicons name="camera" size={32} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.quickTitle}>手語翻譯</Text>
            <Text style={styles.quickDesc}>即時辨識手語動作</Text>
            <View style={styles.quickBadge}>
              <Text style={styles.quickBadgeText}>📸 需要相機</Text>
            </View>
            <Button
              mode="contained"
              buttonColor="#6366F1"
              style={styles.quickBtn}
              labelStyle={{ fontSize: 14, fontWeight: "700" }}
            >
              開啟翻譯
            </Button>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.quickCard, styles.quickSecondary]}
            onPress={() => {
              const volumeId = userProgress.isNewUser
                ? 1
                : userProgress.lastLesson.volume;
              const lessonId = 1; // 預設從第一課開始測驗
              router.navigate({
                pathname: "/(tabs)/education",
                params: {
                  navigateTo: "quiz",
                  volumeId: volumeId,
                  lessonId: lessonId,
                },
              });
            }}
          >
            <View style={styles.quickIconWrapper}>
              <LinearGradient
                colors={["#1F2937", "#111827"]}
                style={styles.quickIconBg}
              >
                <Ionicons name="school" size={32} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.quickTitle}>練習測驗</Text>
            <Text style={styles.quickDesc}>檢測學習成果</Text>
            <View style={styles.quickBadge}>
              <Text style={styles.quickBadgeText}>📝 智能出題</Text>
            </View>
            <Button
              mode="contained"
              buttonColor="#1F2937"
              textColor="#fff"
              style={[styles.quickBtn, styles.blackButton]}
              labelStyle={{ fontSize: 14, fontWeight: "700" }}
            >
              開始測驗
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
                <Text style={styles.statNumber}>
                  {todayTasks.completedTasks || 0}
                </Text>
                <Text style={styles.statLabel}>今日完成</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userProgress.lastLesson?.volume || 1}
                </Text>
                <Text style={styles.statLabel}>當前冊數</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round((userProgress.progress || 0) * 100)}%
                </Text>
                <Text style={styles.statLabel}>學習進度</Text>
              </View>
            </View>

            <View style={styles.progressBarWrap}>
              <Text style={styles.progressLabel}>本日任務進度</Text>
              <View style={styles.weeklyProgressTrack}>
                <View
                  style={[
                    styles.weeklyProgressFill,
                    {
                      width: `${Math.round(
                        (todayTasks.completedTasks / todayTasks.totalTasks) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressTextBottom}>
                {todayTasks.completedTasks}/{todayTasks.totalTasks} 任務
              </Text>
            </View>

            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={styles.progressActionBtn}
              labelStyle={{ fontSize: 13, fontWeight: "600" }}
              onPress={() =>
                router.navigate("/(tabs)/education/word-learning/progress")
              }
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
    alignItems: "center", // Center the image
  },
  welcomeImage: {
    width: "90%",
    height: 200,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  streakText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400E",
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  streakBadgeAmazing: {
    backgroundColor: "#DBEAFE",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  streakBadgeLegendary: {
    backgroundColor: "#FEE2E2",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  subtitle: {
    fontSize: 15,
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
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: "auto",
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
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 240,
    justifyContent: "space-between",
  },
  quickPrimary: {
    borderColor: "#6366F1",
    backgroundColor: "#FAFBFF",
  },
  quickSecondary: {
    borderColor: "#374151",
    backgroundColor: "#F9FAFB",
  },
  quickIconWrapper: {
    marginBottom: 12,
  },
  quickIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 4,
  },
  quickDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  quickBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickBadgeText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  quickBtn: {
    borderRadius: 12,
    minWidth: "100%",
    height: 44,
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
    borderWidth: 2,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dailyContent: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  dailyHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dailyTagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  categoryBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730A3",
  },
  favoriteBtn: {
    padding: 4,
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1F2937",
    textAlign: "center",
  },
  dailyContext: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  swipeContainer: {
    width: "100%",
    alignItems: "center",
  },
  swipeHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
  },
  dailyPrimaryBtn: {
    borderRadius: 12,
    height: 48,
    width: "100%",
    marginTop: 16,
  },
  gif: {
    width: 280,
    height: 280,
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
    width: 240,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recImageWrap: {
    width: "100%",
    height: 140,
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
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
  recTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recBody: {
    padding: 16,
    minHeight: 100,
    justifyContent: "space-between",
  },
  recDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },
  recLinkBtn: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  recLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
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

function RecommendCard({ item, onPress }) {
  const [error, setError] = useState(false);

  // --- New: Define styles for different recommendation types ---
  const getRecommendationStyle = (item) => {
    const id = item.id?.toString() || "";
    if (id.startsWith("continue")) {
      return {
        icon: "bookmark",
        color: "#2563EB", // Blue
        backgroundColor: "#EFF6FF",
        label: "繼續",
      };
    }
    if (id.startsWith("review")) {
      return {
        icon: "refresh",
        color: "#16A34A", // Green
        backgroundColor: "#F0FDF4",
        label: "複習",
      };
    }
    if (id.startsWith("learn")) {
      return {
        icon: "flame",
        color: "#EA580C", // Orange
        backgroundColor: "#FFF7ED",
        label: "挑戰",
      };
    }
    // Fallback for general topics
    return {
      icon: "compass",
      color: "#7C3AED", // Purple
      backgroundColor: "#F5F3FF",
      label: "探索",
    };
  };

  const styleInfo = getRecommendationStyle(item);
  const imageUrl = item.image || item.image_url;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.recOuter,
        {
          backgroundColor: styleInfo.backgroundColor,
          borderColor: styleInfo.color,
        },
      ]}
    >
      <View style={styles.recImageWrap}>
        {error || !imageUrl ? (
          <View style={styles.placeholderImage}>
            <Ionicons name={styleInfo.icon} size={40} color={styleInfo.color} />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.recImage}
            resizeMode="cover"
            onError={() => setError(true)}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
          style={styles.recOverlay}
        >
          <Text style={styles.recTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </LinearGradient>
      </View>
      <View style={styles.recBody}>
        <Text style={styles.recDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={[styles.recLinkBtn, { backgroundColor: styleInfo.color }]}>
          <Text style={styles.recLinkText}>{styleInfo.label}</Text>
        </View>
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

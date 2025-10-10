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
import { Button, Card, ProgressBar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight(); // 新增
  const { user } = useUser(); // 新增用戶資訊

  // 個人化推薦狀態
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // 模擬用戶數據
  const mockUserData = {
    name: "仕彥",
    lastLesson: { volume: 4, unit: 2, title: "學校生活" },
    progress: 0.45,
    weeklyTarget: 20,
    weeklyCompleted: 9,
  };

  // 載入個人化推薦
  useEffect(() => {
    loadPersonalizedRecommendations();
  }, [user]);

  const loadPersonalizedRecommendations = async () => {
    if (!user?.id) {
      console.log('📍 用戶未登入，使用預設推薦');
      setPersonalizedRecs(recommendedList);
      setLoadingRecs(false);
      return;
    }

    try {
      setLoadingRecs(true);
      
      // 檢查 API 配置是否存在
      if (!API_CONFIG.BASE_URL) {
        console.warn('⚠️ API_CONFIG.BASE_URL 未設定，使用預設推薦');
        setPersonalizedRecs(recommendedList);
        return;
      }

      console.log(`🌐 正在請求個人化推薦: ${API_CONFIG.BASE_URL}/api/recommendations/personalized/${user.id}`);
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/recommendations/personalized/${user.id}?limit=4`,
        {
          headers: { 
            "ngrok-skip-browser-warning": "true",
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          timeout: 5000, // 5秒超時
        }
      );

      // 檢查響應是否成功
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 檢查 Content-Type 是否為 JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ API 返回非 JSON 內容，可能是伺服器錯誤頁面');
        setPersonalizedRecs(recommendedList);
        return;
      }

      const data = await response.json();
      console.log('✅ 成功載入個人化推薦:', data);
      
      if (data.recommendations && data.recommendations.length > 0) {
        setPersonalizedRecs(data.recommendations);
        console.log(`🎯 載入了 ${data.recommendations.length} 個個人化推薦`);
      } else {
        console.log('📋 沒有個人化推薦，使用預設推薦');
        setPersonalizedRecs(recommendedList);
      }
    } catch (error) {
      console.error("❌ 載入個人化推薦失敗:", error.message);
      
      // 根據錯誤類型提供不同的處理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('🔌 網路連線問題，使用預設推薦');
      } else if (error.name === 'SyntaxError') {
        console.warn('📄 伺服器返回非 JSON 格式，可能是錯誤頁面');
      } else {
        console.warn('🔄 未知錯誤，使用預設推薦');
      }
      
      // 使用現有的靜態推薦作為後備
      setPersonalizedRecs(recommendedList);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleRecommendationPress = (recommendation) => {
    if (recommendation.action) {
      const { action } = recommendation;
      if (action.type === "navigate") {
        if (action.params && Object.keys(action.params).length > 0) {
          router.push({
            pathname: action.route,
            params: action.params,
          });
        } else {
          router.push(action.route);
        }
      }
    } else {
      // 原有的靜態推薦處理
      router.push("/education/teach-screen");
    }
  };

  // 模擬推薦課程資料
  const recommendedList = [
    {
      id: 1,
      title: "日常對話",
      image:
        "https://www.shutterstock.com/image-vector/students-sitting-having-conversation-600nw-2584238303.jpg",
      description: "學習常見日常手勢，提升表達流暢度",
    },
    {
      id: 2,
      title: "餐廳用語",
      image:
        "https://static.vecteezy.com/system/resources/previews/047/553/671/non_2x/a-yellow-and-red-building-with-a-red-awning-and-a-black-door-vector.jpg",
      description: "掌握餐廳常用手語，點餐更方便",
    },
    {
      id: 3,
      title: "交通出行",
      image:
        "https://goldcard.nat.gov.tw/cms-uploads/public-transportation-getting-around-taiwan.jpg",
      description: "學會出行相關手語，問路搭車更輕鬆",
    },
  ];

  const signOfTheDay = {
    word: "謝謝 (Thank you)",
    gif: "https://png.pngtree.com/element_our/20190602/ourlarge/pngtree-sign-language-thank-you-gesture-image_1419966.jpg",
  };

  return (
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + tabBarHeight + 32, // 動態底部距
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      >
        {/* Header 歡迎 + Hero 區 */}
        <Image
          source={require("@/assets/images/hero.png")}
          resizeMode="contain"
          style={styles.headerImage}
        />
        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting}>
            👋 Hi，{user?.firstName || mockUserData.name}
          </Text>
          <Text style={styles.subtitleMuted}>今天再學一點點，就更接近目標</Text>
        </View>

        <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              繼續「{mockUserData.lastLesson.title}」
            </Text>
            <Text style={styles.heroSub}>
              上次：第 {mockUserData.lastLesson.volume} 冊 第{" "}
              {mockUserData.lastLesson.unit} 單元
            </Text>

            {/* 進度條重構 */}
            <View style={styles.progressBlock}>
              <ProgressBar
                progress={mockUserData.progress}
                color="#fff"
                style={styles.heroProgress}
              />
              <Text style={styles.heroProgressPercent}>
                {Math.round(mockUserData.progress * 100)}%
              </Text>
            </View>

            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={[styles.ctaButton, styles.blackButton]}
              onPress={() =>
                router.push(
                  `/education/teach/${mockUserData.lastLesson.volume}/${mockUserData.lastLesson.unit}`
                )
              }
            >
              繼續學習
            </Button>
          </View>
        </LinearGradient>

        {/* 快速功能 - 卡片整塊可點 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🧭 快速功能</Text>
        </View>
        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickCard, styles.quickPrimary]}
            onPress={() => router.push("/translation")}
          >
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
            onPress={() => router.push("/practice")}
          >
            <Text style={styles.quickTitle}>練習模式</Text>
            <Text style={styles.quickDesc}>專注複習已學內容</Text>
            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={[styles.quickBtn, styles.blackButton]}
              labelStyle={{ fontSize: 13 }}
            >
              進入
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
            snapToInterval={240} // 220 寬 + 20 邊距
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
            <Text style={styles.dailyWord}>{signOfTheDay.word}</Text>
            <Image source={{ uri: signOfTheDay.gif }} style={styles.gif} />
            <Button
              compact
              mode="text"
              textColor="#1D4ED8"
              onPress={() => {}}
              style={{ marginTop: 6 }}
              labelStyle={{ fontSize: 13, fontWeight: "600" }}
            >
              更多例句
            </Button>
          </Card.Content>
        </Card>

        {/* 學習進度 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🏫 學習進度</Text>
        </View>
        <Card
          style={[styles.flatCard, styles.progressCardLite]}
          mode="contained"
        >
          <Card.Content style={styles.progressLiteContent}>
            <View style={styles.progressTopRow}>
              <Text style={styles.progressTitle}>本週完成度</Text>
              <Text style={styles.progressSub}>
                {mockUserData.weeklyCompleted}/{mockUserData.weeklyTarget}
              </Text>
            </View>

            <View style={styles.progressBarWrap}>
              <ProgressBar
                progress={mockUserData.progress}
                color="#1D4ED8"
                style={styles.progressBarLite}
              />
            </View>

            <View style={styles.progressBottomRow}>
              <Text style={styles.progressPercentLite}>
                {Math.round(mockUserData.progress * 100)}%
              </Text>
              <Button
                mode="contained"
                buttonColor="#000"
                textColor="#fff"
                style={styles.progressActionBtn}
                labelStyle={{ fontSize: 13, fontWeight: "600" }}
                onPress={() => router.push("/stats")}
              >
                查看詳細
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerImage: {
    width: width * 0.8,
    height: width * 0.8,
    maxHeight: 280,
    alignSelf: "center",
  },
  headerTextWrap: {
    marginVertical: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  subtitleMuted: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    overflow: "hidden",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginBottom: 12,
  },
  progressBlock: {
    marginBottom: 12,
    position: "relative",
  },
  heroProgress: {
    width: "100%",
    height: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroProgressPercent: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -8 }],
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: "#2563EB",
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#F1F5F9",
  },
  quickPrimary: {
    backgroundColor: "#EEF2FF",
  },
  quickOutline: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  quickBtn: {
    marginTop: 14,
    borderRadius: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  recommendScrollContent: {
    paddingRight: 16,
    paddingVertical: 4,
  },
  personalizedCard: {
    borderWidth: 2,
    borderColor: "#3b82f6",
    backgroundColor: "#f8faff",
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  recSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  recOuter: {
    width: 220,
    marginRight: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  recImageWrap: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  recImage: {
    width: "100%",
    height: "100%",
  },
  recSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
  },
  recErrorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recErrorText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  recOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 24,
    paddingBottom: 6,
    justifyContent: "flex-end",
  },
  recTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  recBody: {
    paddingHorizontal: 12,
    paddingTop: 8,
    minHeight: 70,
  },
  recLinkBtn: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },

  recDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 6, // 只留一點間距
  },

  recLink: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#EEF2FF", // 小圓角背景更像按鈕
    overflow: "hidden",
  },

  /* Daily card 調淡，移除邊框 */
  dailyCard: {
    backgroundColor: "#F3F8FF",
  },
  dailyContent: {
    alignItems: "center",
    paddingVertical: 14,
  },
  dailyWord: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1E3A8A",
  },

  /* 進度卡（淺藍） */
  progressCardLite: {
    backgroundColor: "#E4EDFF",
  },
  progressLiteContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  progressSub: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  progressBarWrap: {
    marginBottom: 14,
  },
  progressBarLite: {
    height: 12,
    borderRadius: 8,
    backgroundColor: "#C7DAFF",
  },
  progressBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressPercentLite: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  progressActionBtn: {
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: "center",
  },
});

function RecommendCard({ item, onPress, isPersonalized = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // 處理個人化推薦和原始推薦的不同結構
  const title = item.title;
  const subtitle = item.subtitle || "";
  const description = item.description;
  const imageUrl =
    item.image ||
    (item.image_url ? item.image_url.replace(".gif", ".png") : null);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.recOuter, isPersonalized && styles.personalizedCard]}
    >
      <View style={styles.recImageWrap}>
        {!loaded && !error && <View style={styles.recSkeleton} />}
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
          {subtitle && (
            <Text style={styles.recSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
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

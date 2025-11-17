import { API_CONFIG } from "@/constants/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLACEHOLDER =
  "https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87";

const { width: screenWidth } = Dimensions.get("window");
const PAGE_HORIZONTAL_PADDING = 20;
// 卡片之間的間距 (marginRight)
const CARD_SPACING = 15;
// 單張卡片的實際顯示寬度
const CARD_WIDTH_DISPLAY = screenWidth - PAGE_HORIZONTAL_PADDING * 2;
// 卡片吸附總寬度 (卡片寬度 + 右邊間距)
const CARD_TOTAL_WIDTH = CARD_WIDTH_DISPLAY + CARD_SPACING;

export default function LessonPage() {
  const { volumeId, lessonId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  // 詞彙狀態
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // 讀教材
  useEffect(() => {
    if (!volumeId || !lessonId) return;

    const loadLessonData = async () => {
      try {
        console.log(
          "📦 進入教材頁面，volumeId:",
          volumeId,
          "lessonId:",
          lessonId
        );
        const res = await axios.get(
          `${API_CONFIG.BASE_URL}/api/material/by-lesson/${volumeId}/${lessonId}`
        );
        setData(res.data);
      } catch (err) {
        console.error("❌ 讀取教材失敗", err);
        setError(true);
      }
    };

    loadLessonData();
  }, [lessonId, volumeId]);

  // 讀詞彙（依教材的 volume + lesson）
  useEffect(() => {
    if (!data) return;
    if (!data.volume || !data.lesson) return;

    const loadWords = async () => {
      try {
        setLoadingWords(true);

        // 🔍 Debug：檢查型別與數值
        console.log("📘 Debug Volume/Lesson:", {
          volume: data.volume,
          lesson: data.lesson,
          volumeType: typeof data.volume,
          lessonType: typeof data.lesson,
        });

        const res = await axios.get(`${API_CONFIG.BASE_URL}/api/book_words`, {
          params: {
            volume: Number(data.volume), // 保險起見轉數字
            lesson: Number(data.lesson),
          },
        });

        console.log("📘 Debug Words 回傳:", res.data);

        setWords(res.data || []);
      } catch (err) {
        console.error("❌ 讀取詞彙失敗", err);
      } finally {
        setLoadingWords(false);
      }
    };

    loadWords();
  }, [data]);

  // 【修正 4】：定義返回函式
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 如果無法回退，導向冊別單元列表頁面
      router.replace(`/education/teach/${volumeId}`);
    }
  };

  const isLoading = !data && !error;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#F0F9FF", "#E0F2FE"]}
        style={styles.gradientBackground}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{data?.unitname || "課程內容"}</Text>
          <View style={{ width: 48 }} />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>無法載入教材資料，請稍後再試。</Text>
          </View>
        )}

        {!isLoading && !error && data && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 封面 */}
            <Image
              source={{ uri: data.image || PLACEHOLDER }}
              style={styles.background}
            />

            <View style={styles.contentContainer}>
              {/* 課文內容卡片 */}
              <View style={styles.contentCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="book" size={24} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>課文內容</Text>
                </View>
                {Array.isArray(data.content) && data.content.length > 0 ? (
                  data.content.map((item, index) => (
                    <View key={index} style={styles.line}>
                      <View style={styles.lineItem}>
                        <Ionicons name="hand-left" size={20} color="#3B82F6" />
                        <Text style={styles.lineText}>
                          {item.sign_text || "無手語內容"}
                        </Text>
                      </View>
                      <View style={styles.lineItem}>
                        <Ionicons name="chatbubble" size={20} color="#8B5CF6" />
                        <Text style={styles.lineText}>
                          {item.spoken_text || "無語音內容"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>⚠️ 此單元尚無內容。</Text>
                )}
              </View>
              {/* ===== 詞彙容器 ===== */}
              <View style={styles.vocabContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="library" size={24} color="#8B5CF6" />
                  <Text style={styles.sectionTitle}>詞彙學習</Text>
                </View>
                {loadingWords && <Text>詞彙載入中...</Text>}
                {!loadingWords && words.length === 0 && (
                  <Text style={styles.emptyText}>⚠️ 此單元尚無詞彙。</Text>
                )}

                {/* 【詞彙 Swiper 邏輯】 */}
                {!loadingWords && words.length > 0 && (
                  <View>
                    {/* 滑動提示 */}
                    <View style={styles.swipeHintContainer}>
                      <Ionicons name="chevron-back" size={20} color="#8B5CF6" />
                      <Text style={styles.swipeHintText}>
                        左右滑動查看更多詞彙
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#8B5CF6"
                      />
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.vocabScrollContent}
                      decelerationRate="fast"
                      snapToAlignment="center"
                      snapToInterval={
                        screenWidth - PAGE_HORIZONTAL_PADDING * 2 - 40 + 16
                      }
                      style={styles.vocabScrollView}
                      onScroll={(event) => {
                        const scrollX = event.nativeEvent.contentOffset.x;
                        const cardWidth =
                          screenWidth - PAGE_HORIZONTAL_PADDING * 2 - 40 + 16;
                        const index = Math.round(scrollX / cardWidth);
                        setCurrentWordIndex(index);
                      }}
                      scrollEventThrottle={16}
                    >
                      {words.map((word, index) => (
                        <View key={index} style={styles.vocabCardSwiper}>
                          <Image
                            source={{ uri: word.image_url || PLACEHOLDER }}
                            style={styles.swiperImage}
                          />
                          <Text style={styles.wordSwiper}>{word.title}</Text>
                          <Text style={styles.meaningSwiper}>
                            第 {word.volume} 冊 · 第 {word.lesson} 單元
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    {/* 分頁指示器 */}
                    <View style={styles.paginationContainer}>
                      {words.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dotStyle,
                            i === currentWordIndex && styles.activeDotStyle,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
              {/* ===== 開始測驗 ===== */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  // 1. 檢查教材資料 (data) 是否已載入
                  //    data.lesson 才是「真實的課數」 (例如 1, 2, 5...)
                  if (!data || data.lesson === undefined) {
                    console.error("錯誤：教材資料尚未載入，無法取得真實課數");
                    return;
                  }

                  // 2. 檢查 'volumeId' (來自 useLocalSearchParams) 是否存在
                  if (!volumeId) {
                    console.error("錯誤：在 URL 中找不到 volumeId");
                    return;
                  }

                  // 3. 取得「真實課數」
                  const realLessonNum = data.lesson; //

                  // 4. 導航到「動態」的測驗路由
                  console.log(
                    `導航到 /education/quiz/${volumeId}/${realLessonNum}`
                  );
                  router.push(`/education/quiz/${volumeId}/${realLessonNum}`);
                }}
                // 5. 【建議】在資料載入完成前，按鈕應為不可點擊狀態
                disabled={!data || data.lesson === undefined}
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.quizBtn}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.quizBtnText}>開始測驗</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

// 樣式定義
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  background: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 16,
    marginHorizontal: PAGE_HORIZONTAL_PADDING,
    marginBottom: 16,
    width: screenWidth - PAGE_HORIZONTAL_PADDING * 2,
  },
  contentContainer: {
    padding: PAGE_HORIZONTAL_PADDING,
  },
  contentCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  line: {
    marginBottom: 16,
    gap: 8,
  },
  lineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lineText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 10,
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  vocabContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  swipeHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  swipeHintText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "500",
  },

  vocabScrollView: {
    marginHorizontal: -20,
  },
  vocabScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // [Swiper 單詞卡片樣式]
  vocabCardSwiper: {
    width: screenWidth - PAGE_HORIZONTAL_PADDING * 2 - 40,
    height: 250,
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  swiperImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
    borderRadius: 12,
    resizeMode: "cover",
  },
  wordSwiper: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  meaningSwiper: {
    fontSize: 16,
    color: "#374151",
  },

  // [分頁圓點樣式]
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  dotStyle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDotStyle: {
    backgroundColor: "#8B5CF6",
    width: 24,
    height: 8,
    borderRadius: 4,
  },

  quizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  quizBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },
});

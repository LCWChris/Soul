import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Dimensions, // <-- 確保引入 Dimensions
} from 'react-native';
import { Card, Text, Button,PaperProvider, MD3LightTheme } from 'react-native-paper';
import ArrowBack from "@/components/ArrowBack";

// 引入 SwiperFlatList
import { SwiperFlatList } from 'react-native-swiper-flatlist'; // <-- 確保引入

const PLACEHOLDER =
  'https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87';

const { width: screenWidth } = Dimensions.get('window');
const PAGE_HORIZONTAL_PADDING = 20; 
// 卡片之間的間距 (marginRight)
const CARD_SPACING = 15; 
// 單張卡片的實際顯示寬度
const CARD_WIDTH_DISPLAY = screenWidth - (PAGE_HORIZONTAL_PADDING * 2); 
// 卡片吸附總寬度 (卡片寬度 + 右邊間距)
const CARD_TOTAL_WIDTH = CARD_WIDTH_DISPLAY + CARD_SPACING; 

export default function LessonPage() {
  const { volumeId, lessonId } = useLocalSearchParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  // 詞彙狀態
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(false);

  // 讀教材
  useEffect(() => {
    if (!lessonId) return;

    const loadLessonData = async () => {
      try {
        console.log('📦 進入教材頁面，volumeId:', volumeId, 'lessonId:', lessonId);
        const res = await axios.get(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAL}/${lessonId}`
        );
        setData(res.data);
      } catch (err) {
        console.error('❌ 讀取教材失敗', err);
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

// ！！！【關鍵修正：將 renderCustomPagination 函式定義在 LessonPage 內部】！！！
// 這樣它就可以被 return 語句內部的 JSX 呼叫，避免語法錯誤。
const renderCustomPagination = (index) => (
  <View style={styles.paginationContainer}>
    {words.map((_, i) => (
      <View
        key={i}
        style={[
          styles.dotStyle,
          i === index.index && styles.activeDotStyle,
        ]}
      />
    ))}
  </View>
);
// ！！！【關鍵修正結束】！！！
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>無法載入教材資料，請稍後再試。</Text>
        </View>
      )}

      {!isLoading && !error && data && (
        <View>
          <ArrowBack onPress={goBack}/>
          {/* 封面 */}
          <Image
            source={{ uri: data.image || PLACEHOLDER }}
            style={styles.background}
          />

          <View style={styles.contentContainer}>
            {/* 單元標題 */}
            <Text style={styles.unit}>{data.unitname}</Text>
            {/* 課文內容 */}
            {Array.isArray(data.content) && data.content.length > 0 ? (
              data.content.map((item, index) => (
                <View key={index} style={styles.line}>
                  <Text style={styles.sign}>✋ {item.sign_text || '無手語內容'}</Text>
                  <Text style={styles.speak}>🗣 {item.spoken_text || '無語音內容'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>⚠️ 此單元尚無內容。</Text>
            )}

            {/* ===== 詞彙容器 ===== */}
            <View style={styles.vocabContainer}>
              <Text style={styles.vocabTitle}>📘 詞彙學習</Text>
              {loadingWords && <Text>詞彙載入中...</Text>}
              {!loadingWords && words.length === 0 && (
                <Text style={styles.emptyText}>⚠️ 此單元尚無詞彙。</Text>
              )}

              {/* 【詞彙 Swiper 邏輯】 */}
              {!loadingWords && words.length > 0 && (
                <SwiperFlatList
                  data={words}
                  contentContainerStyle={styles.swiperContentContainer} 
                  renderItem={({ item: w }) => (
                    <View style={styles.vocabCardSwiper}> 
                      <Image
                        source={{ uri: w.image_url || PLACEHOLDER }}
                        style={styles.swiperImage}
                      />
                      <Text style={styles.wordSwiper}>{w.title}</Text>
                      <Text style={styles.meaningSwiper}>
                        第 {w.volume} 冊 · 第 {w.lesson} 單元
                      </Text>
                    </View>
                  )}
                  index={0}
                  renderPagination={renderCustomPagination}
                  
                  // ！！！這是最終修正的關鍵部分！！！
                  // 由於我們使用了 contentContainerStyle={paddingHorizontal} 和 marginRight
                  // 則 snapToInterval 必須等於 CARD_TOTAL_WIDTH
                  snapToInterval={CARD_TOTAL_WIDTH} 
                  snapToAlignment="start" // 讓吸附從卡片的開始位置開始
                  decelerationRate="fast" 
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>

            {/* ===== 開始測驗 ===== */}
            <Pressable
              style={styles.quizBtn}
              onPress={() => {
                if (!lessonId) return;
                router.push({ pathname: '/education/quiz' });
              }}
            >
              <Text style={styles.quizBtnText}>開始測驗</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// 樣式定義
const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  background: { width: '100%', height: 200, resizeMode: 'cover' },
  contentContainer: { padding: PAGE_HORIZONTAL_PADDING }, 
  unit: { fontSize: 22, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 12 },
  line: { marginBottom: 16 },
  sign: { fontSize: 16, color: '#374151' },
  speak: { fontSize: 16, color: '#6B7280' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: 'red' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },

  // 【關鍵修正 1：移除背景色和圓角】
  vocabContainer: {
    marginTop: 20,
    paddingVertical: 16, 
    paddingHorizontal: 0, // 滿寬度
    backgroundColor: 'transparent', // 讓它融入頁面，移除邊界陰影
    borderRadius: 0, // 移除圓角
  },
  vocabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1E3A8A',
    paddingHorizontal: PAGE_HORIZONTAL_PADDING, 
  },
  
  // [Swiper 容器樣式：起始 Padding]
  swiperContentContainer: {
    // 設置起始 Padding，讓卡片對齊頁面內容左側，
    // 同時讓第一張卡片在滑動時能正確置中
    paddingHorizontal: PAGE_HORIZONTAL_PADDING, 
  },

  // [Swiper 單詞卡片樣式]
  vocabCardSwiper: {
    width: CARD_WIDTH_DISPLAY, // 卡片內容寬度
    height: 250, 
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginRight: CARD_SPACING, // 只有右側有間距
    alignItems: 'center',
    justifyContent: 'center',
    
    // 陰影樣式保持不變，因為它們在卡片上是浮動的
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  swiperImage: { 
    width: 80, 
    height: 80, 
    marginBottom: 10, 
    borderRadius: 10, 
    resizeMode: 'cover',
    // 圖片內容置中，如果圖片本身小於 80x80，應會自動置中
  },
  wordSwiper: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 4 
  },
  meaningSwiper: { 
    fontSize: 16, 
    color: '#374151' 
  },

  // [自定義分頁圓點樣式]
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15, 
    width: '100%', 
    paddingHorizontal: PAGE_HORIZONTAL_PADDING, 
  },
  dotStyle: {
    width: 8, 
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4, 
  },
  activeDotStyle: {
    backgroundColor: '#1E3A8A', 
    width: 10, 
    height: 10,
    borderRadius: 5,
  },

  quizBtn: {
    marginTop: 30, 
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quizBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
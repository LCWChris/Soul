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
} from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

const PLACEHOLDER =
  'https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87';

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
              {words.map((w) => (
                <View key={w._id} style={styles.vocabCard}>
                  <Image
                    source={{ uri: w.image_url || PLACEHOLDER }}
                    style={{ width: 60, height: 60, marginBottom: 6, borderRadius: 8 }}
                  />
                  <Text style={styles.word}>{w.title}</Text>
                  <Text style={styles.meaning}>
                    第 {w.volume} 冊 · 第 {w.lesson} 單元
                  </Text>
                </View>
              ))}
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

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  background: { width: '100%', height: 200, resizeMode: 'cover' },
  contentContainer: { padding: 20 },
  unit: { fontSize: 22, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 12 },
  line: { marginBottom: 16 },
  sign: { fontSize: 16, color: '#374151' },
  speak: { fontSize: 16, color: '#6B7280' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: 'red' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },

  vocabContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  vocabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1E3A8A',
  },
  vocabCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  word: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meaning: { fontSize: 14, color: '#374151' },
  quizBtn: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quizBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

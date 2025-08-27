// app/education/[lessonId].jsx  (或你的 LessonPage 檔案)
import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  Button,
  ProgressBar,
  IconButton,
  Divider,
} from 'react-native-paper';

const PLACEHOLDER =
  'https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87';

export default function LessonPage() {
  const { lessonId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  // 詞彙狀態
  const [vocab, setVocab] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(true);
  const [vocabError, setVocabError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [mastered, setMastered] = useState({}); // { [wordId]: boolean }

  // 讀教材
  useEffect(() => {
    console.log('📦 進入教材頁面，lessonId：', lessonId);
    axios
      .get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAL}/${lessonId}`)
      .then((res) => {
        console.log('✅ 成功取得教材資料', res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error('❌ 讀取教材失敗', err);
        setError(true);
      }
    };

    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  // 從 unit 文字嘗試抓單元數字（例：'第3單元 …' -> 3）
  const extractLessonNo = (unitStr) => {
    const m = String(unitStr || '').match(/\d+/);
    return m ? Number(m[0]) : undefined;
  };

  // 讀本課詞彙（依 volume + lesson）
  useEffect(() => {
    if (!data) return;

    const volumeNo =
      typeof data.volume === 'number'
        ? data.volume
        : Number(data.volume ?? NaN); // 盡量轉為數字

    const lessonNo =
      typeof data.lesson === 'number'
        ? data.lesson
        : extractLessonNo(data.unit); // 從 unit 文字萃取

    // 若 volume 缺失就不查（避免撈整庫）
    if (!Number.isFinite(volumeNo)) return;

    const BOOK_WORDS = API_CONFIG.ENDPOINTS?.BOOK_WORDS || '/api/book_words';
    setVocabLoading(true);
    setVocabError(false);

    axios
      .get(`${API_CONFIG.BASE_URL}${BOOK_WORDS}`, {
        params: {
          volume: volumeNo,
          ...(Number.isFinite(lessonNo) ? { lesson: lessonNo } : {}),
          // 你的後端若有分頁/限制，也可加：limit: 30
        },
      })
      .then((res) => {
        const arr = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setVocab(arr);
      })
      .catch((err) => {
        console.error('❌ 讀取詞彙失敗', err);
        setVocabError(true);
      })
      .finally(() => setVocabLoading(false));
  }, [data]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>無法載入教材資料，請稍後再試。</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  const resolvedLessonId = String(lessonId || data?._id || '');
  const total = vocab.length;
  const learned = useMemo(
    () => Object.values(mastered).filter(Boolean).length,
    [mastered]
  );
  const displayList = showAll ? vocab : vocab.slice(0, 8);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* 封面 */}
      <Image
        source={{ uri: data.image || 'https://placehold.co/600x300?text=無圖片' }}
        style={styles.background}
      />

      <View style={styles.contentContainer}>
        {/* 單元標題 */}
        <Text style={styles.unit}>{data.unit}</Text>

        {data.content && data.content.length > 0 ? (
          data.content.map((item, index) => (
            <View key={index} style={styles.line}>
              <Text style={styles.sign}>✋ {item.sign_text || '無手語內容'}</Text>
              <Text style={styles.speak}>🗣 {item.spoken_text || '無語音內容'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>⚠️ 此單元尚無內容。</Text>
        )}

        {/* ===== 詞彙總覽（依 volume+lesson 從 book_words 撈） ===== */}
        <Card mode="elevated" style={styles.vocabCard}>
          <Card.Title
            title="詞彙總覽"
            subtitle={
              total > 0
                ? `本課共 ${total} 個詞彙`
                : '尚無可顯示的詞彙（請確認 volume/lesson 是否匹配）'
            }
            right={(props) =>
              total > 8 ? (
                <Button compact onPress={() => setShowAll((s) => !s)}>
                  {showAll ? '收合' : '顯示全部'}
                </Button>
              ) : null
            }
          />
          <Card.Content style={{ gap: 8 }}>
            {/* 進度條 */}
            {total > 0 && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ marginBottom: 6, color: '#334155' }}>
                  熟練度：{learned}/{total}
                </Text>
                <ProgressBar progress={total ? learned / total : 0} />
              </View>
            )}

            {/* 圖片詞卡（水平捲動） */}
            {!vocabLoading && !vocabError && total > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {displayList.map((w, idx) => {
                  const id = String(w._id || idx);
                  const img = w.image_url || PLACEHOLDER;
                  const title = w.title || '未命名';

                  return (
                    <Pressable
                      key={id}
                      style={styles.thumb}
                      onPress={() =>
                        router.push({
                          pathname: 'education/word-learning',
                          params: { q: title, volume: w.volume, lesson: w.lesson },
                        })
                      }
                      onLongPress={() =>
                        setMastered((prev) => ({ ...prev, [id]: !prev[id] }))
                      }
                    >
                      <Image source={{ uri: img }} style={styles.thumbImage} />
                      <Text numberOfLines={1} style={styles.thumbText}>
                        {title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Chips（快速點選） */}
            <View style={styles.chipsWrap}>
              {vocabLoading && <Text>載入詞彙中...</Text>}
              {vocabError && <Text style={{ color: 'tomato' }}>無法載入詞彙</Text>}

              {!vocabLoading &&
                !vocabError &&
                displayList.map((w, idx) => {
                  const id = String(w._id || idx);
                  const label = w.title || '未命名';
                  const selected = !!mastered[id];
                  const level = w.level || w.difficulty; // 若有等級欄位可顯示
                  const chipText = level ? `${label} · ${level}` : label;

                  return (
                    <View key={id} style={styles.chipRow}>
                      <Chip
                        style={styles.chip}
                        selected={selected}
                        onPress={() =>
                          router.push({
                            pathname: 'education/word-learning',
                            params: { q: label, volume: w.volume, lesson: w.lesson },
                          })
                        }
                        onLongPress={() =>
                          setMastered((prev) => ({ ...prev, [id]: !prev[id] }))
                        }
                      >
                        {chipText}
                      </Chip>
                      <IconButton
                        icon={selected ? 'check-circle' : 'plus-circle-outline'}
                        onPress={() =>
                          setMastered((prev) => ({ ...prev, [id]: !prev[id] }))
                        }
                        size={22}
                        accessibilityLabel="標記熟練"
                      />
                    </View>
                  );
                })}
            </View>

            <Divider style={{ marginTop: 8, marginBottom: 8 }} />
            <View style={styles.vocabActions}>
              <Button
                mode="contained-tonal"
                onPress={() =>
                  router.push({
                    pathname: 'education/word-learning',
                    params: {
                      lessonId: resolvedLessonId,
                      volume: data.volume,
                      lesson: extractLessonNo(data.unit) ?? data.lesson,
                    },
                  })
                }
              >
                查看全部詞彙
              </Button>
              <Button
                mode="contained"
                onPress={() => router.push({ pathname: '/education/quiz' })}
              >
                試試 3 題快問快答
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* ===== 開始測驗 ===== */}
        <Pressable
          style={styles.quizBtn}
          onPress={() => {
            if (!resolvedLessonId) return;
            router.push({ pathname: '/education/quiz' });
          }}
        >
          <Text style={styles.quizBtnText}>開始測驗</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  background: { width: '100%', height: 200, resizeMode: 'cover' },
  contentContainer: { padding: 20 },

  unit: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },

  line: { marginBottom: 16 },
  sign: { fontSize: 16, color: '#374151' },
  speak: { fontSize: 16, color: '#6B7280' },

  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: 'red' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },

  // ===== 詞彙卡片 =====
  vocabCard: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // thumbs（有圖）
  thumbRow: {
    gap: 12,
    paddingVertical: 4,
  },
  thumb: {
    width: 92,
    alignItems: 'center',
  },
  thumbImage: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  thumbText: {
    marginTop: 6,
    fontSize: 12,
    color: '#1f2937',
    width: 92,
    textAlign: 'center',
  },

  // chips（快速操作）
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center' },
  chip: { borderRadius: 14 },

  vocabActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  // ====== 測驗按鈕 ======
  quizBtn: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quizBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

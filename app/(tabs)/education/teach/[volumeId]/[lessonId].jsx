import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';

export default function LessonPage() {
  const { lessonId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        console.log('📦 進入教材頁面，lessonId：', lessonId);
        
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAL}/${lessonId}`;
        console.log('🔗 載入教材詳情，URL：', url);
        
        const response = await axios.get(url, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        
        console.log('📦 完整回應：', response);
        console.log('📄 回應資料：', response.data);
        console.log('✅ 成功取得教材資料', response.data);
        
        setData(response.data);
      } catch (err) {
        console.error('❌ 讀取教材失敗：', err);
        console.error('❌ 錯誤訊息：', err.message);
        console.error('❌ 錯誤回應：', err.response?.data);
        setError(true);
      }
    };

    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

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

  const resolvedLessonId = String(lessonId || data?._id || "");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image
        source={{
          uri: data.image || 'https://placehold.co/600x300?text=無圖片',
        }}
        style={styles.background}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.unit}>{data.unit}</Text>

        {data.content && Array.isArray(data.content) && data.content.length > 0 ? (
          data.content.map((item, index) => (
            <View key={index} style={styles.line}>
              <Text style={styles.sign}>✋ {item.sign_text || '無手語內容'}</Text>
              <Text style={styles.speak}>🗣 {item.spoken_text || '無語音內容'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>⚠️ 此單元尚無內容。</Text>
        )}

        {/* 開始測驗按鈕 */}
        <Pressable
          style={styles.quizBtn}
          onPress={() => {
            if (!resolvedLessonId) return;
            router.push({ pathname: "/education/quiz" });
          }}
        >
          <Text style={styles.quizBtnText}>開始測驗</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  background: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
  },
  unit: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  line: {
    marginBottom: 16,
  },
  sign: {
    fontSize: 16,
    color: '#374151',
  },
  speak: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  // ====== 測驗按鈕 ======
  quizBtn: {
    marginTop: 20,
    backgroundColor: "#3B82F6", // 藍色 (Tailwind: bg-blue-500)
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  quizBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

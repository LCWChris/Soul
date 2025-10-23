import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity,View } from 'react-native';
import ArrowBack from "@/components/ArrowBack";

export default function VolumeIndex() {
  const { volumeId } = useLocalSearchParams();
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const loadLessons = async () => {
      try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}?volume=${volumeId}`;
        console.log("🔗 載入教學單元，URL：", url);

        const response = await axios.get(url, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        console.log("📄 回應資料：", response.data);

        if (!Array.isArray(response.data)) {
          throw new Error("API 回應格式錯誤，預期為陣列");
        }

        setLessons(response.data);
      } catch (err) {
        console.error('❌ 載入單元失敗：', err.message);
        setLessons([]);
      }
    };

    if (volumeId) {
      loadLessons();
    }
  }, [volumeId]);

  return (
// 使用一個最外層的 View 來包裹內容
    <View style={styles.fullScreenContainer}>
      {/* ArrowBack 放在 ScrollView 外面 */}
      <View style={styles.header}>
        <ArrowBack onPress={()=> router.back()}/>
      </View>

      {/* ScrollView 只包含可捲動的內容 (Lessons) */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {lessons.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={styles.card}
            onPress={() => {
              console.log('🧭 點擊教材，導向 _id：', item._id);
              router.push(`/education/teach/${item.volume}/${item._id}`);
            }}
          >
            {/* ✅ 用 unitname 取代舊的 unit */}
            <Text style={styles.unit}>{item.unitname || `第${item.lesson}單元`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1, // 讓 View 佔滿整個螢幕
    backgroundColor: 'white', // 假設背景色
  },
  header: {
    padding: 20, // 確保 ArrowBack 有足夠的點擊和視覺空間
    paddingBottom: 0, // 減少底部的間隔
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16, // 確保 ScrollView 的內容不會太靠近 Header
    gap: 16,
  },
  card: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
  },
  unit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
});

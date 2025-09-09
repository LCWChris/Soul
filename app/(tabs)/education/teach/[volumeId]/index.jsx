import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

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
    <ScrollView contentContainerStyle={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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

import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TeachScreen() {
  const [volumes, setVolumes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVolumes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}`;
        console.log("🔗 準備打 API：", url);

        const response = await axios.get(url);
        
        console.log("✅ 是否為陣列：", Array.isArray(response.data), "筆數：", response.data.length);
        console.log("🧾 前三筆預覽：", response.data.slice(0, 3));
        
        const uniqueVolumes = [...new Set(response.data.map((item) => Number(item.volume)))];
        console.log("🧮 提取 volumes：", uniqueVolumes);
        
        setVolumes(uniqueVolumes.sort((a, b) => a - b));
      } catch (err) {
        console.error("❌ 載入教材失敗：", err.message);
        setError(`無法載入教材：${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadVolumes();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && (
        <Text style={styles.errorText}>⚠️ {error}</Text>
      )}

      {loading && (
        <Text style={styles.loadingText}>� 載入教材中...</Text>
      )}

      {!loading && volumes.length === 0 && !error && (
        <Text style={styles.emptyText}>
          📭 尚未載入任何教材，請確認資料庫是否有資料
        </Text>
      )}

      {volumes.map((vol) => {
        console.log('🔍 渲染中的 vol：', vol);
        return (
          <TouchableOpacity
            key={vol}
            style={styles.card}
            onPress={() => router.push(`/education/teach/${vol}`)}
          >
            <Text style={styles.text}>第 {vol} 冊</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#E0E7FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 32,
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#DC2626',
    marginTop: 32,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 32,
    fontWeight: '500',
  },
});

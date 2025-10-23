import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity,View } from 'react-native';
import ArrowBack from "@/components/ArrowBack";

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

        const response = await axios.get(url, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        
        console.log("📦 完整回應：", response);
        console.log("📄 回應資料：", response.data);
        console.log("🔍 資料型別：", typeof response.data);
        console.log("✅ 是否為陣列：", Array.isArray(response.data));
        
        // 驗證資料格式
        if (!response.data) {
          throw new Error("API 回應為空");
        }
        
        if (!Array.isArray(response.data)) {
          console.error("❌ API 回應不是陣列：", response.data);
          throw new Error("API 回應格式錯誤，預期為陣列");
        }
        
        console.log("📊 資料筆數：", response.data.length);
        console.log("🧾 前三筆預覽：", response.data.slice(0, 3));
        
        const uniqueVolumes = [...new Set(response.data.map((item) => Number(item.volume)))];
        console.log("🧮 提取 volumes：", uniqueVolumes);
        
        setVolumes(uniqueVolumes.sort((a, b) => a - b));
      } catch (err) {
        console.error("❌ 載入教材失敗：", err);
        console.error("❌ 錯誤訊息：", err.message);
        console.error("❌ 錯誤回應：", err.response?.data);
        
        let errorMessage = '載入教材時發生未知錯誤';
        
        if (err.response) {
          errorMessage = `伺服器錯誤 (${err.response.status}): ${err.response.data?.message || err.message}`;
        } else if (err.request) {
          errorMessage = '無法連線到伺服器，請檢查網路連線';
        } else {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadVolumes();
  }, []);

  return (
// 使用一個最外層的 View 來包裹內容
    <View style={styles.fullScreenContainer}>
      {/* ArrowBack 放在 ScrollView 外面，獨立於可捲動內容 */}
      <View style={styles.header}>
        <ArrowBack onPress={()=> router.back()}/>
      </View>
      
      {/* ScrollView 只包含可捲動的內容 (Volumes) */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && (
          <Text style={styles.errorText}>⚠️ {error}</Text>
        )}

        {loading && (
          <Text style={styles.loadingText}> 載入教材中...</Text>
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
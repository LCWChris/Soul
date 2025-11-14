import { API_CONFIG } from "@/constants/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TeachScreen() {
  const [volumes, setVolumes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadVolumes = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}`;
        console.log("🔗 準備打 API：", url);

        const response = await axios.get(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
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

        const uniqueVolumes = [
          ...new Set(response.data.map((item) => Number(item.volume))),
        ];
        console.log("🧮 提取 volumes：", uniqueVolumes);

        setVolumes(uniqueVolumes.sort((a, b) => a - b));
      } catch (err) {
        console.error("❌ 載入教材失敗：", err);
        console.error("❌ 錯誤訊息：", err.message);
        console.error("❌ 錯誤回應：", err.response?.data);

        let errorMessage = "載入教材時發生未知錯誤";

        if (err.response) {
          errorMessage = `伺服器錯誤 (${err.response.status}): ${
            err.response.data?.message || err.message
          }`;
        } else if (err.request) {
          errorMessage = "無法連線到伺服器，請檢查網路連線";
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
    <LinearGradient
      colors={["#EEF2FF", "#E0E7FF", "#F9FAFB"]}
      style={styles.container}
    >
      {/* 自定義返回按鈕 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>選擇冊別</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>載入教材中...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && volumes.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>尚未載入任何教材</Text>
            <Text style={styles.emptySubtext}>請確認資料庫是否有資料</Text>
          </View>
        )}

        {!loading && !error && volumes.length > 0 && (
          <View style={styles.gridContainer}>
            {volumes.map((vol) => (
              <TouchableOpacity
                key={vol}
                activeOpacity={0.8}
                onPress={() => router.push(`/(tabs)/education/teach/${vol}`)}
              >
                <LinearGradient
                  colors={[
                    vol % 2 === 0 ? "#6366F1" : "#8B5CF6",
                    vol % 2 === 0 ? "#4F46E5" : "#7C3AED",
                  ]}
                  style={styles.volumeCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.volumeIconContainer}>
                    <Ionicons name="book" size={32} color="#FFF" />
                  </View>
                  <Text style={styles.volumeNumber}>第 {vol} 冊</Text>
                  <View style={styles.volumeArrow}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255,255,255,0.8)"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  volumeCard: {
    width: CARD_WIDTH,
    height: 140,
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  volumeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  volumeArrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
});

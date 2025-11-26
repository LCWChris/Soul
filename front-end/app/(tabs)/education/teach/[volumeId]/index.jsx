import { API_CONFIG } from "@/constants/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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

export default function VolumeIndex() {
  const { volumeId } = useLocalSearchParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadLessons = async () => {
      setLoading(true);
      try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}?volume=${volumeId}`;
        console.log("🔗 載入教學單元，URL：", url);
        console.log("📌 請求的 volumeId：", volumeId);

        const response = await axios.get(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        console.log("📄 回應資料：", response.data);
        console.log("📊 回應資料數量：", response.data.length);
        console.log("🔍 回應資料詳細內容：", JSON.stringify(response.data, null, 2));

        if (!Array.isArray(response.data)) {
          throw new Error("API 回應格式錯誤，預期為陣列");
        }

        // 檢查每一筆資料的 volume 和 lesson
        response.data.forEach((item, index) => {
          console.log(`📝 第 ${index + 1} 筆: volume=${item.volume}, lesson=${item.lesson}, unitname=${item.unitname}`);
        });

        setLessons(response.data);
      } catch (err) {
        console.error("❌ 載入單元失敗：", err.message);
        console.error("❌ 錯誤詳情：", err);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    if (volumeId) {
      loadLessons();
    }
  }, [volumeId]);

  const { width } = Dimensions.get("window");
  const CARD_WIDTH = (width - 60) / 2;

  return (
    <LinearGradient colors={["#F0F9FF", "#E0F2FE"]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>第 {volumeId} 冊</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>載入單元中...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          <View style={styles.grid}>
            {lessons.map((item, index) => (
              <TouchableOpacity
                key={item._id}
                activeOpacity={0.7}
                onPress={() => {
                  console.log(
                    "🧭 點擊教材，volume:",
                    item.volume,
                    "lesson:",
                    item.lesson
                  );
                  router.push(
                    `/(tabs)/education/teach/${item.volume}/${item.lesson}`
                  );
                }}
              >
                <LinearGradient
                  colors={
                    index % 2 === 0
                      ? ["#3B82F6", "#2563EB"]
                      : ["#8B5CF6", "#7C3AED"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.lessonCard, { width: CARD_WIDTH }]}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="book-outline" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.lessonNumber}>單元 {item.lesson}</Text>
                  <Text
                    style={styles.lessonName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.unitname || `第${item.lesson}單元`}
                  </Text>
                  <View style={styles.arrowIcon}>
                    <Ionicons name="chevron-forward" size={20} color="#FFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  lessonCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  lessonNumber: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    opacity: 0.9,
    marginBottom: 4,
  },
  lessonName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    lineHeight: 22,
    flex: 1,
  },
  arrowIcon: {
    position: "absolute",
    bottom: 16,
    right: 16,
    opacity: 0.8,
  },
});

import { API_CONFIG } from "@/constants/api";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function TeachScreen() {
  const [volumes, setVolumes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}`;
    console.log("🔗 準備打 API：", url);

    axios
      .get(url)
      .then((res) => {
        console.log("✅ 是否為陣列：", Array.isArray(res.data), "筆數：", res.data.length);
        console.log("🧾 前三筆預覽：", res.data.slice(0, 3));
        const uniqueVolumes = [...new Set(res.data.map((it) => Number(it.volume)))];
        console.log("🧮 提取 volumes：", uniqueVolumes);
        setVolumes(uniqueVolumes);
      })
      .catch((err) => {
        console.error("❌ Axios 失敗：", err.message);
        alert(`⚠️ 無法載入教材：${err.message}`);
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && (
        <Text style={styles.errorText}>⚠️ 載入錯誤：{error}</Text>
      )}

      {volumes.length === 0 && !error && (
        <Text style={styles.emptyText}>
          📭 尚未載入任何教材，請確認資料庫是否有資料
        </Text>
      )}

      {volumes.map((vol) => (
        <TouchableOpacity
          key={vol}
          style={styles.card}
          onPress={() => router.push(`/education/teach/${vol}`)}
        >
          <Text style={styles.text}>第{vol}冊</Text>
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
    backgroundColor: "#E0E7FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 32,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 32,
  },
});

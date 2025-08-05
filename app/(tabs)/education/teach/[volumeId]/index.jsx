import { API_CONFIG } from "@/constants/api";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
export default function VolumeIndex() {
  const { volumeId } = useLocalSearchParams();
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    axios
      .get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIALS}?volume=${volumeId}`
      )
      .then((res) => setLessons(res.data))
      .catch((err) => console.error("載入單元失敗", err));
  }, [volumeId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {lessons.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={styles.card}
          onPress={() => {
            console.log("🧭 點擊教材，導向 _id：", item._id);
            router.push(`/education/teach/${volumeId}/${item._id}`);
          }}
        >
          <Text style={styles.unit}>{item.unit}</Text>
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
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 12,
  },
  unit: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400E",
  },
});

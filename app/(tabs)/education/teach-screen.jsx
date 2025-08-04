import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import axios from "axios";
import { router } from "expo-router";

export default function TeachScreen() {
  const [volumes, setVolumes] = useState([]);

  useEffect(() => {
    axios.get("http://192.168.1.182:3001/api/materials")
      .then(res => {
        const uniqueVolumes = [...new Set(res.data.map(item => item.volume))];
        setVolumes(uniqueVolumes);
      })
      .catch(err => console.error("載入冊別失敗", err));
  }, []);

  return (
  <ScrollView contentContainerStyle={styles.container}>
    {volumes.map((vol) => {
      console.log("🔍 渲染中的 vol：", vol); // ← 你可以加這行 debug
      return (
        <TouchableOpacity
          key={vol}
          style={styles.card}
          onPress={() => router.push(`/education/teach/${vol}`)}
        >
          <Text style={styles.text}>第{vol}冊</Text>
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
});

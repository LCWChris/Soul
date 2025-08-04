import ArrowBack from "@/components/ArrowBack"; // 自訂返回按鈕
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function WordLearningPage() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [cloudinaryUrls, setCloudinaryUrls] = useState([]);

  useEffect(() => {
    axios
      .get("http://172.20.10.3:3001/api/vocabularies")
      .then((res) => {
        console.log("✅ 從 API 拿到：", res.data);

        if (res.data.length > 0) {
          setWordData(res.data[0]);
        } else {
          console.warn("⚠️ API 回傳是空陣列！");
        }
      })
      .catch((err) => console.error("❌ API Error", err));
  }, []);

  useEffect(() => {
    fetch("http://172.20.10.3:3001/api/cloudinary-images")
      .then((res) => res.json())
      .then((urls) => setCloudinaryUrls(urls))
      .catch((err) => console.error("Cloudinary API Error", err));
  }, []);

  return (
    <LinearGradient colors={["#e0f2fe", "#bae6fd"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ArrowBack />

        {wordData ? (
          <View style={[styles.card, styles.imageWrapper]}>
            <Text style={styles.wordText}>{wordData.title}</Text>

            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image
                source={{ uri: wordData.image_url }}
                style={styles.imageMedia}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={styles.subTitle}>手語影片教學 🎬</Text>

            <Video
              source={{ uri: wordData.video_url }}
              useNativeControls
              resizeMode="contain"
              style={styles.videoMedia}
            />

            <TouchableOpacity
              style={[
                styles.favoriteButton,
                { backgroundColor: isFavorited ? "#93c5fd" : "#dbeafe" },
              ]}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Text style={styles.favoriteText}>
                {isFavorited ? "❤️ 已收藏" : "🤍 加入收藏"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 18, marginTop: 100 }}>載入中...</Text>
        )}

        <Text>Cloudinary 圖片/影片：</Text>
        {cloudinaryUrls.map((url, idx) => (
          <View key={idx} style={{ marginBottom: 16 }}>
            {/* 只顯示圖片，影片可用 Video 組件 */}
            {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <Image source={{ uri: url }} style={{ width: 200, height: 200 }} />
            ) : (
              <Text>{url}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          {wordData && (
            <Image
              source={{ uri: wordData.image_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    alignItems: "center",
    paddingBottom: 80,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#60a5fa",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    alignItems: "center",
  },
  wordText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 16,
    textAlign: "center",
  },
  imageMedia: {
    width: screenWidth * 0.85,
    maxWidth: 340,
    height: 340,
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  videoMedia: {
    width: screenWidth * 0.85,
    maxWidth: 340,
    height: 240,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#dbeafe",
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 10,
    marginTop: 6,
  },
  favoriteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  favoriteText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e3a8a",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
    maxWidth: 340,
    maxHeight: 460,
  },
});

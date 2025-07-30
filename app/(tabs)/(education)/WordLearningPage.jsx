import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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
  const word = "一";
  const imageUrl = {
    uri: "https://res.cloudinary.com/dslcjvqzf/image/upload/v1753713788/%E4%B8%80_viysdw.png",
  };

  const videoUrl = {
    uri: "https://res.cloudinary.com/dslcjvqzf/video/upload/v1753713826/one_detek2.mp4",
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <LinearGradient colors={["#e0f2fe", "#bae6fd"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>

        <View style={[styles.card, styles.imageWrapper]}>
          <Text style={styles.wordText}>{word}</Text>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={imageUrl}
              style={styles.imageMedia}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.subTitle}>手語影片教學 🎬</Text>

          <Video
            source={videoUrl}
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
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={imageUrl}
            style={styles.fullImage}
            resizeMode="contain"
          />
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: "#1e3a8a",
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
    height: 340, // 重要！不定高
    aspectRatio: 1, // 先給個大致預設比例，避免閃爍（如：1:1 圖片）
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "transparent", // ← 不設底色或設成 transparent
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

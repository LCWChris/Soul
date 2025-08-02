//✅ app/(tabs)/translation/video-confirmation.jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Video } from "expo-av";

export default function VideoConfirmationScreen() {
  const router = useRouter();
  const { videoUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
  if (!videoUri || !videoUri.startsWith("data:")) {
    Alert.alert("錯誤", "影片格式錯誤，請重新上傳");
    return;
  }

  try {
    setLoading(true);

    const body = {
      filename: "video.mp4",
      content_base64: videoUri,
    };

    const response = await fetch("http://localhost:8000/translate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ✅ 非 multipart
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      router.push({
        pathname: "/(tabs)/translation/translation-result",
        params: { translatedText: data.translation },
      });
    } else {
      console.error("❌ Server response:", data);
      Alert.alert("上傳失敗", data?.error || "後端錯誤");
    }
  } catch (err) {
    console.error("❌ 發生錯誤:", err);
    Alert.alert("錯誤", "無法連線到後端");
  } finally {
    setLoading(false);
  }
};



  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>預覽你選取的影片</Text>

      {videoUri ? (
        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      ) : (
        <Text style={styles.errorText}>找不到影片</Text>
      )}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>翻譯中，請稍候...</Text>
        </View>
      )}

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.buttonText}>確認並進行翻譯</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>重新選擇影片</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  video: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
    borderRadius: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 20,
  },
  loadingBox: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  buttonGroup: {
    marginTop: 30,
  },
  button: {
    padding: 14,
    backgroundColor: "#4285F4",
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

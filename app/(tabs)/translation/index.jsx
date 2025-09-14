// SOUL/app/(tabs)/translation/index.jsx
import ArrowBack from "@/components/ArrowBack";
import { Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function TranslateScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const cameraRef = useRef(null);

  const BACKEND_URL = process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL;
  const NODE_API = process.env.EXPO_PUBLIC_IP;

  const resetState = () => {
    setPhotoUri(null);
    setVideoUri(null);
    setTranslationResult(null);
    setIsUploading(false);
  };

  if (!permission)
    return (
      <View>
        <Text>請求相機權限中…</Text>
      </View>
    );

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>需要相機權限才能使用此功能</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>授權相機</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const uploadVideoToCloudinary = async (videoUri) => {
    const data = new FormData();
    data.append("file", {
      uri: videoUri,
      type: "video/mp4",
      name: "upload.mp4",
    });
    data.append("upload_preset", "upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dbmrnpwxd/video/upload",
      {
        method: "POST",
        body: data,
      }
    );

    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.secure_url;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      resetState();
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      resetState();
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        setVideoUri(video.uri);
      } catch (e) {
        console.error("錄影錯誤：", e);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const pickVideoFromGallery = async () => {
    resetState();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const uploadAndTranslateVideo = async () => {
    if (!videoUri) {
      alert("請先錄製或選擇影片");
      return;
    }

    setIsUploading(true);
    setTranslationResult(null);

    try {
      // ① 上傳到 Cloudinary
      const cloudUrl = await uploadVideoToCloudinary(videoUri);
      console.log("✅ Cloudinary 上傳成功：", cloudUrl);

      // ② 寫入 MongoDB
      const nodeRes = await fetch(`${NODE_API}/api/vocabularies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "影片標題",
          content: "",
          level: "",
          theme: "",
          image_url: "",
          video_url: cloudUrl,
          created_by: "frontend",
          created_at: new Date().toISOString(),
        }),
      });
      console.log("📤 Node.js API 回應狀態：", nodeRes.status);

      // ③ 傳 Cloudinary 連結給 FastAPI 翻譯（by-url 模式）
      console.log("🌍 發送到翻譯 API：", `${BACKEND_URL}/translate-by-url`);
      const res = await fetch(`${BACKEND_URL}/translate-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: cloudUrl }),
      });

      const data = await res.json();
      if (res.ok && data.translation) {
        setTranslationResult(data.translation);
      } else {
        console.warn("⚠️ 無法解析 JSON：", JSON.stringify(data));
        throw new Error("無法解析翻譯結果");
      }
    } catch (error) {
      console.error("上傳或翻譯失敗：", error);
      setTranslationResult("翻譯失敗，請稍後再試");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <ArrowBack />
      </Animated.View>

      <TouchableOpacity
        style={styles.topRightButton}
        onPress={toggleCameraFacing}
      >
        <Text style={styles.buttonText}>🔄</Text>
      </TouchableOpacity>

      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={pickVideoFromGallery}>
          <Text style={styles.buttonText}>🎬</Text>
        </TouchableOpacity>

        {!isRecording ? (
          <TouchableOpacity style={styles.button} onPress={startRecording}>
            <Text style={styles.buttonText}>⏺️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={stopRecording}>
            <Text style={styles.buttonText}>⏹️</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={takePicture}
          disabled={isRecording}
        >
          <Text style={styles.buttonText}>📸</Text>
        </TouchableOpacity>
      </View>

      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

      {videoUri && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
          />
        </View>
      )}

      <View
        style={{ alignItems: "center", marginBottom: 20, paddingBottom: 120 }}
      >
        <TouchableOpacity
          style={[styles.button, { paddingHorizontal: 20, marginTop: 20 }]}
          onPress={uploadAndTranslateVideo}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>
            {isUploading ? "翻譯中…" : "上傳並翻譯"}
          </Text>
        </TouchableOpacity>
      </View>

      {translationResult && (
        <ScrollView
          style={{
            backgroundColor: "#f0f0f0",
            padding: 20,
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>翻譯結果：</Text>
          <Text style={{ fontSize: 18, marginTop: 8 }}>
            {translationResult}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1 },
  header: { position: "absolute", top: 10, left: 0, zIndex: 20 },
  topRightButton: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "#000000aa",
    padding: 10,
    borderRadius: 25,
    zIndex: 20,
  },
  buttonRow: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    zIndex: 10,
  },
  button: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 50,
    marginHorizontal: 8,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  preview: {
    position: "absolute",
    bottom: 180,
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  videoContainer: {
    alignSelf: "center",
    width: "90%",
    height: 200,
    marginTop: 20,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

// SOUL/app/(tabs)/translation/index.jsx
import ArrowBack from "@/components/ArrowBack";
import { Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
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

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setVideoUri(null);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      setPhotoUri(null);
      setVideoUri(null);
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setPhotoUri(null);
    }
  };

  const uploadAndTranslateVideo = async () => {
    if (!videoUri) {
      alert("請先錄製或選擇影片");
      return;
    }

    setIsUploading(true);
    setTranslationResult(null);

    const formData = new FormData();
    formData.append("file", {
      uri: videoUri,
      name: "video.mp4",
      type: "video/mp4",
    });

    try {
      const response = await fetch("https://8cbe5f586bf2.ngrok-free.app/translate", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
      });



      const data = await response.json();
      setTranslationResult(data.translation || "未取得翻譯結果");
    } catch (error) {
      console.error("上傳或翻譯失敗：", error);
      setTranslationResult("翻譯失敗，請稍後再試");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 返回按鈕 */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <ArrowBack />
      </Animated.View>

      {/* 切換鏡頭按鈕 */}
      <TouchableOpacity
        style={styles.topRightButton}
        onPress={toggleCameraFacing}
      >
        <Text style={styles.buttonText}>🔄</Text>
      </TouchableOpacity>

      {/* 相機畫面 */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      {/* 功能按鈕 */}
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

      {/* 預覽 */}
      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
      {videoUri && (
        <Video
          source={{ uri: videoUri }}
          style={styles.preview}
          useNativeControls
          resizeMode="contain"
        />
      )}

      {/* 上傳與翻譯按鈕 */}
      <View style={{ alignItems: "center", marginBottom: 20, paddingBottom: 120 }}>

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

      {/* 翻譯結果 */}
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
          <Text style={{ fontSize: 18, marginTop: 8 }}>{translationResult}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 20,
  },
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
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
});

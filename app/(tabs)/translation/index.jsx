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
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { Ionicons } from '@expo/vector-icons';

// Material You Theme
const MaterialYouTheme = {
  primary: {
    primary0: '#000000',
    primary10: '#1a0034',
    primary20: '#2e0054',
    primary30: '#440076',
    primary40: '#5b0099',
    primary50: '#7318bd',
    primary60: '#8b36d8',
    primary70: '#a353f4',
    primary80: '#bb71ff',
    primary90: '#d392ff',
    primary95: '#eab3ff',
    primary99: '#fdf7ff',
    primary100: '#ffffff'
  },
  neutral: {
    neutral0: '#000000',
    neutral10: '#1c1b1f',
    neutral20: '#313033',
    neutral30: '#484649',
    neutral40: '#605d62',
    neutral50: '#79767a',
    neutral60: '#938f94',
    neutral70: '#aeaaae',
    neutral80: '#c9c5ca',
    neutral90: '#e6e1e5',
    neutral95: '#f4eff4',
    neutral99: '#fffbfe',
    neutral100: '#ffffff'
  },
  surface: {
    surface: '#fffbfe',
    surfaceDim: '#ded8e1',
    surfaceBright: '#fffbfe',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f7f2fa',
    surfaceContainer: '#f1ecf4',
    surfaceContainerHigh: '#ece6f0',
    surfaceContainerHighest: '#e6e0e9'
  }
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TranslateScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const cameraRef = useRef(null);

  // 動畫值
  const recordingScale = useSharedValue(1);
  const uploadProgress = useSharedValue(0);

  const BACKEND_URL = process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL;
  const NODE_API = process.env.EXPO_PUBLIC_IP;

  const resetState = () => {
    setPhotoUri(null);
    setVideoUri(null);
    setTranslationResult(null);
    setIsUploading(false);
    setShowResults(false);
    uploadProgress.value = 0;
  };

  // 錄製動畫
  const recordingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: recordingScale.value }],
    };
  });

  // 上傳進度動畫
  const uploadAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${uploadProgress.value * 100}%`,
    };
  });

  if (!permission)
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color={MaterialYouTheme.primary.primary60} />
          <Text style={styles.permissionTitle}>請求相機權限中...</Text>
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, { animationDelay: '0.1s' }]} />
            <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
          </View>
        </View>
      </SafeAreaView>
    );

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Animated.View entering={FadeInUp} style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color={MaterialYouTheme.primary.primary60} />
          </View>
          <Text style={styles.permissionTitle}>需要相機權限</Text>
          <Text style={styles.permissionSubtitle}>
            為了提供手語翻譯功能，我們需要存取您的相機來錄製手語影片
          </Text>
          <TouchableOpacity 
            onPress={requestPermission} 
            style={styles.permissionButton}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color={MaterialYouTheme.neutral.neutral100} />
            <Text style={styles.permissionButtonText}>授權相機權限</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
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
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (error) {
        Alert.alert('錯誤', '拍照失敗，請重試');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      resetState();
      setIsRecording(true);
      
      // 開始錄製動畫
      recordingScale.value = withRepeat(
        withSpring(1.2, { duration: 800 }),
        -1,
        true
      );
      
      try {
        const video = await cameraRef.current.recordAsync();
        setVideoUri(video.uri);
      } catch (e) {
        console.error("錄影錯誤：", e);
        Alert.alert('錯誤', '錄影失敗，請重試');
      }
      setIsRecording(false);
      recordingScale.value = withSpring(1);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      recordingScale.value = withSpring(1);
    }
  };

  const pickVideoFromGallery = async () => {
    resetState();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('錯誤', '選擇影片失敗，請重試');
    }
  };

  const uploadAndTranslateVideo = async () => {
    if (!videoUri) {
      Alert.alert("提示", "請先錄製或選擇影片");
      return;
    }

    setIsUploading(true);
    setTranslationResult(null);
    uploadProgress.value = 0;

    try {
      // 模擬上傳進度
      uploadProgress.value = withTiming(0.3, { duration: 1000 });
      
      // ① 上傳到 Cloudinary
      const cloudUrl = await uploadVideoToCloudinary(videoUri);
      console.log("✅ Cloudinary 上傳成功：", cloudUrl);
      
      uploadProgress.value = withTiming(0.6, { duration: 500 });

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
      
      uploadProgress.value = withTiming(0.8, { duration: 500 });

      // ③ 傳 Cloudinary 連結給 FastAPI 翻譯（by-url 模式）
      console.log("🌍 發送到翻譯 API：", `${BACKEND_URL}/translate-by-url`);
      const res = await fetch(`${BACKEND_URL}/translate-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: cloudUrl }),
      });

      const data = await res.json();
      uploadProgress.value = withTiming(1, { duration: 500 });
      
      if (res.ok && data.translation) {
        setTranslationResult(data.translation);
        setShowResults(true);
      } else {
        console.warn("⚠️ 無法解析 JSON：", JSON.stringify(data));
        throw new Error("無法解析翻譯結果");
      }
    } catch (error) {
      console.error("上傳或翻譯失敗：", error);
      setTranslationResult("翻譯失敗，請檢查網路連線後重試");
      setShowResults(true);
      Alert.alert('翻譯失敗', '請檢查網路連線後重試');
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MaterialYouTheme.primary.primary40} />
      
      {/* 頂部導航欄 */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <ArrowBack />
        <Text style={styles.headerTitle}>手語翻譯</Text>
        <TouchableOpacity
          style={styles.cameraFlipButton}
          onPress={toggleCameraFacing}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="camera-reverse-outline" 
            size={24} 
            color={MaterialYouTheme.neutral.neutral100} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* 相機視圖 */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* 錄製指示器 */}
          {isRecording && (
            <Animated.View entering={ZoomIn} style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>錄製中...</Text>
            </Animated.View>
          )}
        </CameraView>
        
        {/* 攝影預覽區域 */}
        {photoUri && (
          <Animated.View entering={FadeInUp} style={styles.mediaPreview}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.closePreviewButton}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="close" size={20} color={MaterialYouTheme.neutral.neutral100} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* 控制按鈕區域 */}
      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          {/* 選擇影片 */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={pickVideoFromGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="film-outline" size={24} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.secondaryButtonText}>選擇影片</Text>
          </TouchableOpacity>

          {/* 錄製按鈕 */}
          <Animated.View style={recordingAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isRecording ? "stop" : "radio-button-on"} 
                size={32} 
                color={MaterialYouTheme.neutral.neutral100} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* 拍照 */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={takePicture}
            disabled={isRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={24} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.secondaryButtonText}>拍照</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 影片預覽區域 */}
      {videoUri && (
        <Animated.View entering={FadeInUp} style={styles.videoPreviewContainer}>
          <View style={styles.videoPreview}>
            <Video
              source={{ uri: videoUri }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.closeVideoButton}
              onPress={() => setVideoUri(null)}
            >
              <Ionicons name="close" size={20} color={MaterialYouTheme.neutral.neutral100} />
            </TouchableOpacity>
          </View>
          
          {/* 翻譯按鈕 */}
          <TouchableOpacity
            style={[
              styles.translateButton,
              isUploading && styles.translateButtonDisabled
            ]}
            onPress={uploadAndTranslateVideo}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <View style={styles.uploadProgressBar}>
                  <Animated.View style={[styles.uploadProgress, uploadAnimatedStyle]} />
                </View>
                <Text style={styles.translateButtonText}>翻譯中...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="language-outline" size={20} color={MaterialYouTheme.neutral.neutral100} />
                <Text style={styles.translateButtonText}>開始翻譯</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 翻譯結果區域 */}
      {showResults && translationResult && (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.resultsContainer}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color={MaterialYouTheme.primary.primary60} />
              <Text style={styles.resultTitle}>翻譯結果</Text>
            </View>
            <ScrollView style={styles.resultContent}>
              <Text style={styles.resultText}>{translationResult}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.closeResultButton}
              onPress={() => setShowResults(false)}
            >
              <Ionicons name="close" size={20} color={MaterialYouTheme.neutral.neutral60} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 權限頁面樣式
  permissionContainer: {
    flex: 1,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MaterialYouTheme.primary.primary95,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: MaterialYouTheme.neutral.neutral10,
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionSubtitle: {
    fontSize: 16,
    color: MaterialYouTheme.neutral.neutral40,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: MaterialYouTheme.primary.primary40,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // 載入動畫
  loadingIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MaterialYouTheme.primary.primary60,
    opacity: 0.4,
  },

  // 主要容器
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.neutral.neutral0,
  },

  // 頂部導航欄
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MaterialYouTheme.primary.primary40,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  cameraFlipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 相機容器
  cameraContainer: {
    flex: 1,
    marginTop: 64, // 為頂部導航留出空間
  },
  camera: {
    flex: 1,
  },

  // 錄製指示器
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.primary.primary40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  recordingText: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 14,
    fontWeight: '500',
  },

  // 媒體預覽
  mediaPreview: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: MaterialYouTheme.neutral.neutral100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 控制按鈕區域
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: MaterialYouTheme.surface.surfaceContainer,
    paddingTop: 20,
    paddingBottom: 100, // 增加底部邊距避免被底部導航欄遮擋
    paddingHorizontal: 20,
    marginBottom: 0,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 80,
  },
  secondaryButton: {
    backgroundColor: MaterialYouTheme.primary.primary95,
  },
  secondaryButtonText: {
    color: MaterialYouTheme.primary.primary40,
    fontSize: 12,
    fontWeight: '500',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: MaterialYouTheme.primary.primary40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
  },

  // 影片預覽容器
  videoPreviewContainer: {
    position: 'absolute',
    bottom: 80, // 調整底部位置避免被底部導航欄遮擋
    left: 0,
    right: 0,
    backgroundColor: MaterialYouTheme.surface.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 10,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  videoPreview: {
    position: 'relative',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: MaterialYouTheme.neutral.neutral0,
    marginBottom: 16,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  closeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 翻譯按鈕
  translateButton: {
    flexDirection: 'row',
    backgroundColor: MaterialYouTheme.primary.primary40,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  translateButtonDisabled: {
    backgroundColor: MaterialYouTheme.neutral.neutral80,
  },
  translateButtonText: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  uploadProgressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgress: {
    height: '100%',
    backgroundColor: MaterialYouTheme.neutral.neutral100,
    borderRadius: 2,
  },

  // 翻譯結果區域
  resultsContainer: {
    position: 'absolute',
    bottom: 80, // 調整底部位置避免被底部導航欄遮擋
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 50,
    zIndex: 20,
  },
  resultCard: {
    backgroundColor: MaterialYouTheme.surface.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: screenHeight * 0.6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: MaterialYouTheme.neutral.neutral10,
    flex: 1,
  },
  closeResultButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MaterialYouTheme.neutral.neutral90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 16,
    color: MaterialYouTheme.neutral.neutral20,
    lineHeight: 24,
  },
});

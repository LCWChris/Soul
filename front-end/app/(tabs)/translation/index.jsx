import { getBackendApiUrl, getTranslationApiUrl } from "@/utils/settings";
import { Ionicons } from "@expo/vector-icons";
import { Audio, Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

function TranslateScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, setAudioPermission] = useState(null);
  const [facing, setFacing] = useState("back");
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(true);
  const [forceReady, setForceReady] = useState(false); // 強制準備模式
  const [cameraReadyAttempts, setCameraReadyAttempts] = useState(0); // 準備嘗試次數

  // 新增：倒數計時狀態 (null, 3, 2, 1)
  const [countdown, setCountdown] = useState(null);

  const cameraRef = useRef(null);
  const readyTimeoutRef = useRef(null);
  const backupReadyTimeoutRef = useRef(null); // 備用計時器

  // 動畫值
  const recordingScale = useSharedValue(1);
  const uploadProgress = useSharedValue(0);

  // 動態獲取 API URLs - 預設使用 .env，可被自訂值覆蓋
  const [BACKEND_URL, setBackendUrl] = useState(
    process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL
  );
  const [NODE_API, setNodeApi] = useState(process.env.EXPO_PUBLIC_IP);

  // 載入自訂的 API URLs（只有在有設定時才覆蓋預設值）
  // 使用 useFocusEffect 確保每次進入頁面時都會重新載入
  useFocusEffect(
    useCallback(() => {
      const loadCustomUrls = async () => {
        const customTranslationUrl = await getTranslationApiUrl();
        const customBackendUrl = await getBackendApiUrl();

        // 只有當自訂 URL 存在且不為空時才覆蓋預設值
        if (customTranslationUrl && customTranslationUrl.trim() !== '') {
          setBackendUrl(customTranslationUrl);
          console.log("✅ 使用自訂翻譯 API:", customTranslationUrl);
        } else {
          // 如果沒有自訂值或為空，確保使用 .env 預設值
          const envUrl = process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL;
          setBackendUrl(envUrl);
          console.log("📋 使用預設翻譯 API (.env):", envUrl);
        }
        
        if (customBackendUrl && customBackendUrl.trim() !== '') {
          setNodeApi(customBackendUrl);
          console.log("✅ 使用自訂後端 API:", customBackendUrl);
        } else {
          // 如果沒有自訂值或為空，確保使用 .env 預設值
          const envUrl = process.env.EXPO_PUBLIC_IP;
          setNodeApi(envUrl);
          console.log("📋 使用預設後端 API (.env):", envUrl);
        }
      };
      loadCustomUrls();
    }, [])
  );

  // 請求麥克風權限
  useEffect(() => {
    (async () => {
      console.log("📱 請求麥克風權限...");
      const { status } = await Audio.requestPermissionsAsync();
      console.log("🎤 麥克風權限狀態:", status);
      setAudioPermission(status === "granted");
    })();
  }, []);

  // 清理計時器和強制準備機制
  useEffect(() => {
    // 如果 5 秒後相機仍未準備好，強制設定為準備好
    const forceReadyTimer = setTimeout(() => {
      if (!isCameraReady) {
        console.log(
          "🚨 5秒強制準備: onCameraReady 沒有觸發，強制設定相機為準備好"
        );
        setIsCameraReady(true);
        setCameraInitializing(false);
        setForceReady(true);
      }
    }, 5000);

    return () => {
      clearTimeout(forceReadyTimer);
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      if (backupReadyTimeoutRef.current) {
        clearTimeout(backupReadyTimeoutRef.current);
      }
    };
  }, [isCameraReady]);

  const resetState = () => {
    setVideoUri(null);
    setTranslationResult(null);
    setIsUploading(false);
    setShowResults(false);
    uploadProgress.value = 0;
    setCountdown(null); // 重設倒數計時
  };

  // 相機準備回調 - 診斷增強版
  const onCameraReady = () => {
    console.log("📷 相機準備完成");

    // 清除所有計時器
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }
    if (backupReadyTimeoutRef.current) {
      clearTimeout(backupReadyTimeoutRef.current);
    }

    setCameraReadyAttempts((prev) => prev + 1);

    // 立即設定為準備好
    setIsCameraReady(true);
    setCameraInitializing(false);
    setForceReady(true);
  };

  // 相機狀態重設 - 增強版
  const resetCameraState = () => {
    console.log("🔄 重設相機狀態");
    setIsCameraReady(false);
    setCameraInitializing(true);
    setForceReady(false);
    setCameraReadyAttempts(0);
    setCountdown(null); // 重設倒數計時

    // 清除所有計時器
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }
    if (backupReadyTimeoutRef.current) {
      clearTimeout(backupReadyTimeoutRef.current);
    }
  };

  // 增強的權限請求
  const requestCameraPermission = async () => {
    try {
      console.log("📋 請求相機權限...");
      const result = await requestPermission();
      console.log("權限請求結果:", result);
      return result;
    } catch (error) {
      console.error("權限請求錯誤:", error);
      Alert.alert("錯誤", "無法請求相機權限");
      return null;
    }
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

  if (!permission || audioPermission === null) {
    // 新增診斷資訊
    console.log(
      "⚠️ 權限狀態未知 - 相機:",
      !!permission,
      "音頻:",
      audioPermission
    );
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color="#2563EB" />
          <Text style={styles.permissionTitle}>請求權限中...</Text>
          <Text style={styles.permissionSubtitle}>
            正在檢查相機和麥克風權限狀態
          </Text>
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, { animationDelay: "0.1s" }]} />
            <View style={[styles.loadingDot, { animationDelay: "0.2s" }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted || !audioPermission) {
    console.log(
      "❌ 權限未授權 - 相機:",
      permission.granted,
      "音頻:",
      audioPermission
    );
    console.log("canAskAgain:", permission.canAskAgain);

    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Animated.View entering={FadeInUp} style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color="#2563EB" />
          </View>
          <Text style={styles.permissionTitle}>需要相機和麥克風權限</Text>
          <Text style={styles.permissionSubtitle}>
            為了提供手語翻譯功能，我們需要存取您的相機和麥克風來錄製手語影片
          </Text>

          {permission.canAskAgain ? (
            <TouchableOpacity
              onPress={async () => {
                console.log("📋 請求所有權限...");
                await requestPermission();
                const { status } = await Audio.requestPermissionsAsync();
                setAudioPermission(status === "granted");
              }}
              style={styles.permissionButton}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>
                授權相機和麥克風權限
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.permissionDeniedContainer}>
              <Text style={styles.permissionDeniedText}>
                權限已被永久拒絕，請在設定中手動開啟相機權限
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    resetCameraState(); // 使用新的重設函數
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

  // 無條件錄影 - 完全繞過所有檢查
  const unconditionalRecord = async () => {
    console.log("🚨 無條件錄影模式 - 繞過所有檢查和等待");

    if (!cameraRef.current) {
      Alert.alert("錯誤", "相機引用不存在");
      return;
    }

    try {
      resetState();
      setIsRecording(true);
      recordingScale.value = withRepeat(withSpring(1.2), -1, true);

      console.log("🎬 直接開始錄影（無條件模式）");
      const video = await cameraRef.current.recordAsync({
        quality: "720p",
        maxDuration: 30,
        mute: false,
      });

      console.log("✅ 無條件錄影成功", video.uri);
      setVideoUri(video.uri);
    } catch (error) {
      console.error("無條件錄影失敗:", error.message);
      Alert.alert("錄影失敗", `即使無條件模式也失敗了: ${error.message}`);
    } finally {
      setIsRecording(false);
      recordingScale.value = withSpring(1);
    }
  };

  // 獨立的錄影執行邏輯，供倒數結束後呼叫
  const recordVideoLogic = async () => {
    console.log("🟢 嘗試正常錄影...");
    setIsRecording(true);
    recordingScale.value = withRepeat(withSpring(1.2), -1, true);

    try {
      const video = await cameraRef.current.recordAsync({
        quality: "720p",
        maxDuration: 30,
        mute: false,
      });

      console.log("✅ 錄影成功", video.uri);
      setVideoUri(video.uri);
    } catch (error) {
      console.error("正常錄影失敗:", error.message);

      if (error.message.includes("Camera is not ready")) {
        // 如果還是相機未準備，提供無條件錄影
        Alert.alert("相機準備問題", "正常錄影失敗，是否要嘗試強制錄影？", [
          { text: "取消", style: "cancel" },
          { text: "強制錄影", onPress: () => unconditionalRecord() },
        ]);
      } else {
        Alert.alert("錄影錯誤", error.message);
      }
    } finally {
      setIsRecording(false);
      recordingScale.value = withSpring(1);
    }
  };

  // 帶倒數計時的錄影啟動函數
  const startCountdownAndRecord = async () => {
    console.log("🎥 開始錄影檢查 (帶倒數)", {
      cameraRef: !!cameraRef.current,
      isRecording,
      isCameraReady,
      cameraInitializing,
      forceReady,
      cameraReadyAttempts,
    });

    if (!cameraRef.current) {
      Alert.alert("錯誤", "相機尚未初始化，請稍候");
      return;
    }

    if (isRecording) {
      Alert.alert("提示", "正在錄影中，請勿重複操作");
      return;
    }

    // 相機準備檢查
    if (!isCameraReady && !forceReady) {
      Alert.alert(
        "相機狀態檢查",
        "onCameraReady 回調似乎沒有觸發。選擇錄影方式：",
        [
          { text: "取消", style: "cancel" },
          {
            text: "等待準備",
            onPress: () => {
              console.log("用戶選擇等待準備");
              setForceReady(true);
              setIsCameraReady(true);
              setTimeout(() => startCountdownAndRecord(), 500); // 重新嘗試倒數
            },
          },
          { text: "直接錄影", onPress: () => unconditionalRecord() },
        ]
      );
      return;
    }

    // 啟動倒數計時
    const COUNTDOWN_SECONDS = 3;
    resetState();
    setCountdown(COUNTDOWN_SECONDS);

    let currentSecond = COUNTDOWN_SECONDS;
    const intervalId = setInterval(() => {
      currentSecond -= 1;
      if (currentSecond > 0) {
        setCountdown(currentSecond);
      } else if (currentSecond === 0) {
        setCountdown(null);
        clearInterval(intervalId);
        recordVideoLogic(); // 倒數結束，開始錄影
      } else {
        clearInterval(intervalId);
      }
    }, 1000);

    // 用 readyTimeoutRef 儲存 Interval ID，以便在重設狀態時清理
    if (readyTimeoutRef.current) {
      clearInterval(readyTimeoutRef.current);
    }
    readyTimeoutRef.current = intervalId;
  };

  // 覆寫原來的 startRecording，使其呼叫新的帶倒數的函數
  const startRecording = async () => {
    startCountdownAndRecord();
  };

  // 移除 emergencyRecord，因為 unconditionalRecord 已經足夠
  const emergencyRecord = unconditionalRecord;

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      // 停止計時器，以防萬一
      if (readyTimeoutRef.current) {
        clearInterval(readyTimeoutRef.current);
        setCountdown(null);
      }
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
      Alert.alert("錯誤", "選擇影片失敗，請重試");
    }
  };

  const uploadAndTranslateVideo = async () => {
    if (!videoUri) {
      Alert.alert("提示", "請先錄製或選擇影片");
      return;
    }

    // 使用 state 中的 BACKEND_URL（已經包含 .env 預設值和自訂值的邏輯）
    if (!BACKEND_URL) {
      Alert.alert(
        "錯誤：未設定 API 位址",
        "請先至「使用者設定」頁面的「開發者設定」中，輸入並儲存您的翻譯模型 API 位址，或確認 .env 檔案中的 EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL 已正確設定。"
      );
      return;
    }

    console.log("🚀 使用翻譯 API:", BACKEND_URL);

    setIsUploading(true);
    setTranslationResult(null);
    setShowResults(false); // 重設結果顯示
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
      const translationUrl = `${BACKEND_URL}/translate-by-url`;
      console.log("🌍 發送到翻譯 API：", translationUrl);
      const res = await fetch(translationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: cloudUrl }),
      });

      // 💥 信心度檢查和翻譯邏輯
      if (res.ok) {
        const data = await res.json();

        uploadProgress.value = withTiming(1, { duration: 500 });

        if (data.translation && data.confidence_score !== undefined) {
          const confidence = parseFloat(data.confidence_score);
          const CONFIDENCE_THRESHOLD = 10; // 10%

          console.log(`💡 翻譯結果信心度: ${confidence}%`);

          if (confidence >= CONFIDENCE_THRESHOLD) {
            // 信心度高於 10%，顯示結果
            setTranslationResult(
              `${data.translation} (信心度: ${confidence.toFixed(1)}%)`
            );
            setShowResults(true);
          } else {
            // 信心度低於 10%，顯示無法翻譯
            console.log(
              `❌ 信心度 (${confidence.toFixed(1)}%) 過低，顯示無法翻譯`
            );
            setTranslationResult(
              "抱歉，翻譯結果信心度過低 (低於10%)，請嘗試更清晰的手勢或換一個詞彙。"
            );
            setShowResults(true);
          }
        } else if (data.translation) {
          // 兼容沒有信心度字段的舊 API
          console.warn(
            "⚠️ API 返回 JSON 缺少 'confidence_score' 字段，將直接顯示翻譯結果。"
          );
          setTranslationResult(data.translation);
          setShowResults(true);
        } else {
          console.warn("⚠️ JSON 缺少 'translation' 字段或格式錯誤:", data);
          throw new Error("翻譯結果格式錯誤或為空");
        }
      } else {
        // 💥 處理 4xx 或 5xx 錯誤碼
        console.error("❌ 後端 API 響應錯誤，狀態碼:", res.status);

        const errorText = await res.text();
        console.error("錯誤詳細信息 (非JSON):", errorText.substring(0, 200));

        setTranslationResult(`後端錯誤 (${res.status})，請檢查伺服器日誌`);
        setShowResults(true);
        throw new Error(
          `後端返回 ${res.status} 錯誤: ${errorText.substring(0, 50)}...`
        );
      }
    } catch (error) {
      // 捕捉網路連線、Cloudinary 或其他所有錯誤
      console.error("上傳或翻譯失敗：", error);

      // 如果 translationResult 尚未被設定，則設定通用錯誤訊息
      if (!translationResult) {
        setTranslationResult("翻譯失敗，請檢查網路或伺服器連線。");
        setShowResults(true);
      }

      Alert.alert(
        "翻譯失敗",
        `請檢查網路連線後重試。\n詳細錯誤: ${error.message}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5FF" />

      {/* 頂部導航欄 */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.navigate({
              pathname: "/(tabs)/(home)/",
            })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🙌 手語翻譯</Text>
        <TouchableOpacity
          style={styles.cameraFlipButton}
          onPress={toggleCameraFacing}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </Animated.View>

      {/* 主要內容區域 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 相機視圖 */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={styles.cameraWrapper}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="video"
              onCameraReady={onCameraReady}
              enableTorch={false}
            />

            {/* 錄製指示器覆蓋層 */}
            {isRecording && (
              <Animated.View
                entering={ZoomIn}
                style={styles.recordingIndicatorOverlay}
              >
                <Animated.View
                  style={[styles.recordingDot, recordingAnimatedStyle]}
                />
                <Text style={styles.recordingText}>錄製中</Text>
              </Animated.View>
            )}

            {/* 相機狀態指示器 */}
            {(!isCameraReady || cameraInitializing) && (
              <View style={styles.cameraStatusOverlay}>
                <View style={styles.statusCard}>
                  <Ionicons name="camera-outline" size={32} color="#2563EB" />
                  <Text style={styles.statusText}>
                    {cameraInitializing ? "初始化相機..." : "準備中..."}
                  </Text>
                  <View style={styles.loadingDots}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* 相機控制條 */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.smallControlButton}
            onPress={pickVideoFromGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-outline" size={24} color="#2563EB" />
          </TouchableOpacity>

          {/* 核心修改：中央控制區域 (包含倒數和錄製按鈕) */}
          <View style={styles.centerControlArea}>
            {countdown !== null && (
              <Animated.View entering={ZoomIn} style={styles.countdownDisplay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </Animated.View>
            )}

            <Animated.View
              style={[
                recordingAnimatedStyle,
                // 倒數時隱藏錄製按鈕
                countdown !== null && { opacity: 0 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  (!isCameraReady || cameraInitializing) &&
                    styles.recordButtonDisabled,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={
                  !isCameraReady || cameraInitializing || countdown !== null
                } // 倒數時禁用
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonInnerActive,
                  ]}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "radio-button-on"}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={styles.smallControlButton}
            onPress={() => {
              resetCameraState();
              Alert.alert("提示", "已重設相機狀態");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* 緊急錄影選項 - 只在相機未準備好時顯示 */}
        {(!isCameraReady || cameraInitializing) && !isRecording && (
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={styles.emergencySection}
          >
            <View style={styles.emergencyHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.emergencySectionTitle}>相機未就緒？</Text>
            </View>
            <View style={styles.emergencyButtons}>
              <TouchableOpacity
                style={[styles.emergencyButton, styles.emergencyButtonPrimary]}
                onPress={unconditionalRecord}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={18} color="#FFFFFF" />
                <Text style={styles.emergencyButtonText}>強制錄影</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* 影片預覽區域 */}
        {videoUri && (
          <Animated.View
            entering={FadeInUp}
            style={styles.videoPreviewContainer}
          >
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
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 翻譯按鈕 */}
            <TouchableOpacity
              style={[
                styles.translateButton,
                isUploading && styles.translateButtonDisabled,
              ]}
              onPress={uploadAndTranslateVideo}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <View style={styles.uploadProgressBar}>
                    <Animated.View
                      style={[styles.uploadProgress, uploadAnimatedStyle]}
                    />
                  </View>
                  <Text style={styles.translateButtonText}>翻譯中...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="language-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.translateButtonText}>開始翻譯</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 翻譯結果區域 */}
        {showResults && translationResult && (
          <Animated.View
            entering={FadeInUp.delay(300)}
            style={styles.resultsContainer}
          >
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                <Text style={styles.resultTitle}>翻譯結果</Text>
              </View>
              <ScrollView style={styles.resultContent}>
                <Text style={styles.resultText}>{translationResult}</Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeResultButton}
                onPress={() => setShowResults(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // 權限頁面樣式
  permissionContainer: {
    flex: 1,
    backgroundColor: "#F1F5FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.1)",
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8EEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // 權限拒絕容器
  permissionDeniedContainer: {
    alignItems: "center",
    gap: 16,
  },
  permissionDeniedText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // 載入指示器
  loadingIndicator: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },

  // 主要容器
  container: {
    flex: 1,
  },

  // 頂部導航欄
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "transparent",
    zIndex: 20,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cameraFlipButton: {
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

  // 主要內容區域
  mainContent: {
    flex: 1,
  },

  // 相機包裝器
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },

  // 相機容器
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  camera: {
    flex: 1,
  },

  // 相機控制條
  cameraControls: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 15,
  },

  // 新增：中央控制區域 (倒數/錄製按鈕)
  centerControlArea: {
    width: 88, // 與 recordButton 寬度相同
    height: 88, // 與 recordButton 高度相同
    justifyContent: "center",
    alignItems: "center",
  },
  countdownDisplay: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(37, 99, 235, 0.9)", // 藍色背景
    justifyContent: "center",
    alignItems: "center",
    zIndex: 11,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "bold",
  },

  smallControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // 錄製按鈕
  recordButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 5,
    borderColor: "#FFFFFF",
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonActive: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  recordButtonInnerActive: {
    backgroundColor: "#B91C1C",
    borderRadius: 8,
  },
  recordButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0.1,
    borderColor: "#E2E8F0",
  },

  // 錄製指示器覆蓋層
  recordingIndicatorOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  recordingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  // 相機狀態覆蓋層
  cameraStatusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.1)",
  },
  statusText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },

  // 緊急錄影區域
  emergencySection: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 251, 235, 0.95)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  emergencySectionTitle: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "600",
  },
  emergencyButtons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonPrimary: {
    backgroundColor: "#F59E0B",
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  // 影片預覽區域
  videoPreviewContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    gap: 16,
    zIndex: 25,
  },
  videoPreview: {
    position: "relative",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  closeVideoButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  // 翻譯按鈕
  translateButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  translateButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0.1,
  },
  translateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadingContainer: {
    alignItems: "center",
    gap: 8,
  },
  uploadProgressBar: {
    width: 120,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  uploadProgress: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },

  // 翻譯結果區域
  resultsContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: screenHeight * 0.5,
    zIndex: 25,
  },
  resultCard: {
    position: "relative",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingRight: 40,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  closeResultButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  resultContent: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
});

export default TranslateScreen;

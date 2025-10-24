import ArrowBack from "@/components/ArrowBack";
import { Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function TranslateScreen() {
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
  const cameraRef = useRef(null);
  const readyTimeoutRef = useRef(null);
  const backupReadyTimeoutRef = useRef(null); // 備用計時器

  // 動畫值
  const recordingScale = useSharedValue(1);
  const uploadProgress = useSharedValue(0);

  const BACKEND_URL = process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL;
  const NODE_API = process.env.EXPO_PUBLIC_IP;

  // 請求麥克風權限
  useEffect(() => {
    (async () => {
      console.log('📱 請求麥克風權限...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('🎤 麥克風權限狀態:', status);
      setAudioPermission(status === 'granted');
    })();
  }, []);

  // 清理計時器和強制準備機制
  useEffect(() => {
    // 如果 5 秒後相機仍未準備好，強制設定為準備好
    const forceReadyTimer = setTimeout(() => {
      if (!isCameraReady) {
        console.log('🚨 5秒強制準備: onCameraReady 沒有觸發，強制設定相機為準備好');
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
  };

  // 相機準備回調 - 診斷增強版
  const onCameraReady = () => {
    console.log('📷 相機準備完成');
    
    // 清除所有計時器
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }
    if (backupReadyTimeoutRef.current) {
      clearTimeout(backupReadyTimeoutRef.current);
    }
    
    setCameraReadyAttempts(prev => prev + 1);
    
    // 立即設定為準備好
    setIsCameraReady(true);
    setCameraInitializing(false);
    setForceReady(true);
  };
  
  // 相機狀態重設 - 增強版
  const resetCameraState = () => {
    console.log('🔄 重設相機狀態');
    setIsCameraReady(false);
    setCameraInitializing(true);
    setForceReady(false);
    setCameraReadyAttempts(0);
    
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
      console.log('📋 請求相機權限...');
      const result = await requestPermission();
      console.log('權限請求結果:', result);
      return result;
    } catch (error) {
      console.error('權限請求錯誤:', error);
      Alert.alert('錯誤', '無法請求相機權限');
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
    console.log('⚠️ 權限狀態未知 - 相機:', !!permission, '音頻:', audioPermission);
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color="#2563EB" />
          <Text style={styles.permissionTitle}>請求權限中...</Text>
          <Text style={styles.permissionSubtitle}>正在檢查相機和麥克風權限狀態</Text>
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, { animationDelay: '0.1s' }]} />
            <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted || !audioPermission) {
    console.log('❌ 權限未授權 - 相機:', permission.granted, '音頻:', audioPermission);
    console.log('canAskAgain:', permission.canAskAgain);
    
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
                console.log('📋 請求所有權限...');
                await requestPermission();
                const { status } = await Audio.requestPermissionsAsync();
                setAudioPermission(status === 'granted');
              }} 
              style={styles.permissionButton}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>授權相機和麥克風權限</Text>
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

  // 緊急錄影 - 使用無條件錄影
  const emergencyRecord = () => {
    console.log('🚨 緊急錄影 -> 調用無條件錄影');
    unconditionalRecord();
  };

  // 無條件錄影 - 完全繞過所有檢查
  const unconditionalRecord = async () => {
    console.log('🚨 無條件錄影模式 - 繞過所有檢查和等待');
    
    if (!cameraRef.current) {
      Alert.alert('錯誤', '相機引用不存在');
      return;
    }
    
    try {
      resetState();
      setIsRecording(true);
      recordingScale.value = withRepeat(withSpring(1.2), -1, true);
      
      console.log('🎬 直接開始錄影（無條件模式）');
      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 30,
        mute: false,
      });
      
      console.log('✅ 無條件錄影成功', video.uri);
      setVideoUri(video.uri);
      
    } catch (error) {
      console.error('無條件錄影失敗:', error.message);
      Alert.alert('錄影失敗', `即使無條件模式也失敗了: ${error.message}`);
    } finally {
      setIsRecording(false);
      recordingScale.value = withSpring(1);
    }
  };

  const startRecording = async () => {
    console.log('🎥 開始錄影檢查', {
      cameraRef: !!cameraRef.current,
      isRecording,
      isCameraReady,
      cameraInitializing,
      forceReady,
      cameraReadyAttempts
    });
    
    // 基本檢查
    if (!cameraRef.current) {
      Alert.alert('錯誤', '相機尚未初始化，請稍候');
      return;
    }
    
    if (isRecording) {
      Alert.alert('提示', '正在錄影中，請勿重複操作');
      return;
    }
    
    // 如果相機未準備好，提供選項
    if (!isCameraReady && !forceReady) {
      Alert.alert(
        '相機狀態檢查', 
        'onCameraReady 回調似乎沒有觸發。選擇錄影方式：',
        [
          { text: '取消', style: 'cancel' },
          { text: '等待準備', onPress: () => {
            console.log('用戶選擇等待準備');
            setForceReady(true);
            setIsCameraReady(true);
            setTimeout(() => startRecording(), 500);
          }},
          { text: '直接錄影', onPress: () => unconditionalRecord() }
        ]
      );
      return;
    }
    
    // 嘗試正常錄影
    try {
      resetState();
      setIsRecording(true);
      recordingScale.value = withRepeat(withSpring(1.2), -1, true);
      
      console.log('🟢 嘗試正常錄影...');
      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 30,
        mute: false,
      });
      
      console.log('✅ 錄影成功', video.uri);
      setVideoUri(video.uri);
      
    } catch (error) {
      console.error('正常錄影失敗:', error.message);
      
      if (error.message.includes('Camera is not ready')) {
        // 如果還是相機未準備，提供無條件錄影
        Alert.alert(
          '相機準備問題',
          '正常錄影失敗，是否要嘗試強制錄影？',
          [
            { text: '取消', style: 'cancel' },
            { text: '強制錄影', onPress: () => unconditionalRecord() }
          ]
        );
      } else {
        Alert.alert('錄影錯誤', error.message);
      }
    } finally {
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
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5FF" />
      
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
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* 主要內容區域 */}
      <View style={styles.mainContent}>
        {/* 相機視圖 */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.cameraWrapper}>
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
              <Animated.View entering={ZoomIn} style={styles.recordingIndicatorOverlay}>
                <Animated.View style={[styles.recordingDot, recordingAnimatedStyle]} />
                <Text style={styles.recordingText}>錄製中</Text>
              </Animated.View>
            )}
            
            {/* 相機狀態指示器 */}
            {(!isCameraReady || cameraInitializing) && (
              <View style={styles.cameraStatusOverlay}>
                <View style={styles.statusCard}>
                  <Ionicons name="camera-outline" size={32} color="#2563EB" />
                  <Text style={styles.statusText}>
                    {cameraInitializing ? '初始化相機...' : '準備中...'}
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
          
          {/* 相機控制條 */}
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.smallControlButton}
              onPress={pickVideoFromGallery}
              activeOpacity={0.8}
            >
              <Ionicons name="folder-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            
            <Animated.View style={recordingAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  (!isCameraReady || cameraInitializing) && styles.recordButtonDisabled
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={!isCameraReady || cameraInitializing}
                activeOpacity={0.8}
              >
                <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]}>
                  <Ionicons 
                    name={isRecording ? "stop" : "radio-button-on"} 
                    size={28} 
                    color="#FFFFFF" 
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.smallControlButton}
              onPress={() => {
                resetCameraState();
                Alert.alert('提示', '已重設相機狀態');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 緊急錄影選項 - 只在相機未準備好時顯示 */}
        {(!isCameraReady || cameraInitializing) && !isRecording && (
          <Animated.View entering={FadeInUp.delay(400)} style={styles.emergencySection}>
            <Text style={styles.emergencySectionTitle}>相機未就緒？</Text>
            <View style={styles.emergencyButtons}>
              <TouchableOpacity
                style={[styles.emergencyButton, styles.emergencyButtonPrimary]}
                onPress={unconditionalRecord}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={18} color="#FFFFFF" />
                <Text style={styles.emergencyButtonText}>強制錄影</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.emergencyButton, styles.emergencyButtonSecondary]}
                onPress={emergencyRecord}
                activeOpacity={0.8}
              >
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={styles.emergencyButtonTextSecondary}>緊急模式</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
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
              <Ionicons name="close" size={20} color="#FFFFFF" />
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
                <Ionicons name="language-outline" size={20} color="#FFFFFF" />
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

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // 權限頁面樣式
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F1F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // 權限拒絕容器
  permissionDeniedContainer: {
    alignItems: 'center',
    gap: 16,
  },
  permissionDeniedText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // 載入指示器
  loadingIndicator: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  // 主要容器
  container: {
    flex: 1,
  },

  // 頂部導航欄
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // 減少左右邊距，讓標題區域更寬
    paddingVertical: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.9)', // 半透明藍色
    backdropFilter: 'blur(10px)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cameraFlipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // 主要內容區域
  mainContent: {
    flex: 1,
    paddingHorizontal: 8, // 減少左右邊距，讓畫面更寬
    paddingVertical: 8,
    paddingBottom: 100, // 增加底部邊距為 Tab Bar 留出空間
    gap: 16,
  },

  // 相機包裝器
  cameraWrapper: {
    flex: 1,
    borderRadius: 16, // 減少圓角
    backgroundColor: '#FFFFFF',
    padding: 4, // 減少內邊距
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    position: 'relative', // 添加相對定位
  },

  // 相機容器
  cameraContainer: {
    flex: 1,
    borderRadius: 12, // 減少圓角
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },

  // 相機控制條 - 改為浮動覆蓋層
  cameraControls: {
    position: 'absolute', // 改為絕對定位，浮動在畫面上
    bottom: 20, // 距離底部
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // 極透明的背景
    borderRadius: 24, // 圓角背景
    marginHorizontal: 20, // 左右邊距
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // 減少陰影透明度
    shadowRadius: 12,
    elevation: 4, // 減少高度
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)', // 更透明的邊框
    backdropFilter: 'blur(10px)', // 毛玻璃效果
    zIndex: 10, // 確保在最上層
  },
  
  smallControlButton: {
    width: 52, // 稍微增大
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(235, 242, 255, 0.6)', // 更透明的背景
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // 減少陰影透明度
    shadowRadius: 8,
    elevation: 3, // 減少高度
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)', // 更透明的邊框
    backdropFilter: 'blur(5px)', // 毛玻璃效果
  },

  // 錄製按鈕
  recordButton: {
    width: 88, // 增大錄製按鈕
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  recordButtonInner: {
    width: 72, // 對應調整內部按鈕
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  recordButtonInnerActive: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
  },
  recordButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
    borderColor: '#E2E8F0',
  },

  // 錄製指示器覆蓋層
  recordingIndicatorOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // 相機狀態覆蓋層
  cameraStatusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  statusText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 更透明的背景
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8, // 左右邊距
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // 減少陰影透明度
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)', // 更透明的邊框
    backdropFilter: 'blur(5px)', // 毛玻璃效果
  },
  emergencySectionTitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  emergencyButtonSecondary: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyButtonTextSecondary: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },

  // 影片預覽區域
  videoPreviewContainer: {
    position: 'absolute',
    bottom: 80, // 調整底部位置避免被 Tab Bar 遮擋
    left: 8, // 減少左邊距
    right: 8, // 減少右邊距
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 更透明的背景
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 16, // 添加底部圓角
    borderBottomRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, // 減少陰影透明度
    shadowRadius: 16,
    elevation: 6, // 減少高度
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)', // 更透明的邊框
    backdropFilter: 'blur(10px)', // 毛玻璃效果
  },
  videoPreview: {
    position: 'relative',
    height: 220, // 增加高度讓影片預覽更大
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
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
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  translateButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  translateButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // 翻譯結果區域
  resultsContainer: {
    position: 'absolute',
    bottom: 80, // 調整底部位置避免被 Tab Bar 遮擋
    left: 8, // 減少左邊距
    right: 8, // 減少右邊距
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 50,
    zIndex: 20,
    borderRadius: 16, // 添加圓角
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 更透明的背景
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 16, // 添加底部圓角
    borderBottomRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: screenHeight * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)', // 更透明的邊框
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, // 減少陰影透明度
    shadowRadius: 16,
    elevation: 6, // 減少高度
    backdropFilter: 'blur(10px)', // 毛玻璃效果
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
    color: '#1E293B',
    flex: 1,
  },
  closeResultButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  resultContent: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },

});

export default TranslateScreen;

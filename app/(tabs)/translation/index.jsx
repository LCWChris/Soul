import ArrowBack from "@/components/ArrowBack";
import CameraDiagnostic from "@/components/CameraDiagnostic";
import { MaterialYouTheme } from "../education/word-learning/MaterialYouTheme";
import { Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
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
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TranslateScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, setAudioPermission] = useState(null);
  const [facing, setFacing] = useState("back");
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(true);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
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
    setPhotoUri(null);
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

  // 相機診斷函式 - 增強版
  const diagnoseCameraIssues = async () => {
    console.log('🔍 開始完整相機診斷...');
    console.log('permission:', permission);
    console.log('audioPermission:', audioPermission);
    console.log('cameraRef.current:', !!cameraRef.current);
    console.log('isCameraReady:', isCameraReady);
    console.log('cameraInitializing:', cameraInitializing);
    console.log('isRecording:', isRecording);
    
    if (permission) {
      console.log('permission.granted:', permission.granted);
      console.log('permission.canAskAgain:', permission.canAskAgain);
    }
    
    const diagnosis = {
      hasCameraPermission: permission?.granted,
      hasAudioPermission: audioPermission,
      hasCameraRef: !!cameraRef.current,
      isCameraReady,
      cameraInitializing,
      isRecording
    };
    
    console.log('📊 完整診斷結果:', diagnosis);
    
    let issues = [];
    if (!diagnosis.hasCameraPermission) issues.push('相機權限未授權');
    if (!diagnosis.hasAudioPermission) issues.push('麥克風權限未授權');
    if (!diagnosis.hasCameraRef) issues.push('相機引用無效');
    if (!diagnosis.isCameraReady) issues.push('相機未準備');
    
    Alert.alert(
      '完整診斷結果', 
      `相機權限: ${diagnosis.hasCameraPermission ? '✅' : '❌'}\n` +
      `麥克風權限: ${diagnosis.hasAudioPermission ? '✅' : '❌'}\n` +
      `相機引用: ${diagnosis.hasCameraRef ? '✅' : '❌'}\n` +
      `相機準備: ${diagnosis.isCameraReady ? '✅' : '❌'}\n` +
      `初始化中: ${diagnosis.cameraInitializing ? '是' : '否'}\n` +
      `正在錄影: ${diagnosis.isRecording ? '是' : '否'}\n\n` +
      (issues.length > 0 ? `⚠️ 發現問題: ${issues.join(', ')}` : '🎉 一切正常！')
    );
    
    return diagnosis;
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
          <Ionicons name="camera-outline" size={64} color={MaterialYouTheme.primary.primary60} />
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
            <Ionicons name="camera-outline" size={48} color={MaterialYouTheme.primary.primary60} />
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
              <Ionicons name="checkmark" size={20} color={MaterialYouTheme.neutral.neutral100} />
              <Text style={styles.permissionButtonText}>授權相機和麥克風權限</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.permissionDeniedContainer}>
              <Text style={styles.permissionDeniedText}>
                權限已被永久拒絕，請在設定中手動開啟相機權限
              </Text>
              <TouchableOpacity 
                onPress={diagnoseCameraIssues}
                style={[styles.permissionButton, styles.diagnosticButton]}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={20} color={MaterialYouTheme.primary.primary60} />
                <Text style={[styles.permissionButtonText, styles.diagnosticButtonText]}>診斷問題</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowDiagnostic(true)}
                style={[styles.permissionButton, styles.diagnosticButton]}
                activeOpacity={0.8}
              >
                <Ionicons name="analytics-outline" size={20} color={MaterialYouTheme.primary.primary60} />
                <Text style={[styles.permissionButtonText, styles.diagnosticButtonText]}>詳細診斷</Text>
              </TouchableOpacity>
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

  const takePicture = async () => {
    console.log('📷 嘗試拍照', {
      cameraRef: !!cameraRef.current,
      isCameraReady,
      cameraInitializing
    });
    
    if (!cameraRef.current) {
      Alert.alert('錯誤', '相機尚未初始化，請稍候');
      return;
    }
    
    if (!isCameraReady || cameraInitializing) {
      Alert.alert('提示', '相機尚未準備好，請稍候片刻');
      return;
    }
    
    try {
      resetState();
      console.log('🟢 開始拍照...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      console.log('✅ 拍照完成', photo.uri);
      setPhotoUri(photo.uri);
    } catch (error) {
      console.error('拍照錯誤：', error);
      let errorMessage = '拍照失敗，請重試';
      
      if (error.message.includes('Camera is not ready')) {
        errorMessage = '相機尚未準備好，請稍候再試';
        resetCameraState();
      }
      
      Alert.alert('錯誤', errorMessage);
    }
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
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>錄製中...</Text>
          </Animated.View>
        )}
        
        {/* 相機未準備好的指示器 */}
        {(!isCameraReady || cameraInitializing) && (
          <View style={styles.cameraLoadingOverlay}>
            <Ionicons name="camera-outline" size={48} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.cameraLoadingText}>
              {cameraInitializing ? '相機初始化中...' : '相機準備中...'}
            </Text>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, { animationDelay: '0.1s' }]} />
              <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
            </View>
          </View>
        )}
        
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
                isRecording && styles.recordButtonActive,
                (!isCameraReady || cameraInitializing) && styles.recordButtonDisabled
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!isCameraReady || cameraInitializing}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isRecording ? "stop" : "radio-button-on"} 
                size={32} 
                color={(!isCameraReady || cameraInitializing) ? MaterialYouTheme.neutral.neutral60 : MaterialYouTheme.neutral.neutral100} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* 緊急錄影按鈕 */}
          {(!isCameraReady || cameraInitializing) && !isRecording && (
            <View style={styles.emergencyContainer}>
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={emergencyRecord}
                activeOpacity={0.8}
              >
                <Ionicons name="warning" size={20} color={MaterialYouTheme.error.error40} />
                <Text style={styles.emergencyButtonText}>緊急錄影</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.unconditionalButton}
                onPress={unconditionalRecord}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={20} color={MaterialYouTheme.neutral.neutral100} />
                <Text style={styles.unconditionalButtonText}>直接錄影</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 拍照 */}
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.secondaryButton,
              (!isCameraReady || isRecording || cameraInitializing) && styles.secondaryButtonDisabled
            ]} 
            onPress={takePicture}
            disabled={isRecording || !isCameraReady || cameraInitializing}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="camera-outline" 
              size={24} 
              color={(!isCameraReady || isRecording || cameraInitializing) ? MaterialYouTheme.neutral.neutral60 : MaterialYouTheme.primary.primary60} 
            />
            <Text 
              style={[
                styles.secondaryButtonText,
                (!isCameraReady || isRecording || cameraInitializing) && styles.secondaryButtonTextDisabled
              ]}
            >
              拍照
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 診斷按鈕行 */}
        <View style={styles.diagnosticRow}>
          <TouchableOpacity 
            style={styles.diagnosticActionButton}
            onPress={diagnoseCameraIssues}
            activeOpacity={0.8}
          >
            <Ionicons name="bug-outline" size={20} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.diagnosticActionText}>診斷相機</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.diagnosticActionButton}
            onPress={() => setShowDiagnostic(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="analytics-outline" size={16} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.diagnosticActionText}>詳細診斷</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.diagnosticActionButton}
            onPress={() => {
              resetCameraState();
              Alert.alert('提示', '已重設相機狀態，請稍候');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={20} color={MaterialYouTheme.primary.primary60} />
            <Text style={styles.diagnosticActionText}>重設相機</Text>
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

      {/* 診斷組件 */}
      {showDiagnostic && (
        <View style={styles.diagnosticModal}>
          <CameraDiagnostic onClose={() => setShowDiagnostic(false)} />
        </View>
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
  
  // 權限拒絕容器
  permissionDeniedContainer: {
    alignItems: 'center',
    gap: 16,
  },
  permissionDeniedText: {
    color: MaterialYouTheme.neutral.neutral40,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  diagnosticButton: {
    backgroundColor: MaterialYouTheme.primary.primary95,
  },
  diagnosticButtonText: {
    color: MaterialYouTheme.primary.primary40,
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

  // 錄製指示器覆蓋層
  recordingIndicatorOverlay: {
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
    zIndex: 10,
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

  // 相機載入覆蓋層
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
  },
  cameraLoadingText: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 16,
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
  
  // 診斷按鈕行
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
  },
  diagnosticActionButton: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: MaterialYouTheme.primary.primary95,
  },
  diagnosticActionText: {
    color: MaterialYouTheme.primary.primary40,
    fontSize: 10,
    fontWeight: '500',
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
  recordButtonDisabled: {
    backgroundColor: MaterialYouTheme.neutral.neutral80,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  
  // 緊急錄影按鈕
  emergencyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.error.error90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MaterialYouTheme.error.error60,
  },
  emergencyButtonText: {
    color: MaterialYouTheme.error.error10,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  unconditionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.neutral.neutral20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MaterialYouTheme.neutral.neutral40,
  },
  unconditionalButtonText: {
    color: MaterialYouTheme.neutral.neutral90,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // 次要按鈕禁用狀態
  secondaryButtonDisabled: {
    backgroundColor: MaterialYouTheme.neutral.neutral90,
    opacity: 0.6,
  },
  secondaryButtonTextDisabled: {
    color: MaterialYouTheme.neutral.neutral60,
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

  // 診斷模態
  diagnosticModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
});

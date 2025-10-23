import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';
import { toggleFavorite as toggleFavoriteUtil } from '@/utils/favorites';
import LearningStatusSelector from './LearningStatusSelector';
import { updateWordProgress, getWordProgress, LEARNING_STATUS } from '@/utils/learning-progress';
import VocabularyService from '../services/VocabularyService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 計算 iPhone 型號的安全頂部間距
const getTopSafeAreaPadding = () => {
  if (Platform.OS === 'ios') {
    const { height, width } = Dimensions.get('window');
    // iPhone 14 Pro Max, 15 Pro Max 等有動態島的機型
    if (height >= 926 || width >= 926) return 35;
    // iPhone X/XS/11/12/13/14 等有劉海的機型
    if (height >= 812 || width >= 812) return 30;
    // 其他 iPhone 機型
    return 25;
  }
  // Android 裝置
  return 20;
};

const WordDetailModal = ({ visible, word, onClose, onSwipeLeft, onSwipeRight, onFavoriteChange, onProgressChange }) => {
  const { user } = useUser();
  const [imageIndex, setImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(word?.isFavorite || false);
  const [learningStatus, setLearningStatus] = useState(LEARNING_STATUS.NOT_STARTED);
  
  // 影片相關狀態
  const [showVideo, setShowVideo] = useState(true); // 預設顯示影片
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // 媒體切換功能
  const hasVideo = word?.video_url;
  const hasImage = word?.image_url || word?.imageUrl;
  const hasBothMedia = hasVideo && hasImage;

  // 當 word 變化時，更新收藏狀態和學習狀態
  useEffect(() => {
    setIsFavorite(word?.isFavorite || false);
    if (word) {
      loadWordProgress();
      // 根據可用媒體設置初始顯示狀態
      const hasVideo = word.video_url;
      const hasImage = word.image_url || word.imageUrl;
      if (hasVideo) {
        setShowVideo(true); // 有影片時優先顯示影片
      } else if (hasImage) {
        setShowVideo(false); // 只有圖片時顯示圖片
      }
    }
  }, [word]);

  const loadWordProgress = async () => {
    if (!word) return;
    try {
      const wordId = word.id || word._id;
      const progress = await getWordProgress(wordId);
      setLearningStatus(progress.status);
    } catch (error) {
      console.error('載入學習進度失敗:', error);
      setLearningStatus(LEARNING_STATUS.NOT_STARTED);
    }
  };

  if (!word) return null;

  // 多圖支援
  const imageUrls = Array.isArray(word.imageUrls) ? word.imageUrls : (word.image_url ? [word.image_url] : []);

  const handleSwipeLeft = () => {
    if (imageIndex < imageUrls.length - 1) {
      setImageIndex(imageIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (imageIndex > 0) {
      setImageIndex(imageIndex - 1);
    }
  };

  // 學習進度處理
  const handleStatusChange = async (newStatus) => {
    if (!word) return;
    
    try {
      const wordId = word.id || word._id;
      const oldStatus = learningStatus;
      
      // 更新本地狀態
      setLearningStatus(newStatus);
      
      // 更新儲存的學習進度
      await updateWordProgress(wordId, newStatus);
      
      // 記錄學習活動到後端
      if (user?.id && newStatus !== LEARNING_STATUS.NOT_STARTED) {
        try {
          let action = 'review';
          
          // 根據狀態變化確定動作類型
          if (oldStatus === LEARNING_STATUS.NOT_STARTED && newStatus === LEARNING_STATUS.LEARNING) {
            action = 'learn';
          } else if (newStatus === LEARNING_STATUS.MASTERED) {
            action = 'master';
          } else {
            action = 'review';
          }
          
          await VocabularyService.recordLearningActivity(
            user.id, 
            wordId, 
            action, 
            {
              timeSpent: 8000, // 估計8秒詳情頁學習時間
              isCorrect: true
            }
          );
          console.log('✅ 詳情頁學習活動已記錄:', { userId: user.id, wordId, action });
        } catch (recordError) {
          console.warn('記錄學習活動失敗:', recordError);
          // 即使記錄失敗也不影響本地進度更新
        }
      }
      
      // 通知主頁面更新
      if (onProgressChange) {
        onProgressChange(wordId, newStatus);
      }
      
      console.log('📚 詳情頁：更新學習狀態:', wordId, oldStatus, '->', newStatus);
    } catch (error) {
      console.error('更新學習進度失敗:', error);
    }
  };

  // 收藏狀態同步
  const handleFavoriteToggle = async () => {
    const wordId = word.id || word._id;
    console.log('💖 詳情頁：嘗試切換收藏:', wordId, word);
    
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    
    // 通知主頁面收藏狀態變化
    if (onFavoriteChange) {
      onFavoriteChange(wordId, newFavoriteStatus);
    }
    
    // 實際更新收藏資料
    try {
      const result = await toggleFavoriteUtil(wordId);
      console.log('💖 詳情頁：收藏操作結果:', result);
    } catch (error) {
      console.error('💖 詳情頁：收藏操作失敗:', error);
    }
  };

  // 影片處理函數
  const handleVideoPlay = async () => {
    if (videoRef.current) {
      setIsVideoPlaying(true);
      await videoRef.current.playAsync();
    }
  };

  const handleVideoPause = async () => {
    if (videoRef.current) {
      setIsVideoPlaying(false);
      await videoRef.current.pauseAsync();
    }
  };

  const handleVideoStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
    }
  };

  // 媒體切換函數
  const toggleMediaType = () => {
    if (hasBothMedia) {
      setShowVideo(!showVideo);
      // 如果切換到圖片，暫停影片
      if (showVideo && videoRef.current) {
        handleVideoPause();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={MaterialYouTheme.neutral.neutral30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>單詞詳情</Text>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoriteToggle}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#2563EB" : MaterialYouTheme.neutral.neutral30} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Word Section */}
          <View style={styles.wordSection}>
            <Text style={styles.word}>{word.word || word.title}</Text>
            {word.pronunciation && (
              <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>
            )}
          </View>

          {/* 媒體區域：圖片或影片，左右切換詞彙 */}
          {(word.image_url || word.imageUrl || word.video_url) && (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                {/* 左滑區域：切換到上一個詞彙 */}
                <TouchableOpacity style={styles.imageSwipeArea} onPress={onSwipeRight}>
                  <Ionicons name="chevron-back" size={32} color="#2563EB" />
                </TouchableOpacity>
                
                {/* 媒體顯示區域 */}
                <View style={styles.mediaContainer}>
                  {/* 根據 showVideo 狀態和媒體可用性決定顯示內容 */}
                  {(showVideo && hasVideo) ? (
                    <View style={styles.videoContainer}>
                      <Video
                        ref={videoRef}
                        source={{ uri: word.video_url }}
                        style={styles.detailVideo}
                        resizeMode="contain"
                        isLooping={true}
                        shouldPlay={false}
                        onPlaybackStatusUpdate={handleVideoStatusUpdate}
                      />
                      {/* 影片控制覆蓋層 - 只在暫停時顯示 */}
                      {!isVideoPlaying && (
                        <View style={styles.videoOverlay}>
                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={handleVideoPlay}
                          >
                            <Ionicons
                              name="play"
                              size={32}
                              color="white"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                      {/* 播放時的暫停按鈕 - 點擊影片任意位置暫停 */}
                      {isVideoPlaying && (
                        <TouchableOpacity
                          style={styles.videoTouchArea}
                          onPress={handleVideoPause}
                        />
                      )}
                    </View>
                  ) : (
                    /* 顯示圖片 */
                    hasImage && (
                      <Image
                        source={{ uri: word.image_url || word.imageUrl }}
                        style={styles.detailImage}
                        resizeMode="contain"
                      />
                    )
                  )}
                  
                  {/* 媒體切換按鈕 - 只有當同時有影片和圖片時才顯示 */}
                  {hasBothMedia && (
                    <TouchableOpacity 
                      style={styles.mediaToggleButton}
                      onPress={toggleMediaType}
                    >
                      <Ionicons 
                        name={showVideo ? "image" : "play-circle"} 
                        size={24} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* 右滑區域：切換到下一個詞彙 */}
                <TouchableOpacity style={styles.imageSwipeArea} onPress={onSwipeLeft}>
                  <Ionicons name="chevron-forward" size={32} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Definition Section */}
          <View style={styles.definitionSection}>
            <Text style={styles.sectionTitle}>定義</Text>
            <Text style={styles.definition}>{word.definition || word.content}</Text>
          </View>

          {/* Example Section */}
          {word.example && (
            <View style={styles.exampleSection}>
              <Text style={styles.sectionTitle}>例句</Text>
              <Text style={styles.example}>{word.example}</Text>
            </View>
          )}

          {/* Metadata Section */}
          <View style={styles.metadataSection}>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>分類</Text>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{word.category}</Text>
                </View>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>級別</Text>
                <View style={[styles.levelTag, { backgroundColor: getLevelColor(word.level || word.learning_level) }]}>
                  <Text style={styles.levelText}>{getLevelText(word.level || word.learning_level)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons - replaced with Learning Status Selector */}
          <LearningStatusSelector
            currentStatus={learningStatus}
            onStatusChange={handleStatusChange}
            style={styles.statusSelector}
          />
        </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const getLevelColor = (level) => {
  switch (level) {
    case 'beginner':
      return MaterialYouTheme.tertiary.tertiary90;
    case 'intermediate':
      return MaterialYouTheme.secondary.secondary90;
    case 'advanced':
      return MaterialYouTheme.error.error90;
    default:
      return MaterialYouTheme.neutral.neutral90;
  }
};

const getLevelText = (level) => {
  switch (level) {
    case 'beginner':
      return '初學';
    case 'intermediate':
      return '進階';
    case 'advanced':
      return '熟練';
    default:
      return level;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: getTopSafeAreaPadding(), // 動態計算 iPhone 型號的安全間距
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 99, 235, 0.1)', // 藍色透明邊框
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // 半透明白色背景
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  wordSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  word: {
    ...Typography.displaySmall,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  pronunciation: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral50,
    fontStyle: 'italic',
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: screenWidth - (Spacing.lg * 2),
    height: 250, // 增加高度以更好地顯示影片
    marginVertical: Spacing.md,
  },
  imageSwipeArea: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    flex: 1,
    height: '100%',
    borderRadius: BorderRadius.lg,
    backgroundColor: MaterialYouTheme.neutral.neutral95,
  },
  mediaContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: MaterialYouTheme.neutral.neutral95,
  },
  detailVideo: {
    flex: 1,
    height: '100%',
    backgroundColor: MaterialYouTheme.neutral.neutral95,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // 減少透明度讓背景更清晰
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mediaToggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageIndicators: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MaterialYouTheme.neutral.neutral80,
  },
  indicatorActive: {
    backgroundColor: "#2563EB",
  },
  definitionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral30,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  definition: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral20,
    lineHeight: 24,
  },
  exampleSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  example: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  metadataSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.neutral.neutral50,
    marginBottom: Spacing.xs,
  },
  categoryTag: {
    backgroundColor: MaterialYouTheme.secondary.secondary90,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  categoryText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.secondary.secondary30,
    fontWeight: '500',
  },
  levelTag: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  levelText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
  statusSelector: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});

export default WordDetailModal;

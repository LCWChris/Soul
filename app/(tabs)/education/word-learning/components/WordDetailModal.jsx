import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';
import { toggleFavorite as toggleFavoriteUtil } from '@/utils/favorites';
import LearningStatusSelector from './LearningStatusSelector';
import { updateWordProgress, getWordProgress, LEARNING_STATUS } from '@/utils/learning-progress';

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
  const [imageIndex, setImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(word?.isFavorite || false);
  const [learningStatus, setLearningStatus] = useState(LEARNING_STATUS.NOT_STARTED);

  // 當 word 變化時，更新收藏狀態和學習狀態
  useEffect(() => {
    setIsFavorite(word?.isFavorite || false);
    if (word) {
      loadWordProgress();
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
      
      // 更新本地狀態
      setLearningStatus(newStatus);
      
      // 更新儲存的學習進度
      await updateWordProgress(wordId, newStatus);
      
      // 通知主頁面更新
      if (onProgressChange) {
        onProgressChange(wordId, newStatus);
      }
      
      console.log('📚 詳情頁：更新學習狀態:', wordId, learningStatus, '->', newStatus);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={MaterialYouTheme.neutral.neutral30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>單詞詳情</Text>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoriteToggle}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? MaterialYouTheme.primary.primary40 : MaterialYouTheme.neutral.neutral30} />
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

          {/* 單張圖片，左右切換詞彙 */}
          {(word.image_url || word.imageUrl) && (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                {/* 左滑區域：切換到上一個詞彙 */}
                <TouchableOpacity style={styles.imageSwipeArea} onPress={onSwipeRight}>
                  <Ionicons name="chevron-back" size={32} color={MaterialYouTheme.primary.primary40} />
                </TouchableOpacity>
                {/* 圖片顯示 */}
                <Image
                  source={{ uri: word.image_url || word.imageUrl }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
                {/* 右滑區域：切換到下一個詞彙 */}
                <TouchableOpacity style={styles.imageSwipeArea} onPress={onSwipeLeft}>
                  <Ionicons name="chevron-forward" size={32} color={MaterialYouTheme.primary.primary40} />
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
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    paddingTop: getTopSafeAreaPadding(), // 動態計算 iPhone 型號的安全間距
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutral.neutral90,
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
    height: 200, // 減少高度讓寬圖片有更好的顯示
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
    backgroundColor: MaterialYouTheme.primary.primary50,
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

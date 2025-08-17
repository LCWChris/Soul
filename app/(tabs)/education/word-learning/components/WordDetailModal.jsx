import React, { useState } from 'react';
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

const WordDetailModal = ({ visible, word, onClose }) => {
  const [imageIndex, setImageIndex] = useState(0);

  if (!word) return null;

  const handleSwipeLeft = () => {
    // 模擬多個圖片的左滑功能
    console.log('Swipe left - next image');
  };

  const handleSwipeRight = () => {
    // 模擬多個圖片的右滑功能
    console.log('Swipe right - previous image');
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
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color={MaterialYouTheme.neutral.neutral30} />
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

          {/* Image Section with Swipe Functionality */}
          {(word.image_url || word.imageUrl) && (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                <TouchableOpacity 
                  style={styles.imageSwipeArea}
                  onPress={handleSwipeRight}
                >
                  <Ionicons name="chevron-back" size={24} color={MaterialYouTheme.neutral.neutral50} />
                </TouchableOpacity>
                
                <Image 
                  source={{ uri: word.image_url || word.imageUrl }} 
                  style={styles.detailImage}
                  resizeMode="contain"
                />
                
                <TouchableOpacity 
                  style={styles.imageSwipeArea}
                  onPress={handleSwipeLeft}
                >
                  <Ionicons name="chevron-forward" size={24} color={MaterialYouTheme.neutral.neutral50} />
                </TouchableOpacity>
              </View>
              
              {/* Image Indicators */}
              <View style={styles.imageIndicators}>
                <View style={[styles.indicator, styles.indicatorActive]} />
                <View style={styles.indicator} />
                <View style={styles.indicator} />
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

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="volume-high" size={20} color={MaterialYouTheme.primary.primary50} />
              <Text style={styles.actionText}>發音</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create" size={20} color={MaterialYouTheme.primary.primary50} />
              <Text style={styles.actionText}>練習</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share" size={20} color={MaterialYouTheme.primary.primary50} />
              <Text style={styles.actionText}>分享</Text>
            </TouchableOpacity>
          </View>
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
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: MaterialYouTheme.primary.primary95,
    borderRadius: BorderRadius.md,
    ...Elevation.level1,
  },
  actionText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.primary.primary30,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
});

export default WordDetailModal;

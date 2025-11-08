// SOUL/app/(tabs)/education/word-learning/components/WordLearningCard.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius } from '../MaterialYouTheme';
import { useLearningTracking } from '../hooks/useLearningTracking';

const WordLearningCard = ({ word, onWordLearned, onWordMastered }) => {
  const {
    recording,
    recordWordView,
    recordWordLearned,
    recordWordPractice,
    recordWordMastered,
  } = useLearningTracking();

  const [viewStartTime, setViewStartTime] = useState(null);
  const [isLearned, setIsLearned] = useState(false);
  const [isMastered, setIsMastered] = useState(false);

  // 當組件掛載時記錄查看
  useEffect(() => {
    if (word?._id) {
      setViewStartTime(Date.now());
      recordWordView(word._id);
    }

    // 清理：當組件卸載時記錄總查看時間
    return () => {
      if (viewStartTime && word?._id) {
        const timeSpent = Math.round((Date.now() - viewStartTime) / 1000); // 轉換為秒
        recordWordView(word._id, timeSpent);
      }
    };
  }, [word?._id]);

  const handleMarkAsLearned = async () => {
    if (!word?._id || isLearned) return;

    const timeSpent = viewStartTime ? Math.round((Date.now() - viewStartTime) / 1000) : 0; // 轉換為秒
    console.log('📚 標記為已學習:', { wordId: word._id, timeSpent });
    
    const success = await recordWordLearned(word._id, timeSpent, 'medium');

    if (success) {
      console.log('✅ 學習記錄成功');
      setIsLearned(true);
      onWordLearned?.(word);
      Alert.alert('太棒了！', '已記錄你學會了這個單詞');
    } else {
      console.log('❌ 學習記錄失敗');
    }
  };

  const handleMarkAsMastered = async () => {
    if (!word?._id || isMastered) return;

    const timeSpent = viewStartTime ? Math.round((Date.now() - viewStartTime) / 1000) : 0; // 轉換為秒
    const success = await recordWordMastered(word._id, timeSpent);

    if (success) {
      setIsMastered(true);
      onWordMastered?.(word);
      Alert.alert('恭喜！', '你已經完全掌握了這個單詞');
    }
  };

  const handlePractice = async (isCorrect) => {
    if (!word?._id) return;

    const timeSpent = 5; // 練習時間 5秒
    await recordWordPractice(word._id, timeSpent, isCorrect, 'medium');
  };

  if (!word) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 單詞標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>{word.title}</Text>
        <View style={styles.statusBadges}>
          {isLearned && (
            <View style={[styles.badge, styles.learnedBadge]}>
              <Ionicons name="checkmark" size={12} color="white" />
              <Text style={styles.badgeText}>已學習</Text>
            </View>
          )}
          {isMastered && (
            <View style={[styles.badge, styles.masteredBadge]}>
              <Ionicons name="star" size={12} color="white" />
              <Text style={styles.badgeText}>已掌握</Text>
            </View>
          )}
        </View>
      </View>

      {/* 單詞內容 */}
      <Text style={styles.content}>{word.content}</Text>

      {/* 分類標籤 */}
      {word.categories && word.categories.length > 0 && (
        <View style={styles.categories}>
          {word.categories.map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 操作按鈕 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isLearned && styles.actionButtonDisabled]}
          onPress={handleMarkAsLearned}
          disabled={isLearned || recording}
        >
          <Ionicons 
            name={isLearned ? "checkmark-circle" : "school"} 
            size={18} 
            color={isLearned ? MaterialYouTheme.neutral.neutral60 : MaterialYouTheme.primary.primary40} 
          />
          <Text style={[styles.actionText, isLearned && styles.actionTextDisabled]}>
            {isLearned ? '已學習' : '標記為已學習'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.masteredButton, isMastered && styles.actionButtonDisabled]}
          onPress={handleMarkAsMastered}
          disabled={isMastered || recording || !isLearned}
        >
          <Ionicons 
            name={isMastered ? "star" : "star-outline"} 
            size={18} 
            color={isMastered ? MaterialYouTheme.neutral.neutral60 : MaterialYouTheme.secondary.secondary40} 
          />
          <Text style={[styles.actionText, isMastered && styles.actionTextDisabled]}>
            {isMastered ? '已掌握' : '標記為掌握'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 練習按鈕 */}
      <View style={styles.practiceButtons}>
        <TouchableOpacity
          style={[styles.practiceButton, styles.correctButton]}
          onPress={() => handlePractice(true)}
          disabled={recording}
        >
          <Ionicons name="thumbs-up" size={16} color="white" />
          <Text style={styles.practiceButtonText}>練習正確</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.practiceButton, styles.incorrectButton]}
          onPress={() => handlePractice(false)}
          disabled={recording}
        >
          <Ionicons name="thumbs-down" size={16} color="white" />
          <Text style={styles.practiceButtonText}>練習錯誤</Text>
        </TouchableOpacity>
      </View>

      {recording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>記錄中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    elevation: 2,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral10,
    flex: 1,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  learnedBadge: {
    backgroundColor: MaterialYouTheme.primary.primary40,
  },
  masteredBadge: {
    backgroundColor: MaterialYouTheme.secondary.secondary40,
  },
  badgeText: {
    ...Typography.labelSmall,
    color: 'white',
  },
  content: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral30,
    marginBottom: Spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryTag: {
    backgroundColor: MaterialYouTheme.tertiary.tertiary90,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.tertiary.tertiary20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: MaterialYouTheme.primary.primary90,
    gap: Spacing.xs,
  },
  masteredButton: {
    backgroundColor: MaterialYouTheme.secondary.secondary90,
  },
  actionButtonDisabled: {
    backgroundColor: MaterialYouTheme.neutral.neutral90,
  },
  actionText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.primary.primary40,
  },
  actionTextDisabled: {
    color: MaterialYouTheme.neutral.neutral60,
  },
  practiceButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  practiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  correctButton: {
    backgroundColor: MaterialYouTheme.success?.success40 || '#4CAF50',
  },
  incorrectButton: {
    backgroundColor: MaterialYouTheme.error.error40,
  },
  practiceButtonText: {
    ...Typography.labelMedium,
    color: 'white',
  },
  recordingIndicator: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  recordingText: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.primary.primary50,
    fontStyle: 'italic',
  },
});

export default WordLearningCard;

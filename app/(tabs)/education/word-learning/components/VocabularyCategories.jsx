import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation, ColorUtils } from '../MaterialYouTheme';

const VocabularyCategories = ({ onCategorySelect, onLearningLevelSelect, selectedCategory, selectedLearningLevel }) => {
  const [categories, setCategories] = useState([]);
  const [learningLevels, setLearningLevels] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏷️ 正在獲取分類數據...');
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = response.data;
      console.log('🏷️ 分類數據獲取成功:', data);
      
      setCategories(data.categories || []);
      setLearningLevels(data.learning_levels || []);
      setVolumes(data.volumes || []);
      console.log('🏷️ 已設定分類:', data.categories?.length || 0, '個');
      setRetryCount(0); // 重置重試計數
    } catch (error) {
      console.error('獲取分類失敗:', error);
      setError('無法載入分類資料');
      
      // 自動重試邏輯
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCategories();
        }, 2000 * (retryCount + 1)); // 遞增延遲
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchCategories();
  };

  const getLearningLevelDisplayName = (level) => {
    const levelMap = {
      'beginner': '🟢 初學者',
      'intermediate': '🟡 進階者',
      'advanced': '🔴 熟練者'
    };
    return levelMap[level] || level;
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      '生活用語': '🏠',
      '情感表達': '💭',
      '動作描述': '🏃‍♂️',
      '物品名稱': '📱',
      '其他': '🔤',
      // 兼容舊的分類名稱
      '家庭生活': '🏠',
      '日常動作': '🏃‍♂️',
      '數字時間': '🕐',
      '動物自然': '🦁',
      '人物關係': '👥',
      '食物飲品': '🍽️',
      '身體健康': '💪',
      '地點場所': '📍',
      '物品工具': '📱'
    };
    return iconMap[categoryName] || '📝';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MaterialYouTheme.primary.primary50} />
        <Text style={styles.loadingText}>
          {retryCount > 0 ? `重試中 (${retryCount}/2)...` : '載入分類中...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Text style={styles.errorIcon}>😔</Text>
        </View>
        <Text style={styles.errorTitle}>載入失敗</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 如果沒有分類數據，顯示提示
  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>暫無分類</Text>
        <Text style={styles.emptyMessage}>正在載入分類數據...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, Platform.OS === 'web' && { minHeight: 400 }]} 
      contentContainerStyle={Platform.OS === 'web' ? { flexGrow: 1 } : {}}
      showsVerticalScrollIndicator={false}
    >
      {/* 主題分類選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>主題分類</Text>
        <Text style={styles.sectionSubtitle}>選擇感興趣的學習主題</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={`category-${index}-${category}`}
              style={[
                styles.categoryCard,
                selectedCategory === category && styles.selectedCategoryCard
              ]}
              onPress={() => onCategorySelect(category)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(category)}
                </Text>
              </View>
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category && styles.selectedCategoryTitle
              ]}>
                {category}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryCount}>
                  詞彙
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 清除篩選器 */}
      {(selectedCategory || selectedLearningLevel) && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onCategorySelect('');
              onLearningLevelSelect('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>清除所有篩選</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  section: {
    backgroundColor: MaterialYouTheme.neutral.neutral95,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level1,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.primary.primary30,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    marginBottom: Spacing.md,
  },
  levelContainer: {
    gap: Spacing.sm,
  },
  levelChip: {
    backgroundColor: MaterialYouTheme.secondary.secondary90,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: MaterialYouTheme.secondary.secondary80,
    overflow: 'hidden',
  },
  selectedLevelChip: {
    backgroundColor: MaterialYouTheme.primary.primary90,
    borderColor: MaterialYouTheme.primary.primary50,
  },
  levelChipContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  levelChipText: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.secondary.secondary30,
    fontWeight: '500',
  },
  selectedLevelChipText: {
    color: MaterialYouTheme.primary.primary30,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Platform.OS === 'web' ? Spacing.sm : undefined,
    marginHorizontal: Platform.OS === 'web' ? -Spacing.sm/2 : 0,
  },
  categoryCard: {
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '48%',
    backgroundColor: MaterialYouTheme.secondary.secondary95,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MaterialYouTheme.secondary.secondary90,
    minHeight: 100,
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'web' ? 0 : Spacing.sm,
  },
  selectedCategoryCard: {
    backgroundColor: MaterialYouTheme.primary.primary95,
    borderColor: MaterialYouTheme.primary.primary60,
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MaterialYouTheme.secondary.secondary80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.secondary.secondary20,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  selectedCategoryTitle: {
    color: MaterialYouTheme.primary.primary20,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: MaterialYouTheme.tertiary.tertiary90,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  categoryCount: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.tertiary.tertiary30,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: MaterialYouTheme.error.error90,
    borderColor: MaterialYouTheme.error.error50,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  clearButtonText: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.error.error30,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MaterialYouTheme.error.error90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.error.error30,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessage: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: MaterialYouTheme.primary.primary50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  retryButtonText: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.primary.primary99,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    minHeight: 200,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral30,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyMessage: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VocabularyCategories;

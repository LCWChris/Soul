import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../../themes/MaterialYouTheme';
import { getWordStats } from '@/utils/word-stats';

const LearningProgress = ({ selectedCategory, selectedLevel, selectedDifficultyLevel, selectedLearningStatus }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedCategory, selectedLevel, selectedDifficultyLevel, selectedLearningStatus]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 構建篩選條件
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedDifficultyLevel) filters.level = selectedDifficultyLevel;
      
      const statsData = await getWordStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('?��?統�圖標��?失�?:', error);
      // 設置默�?統�?
      setStats({
        totalWords: 0,
        favoriteWords: 0,
        notStarted: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
        progressRate: 0,
        todayRecommendation: {
          newWords: 0,
          reviewWords: 0,
          masteredToday: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>載入統�圖標��?...</Text>
        </View>
      </View>
    );
  }

  if (!stats) return null;

  const { totalWords, favoriteWords, notStarted, learning, reviewing, mastered, progressRate, todayRecommendation } = stats;

  return (
    <View style={styles.container}>
      {/* 主�圖標�度?��? */}
      <View style={styles.mainCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>學�圖標�度</Text>
          <Text style={styles.progressPercentage}>{progressRate}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressRate}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalWords}</Text>
            <Text style={styles.statLabel}>總單字</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{learning + reviewing + mastered}</Text>
            <Text style={styles.statLabel}>已學習</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mastered}</Text>
            <Text style={styles.statLabel}>已掌握</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteWords}</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
        </View>
      </View>

      {/* 學習狀態詳細統計 */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>學習狀態分布</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: MaterialYouTheme.neutral.neutral50 }]} />
            <Text style={styles.statusCount}>{notStarted}</Text>
            <Text style={styles.statusLabel}>未開始</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: MaterialYouTheme.tertiary.tertiary40 }]} />
            <Text style={styles.statusCount}>{learning}</Text>
            <Text style={styles.statusLabel}>學習中</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: MaterialYouTheme.secondary.secondary40 }]} />
            <Text style={styles.statusCount}>{reviewing}</Text>
            <Text style={styles.statusLabel}>複習中</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: "#2563EB" }]} />
            <Text style={styles.statusCount}>{mastered}</Text>
            <Text style={styles.statusLabel}>已掌握</Text>
          </View>
        </View>
      </View>

      {/* 今日學習建議 */}
      <View style={styles.recommendationCard}>
        <Text style={styles.recommendationTitle}>今日學習建議</Text>
        <View style={styles.recommendationGrid}>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationNumber}>{todayRecommendation.newWords}</Text>
            <Text style={styles.recommendationLabel}>新單字</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationNumber}>{todayRecommendation.reviewWords}</Text>
            <Text style={styles.recommendationLabel}>待複習</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationNumber}>{todayRecommendation.masteredToday}</Text>
            <Text style={styles.recommendationLabel}>今日掌握</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral50,
  },
  mainCard: {
    backgroundColor: "#EFF6FF", // 淡�圖標��圖標?
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    ...Typography.titleLarge,
    color: "#1E40AF", // 深�圖標��?�?
    fontWeight: '600',
  },
  progressPercentage: {
    ...Typography.headlineSmall,
    color: "#2563EB", // ?�色?��?�?
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#DBEAFE", // 淡�圖標��圖標?
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: "#2563EB", // ?�色?�度�?
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...Typography.titleMedium,
    color: "#1E40AF", // 深�圖標�數�?
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: "#2563EB", // ?�色標籤
  },
  detailCard: {
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level1,
  },
  detailTitle: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  statusCount: {
    ...Typography.titleSmall,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusLabel: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.neutral.neutral50,
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: MaterialYouTheme.tertiary.tertiary90,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level1,
  },
  recommendationTitle: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.tertiary.tertiary30,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  recommendationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationItem: {
    alignItems: 'center',
    flex: 1,
  },
  recommendationNumber: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.tertiary.tertiary40,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recommendationLabel: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.tertiary.tertiary50,
    textAlign: 'center',
  },
});

export default LearningProgress;

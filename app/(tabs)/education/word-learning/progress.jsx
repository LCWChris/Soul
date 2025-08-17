import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from './MaterialYouTheme';
import MaterialTopAppBar from './components/MaterialTopAppBar';

const { width: screenWidth } = Dimensions.get('window');

const ProgressScreen = () => {
  const router = useRouter();
  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    // 模擬進度統計數據
    const mockProgress = {
      overall: {
        totalWords: 1250,
        learnedWords: 485,
        masteredWords: 168,
        progressPercentage: 39,
        streak: 7,
        totalStudyTime: 125, // 分鐘
      },
      categories: [
        { name: '身體健康', total: 250, learned: 120, mastered: 60, percentage: 48 },
        { name: '其他', total: 220, learned: 110, mastered: 50, percentage: 50 },
        { name: '生活用語', total: 200, learned: 95, mastered: 45, percentage: 48 },
        { name: '情感表達', total: 150, learned: 85, mastered: 40, percentage: 57 },
        { name: '動作描述', total: 180, learned: 75, mastered: 28, percentage: 42 },
      ],
      levels: [
        { name: 'beginner', displayName: '初學', total: 450, learned: 285, percentage: 63 },
        { name: 'intermediate', displayName: '進階', total: 500, learned: 150, percentage: 30 },
        { name: 'advanced', displayName: '熟練', total: 300, learned: 50, percentage: 17 },
      ],
      recentActivity: [
        { date: '今天', wordsLearned: 12, timeSpent: 25 },
        { date: '昨天', wordsLearned: 15, timeSpent: 30 },
        { date: '2天前', wordsLearned: 8, timeSpent: 18 },
        { date: '3天前', wordsLearned: 20, timeSpent: 35 },
        { date: '4天前', wordsLearned: 10, timeSpent: 22 },
      ]
    };
    setProgressData(mockProgress);
  };

  const ProgressCard = ({ title, children }) => (
    <View style={styles.progressCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const StatItem = ({ icon, label, value, color = MaterialYouTheme.primary.primary50 }) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statText}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const ProgressBar = ({ percentage, color = MaterialYouTheme.primary.primary50 }) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarTrack}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.progressBarText}>{percentage}%</Text>
    </View>
  );

  if (!progressData.overall) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <MaterialTopAppBar
            title="學習統計"
            onBackPress={() => router.back()}
          />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={MaterialYouTheme.neutral.neutral99} barStyle="dark-content" />
        
        <MaterialTopAppBar
          title="學習統計"
          subtitle="你的學習進度和成就"
          onBackPress={() => router.back()}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 總體統計 */}
          <ProgressCard title="總體進度">
            <View style={styles.overallStats}>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatNumber}>{progressData.overall.learnedWords}</Text>
                <Text style={styles.mainStatLabel}>已學習單詞</Text>
              </View>
              <View style={styles.statsGrid}>
                <StatItem 
                  icon="library" 
                  label="總詞彙" 
                  value={progressData.overall.totalWords}
                  color={MaterialYouTheme.tertiary.tertiary50}
                />
                <StatItem 
                  icon="checkmark-circle" 
                  label="已掌握" 
                  value={progressData.overall.masteredWords}
                  color={MaterialYouTheme.secondary.secondary50}
                />
                <StatItem 
                  icon="flame" 
                  label="連續天數" 
                  value={`${progressData.overall.streak}天`}
                  color={MaterialYouTheme.error.error50}
                />
                <StatItem 
                  icon="time" 
                  label="學習時間" 
                  value={`${progressData.overall.totalStudyTime}分鐘`}
                  color={MaterialYouTheme.primary.primary50}
                />
              </View>
            </View>
          </ProgressCard>

          {/* 分類進度 */}
          <ProgressCard title="分類進度">
            {progressData.categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryStats}>
                    {category.learned}/{category.total}
                  </Text>
                </View>
                <ProgressBar percentage={category.percentage} />
              </View>
            ))}
          </ProgressCard>

          {/* 級別進度 */}
          <ProgressCard title="級別進度">
            {progressData.levels.map((level, index) => (
              <View key={index} style={styles.levelItem}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelName}>{level.displayName}</Text>
                  <Text style={styles.levelStats}>
                    {level.learned}/{level.total}
                  </Text>
                </View>
                <ProgressBar 
                  percentage={level.percentage} 
                  color={getLevelColor(level.name)}
                />
              </View>
            ))}
          </ProgressCard>

          {/* 最近活動 */}
          <ProgressCard title="最近活動">
            {progressData.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Text style={styles.activityDate}>{activity.date}</Text>
                <View style={styles.activityStats}>
                  <Text style={styles.activityStat}>
                    📚 {activity.wordsLearned} 個單詞
                  </Text>
                  <Text style={styles.activityStat}>
                    ⏰ {activity.timeSpent} 分鐘
                  </Text>
                </View>
              </View>
            ))}
          </ProgressCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const getLevelColor = (level) => {
  switch (level) {
    case 'beginner':
      return MaterialYouTheme.tertiary.tertiary50;
    case 'intermediate':
      return MaterialYouTheme.secondary.secondary50;
    case 'advanced':
      return MaterialYouTheme.error.error50;
    default:
      return MaterialYouTheme.primary.primary50;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
  },
  safeArea: {
    flex: 1,
    paddingTop: 0, // TopAppBar 現在已經包含安全間距，所以這裡不需要額外間距
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral50,
  },
  progressCard: {
    backgroundColor: MaterialYouTheme.neutral.neutral95,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level1,
  },
  cardTitle: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  overallStats: {
    alignItems: 'center',
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainStatNumber: {
    ...Typography.displayMedium,
    color: MaterialYouTheme.primary.primary50,
    fontWeight: '700',
  },
  mainStatLabel: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.neutral.neutral50,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (screenWidth - Spacing.md * 4 - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.neutral.neutral50,
  },
  categoryItem: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral30,
    fontWeight: '500',
  },
  categoryStats: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral50,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: MaterialYouTheme.neutral.neutral90,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.neutral.neutral40,
    width: 35,
    textAlign: 'right',
  },
  levelItem: {
    marginBottom: Spacing.md,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  levelName: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral30,
    fontWeight: '500',
  },
  levelStats: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral50,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutral.neutral90,
  },
  activityDate: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral30,
    fontWeight: '500',
    width: 60,
  },
  activityStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: Spacing.md,
  },
  activityStat: {
    ...Typography.bodySmall,
    color: MaterialYouTheme.neutral.neutral50,
  },
});

export default ProgressScreen;

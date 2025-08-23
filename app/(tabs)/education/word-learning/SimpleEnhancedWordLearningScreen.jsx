import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from './MaterialYouTheme';
// import { useFavorites } from '../../../../utils/favorites.js'; // 暫時註解掉

const { width: screenWidth } = Dimensions.get('window');

const SimpleEnhancedWordLearningScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  // const { favorites } = useFavorites(); // 暫時註解掉

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={MaterialYouTheme.surface.surface} />
        
        {/* 簡化版頭部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>單詞學習 - Enhanced</Text>
          <Text style={styles.headerSubtitle}>Material You 風格界面</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[MaterialYouTheme.primary.primary40]}
              tintColor={MaterialYouTheme.primary.primary40}
            />
          }
        >
          {/* 統計卡片 */}
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsTitle}>學習統計</Text>
            <View style={styles.statisticsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="library-outline" size={24} color={MaterialYouTheme.primary.primary40} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>總單詞</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle-outline" size={24} color={MaterialYouTheme.primary.primary40} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>已掌握</Text>
              </View>
            </View>
          </View>

          {/* 佔位內容 */}
          <View style={styles.placeholderCard}>
            <Ionicons name="construct-outline" size={48} color={MaterialYouTheme.neutralVariant.neutralVariant50} />
            <Text style={styles.placeholderTitle}>Enhanced UI Components</Text>
            <Text style={styles.placeholderText}>
              Material You 風格的增強版組件正在建構中...
            </Text>
            <Text style={styles.placeholderText}>
              包含了動畫效果、漸層背景、進度指示器等功能
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: MaterialYouTheme.primary.primary90,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Elevation.level2,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: MaterialYouTheme.primary.primary10,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.primary.primary20,
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statisticsCard: {
    backgroundColor: MaterialYouTheme.primaryContainer.primaryContainer || MaterialYouTheme.primary.primary95,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Elevation.level1,
  },
  statisticsTitle: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.primary.primary10,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.primary.primary10,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.primary.primary20,
    marginTop: Spacing.xs,
  },
  placeholderCard: {
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant || MaterialYouTheme.neutral.neutral95,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Elevation.level1,
  },
  placeholderTitle: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant || MaterialYouTheme.neutral.neutral10,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  placeholderText: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant || MaterialYouTheme.neutral.neutral30,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: Spacing.sm,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default SimpleEnhancedWordLearningScreen;

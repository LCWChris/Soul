import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation, ColorUtils } from '../themes/MaterialYouTheme';
import EnhancedVocabularyCard from './components/EnhancedVocabularyCard';
import MaterialButton, { MaterialFAB, MaterialIconButton } from './components/MaterialButton';
// import { useWordLearning } from './hooks/useWordLearning'; // 暫時註解掉
// import { useFavorites } from '../../../../utils/favorites.js'; // 暫時註解掉

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EnhancedWordLearningScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    level: 'all',
    category: 'all',
    status: 'all',
    showFavorites: false,
  });
  const [sortBy, setSortBy] = useState('alphabetical');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 暫時使用 mock data
  const words = [];
  const loading = false;
  const error = null;
  const refreshWords = () => {};
  
  // 暫時 mock favorites
  const favorites = [];
  const toggleFavorite = () => {};

  // 動畫值
  const headerOpacity = new Animated.Value(1);
  const filterPanelHeight = new Animated.Value(0);
  const scrollY = new Animated.Value(0);

  // 過濾和排序邏輯
  const filteredAndSortedWords = useMemo(() => {
    if (!words) return [];

    let filtered = words.filter(word => {
      // 搜尋過濾
      if (searchQuery && !word.word.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !word.definition.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 等級過濾
      if (selectedFilters.level !== 'all' && word.level !== selectedFilters.level) {
        return false;
      }

      // 分類過濾
      if (selectedFilters.category !== 'all' && word.category !== selectedFilters.category) {
        return false;
      }

      // 學習狀態過濾
      if (selectedFilters.status !== 'all' && word.learningStatus !== selectedFilters.status) {
        return false;
      }

      // 收藏過濾
      if (selectedFilters.showFavorites && !favorites.includes(word.word)) {
        return false;
      }

      return true;
    });

    // 排序
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'level':
        const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
        filtered.sort((a, b) => (levelOrder[a.level] || 5) - (levelOrder[b.level] || 5));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastReviewed || 0) - new Date(a.lastReviewed || 0));
        break;
      case 'difficulty':
        filtered.sort((a, b) => (b.difficultyScore || 0) - (a.difficultyScore || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [words, selectedFilters, sortBy, searchQuery, favorites]);

  // 統計數據
  const statistics = useMemo(() => {
    if (!words) return { total: 0, mastered: 0, learning: 0, favorites: 0 };

    return {
      total: words.length,
      mastered: words.filter(w => w.learningStatus === 'mastered').length,
      learning: words.filter(w => w.learningStatus === 'learning').length,
      favorites: words.filter(w => favorites.includes(w.word)).length,
    };
  }, [words, favorites]);

  // 刷新處理
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWords();
    } finally {
      setRefreshing(false);
    }
  };

  // 切換過濾面板
  const toggleFilterPanel = () => {
    const toValue = showFilterPanel ? 0 : 200;
    setShowFilterPanel(!showFilterPanel);
    
    Animated.spring(filterPanelHeight, {
      toValue,
      useNativeDriver: false,
      tension: 300,
      friction: 25,
    }).start();
  };

  // 渲染統計卡片
  const renderStatisticsCards = () => (
    <View style={styles.statisticsContainer}>
      <LinearGradient
        colors={ColorUtils.getGradientColors('primary')}
        style={styles.statisticsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statisticsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="library-outline" size={24} color={MaterialYouTheme.primary.primary10} />
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>總單詞</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={MaterialYouTheme.primary.primary10} />
            <Text style={styles.statNumber}>{statistics.mastered}</Text>
            <Text style={styles.statLabel}>已掌握</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color={MaterialYouTheme.primary.primary10} />
            <Text style={styles.statNumber}>{statistics.learning}</Text>
            <Text style={styles.statLabel}>學習中</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="heart-outline" size={24} color={MaterialYouTheme.primary.primary10} />
            <Text style={styles.statNumber}>{statistics.favorites}</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  // 渲染過濾器面板
  const renderFilterPanel = () => (
    <Animated.View style={[styles.filterPanel, { height: filterPanelHeight }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>等級</Text>
          <View style={styles.filterButtons}>
            {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
              <MaterialButton
                key={level}
                title={level === 'all' ? '全部' : level}
                variant={selectedFilters.level === level ? 'filled' : 'outlined'}
                size="small"
                onPress={() => setSelectedFilters(prev => ({ ...prev, level }))}
                style={styles.filterButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>排序</Text>
          <View style={styles.filterButtons}>
            {[
              { key: 'alphabetical', label: '字母' },
              { key: 'level', label: '等級' },
              { key: 'recent', label: '最近' },
              { key: 'difficulty', label: '難度' }
            ].map(sort => (
              <MaterialButton
                key={sort.key}
                title={sort.label}
                variant={sortBy === sort.key ? 'filled' : 'outlined'}
                size="small"
                onPress={() => setSortBy(sort.key)}
                style={styles.filterButton}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // 渲染頭部
  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={ColorUtils.getGradientColors('primary')}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>單詞學習</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredAndSortedWords.length} 個單詞
                </Text>
              </View>
              
              <View style={styles.headerActions}>
                <MaterialIconButton
                  icon="search-outline"
                  variant="filled"
                  onPress={() => {/* 搜尋功能 */}}
                  style={styles.headerButton}
                />
                <MaterialIconButton
                  icon={showFilterPanel ? "filter" : "filter-outline"}
                  variant={showFilterPanel ? "filled" : "standard"}
                  onPress={toggleFilterPanel}
                  style={styles.headerButton}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  // 渲染單詞列表
  const renderWordList = () => (
    <View style={styles.wordListContainer}>
      {filteredAndSortedWords.map((word, index) => (
        <EnhancedVocabularyCard
          key={`${word.word}-${index}`}
          word={word.word}
          pronunciation={word.pronunciation}
          definition={word.definition}
          category={word.category}
          level={word.level}
          imageUrl={word.image_url}
          videoUrl={word.video_url}
          example={word.example}
          learningStatus={word.learningStatus}
          isFavorite={favorites.includes(word.word)}
          onToggleFavorite={() => toggleFavorite(word.word)}
          onPress={() => {/* 單詞詳情 */}}
          onProgressChange={() => {/* 進度更新 */}}
          style={[
            styles.wordCard,
            index === 0 && styles.firstCard,
            index === filteredAndSortedWords.length - 1 && styles.lastCard
          ]}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>載入失敗</Text>
        <MaterialButton
          title="重試"
          onPress={handleRefresh}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[MaterialYouTheme.primary.primary40]}
            tintColor={MaterialYouTheme.primary.primary40}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderStatisticsCards()}
        {renderFilterPanel()}
        {renderWordList()}
        
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      <MaterialFAB
        icon="add-outline"
        size="medium"
        variant="primary"
        style={styles.fab}
        onPress={() => {/* 添加單詞 */}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: MaterialYouTheme.primary.primary100,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.primary.primary90,
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    backgroundColor: MaterialYouTheme.primary.primary80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  statisticsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statisticsGradient: {
    borderRadius: BorderRadius.xl,
    ...Elevation.level2,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
  },
  statCard: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
  filterPanel: {
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Elevation.level1,
  },
  filterScroll: {
    padding: Spacing.md,
  },
  filterGroup: {
    marginRight: Spacing.xl,
  },
  filterGroupTitle: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    marginRight: Spacing.sm,
  },
  wordListContainer: {
    paddingHorizontal: Spacing.sm,
  },
  wordCard: {
    marginVertical: Spacing.xs,
  },
  firstCard: {
    marginTop: 0,
  },
  lastCard: {
    marginBottom: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    right: Spacing.lg,
    ...Elevation.level4,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurface.onSurface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.surface.surface,
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.error.error40,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
  },
});

export default EnhancedWordLearningScreen;

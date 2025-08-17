import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

// Material You Components
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from './MaterialYouTheme';
import MaterialTopAppBar from './components/MaterialTopAppBar';
import MaterialSearchBar from './components/MaterialSearchBar';
import VocabularyCard from './components/VocabularyCard';
import MaterialFAB from './components/MaterialFAB';
import LearningProgress from './components/LearningProgress';
import VocabularyCategories from './components/VocabularyCategories';
import WordDetailModal from './components/WordDetailModal';

// Services and Utilities
import { API_CONFIG } from '@/constants/api';
import { getFavorites, toggleFavorite as toggleFavoriteUtil } from '@/utils/favorites';
import axios from 'axios';

const MaterialWordLearningScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showCategories, setShowCategories] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showWordDetail, setShowWordDetail] = useState(false);

  useEffect(() => {
    // 初始化時強制顯示分類選擇
    setWords([]);
    setShowCategories(true);
    setSelectedCategory('');
    setSelectedLevel('');
    setSearchQuery('');
    loadFavorites();
  }, []);

  useEffect(() => {
    if (selectedCategory || selectedLevel || searchQuery) {
      fetchWords();
      setShowCategories(false);
    } else {
      setShowCategories(true);
      setWords([]);
    }
  }, [selectedCategory, selectedLevel, searchQuery]);

  const loadFavorites = async () => {
    try {
      const userFavorites = await getFavorites();
      setFavorites(new Set(userFavorites));
    } catch (error) {
      console.error('載入收藏失敗:', error);
      // 使用空的 Set 作為備用
      setFavorites(new Set());
    }
  };

  const fetchWords = async () => {
    if (!selectedCategory && !selectedLevel && !searchQuery) {
      setWords([]);
      setShowCategories(true);
      return; // 如果沒有選擇任何條件，不進行 API 調用
    }
    
    setLoading(true);
    try {
      const params = {
        category: selectedCategory,
        level: selectedLevel,
        search: searchQuery,
        limit: 20,
      };

      // 只有當真正有選擇條件時才調用 API
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`, { params });
      const wordsData = response.data.words || response.data || [];
      setWords(wordsData);
      setShowCategories(false); // 有數據時隱藏分類選擇
    } catch (error) {
      console.error('獲取單詞失敗:', error);
      
      // 只有在真正選擇了條件時才提供示例數據
      if (selectedCategory || selectedLevel || searchQuery) {
        const mockWords = [
          {
            id: 1,
            word: 'apple',
            pronunciation: 'ˈæp(ə)l',
            definition: '蘋果；一種常見的水果',
            category: 'food',
            level: 'beginner',
            example: 'I like to eat apples.'
          },
          {
            id: 2,
            word: 'hello',
            pronunciation: 'həˈləʊ',
            definition: '你好；用於問候的詞語',
            category: 'basic',
            level: 'beginner',
            example: 'Hello, how are you?'
          },
          {
            id: 3,
            word: 'beautiful',
            pronunciation: 'ˈbjuːtɪf(ə)l',
            definition: '美麗的；令人愉悅的',
            category: 'adjective',
            level: 'intermediate',
            example: 'She has a beautiful smile.'
          }
        ];
        
        // 根據搜尋條件過濾模擬數據
        let filteredWords = mockWords;
        if (searchQuery) {
          filteredWords = mockWords.filter(word => 
            word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            word.definition.includes(searchQuery)
          );
        }
        if (selectedLevel) {
          filteredWords = filteredWords.filter(word => word.level === selectedLevel);
        }
        if (selectedCategory) {
          filteredWords = filteredWords.filter(word => word.category === selectedCategory);
        }
        
        setWords(filteredWords);
        setShowCategories(false);
      } else {
        setWords([]);
        setShowCategories(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWords();
    await loadFavorites();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (word) => {
    try {
      const wordId = word.id || word._id; // 支援不同的 ID 格式
      const newFavorites = new Set(favorites);
      if (favorites.has(wordId)) {
        newFavorites.delete(wordId);
      } else {
        newFavorites.add(wordId);
      }
      setFavorites(newFavorites);
      await toggleFavoriteUtil(wordId);
    } catch (error) {
      console.error('切換收藏失敗:', error);
      // 如果操作失敗，可以選擇還原狀態或顯示錯誤訊息
    }
  };

  const handleWordPress = (word) => {
    setSelectedWord(word);
    setShowWordDetail(true);
    console.log('Word pressed:', word);
  };

  const handleBackPress = () => {
    // 如果有選擇分類或級別，則重置選擇並顯示分類頁面
    if (selectedCategory || selectedLevel || searchQuery) {
      setSelectedCategory('');
      setSelectedLevel('');
      setSearchQuery('');
      setWords([]);
      setShowCategories(true);
    } else {
      // 如果沒有選擇，則導航回上一頁
      router.back();
    }
  };

  const renderWordCard = ({ item }) => {
    const wordId = item.id || item._id;
    return (
      <VocabularyCard
        word={item.word || item.title}
        pronunciation={item.pronunciation}
        definition={item.definition || item.content}
        category={item.category}
        level={item.level}
        image_url={item.image_url}
        isFavorite={favorites.has(wordId)}
        onToggleFavorite={() => handleToggleFavorite(item)}
        onPress={() => handleWordPress(item)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>選擇學習方式</Text>
      <Text style={styles.emptyStateMessage}>
        選擇學習程度或主題分類來開始學習單詞
      </Text>
    </View>
  );

  const topBarActions = [
    {
      icon: 'heart',
      onPress: () => router.push('/education/word-learning/favorites'),
    },
    {
      icon: 'stats-chart',
      onPress: () => router.push('/education/word-learning/progress'),
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={MaterialYouTheme.neutral.neutral99} barStyle="dark-content" />
        
        <MaterialTopAppBar
          title="單詞學習"
          subtitle={selectedCategory || selectedLevel ? `${selectedCategory} ${selectedLevel}` : undefined}
          actions={topBarActions}
          onBackPress={handleBackPress}
          showBackButton={true} // 始終顯示返回按鈕
          isMainScreen={showCategories} // 當顯示分類選擇時為主屏幕
        />

      <MaterialSearchBar
        placeholder="搜尋單詞..."
        onSearchChange={setSearchQuery}
        value={searchQuery}
      />

      <FlatList
        data={words}
        renderItem={renderWordCard}
        keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[MaterialYouTheme.primary.primary50]}
            tintColor={MaterialYouTheme.primary.primary50}
          />
        }
        ListHeaderComponent={
          <>
            {!loading && (selectedCategory || selectedLevel) && (
              <LearningProgress
                selectedCategory={selectedCategory}
                selectedLevel={selectedLevel}
              />
            )}
            {showCategories && (
              <VocabularyCategories
                onCategorySelect={setSelectedCategory}
                onLearningLevelSelect={setSelectedLevel}
                selectedCategory={selectedCategory}
                selectedLearningLevel={selectedLevel}
              />
            )}
          </>
        }
        ListEmptyComponent={!showCategories && !loading ? renderEmptyState : null}
      />

      <MaterialFAB
        icon="🎯"
        text="測驗"
        onPress={() => router.push('/education/word-learning/quiz')}
        style={styles.fab}
      />

      <WordDetailModal
        visible={showWordDetail}
        word={selectedWord}
        onClose={() => setShowWordDetail(false)}
      />
      </SafeAreaView>
    </View>
  );
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
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral30,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateMessage: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral50,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
});

export default MaterialWordLearningScreen;

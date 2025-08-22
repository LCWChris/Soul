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
import LearningProgress from './components/LearningProgressNew';
import VocabularyCategories from './components/VocabularyCategories';
import LearningProgressSelector from './components/LearningProgressSelector';
import LevelSelector from './components/LevelSelector';
import WordDetailModal from './components/WordDetailModal';

// Services and Utilities
import { API_CONFIG } from '@/constants/api';
import { getFavorites, toggleFavorite as toggleFavoriteUtil } from '@/utils/favorites';
import { 
  updateWordProgress, 
  getWordProgress, 
  filterWordsByProgress, 
  LEARNING_STATUS,
  getLearningProgress
} from '@/utils/learning-progress';
import axios from 'axios';

const MaterialWordLearningScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState(''); // 新增難度等級篩選
  const [selectedLearningStatus, setSelectedLearningStatus] = useState(''); // 新增學習狀態篩選
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [learningProgress, setLearningProgress] = useState({}); // 新增學習進度狀態
  const [showCategories, setShowCategories] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);
  const [showWordDetail, setShowWordDetail] = useState(false);

  useEffect(() => {
    // 初始化時強制顯示分類選擇
    setWords([]);
    setShowCategories(true);
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedDifficultyLevel(''); // 重置難度等級篩選
    setSelectedLearningStatus(''); // 重置學習狀態篩選
    setSearchQuery('');
    loadFavorites();
    loadLearningProgress(); // 載入學習進度
  }, []);

  useEffect(() => {
    if (selectedCategory || selectedLevel || selectedDifficultyLevel || selectedLearningStatus || searchQuery) {
      fetchWords();
      setShowCategories(false);
    } else {
      setShowCategories(true);
      setWords([]);
    }
  }, [selectedCategory, selectedLevel, selectedDifficultyLevel, selectedLearningStatus, searchQuery]);

  // 獲取學習狀態的顯示標籤
  const getProgressLabel = (status) => {
    switch (status) {
      case LEARNING_STATUS.NOT_STARTED:
        return '未開始學習';
      case LEARNING_STATUS.LEARNING:
        return '正在學習';
      case LEARNING_STATUS.REVIEWING:
        return '複習中';
      case LEARNING_STATUS.MASTERED:
        return '已掌握';
      default:
        return '';
    }
  };

  const loadLearningProgress = async () => {
    try {
      console.log('📚 開始載入學習進度...');
      const progressData = await getLearningProgress();
      console.log('📚 載入學習進度結果:', progressData);
      setLearningProgress(progressData);
    } catch (error) {
      console.error('載入學習進度失敗:', error);
      setLearningProgress({});
    }
  };

  const loadFavorites = async () => {
    try {
      console.log('📖 開始載入收藏列表...');
      const userFavorites = await getFavorites();
      console.log('📖 載入收藏結果:', userFavorites);
      setFavorites(new Set(userFavorites));
      console.log('📖 收藏 Set 已更新:', new Set(userFavorites));
    } catch (error) {
      console.error('載入收藏失敗:', error);
      // 使用空的 Set 作為備用
      setFavorites(new Set());
    }
  };

  const fetchWords = async () => {
    if (!selectedCategory && !selectedLevel && !selectedDifficultyLevel && !selectedLearningStatus && !searchQuery) {
      setWords([]);
      setShowCategories(true);
      return; // 如果沒有選擇任何條件，不進行 API 調用
    }
    
    setLoading(true);
    try {
      // 如果選擇了學習狀態，使用本地篩選
      if (selectedLearningStatus) {
        // 先獲取所有單詞，然後根據學習狀態篩選
        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`, { 
          params: { limit: 100 } // 獲取更多數據用於篩選
        });
        const allWords = response.data.words || response.data || [];
        
        // 根據學習狀態篩選
        const filteredWords = await filterWordsByProgress(allWords, selectedLearningStatus);
        setWords(filteredWords);
      } else {
        // 原有的 API 篩選邏輯，添加難度等級支援
        const params = {
          category: selectedCategory,
          level: selectedLevel || selectedDifficultyLevel, // 支援兩種 level 篩選
          search: searchQuery,
          limit: 20,
        };

        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`, { params });
        const wordsData = response.data.words || response.data || [];
        setWords(wordsData);
      }
      
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
      console.log('🔄 嘗試切換收藏:', wordId, word);
      
      const newFavorites = new Set(favorites);
      if (favorites.has(wordId)) {
        newFavorites.delete(wordId);
        console.log('❌ 從本地移除收藏:', wordId);
      } else {
        newFavorites.add(wordId);
        console.log('✅ 添加到本地收藏:', wordId);
      }
      setFavorites(newFavorites);
      
      const result = await toggleFavoriteUtil(wordId);
      console.log('💾 收藏操作結果:', result);
      
      // 重新載入收藏以確保同步
      await loadFavorites();
    } catch (error) {
      console.error('切換收藏失敗:', error);
      // 如果操作失敗，可以選擇還原狀態或顯示錯誤訊息
    }
  };

  const handleWordPress = (word, index) => {
    // 確保傳遞給詳情頁的單詞包含最新的收藏狀態
    const wordId = word.id || word._id;
    const wordWithFavoriteStatus = {
      ...word,
      isFavorite: favorites.has(wordId)
    };
    
    setSelectedWord(wordWithFavoriteStatus);
    setSelectedWordIndex(index);
    setShowWordDetail(true);
  };

  // 處理難度等級選擇
  const handleDifficultyLevelSelection = (level) => {
    console.log('📚 選擇難度等級:', level);
    setSelectedDifficultyLevel(level);
    // 清除其他篩選條件
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedLearningStatus('');
    setSearchQuery('');
  };

  // 處理學習進度選擇
  const handleProgressSelection = (status) => {
    console.log('📚 選擇學習狀態:', status);
    setSelectedLearningStatus(status);
    // 清除其他篩選條件
    setSelectedCategory('');
    setSelectedLevel('');
    setSearchQuery('');
  };

  // 處理單詞學習進度變更
  const handleWordProgressChange = async (wordId) => {
    try {
      // 獲取當前學習狀態
      const currentProgress = await getWordProgress(wordId);
      
      // 狀態循環：未開始 -> 學習中 -> 複習中 -> 已掌握 -> 未開始
      let nextStatus;
      switch (currentProgress.status) {
        case LEARNING_STATUS.NOT_STARTED:
          nextStatus = LEARNING_STATUS.LEARNING;
          break;
        case LEARNING_STATUS.LEARNING:
          nextStatus = LEARNING_STATUS.REVIEWING;
          break;
        case LEARNING_STATUS.REVIEWING:
          nextStatus = LEARNING_STATUS.MASTERED;
          break;
        case LEARNING_STATUS.MASTERED:
          nextStatus = LEARNING_STATUS.NOT_STARTED;
          break;
        default:
          nextStatus = LEARNING_STATUS.LEARNING;
      }

      // 更新學習進度
      await updateWordProgress(wordId, nextStatus);
      
      // 重新載入學習進度數據
      await loadLearningProgress();
      
      console.log('📚 更新學習狀態:', wordId, currentProgress.status, '->', nextStatus);
    } catch (error) {
      console.error('更新學習進度失敗:', error);
    }
  };

  // 處理從詳細頁面傳來的學習進度變化
  const handleDetailProgressChange = async (wordId, newStatus) => {
    console.log('🔄 主頁面：收到詳細頁面學習進度變化:', wordId, newStatus);
    
    // 重新載入學習進度數據
    await loadLearningProgress();
  };

  // 處理從詳細頁面傳來的收藏狀態變化
  const handleDetailFavoriteChange = (wordId, newFavoriteStatus) => {
    console.log('🔄 主頁面：收到詳細頁面收藏變化:', wordId, newFavoriteStatus);
    
    // 更新主頁面的收藏狀態
    if (newFavoriteStatus) {
      setFavorites(prev => new Set([...prev, wordId]));
    } else {
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    }
    
    // 更新 selectedWord 的收藏狀態
    setSelectedWord(prev => prev ? { ...prev, isFavorite: newFavoriteStatus } : prev);
  };

  const handleSwipeLeft = () => {
    if (selectedWordIndex < words.length - 1) {
      const nextWord = words[selectedWordIndex + 1];
      const wordId = nextWord.id || nextWord._id;
      const wordWithFavoriteStatus = {
        ...nextWord,
        isFavorite: favorites.has(wordId)
      };
      setSelectedWord(wordWithFavoriteStatus);
      setSelectedWordIndex(selectedWordIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (selectedWordIndex > 0) {
      const prevWord = words[selectedWordIndex - 1];
      const wordId = prevWord.id || prevWord._id;
      const wordWithFavoriteStatus = {
        ...prevWord,
        isFavorite: favorites.has(wordId)
      };
      setSelectedWord(wordWithFavoriteStatus);
      setSelectedWordIndex(selectedWordIndex - 1);
    }
  };

  const renderWordCard = ({ item, index }) => {
    const wordId = item.id || item._id;
    const wordProgress = learningProgress[wordId];
    
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
        onPress={() => handleWordPress(item, index)}
        learningStatus={wordProgress?.status || LEARNING_STATUS.NOT_STARTED}
        onProgressChange={() => handleWordProgressChange(wordId)}
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

  const handleBackPress = () => {
    if (selectedCategory || selectedLevel || selectedDifficultyLevel || selectedLearningStatus || searchQuery) {
      // 清除所有篩選條件
      setSelectedCategory('');
      setSelectedLevel('');
      setSelectedDifficultyLevel('');
      setSelectedLearningStatus('');
      setSearchQuery('');
      setWords([]);
      setShowCategories(true);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={MaterialYouTheme.neutral.neutral99} barStyle="dark-content" />
        
        <MaterialTopAppBar
          title="單詞學習"
          subtitle={
            selectedLearningStatus ? 
              getProgressLabel(selectedLearningStatus) : 
              selectedDifficultyLevel ?
                `${selectedDifficultyLevel}等級` :
                (selectedCategory || selectedLevel ? `${selectedCategory} ${selectedLevel}` : undefined)
          }
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
            {!loading && (selectedCategory || selectedLevel || selectedDifficultyLevel) && (
              <LearningProgress
                selectedCategory={selectedCategory}
                selectedLevel={selectedLevel}
                selectedDifficultyLevel={selectedDifficultyLevel}
                selectedLearningStatus={selectedLearningStatus}
              />
            )}
            {showCategories && (
              <>
                <LearningProgressSelector
                  onSelectProgress={handleProgressSelection}
                  selectedProgress={selectedLearningStatus}
                  style={{ marginBottom: 20 }}
                />
                <LevelSelector
                  onSelectLevel={handleDifficultyLevelSelection}
                  selectedLevel={selectedDifficultyLevel}
                  style={{ marginBottom: 20 }}
                />
                <VocabularyCategories
                  onCategorySelect={setSelectedCategory}
                  onLearningLevelSelect={setSelectedLevel}
                  selectedCategory={selectedCategory}
                  selectedLearningLevel={selectedLevel}
                />
              </>
            )}
          </>
        }
        ListEmptyComponent={!showCategories && !loading ? renderEmptyState : null}
      />

      <WordDetailModal
        visible={showWordDetail}
        word={selectedWord}
        onClose={() => setShowWordDetail(false)}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onFavoriteChange={handleDetailFavoriteChange}
        onProgressChange={handleDetailProgressChange}
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
    bottom: 80, // 修正 FAB 位置
    right: Spacing.lg,
  },
});

export default MaterialWordLearningScreen;

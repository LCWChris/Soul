import ArrowBack from "@/components/ArrowBack"; // 自訂返回按鈕
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { getFavorites, toggleFavorite as toggleFavoriteUtil } from "@/utils/favorites";
import { API_CONFIG } from "@/constants/api";
import { NetworkTester } from "@/utils/networkTester";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  PanResponder,
  Alert,
  ActivityIndicator,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;

// ===== 內嵌組件：VocabularyCategories =====
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
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`);
      const data = response.data;
      
      setCategories(data.categories || []);
      setLearningLevels(data.learning_levels || []);
      setVolumes(data.volumes || []);
      setRetryCount(0);
    } catch (error) {
      console.error('獲取分類失敗:', error);
      setError('無法載入分類資料');
      
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCategories();
        }, 2000 * (retryCount + 1));
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
      <View style={categoriesStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={categoriesStyles.loadingText}>
          {retryCount > 0 ? `重試中 (${retryCount}/2)...` : '載入分類中...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={categoriesStyles.errorContainer}>
        <Text style={categoriesStyles.errorIcon}>😔</Text>
        <Text style={categoriesStyles.errorTitle}>載入失敗</Text>
        <Text style={categoriesStyles.errorMessage}>{error}</Text>
        <TouchableOpacity style={categoriesStyles.retryButton} onPress={handleRetry}>
          <Text style={categoriesStyles.retryButtonText}>🔄 重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={categoriesStyles.container} showsVerticalScrollIndicator={false}>
      {/* 學習難度選擇 */}
      <View style={categoriesStyles.section}>
        <Text style={categoriesStyles.sectionTitle}>📚 按程度學習</Text>
        <View style={categoriesStyles.levelContainer}>
          {learningLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                categoriesStyles.levelButton,
                selectedLearningLevel === level && categoriesStyles.selectedButton
              ]}
              onPress={() => onLearningLevelSelect(level)}
            >
              <Text style={[
                categoriesStyles.levelButtonText,
                selectedLearningLevel === level && categoriesStyles.selectedButtonText
              ]}>
                {getLearningLevelDisplayName(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 主題分類選擇 */}
      <View style={categoriesStyles.section}>
        <Text style={categoriesStyles.sectionTitle}>🏷️ 主題分類</Text>
        <View style={categoriesStyles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                categoriesStyles.categoryButton,
                selectedCategory === category.name && categoriesStyles.selectedButton
              ]}
              onPress={() => onCategorySelect(category.name)}
            >
              <Text style={categoriesStyles.categoryIcon}>
                {getCategoryIcon(category.name)}
              </Text>
              <Text style={[
                categoriesStyles.categoryButtonText,
                selectedCategory === category.name && categoriesStyles.selectedButtonText
              ]}>
                {category.name}
              </Text>
              <Text style={categoriesStyles.categoryCount}>
                {category.count} 詞
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 清除篩選器 */}
      {(selectedCategory || selectedLearningLevel) && (
        <View style={categoriesStyles.section}>
          <TouchableOpacity
            style={categoriesStyles.clearButton}
            onPress={() => {
              onCategorySelect('');
              onLearningLevelSelect('');
            }}
          >
            <Text style={categoriesStyles.clearButtonText}>🗑️ 清除篩選</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// ===== 內嵌組件：RecommendedWords =====
const RecommendedWords = ({ learningLevel = 'beginner', onWordPress, limit = 10 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchRecommendations();
  }, [learningLevel]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECOMMENDATIONS}`,
        {
          params: { learning_level: learningLevel, limit },
          timeout: API_CONFIG.TIMEOUT
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setRecommendations(response.data);
        setRetryCount(0);
      } else {
        throw new Error('無效的推薦數據格式');
      }
    } catch (error) {
      console.error('獲取推薦詞彙失敗:', error);
      setError('無法載入推薦詞彙');
      
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchRecommendations();
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchRecommendations();
  };

  const renderWordCard = ({ item, index }) => (
    <TouchableOpacity
      style={[recommendationsStyles.wordCard, index % 2 === 1 && recommendationsStyles.wordCardRight]}
      onPress={() => onWordPress && onWordPress(item)}
    >
      <View style={recommendationsStyles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={recommendationsStyles.wordImage} />
        ) : (
          <View style={recommendationsStyles.placeholderImage}>
            <Text style={recommendationsStyles.placeholderText}>📝</Text>
          </View>
        )}
      </View>
      
      <View style={recommendationsStyles.wordInfo}>
        <Text style={recommendationsStyles.wordTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={recommendationsStyles.wordMeta}>
          {item.volume && (
            <Text style={recommendationsStyles.metaText}>{item.volume}</Text>
          )}
          {item.lesson && (
            <Text style={recommendationsStyles.metaText}>第{item.lesson}課</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={recommendationsStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={recommendationsStyles.loadingText}>
          載入推薦詞彙中...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={recommendationsStyles.errorContainer}>
        <Text style={recommendationsStyles.errorIcon}>😔</Text>
        <Text style={recommendationsStyles.errorTitle}>載入失敗</Text>
        <Text style={recommendationsStyles.errorMessage}>{error}</Text>
        <TouchableOpacity style={recommendationsStyles.retryButton} onPress={handleRetry}>
          <Text style={recommendationsStyles.retryButtonText}>🔄 重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={recommendationsStyles.container}>
      <Text style={recommendationsStyles.title}>
        💡 為您推薦 ({recommendations.length})
      </Text>
      <FlatList
        data={recommendations}
        renderItem={renderWordCard}
        keyExtractor={item => item._id}
        numColumns={2}
        contentContainerStyle={recommendationsStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default function WordLearningPage() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [words, setWords] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLearningLevel, setSelectedLearningLevel] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [mode, setMode] = useState('categories'); // 'categories', 'recommendations', 'list', 'learning', 'favorites'
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);

  const userId = 'user123'; // 實際應從認證系統取得

  // 滑動手勢處理
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // 右滑 - 上一個單詞
        goToPreviousWord();
      } else if (gestureState.dx < -50) {
        // 左滑 - 下一個單詞
        goToNextWord();
      }
    },
  });

  const goToNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setCurrentWord(words[nextIndex]);
    }
  };

  const goToPreviousWord = () => {
    if (currentWordIndex > 0) {
      const prevIndex = currentWordIndex - 1;
      setCurrentWordIndex(prevIndex);
      setCurrentWord(words[prevIndex]);
    }
  };

  useEffect(() => {
    fetchWords();
    fetchFavorites();
    fetchAvailableCategories(); // 獲取可用的分類
  }, [selectedLevel, selectedCategory, selectedLearningLevel, searchText]);

  // 組件首次掛載時載入收藏數據
  useEffect(() => {
    fetchFavorites();
  }, []);

  // 獲取可用的分類
  const fetchAvailableCategories = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`);
      if (response.data && response.data.categories) {
        setAvailableCategories(response.data.categories.map(cat => cat.name));
      }
    } catch (error) {
      console.error('獲取分類失敗:', error);
      // 如果 API 失敗，使用預設分類
      setAvailableCategories(['生活用語', '情感表達', '動作描述', '物品名稱', '其他']);
    }
  };

  const fetchWords = async () => {
    try {
      setLoading(true);
      // 使用配置文件中的 API 端點
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`;
      const params = new URLSearchParams();
      
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLearningLevel) params.append('learning_level', selectedLearningLevel);
      if (searchText) params.append('search', searchText);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔍 當前 API 配置:', API_CONFIG.BASE_URL);
      console.log('📡 請求 URL:', url);
      
      const res = await axios.get(url, {
        timeout: API_CONFIG.TIMEOUT,
      });
      
      console.log('✅ API 連接成功，獲取到', res.data.length, '個單詞');
      setWords(res.data);
      if (res.data.length > 0) {
        setCurrentWord(res.data[0]);
        setCurrentWordIndex(0);
      }
    } catch (error) {
      console.error('❌ API 連接失敗:', error.message);
      
      // 網路連接檢查和用戶提示
      Alert.alert(
        '網路連接問題',
        `無法連接到伺服器 (${API_CONFIG.BASE_URL})\n\n可能的原因：\n• 伺服器未啟動\n• 網路連接問題\n• IP 地址設定錯誤\n\n錯誤詳情：${error.message}`,
        [
          {
            text: '檢查網路連接',
            onPress: async () => {
              const networkInfo = await NetworkTester.getNetworkInfo();
              console.log('網路檢查結果:', networkInfo);
            },
          },
          { text: '確定', style: 'default' },
        ],
      );
      
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      // 從 AsyncStorage 載入收藏數據
      const favoritesSet = await getFavorites(userId);
      setFavorites(favoritesSet);
      console.log('✅ 載入收藏數據:', Array.from(favoritesSet));
    } catch (error) {
      console.error('載入收藏失敗', error);
    }
  };

  const toggleFavorite = async (wordId) => {
    try {
      // 使用工具函數切換收藏狀態
      const newFavorites = await toggleFavoriteUtil(userId, wordId);
      if (newFavorites) {
        setFavorites(newFavorites);
      }
      
      // 未來也可以同步到後端 API
      // await axios.post('http://172.20.10.3:3001/api/favorites', {
      //   user_id: userId, 
      //   word_id: wordId,
      //   action: favorites.has(wordId) ? 'remove' : 'add'
      // });
    } catch (error) {
      console.error('收藏操作失敗', error);
    }
  };

  const WordCard = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.wordCard}
      onPress={() => {
        setCurrentWord(item);
        setCurrentWordIndex(index);
        setMode('learning');
      }}
    >
      <Image source={{ uri: item.image_url }} style={styles.wordCardImage} />
      <View style={styles.wordInfo}>
        <Text style={styles.wordCardText}>{item.title}</Text>
        <Text style={styles.levelText}>{item.level || '初級'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.favoriteBtn}
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(item._id);
        }}
      >
        <Text style={styles.favoriteIcon}>
          {favorites.has(item._id) ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderListView = () => (
    <View style={styles.container}>
      {/* 搜尋列 */}
      <TextInput
        style={styles.searchInput}
        placeholder="搜尋單詞..."
        value={searchText}
        onChangeText={setSearchText}
      />
      
      {/* 篩選按鈕 */}
      <ScrollView horizontal style={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {['初級', '中級', '高級'].map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.filterBtn, selectedLevel === level && styles.filterBtnActive]}
            onPress={() => setSelectedLevel(selectedLevel === level ? '' : level)}
          >
            <Text style={[styles.filterText, selectedLevel === level && styles.filterTextActive]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* 使用從後端獲取的實際分類 */}
        {availableCategories.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.filterBtn, selectedCategory === category && styles.filterBtnActive]}
            onPress={() => setSelectedCategory(selectedCategory === category ? '' : category)}
          >
            <Text style={[styles.filterText, selectedCategory === category && styles.filterTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 單詞列表 */}
      {loading ? (
        <Text style={styles.loadingText}>載入中...</Text>
      ) : (
        <FlatList
          data={words}
          renderItem={({ item, index }) => <WordCard item={item} index={index} />}
          keyExtractor={item => item._id}
          numColumns={2}
          contentContainerStyle={styles.wordList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderLearningView = () => (
    <View style={styles.learningContainer}>
      <View style={styles.learningHeader}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => setMode('list')}
        >
          <Text style={styles.backBtnText}>← 返回列表</Text>
        </TouchableOpacity>
        
        <Text style={styles.wordCounter}>
          {currentWordIndex + 1} / {words.length}
        </Text>
      </View>
      
      {currentWord && (
        <View style={styles.learningContent} {...panResponder.panHandlers}>
          <ScrollView contentContainerStyle={styles.learningScrollContainer}>
            <View style={styles.learningCard}>
              <Text style={styles.learningWord}>{currentWord.title}</Text>
              
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image 
                  source={{ uri: currentWord.image_url }} 
                  style={styles.learningImage} 
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.favoriteButton,
                  { backgroundColor: favorites.has(currentWord._id) ? '#93c5fd' : '#dbeafe' },
                ]}
                onPress={() => toggleFavorite(currentWord._id)}
              >
                <Text style={styles.favoriteText}>
                  {favorites.has(currentWord._id) ? '❤️ 已收藏' : '🤍 加入收藏'}
                </Text>
              </TouchableOpacity>

              {currentWord.content && (
                <Text style={styles.descriptionText}>{currentWord.content}</Text>
              )}
            </View>
          </ScrollView>
          
          {/* 導航按鈕 */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={[styles.navBtn, currentWordIndex === 0 && styles.navBtnDisabled]}
              onPress={goToPreviousWord}
              disabled={currentWordIndex === 0}
            >
              <Text style={[styles.navBtnText, currentWordIndex === 0 && styles.navBtnTextDisabled]}>
                ← 上一個
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navBtn, currentWordIndex === words.length - 1 && styles.navBtnDisabled]}
              onPress={goToNextWord}
              disabled={currentWordIndex === words.length - 1}
            >
              <Text style={[styles.navBtnText, currentWordIndex === words.length - 1 && styles.navBtnTextDisabled]}>
                下一個 →
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.swipeHint}>💡 左右滑動切換單詞</Text>
        </View>
      )}
    </View>
  );

  const renderFavoritesView = () => {
    const favoriteWords = words.filter(word => favorites.has(word._id));
    
    return (
      <View style={styles.container}>
        <Text style={styles.favoritesTitle}>我的收藏 ({favoriteWords.length})</Text>
        
        {favoriteWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>還沒有收藏任何單詞</Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => setMode('list')}
            >
              <Text style={styles.exploreBtnText}>去探索單詞</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favoriteWords}
            renderItem={({ item, index }) => <WordCard item={item} index={index} />}
            keyExtractor={item => item._id}
            numColumns={2}
            contentContainerStyle={styles.wordList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={{ flex: 1 }}>
      {/* 頂部導航 */}
      <View style={styles.header}>
        <ArrowBack />
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, mode === 'categories' && styles.tabBtnActive]}
            onPress={() => setMode('categories')}
          >
            <Text style={[styles.tabBtnText, mode === 'categories' && styles.tabBtnTextActive]}>
              📚 分類
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, mode === 'recommendations' && styles.tabBtnActive]}
            onPress={() => setMode('recommendations')}
          >
            <Text style={[styles.tabBtnText, mode === 'recommendations' && styles.tabBtnTextActive]}>
              💡 推薦
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, mode === 'list' && styles.tabBtnActive]}
            onPress={() => setMode('list')}
          >
            <Text style={[styles.tabBtnText, mode === 'list' && styles.tabBtnTextActive]}>
              📝 列表
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, mode === 'favorites' && styles.tabBtnActive]}
            onPress={() => setMode('favorites')}
          >
            <Text style={[styles.tabBtnText, mode === 'favorites' && styles.tabBtnTextActive]}>
              ⭐ 收藏
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 渲染不同模式的內容 */}
      {mode === 'categories' && (
        <VocabularyCategories
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            if (category) setMode('list');
          }}
          onLearningLevelSelect={(level) => {
            setSelectedLearningLevel(level);
            if (level) setMode('list');
          }}
          selectedCategory={selectedCategory}
          selectedLearningLevel={selectedLearningLevel}
        />
      )}
      
      {mode === 'recommendations' && (
        <RecommendedWords
          learningLevel={selectedLearningLevel || 'beginner'}
          onWordPress={(word) => {
            setCurrentWord(word);
            setCurrentWordIndex(0);
            setMode('learning');
          }}
          limit={20}
        />
      )}
      
      {mode === 'list' && renderListView()}
      {mode === 'learning' && renderLearningView()}
      {mode === 'favorites' && renderFavoritesView()}

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          {currentWord && (
            <Image
              source={{ uri: currentWord.image_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 20,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#3b82f6',
  },
  tabBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterRow: {
    marginBottom: 16,
    paddingHorizontal: 8,
    height: 48,
  },
  filterBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: '#666',
  },
  wordList: {
    paddingBottom: 100,
  },
  wordCard: {
    backgroundColor: 'white',
    margin: 6,
    borderRadius: 16,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: (screenWidth - 48) / 2,
  },
  wordCardImage: {
    width: (screenWidth - 48) / 2 - 24,
    height: (screenWidth - 48) / 2 - 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  wordInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  wordCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  levelText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  learningContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  wordCounter: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  learningContent: {
    flex: 1,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  learningScrollContainer: {
    paddingBottom: 100,
  },
  learningCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  learningWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
    textAlign: 'center',
  },
  learningImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: 16,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: '#9ca3af',
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    paddingBottom: 20,
  },
  favoriteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
  },
  favoriteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  favoritesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
    maxWidth: 400,
    maxHeight: 500,
  },
});

// ===== VocabularyCategories 樣式 =====
const categoriesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  levelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedButtonText: {
    color: 'white',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryButton: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// ===== RecommendedWords 樣式 =====
const recommendationsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 100,
  },
  wordCard: {
    backgroundColor: 'white',
    margin: 6,
    borderRadius: 16,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: (screenWidth - 48) / 2,
  },
  wordCardRight: {
    marginLeft: 0,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  wordImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  wordInfo: {
    alignItems: 'center',
    width: '100%',
  },
  wordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 4,
  },
  wordMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
});

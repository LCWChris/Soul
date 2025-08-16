import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  Alert
} from 'react-native';
import { debounce } from 'lodash';
import { VocabularyService } from '../services/VocabularyService';

const SmartSearch = ({ onWordSelect, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [suggestions, setSuggestions] = useState([]);

  // 搜索建議和自動完成
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setSearchResults([]);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // 智能搜索API調用
        const results = await VocabularyService.smartSearch({
          query: term,
          filters: activeFilters,
          includeDefinitions: true,
          includeSynonyms: true,
          fuzzyMatch: true
        });

        setSearchResults(results.words || []);
        setSuggestions(results.suggestions || []);
        
        // 保存搜索歷史
        saveToSearchHistory(term);
      } catch (error) {
        console.error('搜索失敗:', error);
        Alert.alert('錯誤', '搜索失敗，請重試');
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [activeFilters]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    loadSearchHistory();
    loadPopularSearches();
  }, []);

  const saveToSearchHistory = (term) => {
    if (!term.trim()) return;
    
    const newHistory = [term, ...searchHistory.filter(item => item !== term)]
      .slice(0, 10); // 保留最近10個搜索
    setSearchHistory(newHistory);
    // 這裡應該保存到本地存儲
  };

  const loadSearchHistory = () => {
    // 從本地存儲加載搜索歷史
    // AsyncStorage.getItem('searchHistory')
  };

  const loadPopularSearches = async () => {
    try {
      // 從後端獲取熱門搜索詞
      const popular = await VocabularyService.getPopularSearches();
      setPopularSearches(popular);
    } catch (error) {
      console.error('載入熱門搜索失敗:', error);
    }
  };

  const handleWordSelect = (word) => {
    onWordSelect && onWordSelect(word);
    saveToSearchHistory(word.word);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchTerm(suggestion);
  };

  const handleFilterToggle = (filterType, value) => {
    const newFilters = { ...activeFilters };
    if (newFilters[filterType] === value) {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }
    setActiveFilters(newFilters);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSuggestions([]);
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleWordSelect(item)}
    >
      <View style={styles.resultContent}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.definitionText} numberOfLines={2}>
          {item.definition}
        </Text>
        
        <View style={styles.resultMeta}>
          <Text style={styles.categoryText}>
            {item.categories ? item.categories.join(', ') : ''}
          </Text>
          <Text style={styles.levelText}>
            {item.learning_level}
          </Text>
        </View>
      </View>
      
      {item.match_reason && (
        <Text style={styles.matchReason}>
          匹配: {item.match_reason}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText}>🔍 {item}</Text>
    </TouchableOpacity>
  );

  const renderQuickFilter = (filterType, value, label) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        activeFilters[filterType] === value && styles.activeFilterChip
      ]}
      onPress={() => handleFilterToggle(filterType, value)}
    >
      <Text style={[
        styles.filterText,
        activeFilters[filterType] === value && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 搜索輸入框 */}
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索詞彙、定義或分類..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 快速篩選器 */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>快速篩選:</Text>
        <View style={styles.filtersRow}>
          {renderQuickFilter('learning_level', 'beginner', '初學')}
          {renderQuickFilter('learning_level', 'intermediate', '中級')}
          {renderQuickFilter('learning_level', 'advanced', '高級')}
          {renderQuickFilter('context', 'daily', '日常')}
          {renderQuickFilter('context', 'academic', '學術')}
        </View>
      </View>

      {/* 搜索建議 */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>搜索建議:</Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* 搜索結果 */}
      {searchTerm.length > 0 ? (
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>搜索中...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item._id || item.word}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                沒有找到匹配的詞彙
              </Text>
              <Text style={styles.noResultsHint}>
                嘗試使用不同的關鍵詞或檢查拼寫
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* 搜索歷史和熱門搜索 */
        <View style={styles.defaultContainer}>
          {searchHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>最近搜索</Text>
              <View style={styles.historyList}>
                {searchHistory.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => setSearchTerm(term)}
                  >
                    <Text style={styles.historyText}>🕐 {term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {popularSearches.length > 0 && (
            <View style={styles.popularContainer}>
              <Text style={styles.sectionTitle}>熱門搜索</Text>
              <View style={styles.popularList}>
                {popularSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularItem}
                    onPress={() => setSearchTerm(term)}
                  >
                    <Text style={styles.popularText}>🔥 {term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterChip: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestionItem: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultContent: {
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  definitionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 12,
    color: '#4A90E2',
  },
  levelText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
  },
  matchReason: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  defaultContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyItem: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#666',
  },
  popularContainer: {
    marginBottom: 24,
  },
  popularList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularItem: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularText: {
    fontSize: 14,
    color: '#ff5722',
  },
});

export default SmartSearch;

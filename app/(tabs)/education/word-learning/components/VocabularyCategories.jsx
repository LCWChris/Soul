import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { API_CONFIG } from '@/constants/api';
import axios from 'axios';

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
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>
          {retryCount > 0 ? `重試中 (${retryCount}/2)...` : '載入分類中...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>載入失敗</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>🔄 重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 學習難度選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 按程度學習</Text>
        <View style={styles.levelContainer}>
          {learningLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelButton,
                selectedLearningLevel === level && styles.selectedButton
              ]}
              onPress={() => onLearningLevelSelect(level)}
            >
              <Text style={[
                styles.levelButtonText,
                selectedLearningLevel === level && styles.selectedButtonText
              ]}>
                {getLearningLevelDisplayName(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 主題分類選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏷️ 主題分類</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && styles.selectedButton
              ]}
              onPress={() => onCategorySelect(category.name)}
            >
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(category.name)}
              </Text>
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.name && styles.selectedButtonText
              ]}>
                {category.name}
              </Text>
              <Text style={styles.categoryCount}>
                {category.count} 詞
              </Text>
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
          >
            <Text style={styles.clearButtonText}>🗑️ 清除篩選</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

export default VocabularyCategories;

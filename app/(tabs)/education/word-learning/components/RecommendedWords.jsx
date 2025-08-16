import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { API_CONFIG } from '@/constants/api';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

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
      
      // 自動重試邏輯
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
      style={[styles.wordCard, index % 2 === 1 && styles.wordCardRight]}
      onPress={() => onWordPress && onWordPress(item)}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.wordImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📝</Text>
          </View>
        )}
      </View>
      
      <View style={styles.wordInfo}>
        <Text style={styles.wordTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.wordMeta}>
          {item.volume && (
            <Text style={styles.metaText}>{item.volume}</Text>
          )}
          {item.lesson && (
            <Text style={styles.metaText}>第{item.lesson}課</Text>
          )}
        </View>
        
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.slice(0, 2).map((category, idx) => (
              <View key={idx} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.frequencyContainer}>
          <View style={[
            styles.frequencyBadge,
            item.frequency === 'high' && styles.highFrequency,
            item.frequency === 'medium' && styles.mediumFrequency,
            item.frequency === 'low' && styles.lowFrequency
          ]}>
            <Text style={styles.frequencyText}>
              {item.frequency === 'high' ? '🔥 常用' : 
               item.frequency === 'medium' ? '⚡ 實用' : '📚 進階'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>
          {retryCount > 0 ? `重試中 (${retryCount}/2)...` : '載入推薦詞彙...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📚</Text>
        <Text style={styles.errorTitle}>載入失敗</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>🔄 重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💡 推薦學習</Text>
        <Text style={styles.headerSubtitle}>
          根據您的程度推薦的高頻詞彙
        </Text>
      </View>
      
      <FlatList
        data={recommendations}
        renderItem={renderWordCard}
        keyExtractor={(item) => item._id || item.title}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  wordCard: {
    width: (screenWidth - 32) / 2 - 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wordCardRight: {
    marginLeft: 8,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  wordImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#ccc',
  },
  wordInfo: {
    flex: 1,
  },
  wordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  wordMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  frequencyContainer: {
    alignItems: 'flex-start',
  },
  frequencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highFrequency: {
    backgroundColor: '#ffebee',
  },
  mediumFrequency: {
    backgroundColor: '#fff3e0',
  },
  lowFrequency: {
    backgroundColor: '#e8f5e8',
  },
  frequencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RecommendedWords;

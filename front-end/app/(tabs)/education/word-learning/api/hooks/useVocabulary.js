// 詞彙相關的自定義 Hook
import { useState, useEffect } from 'react';
import { VocabularyService } from '../services/VocabularyService';
import { Alert } from 'react-native';

// 使用詞彙列表的 Hook
export const useVocabulary = (filters = {}) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VocabularyService.getWords(filters);
      setWords(data);
    } catch (err) {
      setError(err);
      console.error('獲取詞彙失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [JSON.stringify(filters)]);

  return {
    words,
    loading,
    error,
    refetch: fetchWords
  };
};

// 使用分類的 Hook
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [learningLevels, setLearningLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VocabularyService.getCategories();
      setCategories(data.categories || []);
      setLearningLevels(data.learning_levels || []);
    } catch (err) {
      setError(err);
      Alert.alert('錯誤', '無法載入分類資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    learningLevels,
    loading,
    error,
    refetch: fetchCategories
  };
};

// 使用推薦詞彙的 Hook
export const useRecommendations = (learningLevel = 'beginner', limit = 10) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VocabularyService.getRecommendations({
        learning_level: learningLevel,
        limit
      });
      setRecommendations(data);
    } catch (err) {
      setError(err);
      Alert.alert('錯誤', '無法載入推薦詞彙');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [learningLevel, limit]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
};

// 使用搜尋的 Hook
export const useVocabularySearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (searchTerm, filters = {}) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await VocabularyService.searchWords(searchTerm, filters);
      setResults(data);
    } catch (err) {
      setError(err);
      console.error('搜尋失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    loading,
    error,
    search,
    clearResults
  };
};

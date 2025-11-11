import { API_CONFIG } from '@/constants/api';
import axios from 'axios';
import { getLearningProgress, LEARNING_STATUS } from './learning-progress';
import { getFavorites } from './favorites';

/**
 * 獲取單詞統計數據
 * @param {Object} filters 篩選條件 { category, level, search }
 * @returns {Promise<Object>} 統計數據
 */
export const getWordStats = async (filters = {}) => {
  try {
    console.log('📊 開始獲取單詞統計數據...', filters);
    
    // 從 API 獲取單詞數據
    const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`, {
      params: {
        ...filters,
        limit: 1000 // 獲取足夠多的數據用於統計
      },
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    // API 直接返回陣列，確保數據格式正確
    let words = response.data;
    if (!Array.isArray(words)) {
      words = words.words || words.data || [];
    }
    console.log('📊 獲取到單詞數據:', words.length, '個');
    
    // 獲取學習進度和收藏數據
    const [learningProgress, favorites] = await Promise.all([
      getLearningProgress(),
      getFavorites()
    ]);
    
    const favoritesSet = new Set(favorites);
    console.log('📊 獲取到學習進度:', Object.keys(learningProgress).length, '個');
    console.log('📊 獲取到收藏數據:', favoritesSet.size, '個');
    
    // 計算統計數據
    const stats = {
      // 基本統計
      totalWords: words.length,
      
      // 收藏統計
      favoriteWords: 0,
      
      // 學習進度統計
      notStarted: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
      
      // 難度等級統計
      beginner: 0,    // 初級
      intermediate: 0, // 中級
      advanced: 0,    // 高級
      
      // 分類統計
      categories: {},
      
      // 學習完成率
      progressRate: 0,
      
      // 每日學習建議
      todayRecommendation: {
        newWords: 0,      // 建議學習的新單詞數
        reviewWords: 0,   // 建議複習的單詞數
        masteredToday: 0  // 今日已掌握的單詞數
      }
    };
    
    // 遍歷所有單詞進行統計
    words.forEach(word => {
      const wordId = word.id || word._id;
      const wordProgress = learningProgress[wordId];
      
      // 收藏統計
      if (favoritesSet.has(wordId)) {
        stats.favoriteWords++;
      }
      
      // 學習進度統計
      if (wordProgress) {
        switch (wordProgress.status) {
          case LEARNING_STATUS.NOT_STARTED:
            stats.notStarted++;
            break;
          case LEARNING_STATUS.LEARNING:
            stats.learning++;
            break;
          case LEARNING_STATUS.REVIEWING:
            stats.reviewing++;
            break;
          case LEARNING_STATUS.MASTERED:
            stats.mastered++;
            break;
          default:
            stats.notStarted++;
        }
      } else {
        stats.notStarted++;
      }
      
      // 難度等級統計
      switch (word.level) {
        case '初級':
          stats.beginner++;
          break;
        case '中級':
          stats.intermediate++;
          break;
        case '高級':
          stats.advanced++;
          break;
      }
      
      // 分類統計
      if (word.category) {
        stats.categories[word.category] = (stats.categories[word.category] || 0) + 1;
      }
    });
    
    // 計算學習完成率
    const totalLearned = stats.learning + stats.reviewing + stats.mastered;
    stats.progressRate = stats.totalWords > 0 ? Math.round((totalLearned / stats.totalWords) * 100) : 0;
    
    // 計算每日學習建議
    stats.todayRecommendation.newWords = Math.min(stats.notStarted, 10); // 建議每天學習10個新單詞
    stats.todayRecommendation.reviewWords = Math.min(stats.reviewing, 15); // 建議每天複習15個單詞
    
    // 統計今日已掌握的單詞（檢查今日更新的掌握狀態）
    const today = new Date().toDateString();
    stats.todayRecommendation.masteredToday = Object.values(learningProgress).filter(progress => {
      if (progress.status === LEARNING_STATUS.MASTERED && progress.lastStudied) {
        const lastStudiedDate = new Date(progress.lastStudied).toDateString();
        return lastStudiedDate === today;
      }
      return false;
    }).length;
    
    console.log('📊 統計數據計算完成:', stats);
    return stats;
    
  } catch (error) {
    console.error('獲取統計數據失敗:', error);
    // 返回默認統計數據
    return {
      totalWords: 0,
      favoriteWords: 0,
      notStarted: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      categories: {},
      progressRate: 0,
      todayRecommendation: {
        newWords: 0,
        reviewWords: 0,
        masteredToday: 0
      }
    };
  }
};

/**
 * 獲取學習趨勢數據（最近7天）
 * @returns {Promise<Array>} 趨勢數據
 */
export const getLearningTrend = async () => {
  try {
    const learningProgress = await getLearningProgress();
    const trend = [];
    
    // 獲取最近7天的數據
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      // 統計該日期的學習活動
      const dayStats = {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD 格式
        newLearned: 0,
        reviewed: 0,
        mastered: 0
      };
      
      Object.values(learningProgress).forEach(progress => {
        if (progress.firstStudied) {
          const firstStudiedDate = new Date(progress.firstStudied).toDateString();
          if (firstStudiedDate === dateString) {
            dayStats.newLearned++;
          }
        }
        
        if (progress.lastStudied) {
          const lastStudiedDate = new Date(progress.lastStudied).toDateString();
          if (lastStudiedDate === dateString) {
            if (progress.status === LEARNING_STATUS.MASTERED) {
              dayStats.mastered++;
            } else {
              dayStats.reviewed++;
            }
          }
        }
      });
      
      trend.push(dayStats);
    }
    
    return trend;
  } catch (error) {
    console.error('獲取學習趨勢失敗:', error);
    return [];
  }
};

/**
 * 獲取最需要複習的單詞
 * @param {number} limit 限制返回數量
 * @returns {Promise<Array>} 需要複習的單詞列表
 */
export const getWordsNeedReview = async (limit = 10) => {
  try {
    const [response, learningProgress] = await Promise.all([
      axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`, {
        params: { limit: 200 },
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }),
      getLearningProgress()
    ]);
    
    // API 直接返回陣列，確保數據格式正確
    let words = response.data;
    if (!Array.isArray(words)) {
      words = words.words || words.data || [];
    }
    
    // 篩選需要複習的單詞
    const reviewWords = words.filter(word => {
      const wordId = word.id || word._id;
      const progress = learningProgress[wordId];
      return progress && progress.status === LEARNING_STATUS.REVIEWING;
    });
    
    // 按最後學習時間排序，最久沒複習的排在前面
    reviewWords.sort((a, b) => {
      const aProgress = learningProgress[a.id || a._id];
      const bProgress = learningProgress[b.id || b._id];
      
      if (!aProgress?.lastStudied) return -1;
      if (!bProgress?.lastStudied) return 1;
      
      return new Date(aProgress.lastStudied) - new Date(bProgress.lastStudied);
    });
    
    return reviewWords.slice(0, limit);
  } catch (error) {
    console.error('獲取複習單詞失敗:', error);
    return [];
  }
};

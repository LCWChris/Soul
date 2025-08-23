import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEARNING_STATUS } from './learning-progress';

/**
 * 間隔重複學習系統
 * 基於遺忘曲線和 SM-2 算法的智能複習系統
 */

const SPACED_REPETITION_KEY = 'spaced_repetition_data';

// SM-2 算法參數
const DEFAULT_EASINESS_FACTOR = 2.5;
const MIN_EASINESS_FACTOR = 1.3;

/**
 * 計算下次複習時間
 * @param {number} interval 當前間隔（天）
 * @param {number} easinessFactor 記憶難度係數
 * @param {number} quality 學習品質 (0-5)
 * @returns {Object} 新的間隔和難度係數
 */
export const calculateNextReview = (interval = 1, easinessFactor = DEFAULT_EASINESS_FACTOR, quality = 3) => {
  let newInterval;
  let newEasinessFactor = easinessFactor;

  if (quality < 3) {
    // 答錯了，重新開始
    newInterval = 1;
  } else {
    // 答對了，增加間隔
    if (interval === 1) {
      newInterval = 6;
    } else if (interval === 6) {
      newInterval = Math.round(interval * newEasinessFactor);
    } else {
      newInterval = Math.round(interval * newEasinessFactor);
    }
  }

  // 調整難度係數
  newEasinessFactor = newEasinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (newEasinessFactor < MIN_EASINESS_FACTOR) {
    newEasinessFactor = MIN_EASINESS_FACTOR;
  }

  return {
    interval: newInterval,
    easinessFactor: newEasinessFactor
  };
};

/**
 * 獲取間隔重複數據
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getSpacedRepetitionData = async (userId = 'default') => {
  try {
    const key = `${SPACED_REPETITION_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('獲取間隔重複數據失敗:', error);
    return {};
  }
};

/**
 * 保存間隔重複數據
 * @param {Object} data 
 * @param {string} userId 
 */
export const saveSpacedRepetitionData = async (data, userId = 'default') => {
  try {
    const key = `${SPACED_REPETITION_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('保存間隔重複數據失敗:', error);
  }
};

/**
 * 更新單詞的複習數據
 * @param {string} wordId 
 * @param {number} quality 學習品質 (0-5)
 * @param {string} userId 
 */
export const updateWordReviewData = async (wordId, quality, userId = 'default') => {
  try {
    const allData = await getSpacedRepetitionData(userId);
    const currentData = allData[wordId] || {
      interval: 1,
      easinessFactor: DEFAULT_EASINESS_FACTOR,
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      lastReview: null
    };

    const { interval, easinessFactor } = calculateNextReview(
      currentData.interval,
      currentData.easinessFactor,
      quality
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const updatedData = {
      ...currentData,
      interval,
      easinessFactor,
      nextReview: nextReviewDate.toISOString(),
      reviewCount: currentData.reviewCount + 1,
      lastReview: new Date().toISOString(),
      lastQuality: quality
    };

    allData[wordId] = updatedData;
    await saveSpacedRepetitionData(allData, userId);

    console.log('📅 更新複習數據:', {
      wordId,
      quality,
      interval,
      nextReview: nextReviewDate.toLocaleDateString()
    });

    return updatedData;
  } catch (error) {
    console.error('更新複習數據失敗:', error);
    throw error;
  }
};

/**
 * 獲取今日需要複習的單詞
 * @param {string} userId 
 * @returns {Promise<Array>} 需要複習的單詞ID列表
 */
export const getTodayReviewWords = async (userId = 'default') => {
  try {
    const allData = await getSpacedRepetitionData(userId);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今天結束時間

    const reviewWords = Object.entries(allData)
      .filter(([wordId, data]) => {
        const nextReview = new Date(data.nextReview);
        return nextReview <= today;
      })
      .map(([wordId, data]) => ({
        wordId,
        ...data
      }))
      .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));

    console.log(`📚 今日需要複習 ${reviewWords.length} 個單詞`);
    return reviewWords;
  } catch (error) {
    console.error('獲取今日複習單詞失敗:', error);
    return [];
  }
};

/**
 * 獲取複習統計
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getReviewStats = async (userId = 'default') => {
  try {
    const allData = await getSpacedRepetitionData(userId);
    const today = new Date();
    const todayStr = today.toDateString();
    
    const stats = {
      totalWords: Object.keys(allData).length,
      todayReviewed: 0,
      averageInterval: 0,
      masteredWords: 0, // 間隔 > 30 天的單詞
      strugglingWords: 0 // 最近答錯的單詞
    };

    if (stats.totalWords === 0) return stats;

    let totalInterval = 0;
    
    Object.values(allData).forEach(data => {
      // 今日已複習
      if (data.lastReview && new Date(data.lastReview).toDateString() === todayStr) {
        stats.todayReviewed++;
      }
      
      // 平均間隔
      totalInterval += data.interval;
      
      // 掌握的單詞（間隔 > 30 天）
      if (data.interval > 30) {
        stats.masteredWords++;
      }
      
      // 困難的單詞（最近答錯）
      if (data.lastQuality !== undefined && data.lastQuality < 3) {
        stats.strugglingWords++;
      }
    });

    stats.averageInterval = Math.round(totalInterval / stats.totalWords);

    return stats;
  } catch (error) {
    console.error('獲取複習統計失敗:', error);
    return {
      totalWords: 0,
      todayReviewed: 0,
      averageInterval: 0,
      masteredWords: 0,
      strugglingWords: 0
    };
  }
};

export default {
  calculateNextReview,
  getSpacedRepetitionData,
  saveSpacedRepetitionData,
  updateWordReviewData,
  getTodayReviewWords,
  getReviewStats
};

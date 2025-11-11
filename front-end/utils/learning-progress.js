import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARNING_PROGRESS_KEY = 'learningProgress';

/**
 * 學習進度狀態
 * - 'not_started': 未開始學習
 * - 'learning': 正在學習
 * - 'reviewing': 正在複習
 * - 'mastered': 已掌握
 */
export const LEARNING_STATUS = {
  NOT_STARTED: 'not_started',
  LEARNING: 'learning',
  REVIEWING: 'reviewing',
  MASTERED: 'mastered'
};

/**
 * 獲取用戶的學習進度數據
 * @param {string} userId 用戶ID，預設為 'default'
 * @returns {Promise<Object>} 學習進度對象 { wordId: { status, lastStudied, reviewCount } }
 */
export const getLearningProgress = async (userId = 'default') => {
  try {
    const key = `${LEARNING_PROGRESS_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    console.log('📚 獲取學習進度:', data ? JSON.parse(data) : {});
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('獲取學習進度失敗:', error);
    return {};
  }
};

/**
 * 保存學習進度數據
 * @param {Object} progressData 學習進度數據
 * @param {string} userId 用戶ID，預設為 'default'
 */
export const saveLearningProgress = async (progressData, userId = 'default') => {
  try {
    const key = `${LEARNING_PROGRESS_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(progressData));
    console.log('📚 保存學習進度成功:', progressData);
  } catch (error) {
    console.error('保存學習進度失敗:', error);
  }
};

/**
 * 更新單詞的學習狀態
 * @param {string} wordId 單詞ID
 * @param {string} status 學習狀態
 * @param {string} userId 用戶ID，預設為 'default'
 * @returns {Promise<Object>} 更新後的學習進度
 */
export const updateWordProgress = async (wordId, status, userId = 'default') => {
  try {
    const progressData = await getLearningProgress(userId);
    const currentData = progressData[wordId] || { 
      status: LEARNING_STATUS.NOT_STARTED, 
      reviewCount: 0,
      firstStudied: null,
      lastStudied: null
    };

    // 更新學習數據
    const updatedWordData = {
      ...currentData,
      status,
      lastStudied: new Date().toISOString(),
    };

    // 如果是第一次學習，記錄首次學習時間
    if (!currentData.firstStudied) {
      updatedWordData.firstStudied = new Date().toISOString();
    }

    // 如果從其他狀態變為複習或已掌握，增加複習次數
    if ((status === LEARNING_STATUS.REVIEWING || status === LEARNING_STATUS.MASTERED) && 
        currentData.status !== status) {
      updatedWordData.reviewCount = (currentData.reviewCount || 0) + 1;
    }

    progressData[wordId] = updatedWordData;
    await saveLearningProgress(progressData, userId);
    
    console.log('📚 更新單詞學習狀態:', wordId, status, updatedWordData);
    return progressData;
  } catch (error) {
    console.error('更新學習進度失敗:', error);
    throw error;
  }
};

/**
 * 獲取單詞的學習狀態
 * @param {string} wordId 單詞ID
 * @param {string} userId 用戶ID，預設為 'default'
 * @returns {Promise<Object>} 單詞的學習數據
 */
export const getWordProgress = async (wordId, userId = 'default') => {
  try {
    const progressData = await getLearningProgress(userId);
    return progressData[wordId] || { 
      status: LEARNING_STATUS.NOT_STARTED, 
      reviewCount: 0,
      firstStudied: null,
      lastStudied: null
    };
  } catch (error) {
    console.error('獲取單詞學習狀態失敗:', error);
    return { 
      status: LEARNING_STATUS.NOT_STARTED, 
      reviewCount: 0,
      firstStudied: null,
      lastStudied: null
    };
  }
};

/**
 * 獲取學習統計數據
 * @param {string} userId 用戶ID，預設為 'default'
 * @returns {Promise<Object>} 統計數據
 */
export const getLearningStats = async (userId = 'default') => {
  try {
    const progressData = await getLearningProgress(userId);
    const stats = {
      notStarted: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
      total: 0
    };

    Object.values(progressData).forEach(wordData => {
      stats.total++;
      switch (wordData.status) {
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
      }
    });

    return stats;
  } catch (error) {
    console.error('獲取學習統計失敗:', error);
    return {
      notStarted: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
      total: 0
    };
  }
};

/**
 * 根據學習狀態篩選單詞
 * @param {Array} words 單詞列表
 * @param {string} status 要篩選的學習狀態
 * @param {string} userId 用戶ID，預設為 'default'
 * @returns {Promise<Array>} 篩選後的單詞列表
 */
export const filterWordsByProgress = async (words, status, userId = 'default') => {
  try {
    const progressData = await getLearningProgress(userId);
    
    return words.filter(word => {
      const wordId = word.id || word._id;
      const wordProgress = progressData[wordId];
      
      if (status === LEARNING_STATUS.NOT_STARTED) {
        // 未開始：沒有記錄或明確標記為未開始
        return !wordProgress || wordProgress.status === LEARNING_STATUS.NOT_STARTED;
      }
      
      return wordProgress && wordProgress.status === status;
    });
  } catch (error) {
    console.error('篩選單詞失敗:', error);
    return words;
  }
};

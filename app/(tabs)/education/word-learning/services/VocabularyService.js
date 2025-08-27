// 詞彙相關的 API 服務
import axios from 'axios';
import { API_CONFIG } from '@/constants/api';

export class VocabularyService {
  // 網路重試機制
  static async makeRequestWithRetry(requestFn, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 延遲重試
        }
      }
    }
    throw lastError;
  }

  // 獲取所有詞彙（支援篩選）
  static async getWords(params = {}) {
    return this.makeRequestWithRetry(async () => {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`;
      const response = await axios.get(url, { 
        params,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: API_CONFIG.TIMEOUT 
      });
      
      // 數據驗證
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('無效的詞彙數據格式');
      }
      
      return response.data;
    });
  }

  // 獲取分類資訊
  static async getCategories() {
    return this.makeRequestWithRetry(async () => {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;
      const response = await axios.get(url, { 
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: API_CONFIG.TIMEOUT 
      });
      
      // 數據驗證
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('無效的分類數據格式');
      }
      
      return response.data;
    });
  }

  // 獲取推薦詞彙
  static async getRecommendations(params = {}) {
    return this.makeRequestWithRetry(async () => {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECOMMENDATIONS}`;
      const response = await axios.get(url, { 
        params,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: API_CONFIG.TIMEOUT 
      });
      
      // 數據驗證
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('無效的推薦數據格式');
      }
      
      return response.data;
    });
  }

  // 獲取統計資訊
  static async getStats() {
    return this.makeRequestWithRetry(async () => {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATS}`;
      const response = await axios.get(url, { 
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: API_CONFIG.TIMEOUT 
      });
      
      // 數據驗證
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('無效的統計數據格式');
      }
      
      return response.data;
    });
  }

  // 搜尋詞彙
  static async searchWords(searchTerm, filters = {}) {
    return this.makeRequestWithRetry(async () => {
      const params = {
        search: searchTerm,
        ...filters
      };
      return await this.getWords(params);
    });
  }

  // 獲取用戶學習進度（暫時返回模擬數據）
  static async getUserProgress(userId, filters = {}) {
    try {
      // 嘗試從實際 API 獲取數據
      return this.makeRequestWithRetry(async () => {
        const url = `${API_CONFIG.BASE_URL}/api/users/${userId}/progress`;
        const response = await axios.get(url, { 
          params: filters,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: API_CONFIG.TIMEOUT 
        });
        
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('無效的進度數據格式');
        }
        
        return response.data;
      });
    } catch (error) {
      console.warn('無法從 API 獲取進度數據，使用模擬數據:', error.message);
      
      // 返回模擬的進度數據
      return {
        totalWords: 1200,
        learnedWords: 350,
        masteredWords: 120,
        progressPercentage: Math.round((350 / 1200) * 100),
        category: filters.category || '全部',
        level: filters.level || '全部'
      };
    }
  }
}

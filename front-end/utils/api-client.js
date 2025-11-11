import axios from 'axios';
import { API_CONFIG } from '@/constants/api';

// 創建統一的 API 客戶端
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // 所有請求都包含這個 header
  }
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API 請求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🌐 API 請求錯誤:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 響應: ${response.config.url} (${response.status})`);
    // 統一處理數據格式
    if (response.data && typeof response.data === 'object') {
      // 如果響應包含 words 陣列，直接返回陣列
      if (Array.isArray(response.data)) {
        return { ...response, data: response.data };
      }
      // 如果響應是包含 words 屬性的對象，提取陣列
      if (response.data.words && Array.isArray(response.data.words)) {
        return { ...response, data: response.data.words };
      }
      // 如果響應是包含 data 屬性的對象，提取數據
      if (response.data.data && Array.isArray(response.data.data)) {
        return { ...response, data: response.data.data };
      }
    }
    return response;
  },
  (error) => {
    console.error(`❌ API 響應錯誤: ${error.config?.url}`, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 提供方便的方法
export const vocabularyAPI = {
  // 獲取詞彙列表
  getWords: (params = {}) => 
    apiClient.get(API_CONFIG.ENDPOINTS.BOOK_WORDS, { params }),
  
  // 獲取分類
  getCategories: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.CATEGORIES),
  
  // 獲取推薦
  getRecommendations: (params = {}) => 
    apiClient.get(API_CONFIG.ENDPOINTS.RECOMMENDATIONS, { params }),
  
  // 獲取統計
  getStats: (params = {}) => 
    apiClient.get(API_CONFIG.ENDPOINTS.STATS, { params }),
  
  // 獲取收藏
  getFavorites: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.FAVORITES),
  
  // 更新收藏
  updateFavorite: (wordId, isFavorite) => 
    apiClient.post(API_CONFIG.ENDPOINTS.FAVORITES, { wordId, isFavorite }),
  
  // 獲取用戶偏好
  getPreferences: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.PREFERENCES),
  
  // 更新用戶偏好
  updatePreferences: (preferences) => 
    apiClient.post(API_CONFIG.ENDPOINTS.PREFERENCES, preferences)
};

export default apiClient;

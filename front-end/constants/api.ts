import { getBackendApiUrl } from "@/utils/settings";

let customBackendUrl: string | null = null;

// 初始化時載入自訂的後端 URL
(async () => {
  customBackendUrl = await getBackendApiUrl();
})();

/**
 * 動態獲取後端 API URL
 * 優先使用用戶自訂的 URL，否則使用環境變數
 */
export const getBaseUrl = (): string => {
  return customBackendUrl || process.env.EXPO_PUBLIC_IP || "";
};

export const API_CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  ENDPOINTS: {
    BOOK_WORDS: "/api/book_words",
    CATEGORIES: "/api/categories",
    RECOMMENDATIONS: "/api/recommendations",
    STATS: "/api/stats",
    FAVORITES: "/api/favorites",
    MATERIALS: "/api/materials",
    MATERIAL: "/api/material",
    PREFERENCES: "/api/preferences", // 使用者偏好問卷
    DAILY_SIGN: "/api/daily-sign", // 每日一句手語

    // 學習統計相關
    LEARNING_STATS: "/api/learning-stats",
    USER_STATS: "/api/learning-stats/user",
    LEARNING_ACTIVITY: "/api/learning-stats/activity",
    LEARNING_HISTORY: "/api/learning-stats/history",
    ACHIEVEMENTS: "/api/learning-stats/achievements",
  },
  TIMEOUT: 10000,
};

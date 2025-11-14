import { getBackendApiUrl } from "@/utils/settings";

let customBackendUrl: string | null = null;
let isLoadingCustomUrl = false;
let hasLoadedOnce = false;

// 非同步載入自訂的後端 URL
const loadCustomBackendUrl = async () => {
  if (isLoadingCustomUrl || hasLoadedOnce) return;
  isLoadingCustomUrl = true;
  try {
    const url = await getBackendApiUrl();
    // 只有在有有效值時才設定，否則保持 null 以使用 .env 預設值
    customBackendUrl = url && url.trim() !== '' ? url : null;
    hasLoadedOnce = true;
  } catch (error) {
    console.error('❌ 載入自訂後端 URL 失敗:', error);
  } finally {
    isLoadingCustomUrl = false;
  }
};

// 立即開始載入（但不會阻塞）
loadCustomBackendUrl();

/**
 * 動態獲取後端 API URL
 * 優先使用用戶自訂的 URL（如果有且不為空），否則使用環境變數
 */
export const getBaseUrl = (): string => {
  // 如果 customBackendUrl 是 null 或空字串，使用 .env 預設值
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

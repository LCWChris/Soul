export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_IP, // 直接使用 ngrok URL（已包含協議和域名）
  ENDPOINTS: {
    BOOK_WORDS: "/api/book_words",
    CATEGORIES: "/api/categories",
    RECOMMENDATIONS: "/api/recommendations",
    STATS: "/api/stats",
    FAVORITES: "/api/favorites",
    MATERIALS: "/api/materials",
    MATERIAL: "/api/material",
    PREFERENCES: "/api/preferences", // 使用者偏好問卷
  },
  TIMEOUT: 10000,
};

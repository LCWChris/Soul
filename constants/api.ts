export const API_CONFIG = {
  BASE_URL: `http://${process.env.EXPO_PUBLIC_IP}:3001`, // 修正字串模板語法
  ENDPOINTS: {
    BOOK_WORDS: "/api/book_words",
    CATEGORIES: "/api/categories",
    RECOMMENDATIONS: "/api/recommendations",
    STATS: "/api/stats",
    FAVORITES: "/api/favorites",
    MATERIALS: "/api/materials",
    MATERIAL: "/api/material",
  },
  TIMEOUT: 10000,
};

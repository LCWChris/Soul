export const API_CONFIG = {
  BASE_URL: `http://${process.env.EXPO_PUBLIC_IP}:3001`,
  ENDPOINTS: {
    BOOK_WORDS: "/api/book_words",
    FAVORITES: "/api/favorites",
    MATERIALS: "/api/materials",
    MATERIAL: "/api/material",
  },
  TIMEOUT: 10000,
};

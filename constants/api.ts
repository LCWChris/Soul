import { Platform } from "react-native";

// ✅ 從 .env 讀取 EXPO_PUBLIC_IP（如果有設定，優先使用）
const ENV_IP = process.env.EXPO_PUBLIC_IP;

// ✅ 本機內網 IP（手機測試用，請改成自己的電腦 IPv4）
const LOCAL_NETWORK_IP = "192.168.1.231:3001";

// ✅ 正式環境 API（雲端部署時使用）
const PRODUCTION_API = "https://your-api.onrender.com";

let BASE_URL: string;

if (__DEV__) {
  if (Platform.OS === "web") {
    // ✅ Web 環境：強制用 localhost
    BASE_URL = "http://localhost:3001";
  } else if (ENV_IP) {
    // ✅ 優先使用 .env 裡設定的 IP
    BASE_URL = `http://${ENV_IP}:3001`;
  } else if (Platform.OS === "android") {
    // ✅ Android 模擬器
    BASE_URL = "http://10.0.2.2:3001";
  } else if (Platform.OS === "ios") {
    // ✅ iOS 模擬器
    BASE_URL = "http://localhost:3001";
  } else {
    // ✅ Expo Go (手機實機)
    BASE_URL = `http://${LOCAL_NETWORK_IP}`;
  }
} else {
  // ✅ 上線模式
  BASE_URL = PRODUCTION_API;
}

export const API_CONFIG = {
  BASE_URL,
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

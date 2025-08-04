// API 配置文件
// 支援不同裝置和網路環境的動態配置

// 🔧 配置選項：根據使用情況調整
const NETWORK_CONFIG = {
  // 開發模式：選擇您當前的使用情況
  DEVELOPMENT_MODE: 'CROSS_DEVICE', // 'LOCAL' | 'CROSS_DEVICE' | 'WIFI'
  
  // IP 地址配置
  IPS: {
    LOCAL: 'http://localhost:3001',           // 同一台電腦（模擬器/瀏覽器）
    HOTSPOT: 'http://172.20.10.3:3001',      // 手機熱點網路
    WIFI_HOME: 'http://192.168.1.100:3001',  // 家用 WiFi（需要手動更新您的 IP）
    WIFI_OFFICE: 'http://192.168.0.100:3001', // 辦公室 WiFi（需要手動更新）
  }
};

const getApiBaseUrl = () => {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // 根據開發模式選擇 IP
    switch (NETWORK_CONFIG.DEVELOPMENT_MODE) {
      case 'LOCAL':
        return NETWORK_CONFIG.IPS.LOCAL;
      case 'CROSS_DEVICE':
        return NETWORK_CONFIG.IPS.HOTSPOT;
      case 'WIFI':
        return NETWORK_CONFIG.IPS.WIFI_HOME;
      default:
        return NETWORK_CONFIG.IPS.HOTSPOT; // 預設使用熱點 IP
    }
  } else {
    // 生產環境配置
    return 'https://your-production-api.com';
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    BOOK_WORDS: '/api/book_words',
    FAVORITES: '/api/favorites',
  },
  TIMEOUT: 10000, // 10 秒超時
};

// 🛠️ 使用說明：
// 1. LOCAL: 在同一台電腦使用（模擬器/瀏覽器測試）
// 2. CROSS_DEVICE: 跨裝置使用（手機/平板連接同一熱點）
// 3. WIFI: WiFi 網路使用（需要更新實際 IP 地址）
//
// 💡 如何找到您的 IP：
// Windows: 開啟 cmd 執行 'ipconfig'
// Mac/Linux: 開啟終端執行 'ifconfig'
// 
// 🔄 切換模式：只需修改 DEVELOPMENT_MODE 即可

// 使用範例：
// const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}`;

export default API_CONFIG;

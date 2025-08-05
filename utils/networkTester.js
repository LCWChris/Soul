// 網路連接檢測工具
// 用於快速測試不同 IP 地址的連接狀況

import { API_CONFIG } from '../constants/api';

export const NetworkTester = {
  // 測試 API 連接
  async testApiConnection(url = API_CONFIG.BASE_URL) {
    try {
      console.log(`🔍 正在測試連接: ${url}`);
      
      const response = await fetch(url + '/api/test', {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        console.log(`✅ 連接成功: ${url}`);
        return { success: true, url, status: response.status };
      } else {
        console.log(`❌ 連接失敗: ${url} (狀態碼: ${response.status})`);
        return { success: false, url, status: response.status };
      }
    } catch (error) {
      console.log(`❌ 連接錯誤: ${url} - ${error.message}`);
      return { success: false, url, error: error.message };
    }
  },

  // 測試所有可用的 IP 地址
  async testAllConnections() {
    console.log('🚀 開始測試所有網路連接...');
    
    const testUrls = [
      'http://localhost:3001',
      'http://172.20.10.3:3001',
      'http://192.168.1.100:3001',
      'http://127.0.0.1:3001',
    ];

    const results = [];
    
    for (const url of testUrls) {
      const result = await this.testApiConnection(url);
      results.push(result);
      
      // 如果找到可用的連接，可以提前結束
      if (result.success) {
        console.log(`🎉 發現可用連接: ${url}`);
        break;
      }
    }

    return results;
  },

  // 獲取網路狀態信息
  async getNetworkInfo() {
    console.log('📊 網路狀態檢查:');
    console.log(`當前 API 地址: ${API_CONFIG.BASE_URL}`);
    console.log(`超時設定: ${API_CONFIG.TIMEOUT}ms`);
    
    // 測試當前配置的連接
    const currentResult = await this.testApiConnection();
    
    return {
      currentUrl: API_CONFIG.BASE_URL,
      connectionStatus: currentResult.success,
      timestamp: new Date().toISOString(),
    };
  }
};

// 使用範例（在開發時可以在 console 中呼叫）:
// import { NetworkTester } from './utils/networkTester';
// NetworkTester.getNetworkInfo();
// NetworkTester.testAllConnections();

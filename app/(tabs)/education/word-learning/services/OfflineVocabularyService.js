import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineVocabularyService {
  static STORAGE_KEYS = {
    VOCABULARIES: 'offline_vocabularies',
    CATEGORIES: 'offline_categories',
    USER_PROGRESS: 'offline_user_progress',
    FAVORITES: 'offline_favorites',
    LAST_SYNC: 'last_sync_timestamp'
  };

  // 同步在線數據到本地
  static async syncData() {
    try {
      const timestamp = new Date().toISOString();
      
      // 下載所有詞彙數據
      const vocabularies = await this.fetchAllVocabularies();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.VOCABULARIES, 
        JSON.stringify(vocabularies)
      );

      // 下載分類數據
      const categories = await this.fetchAllCategories();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CATEGORIES, 
        JSON.stringify(categories)
      );

      // 保存同步時間戳
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, timestamp);
      
      return { success: true, timestamp };
    } catch (error) {
      console.error('數據同步失敗:', error);
      return { success: false, error };
    }
  }

  // 獲取離線詞彙數據
  static async getOfflineVocabularies(filters = {}) {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.VOCABULARIES);
      if (!data) return [];

      let vocabularies = JSON.parse(data);
      
      // 應用篩選器
      if (filters.category) {
        vocabularies = vocabularies.filter(vocab => 
          vocab.categories && vocab.categories.includes(filters.category)
        );
      }
      
      if (filters.level) {
        vocabularies = vocabularies.filter(vocab => 
          vocab.learning_level === filters.level
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        vocabularies = vocabularies.filter(vocab =>
          vocab.word.toLowerCase().includes(searchTerm) ||
          vocab.definition.toLowerCase().includes(searchTerm)
        );
      }

      return vocabularies;
    } catch (error) {
      console.error('獲取離線詞彙失敗:', error);
      return [];
    }
  }

  // 獲取離線分類數據
  static async getOfflineCategories() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('獲取離線分類失敗:', error);
      return [];
    }
  }

  // 保存用戶進度（離線）
  static async saveUserProgress(progressData) {
    try {
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
      const progress = existingData ? JSON.parse(existingData) : {};
      
      // 合併新的進度數據
      Object.assign(progress, progressData);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROGRESS, 
        JSON.stringify(progress)
      );
      
      return { success: true };
    } catch (error) {
      console.error('保存用戶進度失敗:', error);
      return { success: false, error };
    }
  }

  // 獲取用戶進度
  static async getUserProgress() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('獲取用戶進度失敗:', error);
      return {};
    }
  }

  // 管理收藏（離線）
  static async toggleFavorite(wordId) {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      const favorites = data ? JSON.parse(data) : [];
      
      const index = favorites.indexOf(wordId);
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(wordId);
      }
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.FAVORITES, 
        JSON.stringify(favorites)
      );
      
      return { success: true, isFavorite: index === -1 };
    } catch (error) {
      console.error('管理收藏失敗:', error);
      return { success: false, error };
    }
  }

  // 獲取收藏列表
  static async getFavorites() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('獲取收藏列表失敗:', error);
      return [];
    }
  }

  // 檢查是否有離線數據
  static async hasOfflineData() {
    try {
      const vocabularies = await AsyncStorage.getItem(this.STORAGE_KEYS.VOCABULARIES);
      const categories = await AsyncStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      return vocabularies !== null && categories !== null;
    } catch (error) {
      return false;
    }
  }

  // 獲取最後同步時間
  static async getLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      return null;
    }
  }

  // 清除所有離線數據
  static async clearOfflineData() {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.VOCABULARIES,
        this.STORAGE_KEYS.CATEGORIES,
        this.STORAGE_KEYS.USER_PROGRESS,
        this.STORAGE_KEYS.FAVORITES,
        this.STORAGE_KEYS.LAST_SYNC
      ]);
      return { success: true };
    } catch (error) {
      console.error('清除離線數據失敗:', error);
      return { success: false, error };
    }
  }

  // 獲取離線存儲統計
  static async getStorageStats() {
    try {
      const vocabularies = await AsyncStorage.getItem(this.STORAGE_KEYS.VOCABULARIES);
      const categories = await AsyncStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      const progress = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
      const favorites = await AsyncStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      
      return {
        vocabulariesCount: vocabularies ? JSON.parse(vocabularies).length : 0,
        categoriesCount: categories ? JSON.parse(categories).length : 0,
        favoritesCount: favorites ? JSON.parse(favorites).length : 0,
        hasProgress: progress !== null,
        lastSync: await this.getLastSyncTime()
      };
    } catch (error) {
      console.error('獲取存儲統計失敗:', error);
      return null;
    }
  }

  // 輔助方法：從服務器獲取所有詞彙
  static async fetchAllVocabularies() {
    // 這裡需要調用實際的API來獲取所有詞彙
    // 返回格式應該與在線API相同
    const response = await fetch('http://172.20.10.3:3001/api/vocabularies/all');
    if (!response.ok) throw new Error('獲取詞彙數據失敗');
    return await response.json();
  }

  // 輔助方法：從服務器獲取所有分類
  static async fetchAllCategories() {
    // 這裡需要調用實際的API來獲取所有分類
    const response = await fetch('http://172.20.10.3:3001/api/categories');
    if (!response.ok) throw new Error('獲取分類數據失敗');
    return await response.json();
  }
}

export default OfflineVocabularyService;

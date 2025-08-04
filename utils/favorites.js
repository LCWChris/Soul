import AsyncStorage from '@react-native-async-storage/async-storage';

// 收藏數據管理工具

// 獲取用戶收藏列表
export const getFavorites = async (userId) => {
  try {
    const favoritesData = await AsyncStorage.getItem(`favorites_${userId}`);
    if (favoritesData) {
      const favoritesArray = JSON.parse(favoritesData);
      return new Set(favoritesArray);
    }
    return new Set();
  } catch (error) {
    console.error('載入收藏失敗', error);
    return new Set();
  }
};

// 保存收藏列表
export const saveFavorites = async (userId, favoritesSet) => {
  try {
    const favoritesArray = Array.from(favoritesSet);
    await AsyncStorage.setItem(`favorites_${userId}`, JSON.stringify(favoritesArray));
    console.log('💾 收藏數據已保存:', favoritesArray);
    return true;
  } catch (error) {
    console.error('保存收藏失敗', error);
    return false;
  }
};

// 添加收藏
export const addFavorite = async (userId, wordId) => {
  try {
    const favorites = await getFavorites(userId);
    favorites.add(wordId);
    await saveFavorites(userId, favorites);
    console.log('❤️ 加入收藏:', wordId);
    return favorites;
  } catch (error) {
    console.error('添加收藏失敗', error);
    return null;
  }
};

// 移除收藏
export const removeFavorite = async (userId, wordId) => {
  try {
    const favorites = await getFavorites(userId);
    favorites.delete(wordId);
    await saveFavorites(userId, favorites);
    console.log('🗑️ 移除收藏:', wordId);
    return favorites;
  } catch (error) {
    console.error('移除收藏失敗', error);
    return null;
  }
};

// 切換收藏狀態
export const toggleFavorite = async (userId, wordId) => {
  try {
    const favorites = await getFavorites(userId);
    if (favorites.has(wordId)) {
      favorites.delete(wordId);
      console.log('🗑️ 移除收藏:', wordId);
    } else {
      favorites.add(wordId);
      console.log('❤️ 加入收藏:', wordId);
    }
    await saveFavorites(userId, favorites);
    return favorites;
  } catch (error) {
    console.error('切換收藏失敗', error);
    return null;
  }
};

// 檢查是否已收藏
export const isFavorite = async (userId, wordId) => {
  try {
    const favorites = await getFavorites(userId);
    return favorites.has(wordId);
  } catch (error) {
    console.error('檢查收藏狀態失敗', error);
    return false;
  }
};

// 清空所有收藏
export const clearAllFavorites = async (userId) => {
  try {
    await AsyncStorage.removeItem(`favorites_${userId}`);
    console.log('🗑️ 已清空所有收藏');
    return new Set();
  } catch (error) {
    console.error('清空收藏失敗', error);
    return null;
  }
};

// 獲取收藏數量
export const getFavoritesCount = async (userId) => {
  try {
    const favorites = await getFavorites(userId);
    return favorites.size;
  } catch (error) {
    console.error('獲取收藏數量失敗', error);
    return 0;
  }
};

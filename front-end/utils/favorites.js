import AsyncStorage from '@react-native-async-storage/async-storage';

// 收藏數據管理工具

// 獲取用戶收藏列表
export const getFavorites = async (userId = 'default') => {
  try {
    const favoritesData = await AsyncStorage.getItem(`favorites_${userId}`);
    if (favoritesData) {
      const favoritesArray = JSON.parse(favoritesData);
      return favoritesArray; // 直接返回陣列，不是 Set
    }
    return [];
  } catch (error) {
    console.error('載入收藏失敗', error);
    return [];
  }
};

// 保存收藏列表
export const saveFavorites = async (userId = 'default', favoritesArray) => {
  try {
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
export const toggleFavorite = async (wordId, userId = 'default') => {
  try {
    const favorites = await getFavorites(userId);
    const favoritesArray = Array.isArray(favorites) ? favorites : [];
    const index = favoritesArray.indexOf(wordId);
    
    if (index > -1) {
      favoritesArray.splice(index, 1);
      console.log('🗑️ 移除收藏:', wordId);
    } else {
      favoritesArray.push(wordId);
      console.log('❤️ 加入收藏:', wordId);
    }
    
    await saveFavorites(userId, favoritesArray);
    return favoritesArray;
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

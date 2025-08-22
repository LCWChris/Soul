import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'vocabulary_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入收藏列表
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('載入收藏失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 儲存收藏列表
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('保存收藏失敗:', error);
      throw error;
    }
  };

  // 切換收藏狀態
  const toggleFavorite = async (wordId) => {
    try {
      const currentFavorites = [...favorites];
      const index = currentFavorites.indexOf(wordId);
      
      if (index > -1) {
        // 移除收藏
        currentFavorites.splice(index, 1);
      } else {
        // 添加收藏
        currentFavorites.push(wordId);
      }
      
      await saveFavorites(currentFavorites);
      return index === -1; // 返回是否是新添加的收藏
    } catch (error) {
      console.error('切換收藏失敗:', error);
      throw error;
    }
  };

  // 檢查是否已收藏
  const isFavorite = (wordId) => {
    return favorites.includes(wordId);
  };

  // 清空所有收藏
  const clearFavorites = async () => {
    try {
      await saveFavorites([]);
    } catch (error) {
      console.error('清空收藏失敗:', error);
      throw error;
    }
  };

  // 批量添加收藏
  const addMultipleFavorites = async (wordIds) => {
    try {
      const currentFavorites = [...favorites];
      const newFavorites = [...new Set([...currentFavorites, ...wordIds])];
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('批量添加收藏失敗:', error);
      throw error;
    }
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    addMultipleFavorites,
    favoritesCount: favorites.length,
    refresh: loadFavorites
  };
};

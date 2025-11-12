import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATION_API_URL_KEY = 'translation_api_url';

/**
 * 保存翻譯 API 的 URL
 * @param {string} url - 要保存的 URL
 */
export const saveTranslationApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem(TRANSLATION_API_URL_KEY, url);
    console.log('✅ 翻譯 API URL 已保存:', url);
  } catch (e) {
    console.error('❌ 保存翻譯 API URL 失敗:', e);
  }
};

/**
 * 獲取已保存的翻譯 API URL
 * @returns {Promise<string|null>} - 已保存的 URL，如果不存在則返回 null
 */
export const getTranslationApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(TRANSLATION_API_URL_KEY);
    console.log('✅ 讀取到翻譯 API URL:', url);
    return url;
  } catch (e) {
    console.error('❌ 讀取翻譯 API URL 失敗:', e);
    return null;
  }
};

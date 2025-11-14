import AsyncStorage from "@react-native-async-storage/async-storage";

const TRANSLATION_API_URL_KEY = "translation_api_url";
const BACKEND_API_URL_KEY = "backend_api_url";
const GEMINI_API_KEY = "gemini_api_key";

/**
 * 保存翻譯 API 的 URL
 * @param {string} url - 要保存的 URL
 */
export const saveTranslationApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem(TRANSLATION_API_URL_KEY, url);
    console.log("✅ 翻譯 API URL 已保存:", url);
  } catch (e) {
    console.error("❌ 保存翻譯 API URL 失敗:", e);
  }
};

/**
 * 獲取已保存的翻譯 API URL
 * @returns {Promise<string|null>} - 已保存的 URL，如果不存在則返回 null
 */
export const getTranslationApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(TRANSLATION_API_URL_KEY);
    console.log("✅ 讀取到翻譯 API URL:", url);
    return url;
  } catch (e) {
    console.error("❌ 讀取翻譯 API URL 失敗:", e);
    return null;
  }
};

/**
 * 保存後端 API 的 URL
 * @param {string} url - 要保存的 URL
 */
export const saveBackendApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem(BACKEND_API_URL_KEY, url);
    console.log("✅ 後端 API URL 已保存:", url);
  } catch (e) {
    console.error("❌ 保存後端 API URL 失敗:", e);
  }
};

/**
 * 獲取已保存的後端 API URL
 * @returns {Promise<string|null>} - 已保存的 URL，如果不存在則返回 null
 */
export const getBackendApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(BACKEND_API_URL_KEY);
    console.log("✅ 讀取到後端 API URL:", url);
    return url;
  } catch (e) {
    console.error("❌ 讀取後端 API URL 失敗:", e);
    return null;
  }
};

/**
 * 保存 Gemini API Key
 * @param {string} key - 要保存的 API Key
 */
export const saveGeminiApiKey = async (key) => {
  try {
    await AsyncStorage.setItem(GEMINI_API_KEY, key);
    console.log("✅ Gemini API Key 已保存");
  } catch (e) {
    console.error("❌ 保存 Gemini API Key 失敗:", e);
  }
};

/**
 * 獲取已保存的 Gemini API Key
 * @returns {Promise<string|null>} - 已保存的 Key，如果不存在則返回 null
 */
export const getGeminiApiKey = async () => {
  try {
    const key = await AsyncStorage.getItem(GEMINI_API_KEY);
    console.log("✅ 讀取到 Gemini API Key:", key ? "***" : "null");
    return key;
  } catch (e) {
    console.error("❌ 讀取 Gemini API Key 失敗:", e);
    return null;
  }
};

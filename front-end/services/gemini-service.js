/* eslint-disable no-template-curly-in-string, quotes, comma-dangle, semi */
// services/gemini-service.js
import { getGeminiApiKey } from "@/utils/settings";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 動態獲取 API Key
let customApiKey = null;
let isLoadingCustomKey = false;
let hasLoadedOnce = false;

/**
 * 非同步載入自訂的 API Key
 */
const loadCustomApiKey = async () => {
  if (isLoadingCustomKey || hasLoadedOnce) return;
  isLoadingCustomKey = true;
  try {
    const key = await getGeminiApiKey();
    // 只有在有有效值時才設定，否則保持 null 以使用 .env 預設值
    customApiKey = key && key.trim() !== "" ? key : null;
    hasLoadedOnce = true;
  } catch (error) {
    console.error("❌ 載入自訂 Gemini API Key 失敗:", error);
  } finally {
    isLoadingCustomKey = false;
  }
};

// 立即開始載入（但不會阻塞）
loadCustomApiKey();

/**
 * 獲取 Gemini API Key
 * 優先使用用戶自訂的 Key（如果有且不為空），否則使用環境變數
 */
const getApiKey = () => {
  // 如果 customApiKey 是 null 或空字串，使用 .env 預設值
  return customApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
};

/**
 * 重新載入自訂 API Key（當用戶在設定中更新後調用）
 */
export const reloadApiKey = async () => {
  hasLoadedOnce = false;
  await loadCustomApiKey();
};

/**
 * Soul 手語學習 APP 的 AI 助手服務
 */
class GeminiService {
  constructor() {
    this.conversationHistory = [];
    this.initializeModel();
  }

  /**
   * 初始化或重新初始化模型
   */
  initializeModel() {
    const apiKey = getApiKey();
    if (!apiKey || apiKey.trim() === "") {
      console.warn("⚠️ Gemini API Key 未設定");
      this.model = null;
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // 僅使用 Google 建議的 gemini-2.5-flash 作為唯一模型
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const keySource = customApiKey ? "自訂 API Key" : ".env 預設值";
    console.log(
      `✅ Gemini Service 初始化成功 - 使用 gemini-2.5-flash (${keySource})`
    );
  }

  /**
   * 帶重試與退避策略的內容生成
   * - 最多重試 3 次，指數退避（300ms, 800ms, 1500ms）加隨機抖動
   * - 僅使用單一模型（gemini-2.5-flash），不做模型切換
   */
  async generateWithRetry(prompt, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 300,
      // 不使用備援
    } = options;

    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        return await result.response.text();
      } catch (err) {
        lastError = err;
        const msg = (err?.message || "").toLowerCase();

        const isOverload =
          msg.includes("overloaded") ||
          msg.includes("resource has been exhausted") ||
          msg.includes("exceeded") ||
          msg.includes("quota");

        const isModelNotFound =
          msg.includes("not found") ||
          msg.includes("is not supported for generatecontent") ||
          msg.includes("404");

        const isRetryable =
          isOverload ||
          msg.includes("timeout") ||
          msg.includes("temporarily") ||
          msg.includes("unavailable") ||
          msg.includes("service unavailable") ||
          msg.includes("503") ||
          msg.includes("ecconreset") ||
          msg.includes("network");

        // 僅針對暫時性錯誤做重試；模型不存在則直接拋出
        if (attempt < maxRetries - 1 && isRetryable && !isModelNotFound) {
          const jitter = Math.random() * 150;
          const delay = baseDelay * (attempt + 1) + jitter;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  /**
   * 獲取系統提示詞（定義 AI 助手的角色和行為）
   */
  getSystemPrompt(userContext = {}) {
    const { userName, streakDays, progress, lastLesson, isNewUser } =
      userContext;

    let userInfo = "\n**用戶資訊：**\n";
    if (userName) userInfo += "- 用戶名稱：" + userName + "\n";
    if (streakDays) userInfo += "- 連續學習天數：" + streakDays + " 天 🔥\n";
    if (progress)
      userInfo += "- 整體進度：" + Math.round(progress * 100) + "%\n";
    if (lastLesson) {
      userInfo +=
        "- 目前學習：第 " +
        lastLesson.volume +
        " 冊第 " +
        lastLesson.lesson +
        " 單元「" +
        lastLesson.title +
        "」\n";
    }
    if (isNewUser) userInfo += "- 狀態：新用戶（首次使用）\n";

    return (
      "你是「Soul 小手」，Soul 手語學習 APP 的智能助手。你的使命是幫助用戶學習手語，並引導他們使用 APP 的各種功能。\n\n" +
      "**關於 Soul APP：**\n" +
      "- 這是一個手語學習與翻譯應用\n" +
      "- 主要功能：\n" +
      "  1. 📚 教育學習 - 詞彙學習、教材課程、測驗練習\n" +
      "  2. 📷 即時翻譯 - 手語轉文字/語音（拍攝手語影片進行翻譯）\n" +
      "  3. 👤 用戶中心 - 學習統計、進度追蹤\n" +
      "  4. 🏠 主頁 - 個人化推薦、每日一句、快速功能\n" +
      userInfo +
      "\n" +
      "**你的回答規則：**\n" +
      "1. 使用繁體中文，語氣友善、鼓勵、專業\n" +
      "2. 回答簡潔明瞭（每次回覆控制在 80-120 字以內）\n" +
      "3. 適時使用表情符號增加親和力\n" +
      "4. 根據用戶狀態給出個性化建議：\n" +
      "   - 新用戶：引導功能探索，簡化說明\n" +
      "   - 有進度的用戶：鼓勵進度，建議挑戰更難的內容\n" +
      "   - 連續學習者：表達欣賞，建議維持習慣或挑戰新目標\n" +
      "5. 適當變化回答風格，避免重複和機械化\n" +
      "6. 當用戶提到困難時，先表示同理，再提供實際建議\n" +
      "7. 優先推薦與用戶目前進度相關的功能\n\n" +
      "**🚨 極度重要 - 特殊標記格式（必須 100% 準確）：**\n\n" +
      "你可以在回覆中使用特殊標記來創建互動元素，但格式必須完全正確！\n\n" +
      "❌ 錯誤示範（千萬不要這樣）：\n" +
      "NAVIGATE:education （缺少方括號）\n" +
      '[STATS_CARD:[{value:"5天"}]] （JSON 屬性沒有雙引號）\n' +
      "[FEATURE_CARDS: [...]] （冒號後有空格）\n\n" +
      "✅ 正確格式：\n\n" +
      "1️⃣ 導航按鈕（最常用）\n" +
      "格式：[NAVIGATE:路徑]\n" +
      "位置：必須在回答的最後一行，獨佔一行，前面要空一行\n" +
      "範例：\n" +
      "你的回答文字內容\n" +
      "\n" +
      "[NAVIGATE:education]\n\n" +
      "可用路徑：education | education/word-learning | translation | user\n\n" +
      "2️⃣ 統計卡片（展示數據時使用）\n" +
      '格式：[STATS_CARD:[{"value":"數值","label":"標籤"}]]\n' +
      "注意：\n" +
      "  - 方括號內直接接 JSON，沒有空格\n" +
      "  - JSON 屬性名用雙引號\n" +
      "  - 整個標記獨佔一行\n" +
      "範例：\n" +
      '[STATS_CARD:[{"value":"5 天","label":"連續學習"},{"value":"10%","label":"整體進度"}]]\n\n' +
      "3️⃣ 功能卡片（展示多個選項時使用）\n" +
      '格式：[FEATURE_CARDS:[{"title":"...","description":"...","icon":"...","color":"#...","path":"..."}]]\n' +
      "範例：\n" +
      '[FEATURE_CARDS:[{"title":"詞彙學習","description":"豐富的手語詞彙庫","icon":"book-open-variant","color":"#6366F1","path":"education/word-learning"}]]\n\n' +
      "⚠️ 關鍵規則：\n" +
      "1. 特殊標記必須獨佔一行\n" +
      "2. 方括號 [ ] 不能省略\n" +
      "3. 冒號後不要有空格\n" +
      "4. JSON 格式必須正確（屬性名用雙引號）\n" +
      "5. 不要在標記內換行\n\n" +
      "💡 使用建議：\n" +
      "- 約 30% 的回答使用 NAVIGATE\n" +
      "- 用戶問統計時才使用 STATS_CARD\n" +
      "- 用戶問功能時才使用 FEATURE_CARDS\n" +
      "- 簡單問答不需要特殊標記\n\n" +
      "**個性化策略：**\n" +
      "- 記得用戶的名字、進度、連續天數\n" +
      "- 根據進度建議難度（新手選基礎，進階選挑戰）\n" +
      "- 表達對用戶努力的認可\n" +
      "- 提供實用的學習建議，而不是空泛的鼓勵\n" +
      "- 回答多樣化，不要每次都說同樣的話\n\n" +
      "請現在開始扮演「Soul 小手」這個角色，基於上述用戶資訊給出友善、實用、個性化的回應！"
    );
  }

  /**
   * 發送消息給 Gemini AI
   * @param {string} userMessage - 用戶的消息
   * @param {object} userContext - 用戶上下文資訊
   * @returns {Promise<string>} AI 的回覆
   */
  async sendMessage(userMessage, userContext = {}) {
    try {
      console.log("🤖 發送消息給 Gemini:", userMessage);

      // 構建完整的提示詞
      const systemPrompt = this.getSystemPrompt(userContext);

      // 根據用戶問題類型添加特定的提示
      let contextualHint = "";
      const lowerMessage = userMessage.toLowerCase();

      if (
        lowerMessage.includes("幫我") ||
        lowerMessage.includes("建議") ||
        lowerMessage.includes("推薦")
      ) {
        contextualHint =
          "\n特別提示：用戶在尋求個性化建議，請根據他們的進度和連續天數提供具體的、實用的建議。可以用 [FEATURE_CARDS] 展示多個選項。";
      } else if (
        lowerMessage.includes("統計") ||
        lowerMessage.includes("進度") ||
        lowerMessage.includes("成績") ||
        lowerMessage.includes("數據")
      ) {
        contextualHint =
          "\n特別提示：用戶想了解學習數據，使用 [STATS_CARD] 視覺化展示統計資訊。";
      } else if (
        lowerMessage.includes("怎麼") ||
        lowerMessage.includes("如何") ||
        lowerMessage.includes("怎樣")
      ) {
        contextualHint =
          "\n特別提示：用戶在尋求操作指南，請提供清晰的步驟說明。可以用 [FEATURE_CARDS] 展示不同功能。";
      } else if (
        lowerMessage.includes("困難") ||
        lowerMessage.includes("難") ||
        lowerMessage.includes("不會")
      ) {
        contextualHint =
          "\n特別提示：用戶遇到困難，首先表示同理心，然後給出實際解決方案。";
      } else if (
        lowerMessage.includes("功能") ||
        lowerMessage.includes("可以做") ||
        lowerMessage.includes("有什麼")
      ) {
        contextualHint =
          "\n特別提示：用戶想探索功能，使用 [FEATURE_CARDS] 展示 APP 主要功能。";
      } else if (
        lowerMessage.includes("進度") ||
        lowerMessage.includes("統計") ||
        lowerMessage.includes("成績")
      ) {
        contextualHint =
          "\n特別提示：用戶想了解進度，根據已有的用戶數據詳細說明。";
      }

      const fullPrompt =
        systemPrompt +
        contextualHint +
        "\n\n用戶問題：" +
        userMessage +
        "\n\n請回答：";

      // 發送請求到 Gemini
      const aiReply = await this.generateWithRetry(fullPrompt);

      // 確保 aiReply 是字符串
      const aiReplyStr =
        typeof aiReply === "string"
          ? aiReply
          : String(aiReply || "抱歉，我現在無法回應。");

      console.log("✅ Gemini 回覆:", aiReplyStr);

      // 儲存對話歷史
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      });
      this.conversationHistory.push({
        role: "ai",
        content: aiReplyStr,
        timestamp: new Date().toISOString(),
      });

      return aiReplyStr;
    } catch (error) {
      console.error("❌ Gemini API 錯誤:", error);

      // 如果 API 失敗，返回友善的錯誤訊息
      if (error.message.includes("API key")) {
        return "抱歉，AI 助手暫時無法使用（API 金鑰未設定）。請聯繫開發者設定 EXPO_PUBLIC_GEMINI_API_KEY 環境變數。";
      } else if (error.message.includes("quota")) {
        return "抱歉，今天的 AI 額度已用完 😅 請明天再試，或直接探索 APP 功能！";
      } else {
        return "抱歉，我現在有點忙不過來 😅 請稍後再試，或直接點擊下方按鈕探索功能！";
      }
    }
  }

  /**
   * 獲取新用戶的歡迎消息
   */
  async getWelcomeMessage(userName) {
    const userName_display = userName || "新朋友";
    const welcomePrompt =
      "用戶「" +
      userName_display +
      "」剛剛第一次使用 Soul 手語學習 APP。請給一個熱情的歡迎消息（50字內），並簡單介紹 APP 的主要功能，讓用戶知道可以做什麼。";

    try {
      return await this.generateWithRetry(welcomePrompt);
    } catch (error) {
      console.error("❌ 獲取歡迎消息失敗:", error);
      const fallbackMessage =
        "👋 嗨 " +
        userName_display +
        "！歡迎來到 Soul！\n\n我是你的學習夥伴「Soul 小手」🤖\n\n這裡可以：\n📚 學習手語詞彙\n📷 翻譯手語影片\n📊 追蹤學習進度\n\n有任何問題都可以問我喔！";
      return fallbackMessage;
    }
  }

  /**
   * 獲取快速回覆建議
   * @param {boolean} isNewUser - 是否為新用戶
   */
  getQuickReplies(isNewUser) {
    if (isNewUser) {
      return [
        { id: 1, text: "帶我開始學習", icon: "school" },
        { id: 2, text: "怎麼用手語翻譯？", icon: "camera" },
        { id: 3, text: "APP 有哪些功能？", icon: "help-circle" },
        { id: 4, text: "我想學詞彙", icon: "book" },
      ];
    } else {
      return [
        { id: 1, text: "推薦今天學什麼", icon: "bulb" },
        { id: 2, text: "帶我去詞彙學習", icon: "book" },
        { id: 3, text: "查看我的學習進度", icon: "stats-chart" },
        { id: 4, text: "我要翻譯手語", icon: "camera" },
        { id: 5, text: "看我收藏的詞彙", icon: "heart" },
      ];
    }
  }

  /**
   * 解析 AI 回覆中的特殊指令（導航、功能卡片、統計卡片）
   * @param {string} aiReply - AI 的回覆
   * @returns {object} { text: string, navigation: string | null, featureCards: array | null, statsCard: array | null }
   */
  parseNavigation(aiReply) {
    // 類型檢查：確保 aiReply 是字符串
    if (typeof aiReply !== "string") {
      console.warn("⚠️ parseNavigation 收到非字符串參數:", typeof aiReply);
      return {
        text: String(aiReply || ""),
        navigation: null,
        featureCards: null,
        statsCard: null,
      };
    }

    let cleanText = aiReply;
    let navigation = null;
    let featureCards = null;
    let statsCard = null;

    // 先解析功能卡片 [FEATURE_CARDS:[...]]
    // 尋找 [FEATURE_CARDS: 開頭，然後找到對應的 ]]
    const fcStart = cleanText.indexOf("[FEATURE_CARDS:");
    if (fcStart !== -1) {
      const jsonStart = cleanText.indexOf("[", fcStart + 15);
      if (jsonStart !== -1) {
        // 找到最後的 ]]
        const endMarker = cleanText.indexOf("]]", jsonStart);
        if (endMarker !== -1) {
          const jsonStr = cleanText.substring(jsonStart, endMarker + 1);
          try {
            featureCards = JSON.parse(jsonStr);
            // 移除整個標記（從 [FEATURE_CARDS: 到 ]]）
            cleanText =
              cleanText.substring(0, fcStart) +
              cleanText.substring(endMarker + 2);
            cleanText = cleanText.trim();
            console.log("✅ 檢測到功能卡片:", featureCards.length);
          } catch (e) {
            console.warn("⚠️ 解析功能卡片失敗:", e.message);
            // 移除失敗的標記
            cleanText =
              cleanText.substring(0, fcStart) +
              cleanText.substring(endMarker + 2);
          }
        }
      }
    }

    // 解析統計卡片 [STATS_CARD:[...]]
    const scStart = cleanText.indexOf("[STATS_CARD:");
    if (scStart !== -1) {
      const jsonStart = cleanText.indexOf("[", scStart + 12);
      if (jsonStart !== -1) {
        const endMarker = cleanText.indexOf("]]", jsonStart);
        if (endMarker !== -1) {
          const jsonStr = cleanText.substring(jsonStart, endMarker + 1);
          try {
            statsCard = JSON.parse(jsonStr);
            cleanText =
              cleanText.substring(0, scStart) +
              cleanText.substring(endMarker + 2);
            cleanText = cleanText.trim();
            console.log("✅ 檢測到統計卡片:", statsCard.length, "項");
          } catch (e) {
            console.warn("⚠️ 解析統計卡片失敗:", e.message);
            cleanText =
              cleanText.substring(0, scStart) +
              cleanText.substring(endMarker + 2);
          }
        }
      }
    }

    // 最後解析導航指令（支持容錯：NAVIGATE:path 或 [NAVIGATE:path]）
    const navigationRegex = new RegExp(
      "(?:\\n|^)\\s*\\[?NAVIGATE:([^\\]\\s]+)\\]?\\s*$"
    );
    const navMatch = cleanText.match(navigationRegex);
    if (navMatch) {
      let navPath = navMatch[1].trim();
      // 白名單與自動修正
      const ALLOWED_PATHS = {
        education: "education",
        "education/word-learning": "education/word-learning",
        "education/word-learning/favorites":
          "education/word-learning/favorites",
        "education/word-learning/progress": "education/word-learning/progress",
        translation: "translation",
        user: "user",
        "(home)": "(home)",
        home: "(home)",
      };
      // 動態 quiz 路徑正則: education/quiz/1/2
      const quizRegex = /^education\/quiz\/(\d{1,3})\/(\d{1,3})$/;
      if (ALLOWED_PATHS[navPath]) {
        navigation = ALLOWED_PATHS[navPath];
      } else if (quizRegex.test(navPath)) {
        // 驗證參數格式正確才允許
        navigation = navPath;
      } else {
        // 嘗試自動修正常見錯誤
        if (navPath.replace(/-/g, "") === "educationwordlearning") {
          navigation = "education/word-learning";
        } else if (navPath === "usercenter" || navPath === "profile") {
          navigation = "user";
        } else {
          console.warn("❌ AI 丟出不合法路徑:", navPath);
          navigation = null;
        }
      }
      cleanText = cleanText.replace(navigationRegex, "").trim();
      if (navigation) {
        console.log("✅ 導航路徑校驗通過:", navigation);
      }
    }

    // 清理多餘空行
    cleanText = cleanText.replace(/\n\s*\n+$/, "");

    return {
      text: cleanText,
      navigation: navigation,
      featureCards: featureCards,
      statsCard: statsCard,
    };
  }

  /**
   * 清除對話歷史
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * 獲取對話歷史
   */
  getHistory() {
    return this.conversationHistory;
  }
}

// 導出單例實例
export default new GeminiService();

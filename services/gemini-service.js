// services/gemini-service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// 初始化 Gemini AI
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Soul 手語學習 APP 的 AI 助手服務
 */
class GeminiService {
  constructor() {
    // 使用 Gemini 2.5 Flash（最新穩定版本）
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    this.conversationHistory = [];
    console.log("✅ Gemini Service 初始化成功 - 使用 gemini-2.5-flash");
  }

  /**
   * 獲取系統提示詞（定義 AI 助手的角色和行為）
   */
  getSystemPrompt(userContext = {}) {
    const { userName, streakDays, progress, lastLesson, isNewUser } =
      userContext;

    return `你是「Soul 小手」，Soul 手語學習 APP 的智能助手。你的使命是幫助用戶學習手語，並引導他們使用 APP 的各種功能。

**關於 Soul APP：**
- 這是一個手語學習與翻譯應用
- 主要功能：
  1. 📚 教育學習 - 詞彙學習、教材課程、測驗練習
  2. 📷 即時翻譯 - 手語轉文字/語音（拍攝手語影片進行翻譯）
  3. 👤 用戶中心 - 學習統計、進度追蹤
  4. 🏠 主頁 - 個人化推薦、每日一句、快速功能

**用戶資訊：**
${userName ? `- 用戶名稱：${userName}` : ""}
${streakDays ? `- 連續學習天數：${streakDays} 天` : ""}
${progress ? `- 整體進度：${Math.round(progress * 100)}%` : ""}
${
  lastLesson
    ? `- 目前學習：第 ${lastLesson.volume} 冊第 ${lastLesson.unit} 單元「${lastLesson.title}」`
    : ""
}
${isNewUser ? "- 狀態：新用戶（首次使用）" : ""}

**你的回答規則：**
1. 使用繁體中文，語氣友善、鼓勵、專業
2. 回答簡潔明瞭（每次回覆控制在 100 字以內）
3. 適時使用表情符號增加親和力
4. 如果用戶詢問功能使用，提供具體步驟
5. 當用戶提到學習困難時，給予鼓勵和建議
6. 如果用戶想跳轉到某個功能，回覆格式：「[NAVIGATE:路徑]」
   - 例如：「[NAVIGATE:education/quiz]」跳轉到測驗
   - 例如：「[NAVIGATE:translation]」跳轉到翻譯
   - 例如：「[NAVIGATE:education/word-learning?word=謝謝]」跳轉到學習「謝謝」這個單字

**可用跳轉路徑：**
- education - 教育學習首頁
- education/quiz - 練習測驗
- education/word-learning - 單字學習
- translation - 即時翻譯
- user - 用戶中心

請現在開始扮演「Soul 小手」這個角色，幫助用戶學習手語！`;
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
      const fullPrompt = `${systemPrompt}\n\n用戶問題：${userMessage}\n\n請回答：`;

      // 發送請求到 Gemini
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const aiReply = response.text();

      console.log("✅ Gemini 回覆:", aiReply);

      // 儲存對話歷史
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      });
      this.conversationHistory.push({
        role: "ai",
        content: aiReply,
        timestamp: new Date().toISOString(),
      });

      return aiReply;
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
    const welcomePrompt = `用戶「${
      userName || "新朋友"
    }」剛剛第一次使用 Soul 手語學習 APP。請給一個熱情的歡迎消息（50字內），並簡單介紹 APP 的主要功能，讓用戶知道可以做什麼。`;

    try {
      const result = await this.model.generateContent(welcomePrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("❌ 獲取歡迎消息失敗:", error);
      return `👋 嗨 ${
        userName || "新朋友"
      }！歡迎來到 Soul！\n\n我是你的學習夥伴「Soul 小手」🤖\n\n這裡可以：\n📚 學習手語詞彙\n📷 翻譯手語影片\n📊 追蹤學習進度\n\n有任何問題都可以問我喔！`;
    }
  }

  /**
   * 獲取快速回覆建議
   * @param {boolean} isNewUser - 是否為新用戶
   */
  getQuickReplies(isNewUser) {
    if (isNewUser) {
      return [
        { id: 1, text: "如何開始學習？", icon: "school" },
        { id: 2, text: "手語翻譯怎麼用？", icon: "camera" },
        { id: 3, text: "APP 有哪些功能？", icon: "help-circle" },
      ];
    } else {
      return [
        { id: 1, text: "推薦今天學什麼", icon: "bulb" },
        { id: 2, text: "查看我的進度", icon: "stats-chart" },
        { id: 3, text: "開始測驗", icon: "checkmark-circle" },
        { id: 4, text: "學習新詞彙", icon: "book" },
      ];
    }
  }

  /**
   * 解析 AI 回覆中的跳轉指令
   * @param {string} aiReply - AI 的回覆
   * @returns {object} { text: string, navigation: string | null }
   */
  parseNavigation(aiReply) {
    const navigationRegex = /\[NAVIGATE:([^\]]+)\]/;
    const match = aiReply.match(navigationRegex);

    if (match) {
      const navigationPath = match[1];
      const cleanText = aiReply.replace(navigationRegex, "").trim();
      return {
        text: cleanText,
        navigation: navigationPath,
      };
    }

    return {
      text: aiReply,
      navigation: null,
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

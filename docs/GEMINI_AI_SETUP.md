# 🤖 Gemini AI Chatbot 設定指南

## 📋 功能介紹

Soul APP 現在整合了 **Gemini AI 智能助手「Soul 小手」**，提供以下功能：

### ✨ 主要特色

- 🎯 **智能問答** - 回答手語學習相關問題
- 🧭 **功能引導** - 幫助用戶認識和使用 APP 功能
- 📚 **學習建議** - 根據用戶進度推薦學習內容
- 🚀 **快速跳轉** - 直接跳轉到指定功能頁面
- 👋 **新用戶歡迎** - 首次使用時提供友善引導

### 🎨 使用者體驗

- 右下角浮動按鈕（帶脈衝動畫）
- 點擊展開全屏聊天視窗
- 快速回覆按鈕（智能推薦）
- Material You 設計風格

---

## 🔑 獲取 Gemini API Key

### 步驟 1：註冊 Google AI Studio

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 使用 Google 帳號登入
3. 同意服務條款

### 步驟 2：創建 API Key

1. 點擊 **「Get API key」** 或 **「Create API key」**
2. 選擇現有的 Google Cloud 專案，或創建新專案
3. 點擊 **「Create API key in new project」**
4. 複製生成的 API Key（格式：`AIzaSy...`）

### 步驟 3：配置到 APP

在 `.env` 文件中替換 API Key：

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **重要：**

- 請勿將真實的 API Key 提交到 Git
- 保持 API Key 保密
- 定期更換 API Key 以確保安全

---

## 🚀 啟動指南

### 1. 安裝依賴（已完成）

```bash
npm install @google/generative-ai
```

### 2. 配置 API Key

在 `.env` 文件中設定：

```env
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### 3. 重新啟動 Expo

```bash
npx expo start --clear
```

### 4. 測試功能

1. 打開 APP 主頁
2. 查看右下角浮動的 AI 按鈕
3. 點擊按鈕開啟聊天視窗
4. 嘗試發送訊息

---

## 💬 使用示例

### 新用戶引導

**用戶：** 第一次使用（自動觸發）
**AI：** 👋 嗨新朋友！歡迎來到 Soul！我是你的學習夥伴「Soul 小手」🤖...

### 功能詢問

**用戶：** 如何開始學習手語？
**AI：** 很高興你想開始學習！👏 建議從「教育學習」開始...

### 進度查詢

**用戶：** 我的學習進度如何？
**AI：** 太棒了！你已經完成 45% 的課程，連續學習 5 天...

### 功能跳轉

**用戶：** 我想開始測驗
**AI：** 沒問題！帶你去測驗頁面 ➡️ [前往按鈕]

---

## 📊 API 用量管理

### 使用的模型

- **Gemini 1.5 Flash Latest** - 最新穩定版本
- 使用 `-latest` 後綴自動獲取最新版本
- 更快、更智能、更穩定

### 免費額度

- **Gemini 1.5 Flash**: 15 次請求/分鐘（免費版）
- **每日免費額度**: 1500 次請求/天
- **每月免費額度**: 充足的免費使用量

⚠️ **重要提示**：

- 使用 `gemini-1.5-flash-latest` 而不是 `gemini-1.5-flash`
- `-latest` 後綴確保使用最新穩定版本
- 避免使用已棄用的 `gemini-pro`

### 成本控制策略

1. **本地緩存** - 常見問題預設回覆
2. **智能路由** - 簡單問題不呼叫 AI
3. **用量監控** - 追蹤 API 呼叫次數

### 查看用量

前往 [Google AI Studio Dashboard](https://makersuite.google.com/app/apikey) 查看詳細用量統計

---

## 🔧 進階配置

### 自訂 AI 角色

編輯 `services/gemini-service.js` 中的 `getSystemPrompt()` 函數：

```javascript
getSystemPrompt(userContext = {}) {
  return `你是「Soul 小手」，一個專業的手語學習助手...`;
}
```

### 調整回覆長度

在 System Prompt 中添加：

```
每次回覆控制在 50-100 字以內
```

### 添加快速回覆

編輯 `getQuickReplies()` 函數：

```javascript
getQuickReplies(isNewUser) {
  return [
    { id: 1, text: '今天學什麼？', icon: 'bulb' },
    { id: 2, text: '查看進度', icon: 'stats-chart' },
    // 添加更多...
  ];
}
```

---

## 🐛 故障排除

### 問題 1：模型不存在錯誤（404 Error）

**錯誤訊息：** `models/gemini-xxx is not found for API version v1beta`
**原因：** 模型名稱不正確或 SDK 版本過舊
**解決方案：**

1. 確認 `services/gemini-service.js` 使用正確的模型名稱：

   ```javascript
   this.model = genAI.getGenerativeModel({
     model: "gemini-1.5-flash-latest",
   });
   ```

2. **可用的模型名稱**（2024 年 10 月）：

   - ✅ `gemini-1.5-flash-latest` - 最新的 Flash 版本（推薦）
   - ✅ `gemini-1.5-pro-latest` - 最新的 Pro 版本
   - ⚠️ `gemini-pro` - 舊版，可能不支援
   - ⚠️ `gemini-1.5-flash` - 需要特定版本號

3. 確保 SDK 是最新版本：

   ```bash
   npm install @google/generative-ai@latest
   ```

4. 重新啟動 Expo：
   ```bash
   npx expo start --clear
   ```

### 問題 2：API Key 無效

**錯誤訊息：** "API key not valid"
**解決方案：**

1. 檢查 `.env` 中的 API Key 是否正確
2. 確認 API Key 以 `AIzaSy` 開頭
3. 重新啟動 Expo (`npx expo start --clear`)

### 問題 3：超過用量限制

**錯誤訊息：** "Quota exceeded"
**解決方案：**

1. 等待配額重置（通常為每分鐘）
2. 升級到付費方案
3. 實作本地緩存減少 API 呼叫

### 問題 4：網路連線失敗

**錯誤訊息：** "Network request failed"
**解決方案：**

1. 檢查網路連線
2. 確認防火牆設定
3. 使用 VPN（如在特定地區）

### 問題 5：AI 回覆不準確

**解決方案：**

1. 優化 System Prompt
2. 提供更多用戶上下文
3. 添加範例回覆

---

## 📱 功能測試清單

### 基本功能

- [ ] 浮動按鈕顯示正常
- [ ] 點擊按鈕開啟聊天視窗
- [ ] 發送訊息成功
- [ ] AI 回覆正常顯示
- [ ] 關閉視窗功能正常

### 進階功能

- [ ] 新用戶自動歡迎訊息
- [ ] 快速回覆按鈕可用
- [ ] 跳轉功能正常工作
- [ ] 載入狀態顯示
- [ ] 錯誤處理正常

### UI/UX

- [ ] 動畫流暢
- [ ] 鍵盤處理正確
- [ ] 滾動至底部自動
- [ ] 訊息氣泡樣式正確
- [ ] 適配深色模式（可選）

---

## 🎯 最佳實踐

### 1. 提示詞設計

- 明確定義 AI 角色和目標
- 提供具體的回覆格式範例
- 設定回覆長度限制
- 包含用戶上下文資訊

### 2. 用戶體驗

- 快速回覆選項幫助用戶快速開始
- 提供明確的跳轉按鈕
- 適時使用表情符號增加親和力
- 載入狀態提示

### 3. 成本優化

- 實作常見問題緩存
- 避免過於頻繁的 API 呼叫
- 設定合理的輸入長度限制

### 4. 安全性

- 不在回覆中暴露敏感資訊
- 驗證用戶輸入
- 過濾不當內容
- 記錄和監控對話

---

## 📚 相關資源

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 文檔](https://ai.google.dev/docs)
- [React Native 整合指南](https://ai.google.dev/tutorials/react_quickstart)
- [最佳實踐指南](https://ai.google.dev/docs/gemini_api_overview#best-practices)

---

## 🆘 需要幫助？

如有問題，請參考：

1. 本文檔的故障排除章節
2. Google AI Studio 官方文檔
3. 專案 GitHub Issues

---

**祝您使用愉快！🎉**

_最後更新：2025-10-14_

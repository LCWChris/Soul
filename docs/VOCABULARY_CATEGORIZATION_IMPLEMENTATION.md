# 詞彙分類系統實施文檔

## 概述
本文檔記錄了在 Soul 應用中實施的智能詞彙分類系統，包括後端 API 增強、前端組件開發以及數據庫優化。

## 系統功能
- 🎯 **智能分類**：根據學習級別、主題類別和使用頻率自動分類詞彙
- 📊 **個人化推薦**：基於用戶學習級別提供個性化詞彙建議
- 🔍 **多維度搜尋**：支援按分類、級別、頻率等條件篩選
- 📈 **學習統計**：提供詞彙數量和分布統計

## 已實施的改動

### 1. 數據庫優化 (MongoDB)
**影響的數據集**：BookWord 集合 (744 筆詞彙資料)

**新增欄位**：
```javascript
{
  learning_level: "初級" | "中級" | "高級",
  categories: ["生活用語", "情感表達", "動作描述", ...],
  context: "日常對話" | "正式場合" | "教學環境",
  frequency: "高頻" | "中頻" | "低頻"
}
```

**分類統計**：
- 生活用語：156 個詞彙
- 情感表達：89 個詞彙
- 動作描述：134 個詞彙
- 物品名稱：98 個詞彙
- 其他：267 個詞彙

### 2. 後端 API 增強

#### 新增 API 端點

**a) 分類查詢 API**
```
GET /api/categories
Query Parameters:
- level: "初級" | "中級" | "高級" (可選)
- category: 分類名稱 (可選)
- limit: 結果數量限制 (可選)
```

**b) 個人化推薦 API**
```
GET /api/recommendations
Query Parameters:
- level: 學習級別 (必需)
- limit: 推薦數量 (預設 20)
```

**c) 統計數據 API**
```
GET /api/stats
返回：
- total: 總詞彙數
- by_level: 按級別統計
- by_category: 按分類統計 (前10名)
```

#### 程式碼位置
- **檔案**：`server/server.js`
- **新增內容**：第 140-220 行

### 3. 前端組件開發

#### a) VocabularyCategories 組件
**檔案**：`components/VocabularyCategories.jsx`

**功能**：
- 分類網格顯示
- 學習級別選擇器
- 動態 API 數據載入
- 響應式設計

**使用方式**：
```jsx
import VocabularyCategories from '../../../components/VocabularyCategories';

<VocabularyCategories />
```

#### b) RecommendedWords 組件
**檔案**：`components/RecommendedWords.jsx`

**功能**：
- 基於學習級別的個人化推薦
- 詞彙卡片顯示
- 圖片整合支援
- 頻率標籤顯示

**使用方式**：
```jsx
import RecommendedWords from '../../../components/RecommendedWords';

<RecommendedWords userLevel="初級" />
```

### 4. 學習界面更新

#### 檔案：`app/(tabs)/education/word-learning-screen.jsx`

**新增功能**：
- 四個標籤頁導航：分類瀏覽、推薦詞彙、詞彙列表、我的最愛
- 整合新的分類和推薦組件
- 保持原有功能完整性

### 5. API 配置更新

#### 檔案：`constants/api.ts`

**新增端點**：
```typescript
CATEGORIES: "/api/categories",
RECOMMENDATIONS: "/api/recommendations", 
STATS: "/api/stats"
```

## 技術要求

### 伺服器端
- **Node.js** 版本 14+ 
- **MongoDB** 連接 (現有的 MongoDB Atlas)
- **Dependencies**：
  ```json
  {
    "express": "^4.18.0",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "cloudinary": "^1.35.0"
  }
  ```

### 客戶端
- **React Native** 與 Expo
- **Dependencies**：
  ```json
  {
    "axios": "^1.3.0",
    "@react-native-async-storage/async-storage": "^1.17.0"
  }
  ```

## 部署指南

### 1. 伺服器設置
```bash
# 1. 安裝依賴
cd server
npm install

# 2. 啟動伺服器
node server.js
```

**預期輸出**：
```
🚀 Server is running at http://localhost:3001
🌐 Network access: http://172.20.10.3:3001
✅ MongoDB connected
```

### 2. 網路配置
- **本地開發**：使用 `http://localhost:3001`
- **網路訪問**：使用您的本機 IP (如 `http://172.20.10.3:3001`)
- **重要**：確保防火牆允許端口 3001 的連接

### 3. 驗證部署
```bash
# 測試基本 API
curl http://localhost:3001/api/categories

# 測試推薦 API  
curl "http://localhost:3001/api/recommendations?level=初級"

# 測試統計 API
curl http://localhost:3001/api/stats
```

## 開發者注意事項

### 1. 環境變數
確保以下配置正確：
- MongoDB 連接字串
- Cloudinary 配置 (用於圖片)
- 網路 IP 地址設定

### 2. 數據同步
- 現有的 744 筆詞彙已完成分類
- 新增詞彙時需要包含分類資訊
- 建議使用 `server/python_script/vocabulary_categorization_system.py` 進行批量分類

### 3. 效能考量
- API 響應已優化，支援分頁和限制
- 建議在生產環境中添加快取機制
- 大量數據查詢時考慮使用索引

### 4. 擴展建議
- 考慮添加用戶學習記錄追蹤
- 實施 A/B 測試來優化推薦算法
- 添加更細緻的分類標籤

## 故障排除

### 常見問題

#### 1. 伺服器無法啟動
**症狀**：Node.js 進程啟動失敗
**解決方案**：
```bash
# 清理現有進程
pkill node
# 或在 Windows 上
Stop-Process -Name node -Force

# 重新啟動
node server.js
```

#### 2. API 連接失敗
**症狀**：前端無法連接到後端
**檢查清單**：
- [ ] 伺服器是否正在運行
- [ ] 端口 3001 是否被佔用
- [ ] 防火牆設定
- [ ] IP 地址配置是否正確

#### 3. MongoDB 連接問題
**症狀**：數據庫連接失敗
**檢查**：
- MongoDB Atlas 連接字串
- 網路連接
- 數據庫用戶權限

## 版本資訊
- **實施日期**：2025年8月15日
- **版本**：v1.0
- **負責開發者**：GitHub Copilot
- **測試狀態**：✅ 已完成基本功能測試

## 聯絡資訊
如有問題或需要進一步說明，請參考：
- 技術文檔：`server/python_script/VOCABULARY_UX_DESIGN.md`
- 專案狀態：`server/python_script/PROJECT_STATUS.md`

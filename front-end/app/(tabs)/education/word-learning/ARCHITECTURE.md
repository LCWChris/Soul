# Word Learning 模組架構說明

## 📁 資料夾結構

```
word-learning/
├── api/                          # 🔴 後端層 - API & 數據邏輯
│   ├── services/                 # API 服務
│   │   └── VocabularyService.js  # 詞彙 API 服務（axios, fetch）
│   ├── hooks/                    # 數據 Hooks
│   │   ├── useVocabulary.js      # 詞彙數據獲取
│   │   ├── useLearningTracking.js # 學習追蹤
│   │   └── useFavorites.js       # 收藏功能
│   └── index.js                  # API 層統一匯出
│
├── ui/                           # 🔵 前端層 - UI 元件
│   ├── components/               # UI 元件庫
│   │   ├── cards/                # 卡片元件
│   │   │   ├── VocabularyCard.jsx
│   │   │   ├── EnhancedVocabularyCard.jsx
│   │   │   └── WordLearningCard.jsx
│   │   ├── modals/               # 彈窗元件
│   │   │   ├── WordDetailModal.jsx
│   │   │   └── AchievementModal.jsx
│   │   ├── progress/             # 進度元件
│   │   │   ├── LearningProgress.jsx
│   │   │   ├── LearningProgressIndicator.jsx
│   │   │   ├── LearningProgressNew.jsx
│   │   │   ├── LearningProgressSelector.jsx
│   │   │   └── ProgressIndicators.jsx
│   │   ├── selectors/            # 選擇器元件
│   │   │   └── LevelSelector.jsx
│   │   ├── material/             # Material Design 元件
│   │   │   ├── MaterialButton.jsx
│   │   │   ├── MaterialFAB.jsx
│   │   │   ├── MaterialInputs.jsx
│   │   │   ├── MaterialSearchBar.jsx
│   │   │   └── MaterialTopAppBar.jsx
│   │   └── VocabularyCategories.jsx
│   ├── screens/                  # 頁面元件
│   │   ├── MaterialWordLearningScreen.jsx
│   │   ├── EnhancedWordLearningScreen.jsx
│   │   └── SimpleEnhancedWordLearningScreen.jsx
│   ├── themes/                   # 主題配置
│   │   └── MaterialYouTheme.js
│   └── index.js                  # UI 層統一匯出
│
├── index.jsx                     # 模組主入口
├── favorites.jsx                 # 收藏頁面
├── progress.jsx                  # 進度頁面
└── README.md                     # 本說明文件
```

## 🎯 設計原則

### 分層架構
- **API 層**：處理所有後端通訊、數據獲取、狀態管理
- **UI 層**：純 UI 元件，不直接調用 API，通過 props 接收數據

### 職責分離
- **api/services**：封裝所有 HTTP 請求（axios、fetch）
- **api/hooks**：數據邏輯的 React Hooks
- **ui/components**：可複用的 UI 元件
- **ui/screens**：完整頁面元件
- **ui/themes**：樣式主題配置

## 📝 使用方式

### 從 API 層引入
```javascript
// 引入服務
import { VocabularyService } from './api';

// 引入 Hooks
import { useVocabulary, useLearningTracking, useFavorites } from './api';
```

### 從 UI 層引入
```javascript
// 引入頁面
import { MaterialWordLearningScreen } from './ui';

// 引入元件
import { VocabularyCard, WordDetailModal } from './ui';
import { LearningProgress, ProgressIndicators } from './ui';
import { MaterialButton, MaterialFAB } from './ui';

// 引入主題
import { MaterialYouTheme } from './ui';
```

## 🔄 遷移指南

### 舊路徑 → 新路徑

#### API 層
```javascript
// ❌ 舊
import { VocabularyService } from './services/VocabularyService';
import { useVocabulary } from './hooks/useVocabulary';

// ✅ 新
import { VocabularyService, useVocabulary } from './api';
```

#### UI 層
```javascript
// ❌ 舊
import VocabularyCard from './components/VocabularyCard';
import MaterialButton from './components/MaterialButton';
import { MaterialYouTheme } from './MaterialYouTheme';

// ✅ 新
import { VocabularyCard, MaterialButton, MaterialYouTheme } from './ui';
```

## 🚀 優點

### 1. 清晰的職責劃分
- **後端相關**（api/）：API 調用、數據獲取、業務邏輯
- **前端相關**（ui/）：UI 渲染、用戶交互、樣式

### 2. 更好的可維護性
- 需要修改 API：只看 `api/` 資料夾
- 需要調整 UI：只看 `ui/` 資料夾
- 元件分類清楚：cards、modals、progress 等

### 3. 易於測試
- API 層可獨立進行單元測試
- UI 元件可用 Storybook 或 Jest 測試
- Mock 數據時只需 mock api 層

### 4. 團隊協作
- 前端開發者專注 `ui/`
- 後端整合專注 `api/`
- 減少檔案衝突

### 5. 打包優化
- Metro/Webpack 可針對不同層做 tree-shaking
- 按需載入更精確
- 減少打包體積

## 🛠️ 開發建議

### 新增功能時
1. **API 功能**：放在 `api/services/` 或 `api/hooks/`
2. **UI 元件**：放在 `ui/components/` 對應分類
3. **新頁面**：放在 `ui/screens/`
4. **更新匯出**：記得更新 `api/index.js` 或 `ui/index.js`

### 命名規範
- **Services**：`*.js` - 純邏輯，不含 JSX
- **Hooks**：`use*.js` - React Hooks
- **Components**：`*.jsx` - React 元件
- **Screens**：`*Screen.jsx` - 頁面元件

## 📦 打包影響

### 改善點
✅ Metro 打包時可更清楚區分前後端代碼  
✅ Tree-shaking 更精確（未使用的 API 不會打包）  
✅ Code-splitting 可按層分割  
✅ 減少意外的循環依賴  

### 注意事項
⚠️ 更新 import 路徑後需清除 Metro 快取：
```bash
npx expo start -c
```

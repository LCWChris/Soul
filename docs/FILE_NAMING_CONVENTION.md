# 檔案命名規範

## 目的
確保專案打包時清晰明確，避免工具鏈混淆，提升團隊協作效率。

## 規則

### JavaScript/TypeScript 檔案

#### `.jsx` / `.tsx` - UI 元件和頁面
**使用時機**：檔案中包含 JSX 語法（React 元件、`<View>`、`<Text>` 等標籤）

**範例**：
```javascript
// ✅ 正確：components/WordCard.jsx
export default function WordCard({ word }) {
  return <View><Text>{word}</Text></View>;
}
```

**目錄**：
- `app/**/*.jsx` - 所有頁面和路由
- `components/**/*.jsx` - 所有 UI 元件
- `app/(tabs)/education/word-learning/**/*.jsx` - 學習相關頁面/元件

#### `.js` / `.ts` - 純邏輯、工具和服務
**使用時機**：不包含 JSX，純邏輯、API、工具函數、主題配置

**範例**：
```javascript
// ✅ 正確：services/VocabularyService.js
export class VocabularyService {
  static async getWords() {
    return await fetch('/api/words');
  }
}

// ✅ 正確：hooks/useVocabulary.js
import { useState } from 'react';
export const useVocabulary = () => {
  const [words, setWords] = useState([]);
  return { words, setWords };
}

// ✅ 正確：constants/theme.js
export const theme = {
  colors: { primary: '#1D4ED8' }
};
```

**目錄**：
- `services/**/*.js` - API 服務
- `hooks/**/*.js` - 自定義 Hook（純邏輯，不返回 JSX）
- `utils/**/*.js` - 工具函數
- `constants/**/*.js` - 常數和配置
- `server/**/*.js` - 後端代碼

### 配置檔案
- `*.config.js` - 工具配置（metro、babel、eslint 等）
- `*.json` - 數據和配置檔案

## 檢查工具

### ESLint 自動檢查
專案已配置 `react/jsx-filename-extension` 規則：
- 含 JSX 的 `.js` 檔案會顯示警告
- 建議改為 `.jsx` 副檔名

### 手動檢查命令（PowerShell）
```powershell
# 列出所有 JS/JSX 檔案
Get-ChildItem -Path . -Recurse -Include *.js,*.jsx | Select-Object FullName

# 找出可能含 JSX 的 .js 檔案（粗略檢測）
Select-String -Path ".\**\*.js" -Pattern '<[A-Z][A-Za-z0-9]*' -List
```

## 為什麼重要？

### 1. 打包優化
- Metro/Babel 可針對不同副檔名做最佳化
- 某些工具會特別處理 `.jsx` 檔案的 JSX 轉換

### 2. IDE 支援
- VS Code 根據副檔名提供不同的語法高亮和自動完成
- Prettier、ESLint 可能套用不同格式規則

### 3. 團隊協作
- 新成員一眼就知道檔案用途
- Code Review 更清晰
- 快速定位 UI 元件或純邏輯檔案

### 4. 建構工具
- 某些打包工具（Webpack、Vite）對 `.jsx` 有特殊處理
- Tree-shaking 和 Code-splitting 更有效

## 遷移現有檔案

### 檢查步驟
1. 執行 `npm run lint` 查看 ESLint 警告
2. 找出被標記的 `.js` 檔案
3. 確認是否包含 JSX
4. 重新命名為 `.jsx`

### 重新命名命令（PowerShell）
```powershell
# 範例：重新命名單一檔案
Rename-Item "components/MyComponent.js" "MyComponent.jsx"

# 更新 import 路徑（自動完成）
# VS Code 會自動處理，或手動更新引用
```

## 當前專案狀態 ✅

**word-learning 資料夾已符合規範**：
- `.jsx` - 所有 UI 元件和頁面
- `.js` - VocabularyService、Hooks、MaterialYouTheme（純邏輯）

**無需修改，繼續保持此規範！**

# API 配置邏輯總結

## 三個 API 的配置邏輯

### 1. **翻譯 API** (`EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL`)

**位置**: `app/(tabs)/translation/index.jsx`

**邏輯**:

```javascript
// 初始化：使用 .env 預設值
const [BACKEND_URL, setBackendUrl] = useState(
  process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL
);

// 載入：每次頁面聚焦時檢查
useFocusEffect(() => {
  const customUrl = await getTranslationApiUrl();
  if (customUrl && customUrl.trim() !== '') {
    setBackendUrl(customUrl);  // 使用自訂值
  } else {
    setBackendUrl(process.env.EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL);  // 使用 .env
  }
});

// 使用：直接使用 BACKEND_URL state
const translationUrl = `${BACKEND_URL}/translate-by-url`;
```

**行為**:

- ✅ 預設使用 `.env` 中的 `EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL`
- ✅ 如果用戶設定了自訂 URL 且不為空，覆蓋預設值
- ✅ 如果用戶清空自訂 URL（儲存空字串），恢復使用 `.env` 預設值
- ✅ 每次進入翻譯頁面都會重新載入最新配置

---

### 2. **後端 API** (`EXPO_PUBLIC_IP`)

**位置**: `constants/api.ts`

**邏輯**:

```typescript
let customBackendUrl: string | null = null;

// 非同步載入自訂值（不阻塞）
const loadCustomBackendUrl = async () => {
  const url = await getBackendApiUrl();
  // 只有在有有效值時才設定，否則保持 null 以使用 .env
  customBackendUrl = url && url.trim() !== "" ? url : null;
};

// 立即開始載入
loadCustomBackendUrl();

// 動態獲取
export const getBaseUrl = (): string => {
  // 如果 customBackendUrl 是 null 或空，使用 .env 預設值
  return customBackendUrl || process.env.EXPO_PUBLIC_IP || "";
};
```

**使用範例**:

```javascript
import { API_CONFIG } from '@/constants/api';

// 使用時
fetch(`${API_CONFIG.BASE_URL}/api/vocabularies`, { ... });
```

**行為**:

- ✅ 預設使用 `.env` 中的 `EXPO_PUBLIC_IP`
- ✅ 如果用戶設定了自訂 URL 且不為空，覆蓋預設值
- ✅ 如果用戶清空自訂 URL（儲存空字串），恢復使用 `.env` 預設值
- ✅ 應用啟動時自動載入配置

---

### 3. **Gemini API Key** (`EXPO_PUBLIC_GEMINI_API_KEY`)

**位置**: `services/gemini-service.js`

**邏輯**:

```javascript
let customApiKey = null;

// 非同步載入自訂值（不阻塞）
const loadCustomApiKey = async () => {
  const key = await getGeminiApiKey();
  // 只有在有有效值時才設定，否則保持 null 以使用 .env
  customApiKey = key && key.trim() !== "" ? key : null;
};

// 立即開始載入
loadCustomApiKey();

// 動態獲取
const getApiKey = () => {
  // 如果 customApiKey 是 null 或空，使用 .env 預設值
  return customApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
};

// 重新載入（供用戶設定頁面使用）
export const reloadApiKey = async () => {
  hasLoadedOnce = false;
  await loadCustomApiKey();
};
```

**使用範例**:

```javascript
import geminiService from "@/services/gemini-service";

// 使用時
const reply = await geminiService.sendMessage("你好", { userName: "Chris" });
```

**行為**:

- ✅ 預設使用 `.env` 中的 `EXPO_PUBLIC_GEMINI_API_KEY`
- ✅ 如果用戶設定了自訂 Key 且不為空，覆蓋預設值
- ✅ 如果用戶清空自訂 Key（儲存空字串），恢復使用 `.env` 預設值
- ✅ 應用啟動時自動載入配置
- ✅ 提供 `reloadApiKey()` 方法供手動重新載入

---

## 用戶設定頁面

**位置**: `app/(tabs)/user/index.jsx`

**保存邏輯**:

```javascript
const handleSaveTranslationApi = async () => {
  // 如果是空字串，儲存空值以使用 .env 預設
  await saveTranslationApiUrl(
    translationApiUrl.trim() !== "" ? translationApiUrl : ""
  );
  setSnackbarMessage("✅ 翻譯 API URL 已儲存（如為空則使用 .env 預設）");
};

const handleSaveBackendApi = async () => {
  await saveBackendApiUrl(backendApiUrl.trim() !== "" ? backendApiUrl : "");
  setSnackbarMessage("✅ 後端 API URL 已儲存（如為空則使用 .env 預設）");
};

const handleSaveGeminiApi = async () => {
  await saveGeminiApiKey(geminiApiKey.trim() !== "" ? geminiApiKey : "");
  setSnackbarMessage("✅ Gemini API Key 已儲存（如為空則使用 .env 預設）");
};
```

**行為**:

- ✅ 用戶輸入自訂值並儲存 → 使用自訂值
- ✅ 用戶清空輸入並儲存 → 儲存空字串，恢復使用 `.env` 預設值
- ✅ 儲存後顯示 Snackbar 提示

---

## AsyncStorage 儲存邏輯

**位置**: `utils/settings.js`

**儲存**:

```javascript
export const saveTranslationApiUrl = async (url) => {
  await AsyncStorage.setItem("translation_api_url", url);
};

export const saveBackendApiUrl = async (url) => {
  await AsyncStorage.setItem("backend_api_url", url);
};

export const saveGeminiApiKey = async (key) => {
  await AsyncStorage.setItem("gemini_api_key", key);
};
```

**讀取**:

```javascript
export const getTranslationApiUrl = async () => {
  return await AsyncStorage.getItem("translation_api_url"); // 可能返回 null 或空字串
};

export const getBackendApiUrl = async () => {
  return await AsyncStorage.getItem("backend_api_url");
};

export const getGeminiApiKey = async () => {
  return await AsyncStorage.getItem("gemini_api_key");
};
```

**行為**:

- ✅ 返回 `null` → 表示從未設定過
- ✅ 返回 `''` (空字串) → 表示用戶清空了自訂值
- ✅ 返回有效字串 → 表示用戶設定了自訂值

---

## 環境變數配置

**位置**: `.env` (根目錄 `front-end/.env`)

**必要變數**:

```env
# 後端 API URL
EXPO_PUBLIC_IP=https://your-backend-url.com

# 翻譯 API URL
EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL=https://your-translate-api-url.com

# Clerk Publishable Key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key

# Gemini API Key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

**載入機制**:

- ✅ Expo 自動載入以 `EXPO_PUBLIC_` 開頭的環境變數
- ✅ 可在代碼中通過 `process.env.EXPO_PUBLIC_*` 訪問
- ✅ 在 EAS Build 中也可以使用（需在 `eas.json` 配置）

---

## 完整流程圖

### 情境 1: 用戶從未設定自訂 API

```
1. 應用啟動
2. AsyncStorage.getItem() 返回 null
3. customBackendUrl/customApiKey 保持 null
4. getBaseUrl()/getApiKey() 返回 process.env.EXPO_PUBLIC_*
5. ✅ 使用 .env 預設值
```

### 情境 2: 用戶設定了自訂 API

```
1. 用戶在設定頁面輸入自訂 URL/Key
2. 點擊儲存 → saveBackendApiUrl('https://custom.com')
3. 下次載入時，AsyncStorage.getItem() 返回 'https://custom.com'
4. customBackendUrl = 'https://custom.com'
5. getBaseUrl() 返回 'https://custom.com'
6. ✅ 使用自訂值
```

### 情境 3: 用戶清空自訂 API

```
1. 用戶在設定頁面清空輸入欄位
2. 點擊儲存 → saveBackendApiUrl('')
3. 下次載入時，AsyncStorage.getItem() 返回 ''
4. customBackendUrl = null (因為 '' 被判定為無效值)
5. getBaseUrl() 返回 process.env.EXPO_PUBLIC_IP
6. ✅ 恢復使用 .env 預設值
```

---

## 測試檢查清單

### ✅ 翻譯 API

- [ ] 未設定時使用 .env 預設值
- [ ] 設定自訂值後使用自訂值
- [ ] 清空自訂值後恢復使用 .env 預設值
- [ ] 每次進入翻譯頁面都會重新載入配置

### ✅ 後端 API

- [ ] 未設定時使用 .env 預設值
- [ ] 設定自訂值後使用自訂值
- [ ] 清空自訂值後恢復使用 .env 預設值
- [ ] 應用啟動時自動載入配置

### ✅ Gemini API Key

- [ ] 未設定時使用 .env 預設值
- [ ] 設定自訂值後使用自訂值
- [ ] 清空自訂值後恢復使用 .env 預設值
- [ ] 應用啟動時自動載入配置

---

## 調試日誌

### 翻譯頁面

```javascript
// 正確的日誌輸出應該是：
📋 使用預設翻譯 API (.env): https://your-api.com
📋 使用預設後端 API (.env): https://your-backend.com

// 或（如果有自訂值）：
✅ 使用自訂翻譯 API: https://custom-api.com
✅ 使用自訂後端 API: https://custom-backend.com
```

### API 調用

```javascript
// 翻譯時的日誌：
🚀 使用翻譯 API: https://your-api.com
🌍 發送到翻譯 API: https://your-api.com/translate-by-url
```

### Gemini Service

```javascript
// 初始化時的日誌：
✅ Gemini Service 初始化成功 - 使用 gemini-2.5-flash (.env 預設值)
// 或
✅ Gemini Service 初始化成功 - 使用 gemini-2.5-flash (自訂 API Key)
```

---

## 總結

**所有三個 API 現在都遵循相同的邏輯**:

1. ✅ **預設行為**: 使用 `.env` 環境變數
2. ✅ **自訂覆蓋**: 如果用戶設定了有效的自訂值（非空字串），使用自訂值
3. ✅ **清空恢復**: 如果用戶清空自訂值（儲存空字串），恢復使用 `.env` 預設值
4. ✅ **自動載入**: 應用啟動或頁面聚焦時自動載入最新配置
5. ✅ **一致性**: 三個 API 使用相同的邏輯模式，易於維護和理解

**用戶體驗**:

- 開箱即用：只需配置 `.env` 文件
- 靈活自訂：可在設定頁面覆蓋任何 API
- 輕鬆重置：清空輸入即可恢復預設值
- 即時生效：儲存後立即應用新配置

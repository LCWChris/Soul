# SouL - 手語學習應用程式

## 打包前檢查清單

### ✅ 已完成項目

1. **app.json 配置**

   - ✅ 應用名稱、版本號已設定
   - ✅ Android package name: `com.soulsign.soul`
   - ✅ iOS bundle identifier: `com.soulsign.soul`
   - ✅ 權限設定：相機、麥克風、儲存空間
   - ✅ Splash screen 配置
   - ✅ iOS info.plist 權限描述
   - ✅ Android versionCode: 1

2. **eas.json 配置**

   - ✅ Preview build: APK for internal testing
   - ✅ Production build: APK for Android, IPA for iOS
   - ✅ 環境變數配置（production & preview）
   - ✅ 所有必要的 API keys 已加入

3. **環境變數**

   - ✅ .env.example 已創建（範本檔案）
   - ✅ .env 已加入 .gitignore
   - ✅ EXPO_PUBLIC_GEMINI_API_KEY 已加入 eas.json

4. **資源檔案**

   - ✅ Icon: `./assets/images/LOGO.png`
   - ✅ Adaptive Icon: `./assets/images/adaptive-icon.png`
   - ✅ Splash Screen: `./assets/images/splash-icon.png`

5. **代碼品質**
   - ✅ 無編譯錯誤
   - ✅ 所有頁面 UI 已優化
   - ✅ 使用 useSafeAreaInsets 避免內容被遮擋

## 📦 打包指令

### Android APK (Preview Build)

```bash
# 確保已安裝 EAS CLI
npm install -g eas-cli

# 登入 Expo 帳號
eas login

# 配置 EAS (第一次執行)
eas build:configure

# 建置 Preview APK
eas build --platform android --profile preview
```

### Android APK (Production Build)

```bash
# 建置 Production APK
eas build --platform android --profile production
```

### iOS IPA (Production Build)

```bash
# 建置 iOS IPA
eas build --platform ios --profile production
```

### 同時建置 Android + iOS

```bash
eas build --platform all --profile production
```

## 🔍 建置前檢查

1. **確認環境變數**

   - 檢查 `eas.json` 中的 production/preview 環境變數是否正確
   - 確認 API URLs 指向正確的後端服務器

2. **確認 EAS Project ID**

   - app.json 中的 `extra.eas.projectId` 已設定
   - Project ID: `487704d4-6ebf-46ae-a2e6-5a259e673d69`

3. **檢查套件依賴**

   ```bash
   npm install
   ```

4. **清理快取（如果需要）**
   ```bash
   npm start -- --clear
   ```

## 📱 測試建議

### Preview Build 測試

1. 下載 APK 後安裝到測試裝置
2. 測試所有主要功能：

   - ✅ 登入/註冊流程
   - ✅ 首頁卡片導航
   - ✅ 教學模式（3 個層級頁面）
   - ✅ 詞彙學習（橫向滑動、收藏功能）
   - ✅ 手語翻譯（相機錄影、上傳）
   - ✅ 使用者設定（問卷、帳號管理）
   - ✅ AI 聊天機器人

3. 檢查權限請求
   - 相機權限
   - 麥克風權限
   - 儲存空間權限

### Production Build 注意事項

- Production build 會使用 Render 上的正式 API URL
- 確保後端服務器已部署並正常運行
- 測試時注意 API 回應速度

## 🚀 部署流程

1. **Preview Build** (內部測試)

   ```bash
   eas build --platform android --profile preview
   ```

   - 用於團隊內部測試
   - 快速迭代修復 bugs

2. **Production Build** (正式發布)
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```
   - Android: 可直接發布 APK 或上傳至 Google Play
   - iOS: 需要 Apple Developer 帳號，上傳至 App Store Connect

## 📋 後續步驟

### Android 發布

1. 在 Google Play Console 創建應用程式
2. 上傳 APK 或 AAB
3. 填寫應用程式資訊、截圖
4. 提交審核

### iOS 發布

1. 在 App Store Connect 創建應用程式
2. 上傳 IPA（透過 EAS Submit 或 Transporter）
3. 填寫應用程式資訊、截圖
4. 提交審核

## ⚠️ 注意事項

1. **API Keys 安全**

   - 生產環境的 API keys 已配置在 eas.json
   - 不要將 .env 檔案提交到 Git

2. **版本號管理**

   - 每次發布前更新 `app.json` 中的 `version`
   - Android 需同步更新 `versionCode`

3. **權限說明**

   - 確保權限描述清楚易懂
   - iOS 的 NSCameraUsageDescription 和 NSMicrophoneUsageDescription 已設定

4. **測試覆蓋**
   - 在不同 Android 版本測試
   - 測試不同螢幕尺寸
   - 檢查網路異常情況處理

## 🔗 相關連結

- EAS Build 文檔: https://docs.expo.dev/build/introduction/
- EAS Submit 文檔: https://docs.expo.dev/submit/introduction/
- Expo Application Services: https://expo.dev/accounts/[your-account]/projects/SouL

## 📞 問題排查

### 建置失敗

- 檢查 eas.json 格式是否正確
- 確認 app.json 中的 package name/bundle identifier 唯一
- 查看 EAS Build logs: https://expo.dev/accounts/[your-account]/projects/SouL/builds

### 應用程式閃退

- 檢查 API URLs 是否正確
- 確認所有環境變數都已設定
- 查看裝置 logs (Android: adb logcat, iOS: Xcode Console)

### 權限問題

- 確認 app.json 中的權限設定
- 檢查 iOS info.plist 的權限描述
- 測試時手動授予權限

---

**準備就緒！可以開始建置了 🚀**

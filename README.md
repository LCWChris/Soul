# Soul Monorepo Split

此專案已重構為三個子資料夾（monorepo）：

```
repo-root/
   front-end/          Expo (React Native) 前端 – 只有上架到 App 的程式碼
   back-end/           Node.js Express API 與 MongoDB
   translation-end/    Python FastAPI 手語翻譯服務
```

前端打包（EAS）只需在 `front-end/` 下運行；後端兩個服務獨立部署（Render 或其他）。

## Front-end (Expo)
位置：`front-end/`
- 設定：`front-end/app.json`, `front-end/eas.json`
- 環境變數：`front-end/.env`（只放 `EXPO_PUBLIC_*`）

本機啟動：
```powershell
cd front-end
npm install
npx expo start
```

EAS 打包（Android APK）：
```powershell
cd front-end
eas build --platform android --profile production
```

## Back-end (Node.js)
位置：`back-end/server/`
- 範例環境檔：`back-end/.env.sample`（複製為 `.env`）
```powershell
cd back-end/server
npm install
node server.js
```

## Translation-end (FastAPI)
位置：`translation-end/backend/`
```powershell
cd translation-end
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
或：
```powershell
python translation_server.py
```

## Dev 啟動器（ngrok）
`back-end/dev_server.py` 會：
1) 啟動 `translation-end/backend`（FastAPI）
2) 啟動 `back-end/server`（Node）
3) 建立 ngrok 隧道
4) 自動更新 `front-end/.env` 的動態 URL

```powershell
cd back-end
python dev_server.py
```
更新後請回到 `front-end/` 重啟 Expo 以載入最新 `.env`。

## 環境變數原則
- `front-end/.env` 只放 `EXPO_PUBLIC_*` 公開鍵值（例如 API Base、Clerk publishable key）。
- 後端密鑰（DB URI、Cloudinary Secret、Clerk Webhook Secret）放在 `back-end/.env` 或部署平台的秘密管理。

---
# Welcome to your Expo app 👋

這是從頭開始的資料優，按照下面的指示操作~
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 現在把 Route 設定好了，規則如下:

/app ->這是頁面資料夾。

/(auth) ->這是註冊頁面。

/(tabs) ->這是導覽列，有四個導覽列。

由左到右分別是(home)、education、translation、user

- 每個資料夾中的 index.jsx 就是該導覽列的主頁，例如:

  - 按下 education 的 icon 後會跳轉

    ```bash
    /app/(tabs)/education/index.jsx
    ```

* 而該導覽列相關跳轉的內容都會在同一個資料夾，例如:

  - word-learning-screen.jsx 跟 educatioin 相關就要放在

    ```bash
    /app/(tabs)/education/
    ```

## Get started

1. 下載套件並啟用虛擬環境 (python 的套件都在 requirements.txt 裡面)

   ```bash
   .\setup.bat
   ```

   ```bash
   & .venv\Scripts\Activate.ps1
   ```

2. 後端開啟 (首次使用需要啟用 ngrok)

   ```bash
   python dev_server.py
   ```

3. 前端開啟

   ```bash
   npx expo
   ```

# API 啟動指南

## 1️⃣ 安裝 ngrok

### ✅ Mac（使用 Homebrew）

```bash
brew install ngrok
```

### ✅ Windows

1. 前往 [ngrok 官方下載頁](https://ngrok.com/download)
2. 選擇 Windows，下載 ZIP 並解壓縮（建議放在 C:\ngrok）
3. 開啟 PowerShell 或 CMD：

```powershell
cd C:\ngrok
```

### ✅ Linux（Ubuntu）

```bash
sudo snap install ngrok
```

---

## 2️⃣ 設定 ngrok authtoken

前往：https://dashboard.ngrok.com/get-started/your-authtoken  
登入帳號後複製你的 token，然後執行（只需設定一次）：

```bash
ngrok config add-authtoken 30o0QI89ZKsJzIzx34NPdRzFLs2_259yBR7RP6RPGiT4iwuga
```

設定成功會看到：

```
Authtoken saved to configuration file: ~/.ngrok2/ngrok.yml
```

---

## 以下為舊版啟動翻譯 api (可省略不看)

以下方法都建議在 anaconda 環境中操作

### 方法一：手動啟動

#### Step 1：啟動 FastAPI（port 8000）

```bash
cd app/(tabs)/translation/backend
uvicorn main:app --reload
```

#### Step 2：啟動 ngrok

```bash
ngrok http 8000
```

#### Step 3：更新 `.env`

將 `.env` 中的 `EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL` 改為 ngrok 提供的網址，例如：

```
EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL=https://abc123.ngrok-free.app
```

---

### 方法二：使用腳本自動化

執行：

```bash
python dev_server.py
```

你會看到：

```
✅ ngrok URL: https://xxxxx.ngrok-free.app
✅ .env 已更新 EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL
```

---

## 🔍 測試是否成功

打開瀏覽器輸入：

```
https://xxxxx.ngrok-free.app/translate
```

若看到：

```
405 Method Not Allowed
```

代表 ngrok 連線 FastAPI 成功！

---

## ♻️ 建議配合使用

Expo 開發環境請重新啟動以載入最新 `.env`：

```bash
npx expo start --clear
```

---

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

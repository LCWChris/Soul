## 前端（React Native / Expo）
   ```bash
npm install expo
npm install expo-av           # ✅ 播放 video（但已被 deprecate，建議改用 expo-video）
npm install expo-router       # ✅ router.push, useLocalSearchParams 等
npm install expo-image-picker # ✅ 選擇影片、圖片（上傳影片用）
npm install react-native      # ✅ React Native 核心
npm install react             # ✅ React
npm install react-native-web  # ✅ 為 Web 版本支援
npm install @clerk/clerk-expo # ✅ 用戶登入驗證（如你前面提到整合 Clerk）
   ```

## 後端（FastAPI + Python）
fastapi                     # ✅ 主框架
uvicorn[standard]           # ✅ 本地開發與啟動伺服器
python-multipart            # ✅ 若要處理 multipart/form-data（例如 UploadFile 時）
pydantic                    # ✅ 輸入驗證

   ```bash
pip install fastapi                     
pip install uvicorn[standard]          
pip install python-multipart           
pip install pydantic                   
   ```

## 啟動翻譯API
預設使用port 8000，可以自已修改

執行
   ```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

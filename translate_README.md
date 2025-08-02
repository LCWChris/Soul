## 前端（React Native / Expo）
 ✅ router.push, useLocalSearchParams 
 ✅ 選擇影片、圖片（上傳影片用）
   ```bash
npm install expo
npm install expo-av           
npm install expo-router       
npm install expo-image-picker 
npm install react-native-web  

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
   ```bash
   cd translate_backend
   ```
在有uvicorn的python環境執行
   ```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Cloudinary API 設定步驟

### 1. 取得 API 憑證
1. 前往 [Cloudinary Dashboard](https://cloudinary.com/console)
2. 登入您的帳號
3. 在 Dashboard 上找到 "API Environment variable" 區塊
4. 複製以下資訊：
   - Cloud Name: `dchrdlxgf` (已知)
   - API Key: `YOUR_API_KEY`
   - API Secret: `YOUR_API_SECRET`

### 2. 設定方式選擇

#### 方式一：使用 .env 檔案 (推薦)
```bash
# 複製範本檔案
cp .env.example .env

# 編輯 .env 檔案，填入您的憑證
CLOUDINARY_CLOUD_NAME=dchrdlxgf
CLOUDINARY_API_KEY=您的API金鑰
CLOUDINARY_API_SECRET=您的API密鑰
```

#### 方式二：直接修改程式碼
編輯 `cloudinary_image_extractor.py` 第 20-24 行：
```python
cloudinary.config(
    cloud_name="dchrdlxgf",
    api_key="您的API金鑰",      # 替換這裡
    api_secret="您的API密鑰"    # 替換這裡
)
```

### 3. 安裝必要套件
```bash
pip install cloudinary pandas python-dotenv openpyxl requests
```

### 4. 執行圖片抓取
```bash
python cloudinary_image_extractor.py
```

### 5. 預期輸出
- `cloudinary_images.xlsx` - Excel 格式的圖片清單
- `cloudinary_images.json` - JSON 格式的圖片清單
- `download_images.py` - 自動下載腳本
- `vocabulary_images.xlsx` - 篩選後的詞彙相關圖片

## 🎯 快速測試
設定完成後，執行：
```bash
python test_cloudinary.py
```
如果看到 "🎉 連接成功！" 就表示設定正確！

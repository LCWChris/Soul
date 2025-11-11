# Cloudinary 圖片抓取工具

## 🚀 快速開始

### 1. 設定 Cloudinary 憑證

複製 `.env.example` 為 `.env` 並填入您的 Cloudinary 憑證：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：
```
CLOUDINARY_CLOUD_NAME=dchrdlxgf
CLOUDINARY_API_KEY=您的_API_金鑰
CLOUDINARY_API_SECRET=您的_API_密鑰
```

### 2. 安裝相依套件

```bash
pip install cloudinary pandas python-dotenv requests openpyxl
```

### 3. 執行抓取腳本

```bash
python cloudinary_image_extractor.py
```

## 📊 輸出檔案

腳本會在 `cloudinary_export/` 目錄中生成以下檔案：

1. **cloudinary_all_images_YYYYMMDD_HHMMSS.xlsx** - 所有圖片的 Excel 清單
2. **cloudinary_all_images_YYYYMMDD_HHMMSS.json** - 所有圖片的 JSON 清單  
3. **cloudinary_vocabulary_images_YYYYMMDD_HHMMSS.xlsx** - 詞彙相關圖片清單
4. **download_images.py** - 自動下載腳本

## 📋 圖片資訊欄位

每張圖片包含以下資訊：
- `public_id` - Cloudinary 公開 ID
- `filename` - 檔案名稱
- `url` - 圖片網址 (HTTPS)
- `format` - 檔案格式 (jpg, png, etc.)
- `width` - 圖片寬度
- `height` - 圖片高度
- `bytes` - 檔案大小
- `created_at` - 建立時間
- `folder` - 所在資料夾

## 🔍 特殊功能

### 篩選詞彙圖片
腳本會自動識別包含以下關鍵字的圖片：
- vocabulary
- word
- vocab
- learning

### 自動下載腳本
生成的 `download_images.py` 可以用來批量下載所有圖片到本地。

## 🛠️ 自定義使用

```python
from cloudinary_image_extractor import get_all_images, filter_vocabulary_images

# 獲取所有圖片
images = get_all_images()

# 篩選特定圖片
vocab_images = filter_vocabulary_images(images)

# 自定義篩選
my_images = [img for img in images if 'my_folder' in img['public_id']]
```

## 🎯 Cloud Name: dchrdlxgf

您的 Cloudinary Cloud Name 已預設為 `dchrdlxgf`，如果不同請在 `.env` 檔案中修改。

## 📞 取得 API 憑證

1. 登入 [Cloudinary Console](https://cloudinary.com/console)
2. 在 Dashboard 頁面找到 "Account Details"
3. 複製 API Key 和 API Secret

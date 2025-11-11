# Soul 詞匯學習系統 - Python工具集

本目錄包含用於管理和處理Soul詞匯學習系統的Python工具和數據檔案。

## 📁 檔案結構

### 🔧 核心工具
- **`vocabulary_level_classifier.py`** - 詞匯分級分類器，將詞匯分為初級/中級/高級三個等級
- **`update_levels_direct.py`** - 直接連接MongoDB更新詞匯分級的腳本
- **`book_words_updater.py`** - 詞匯數據更新和維護工具
- **`vocabulary_categorization_system.py`** - 詞匯分類系統，自動分類詞匯主題
- **`clean_categories.py`** - 清理和標準化分類數據的工具
- **`cloudinary_image_extractor.py`** - 從Cloudinary提取圖片鏈接的工具
- **`data_utils.py`** - 通用數據處理函數庫
- **`quick_tools.py`** - 快速數據處理工具集

### 📊 數據檔案
- **`book_words_final_20250816_225454.json`** - 原始詞匯數據（已清理）
- **`book_words_leveled_20250816_233048.json`** - 🎯 **最新分級後的詞匯數據**
- **`book_words_leveled_20250816_233048_分級報告.txt`** - 分級統計報告

### 📚 文檔
- **`README_NEW.md`** - 最新說明檔案
- **`SETUP_GUIDE.md`** - 環境設置指南
- **`PROJECT_STATUS.md`** - 專案狀態追蹤
- **`VOCABULARY_UX_DESIGN.md`** - 詞匯學習UX設計文檔
- **`cloudinary_README.md`** - Cloudinary使用說明

### ⚙️ 配置
- **`.env.example`** - 環境變數範例檔案
- **`.env`** - 實際環境變數（請勿提交到版本控制）

## 🎯 當前系統狀態

✅ **詞匯分級系統** - 已完成三級分級：
- 初級 (beginner): 188 個詞匯 (31.5%)
- 中級 (intermediate): 305 個詞匯 (51.2%)
- 高級 (advanced): 99 個詞匯 (17.3%)

✅ **圖片鏈接** - 已更新為正確的Cloudinary URL

✅ **分類清理** - 已移除NaN值，保留11個清理後的分類

✅ **組件整合** - 詞匯學習組件已整合到單一檔案

## 🚀 快速使用

### 重新分級詞匯
```bash
python vocabulary_level_classifier.py
python update_levels_direct.py
```

### 更新詞匯數據
```bash
python book_words_updater.py
```

### 清理分類數據
```bash
python clean_categories.py
```

## 📝 維護說明

- 使用 `book_words_leveled_20250816_233048.json` 作為主要數據源
- 新的分級邏輯基於冊數、詞匯複雜度、內容分類等多重標準
- 所有圖片使用Cloudinary CDN，版本號為v1755264573系列

## 🗂️ 已清理的檔案

以下檔案已被移除（臨時或重複檔案）：
- 舊版本數據檔案 (book_words_final_*_224249.*)
- 臨時CSV和Excel檔案
- 一次性使用的腳本
- MongoDB匯入腳本（已完成任務）
- Cloudinary臨時檔案

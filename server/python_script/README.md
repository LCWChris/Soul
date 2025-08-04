# 資料處理腳本使用說明

## 📁 文件說明

### 核心腳本
- `data_utils.py` - 萬用資料處理工具
- `merge.py` - 簡化版文件合併工具
- `import_vocabulary_auto.py` - 自動匯入詞彙到 MongoDB

### 使用範例

## 1. 快速操作

```python
from data_utils import *

# 快速分析文件
quick_analyze("your_file.xlsx")

# 快速合併文件
quick_merge("file1.xlsx", "file2.xlsx", "word", "public_id", "output.xlsx")

# 快速匯入到 MongoDB
quick_import_to_mongo("data.xlsx", "book_words", clear_first=True)

# 快速從 MongoDB 匯出
quick_export_from_mongo("book_words", "exported_data.xlsx")
```

## 2. 完整功能使用

```python
from data_utils import DataProcessor

# 創建處理器
processor = DataProcessor()

# 文件操作
df = processor.read_file("input.xlsx")
cleaned_df = processor.clean_data(df)
processor.save_file(cleaned_df, "cleaned_output.xlsx")

# MongoDB 操作
processor.connect_mongo("tsl_app")
processor.mongo_import(df, "collection_name", clear_first=True)
exported_df = processor.mongo_export("collection_name")
processor.close_mongo()

# 批次處理
def process_file(filename):
    df = processor.read_file(filename)
    return processor.clean_data(df)

results = processor.batch_process("*.xlsx", process_file)
```

## 3. 常用操作組合

### 詞彙數據處理流程
```python
# 1. 讀取和清理數據
df = processor.read_file("詞彙整合.xlsx")
df_clean = processor.clean_data(df)
df_standard = processor.standardize_columns(df_clean)

# 2. 匯入到資料庫
processor.connect_mongo()
processor.mongo_import(df_standard, "book_words", clear_first=True)

# 3. 生成報告
report_info = {
    "處理文件": "詞彙整合.xlsx",
    "記錄數": len(df_standard),
    "狀態": "成功"
}
processor.generate_report(report_info)
```

## 配置說明

### MongoDB 連接
預設連接字串已內建，如需修改：
```python
processor = DataProcessor("your_mongodb_uri")
```

### 欄位映射規則
可自定義欄位名稱映射：
```python
custom_mapping = {
    'word': 'title',
    'image': 'image_url',
    'video': 'video_url'
}
df_mapped = processor.standardize_columns(df, custom_mapping)
```

## 注意事項

1. 確保已安裝必要套件：`pandas`, `pymongo`, `openpyxl`
2. MongoDB 連接需要網路
3. 大文件處理時注意記憶體使用
4. 建議先備份原始數據

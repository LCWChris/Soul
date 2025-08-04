import pandas as pd
from pymongo import MongoClient
from datetime import datetime

# 讀取 Excel 檔案
df = pd.read_excel("第一冊_詞彙整合_含圖片連結.xlsx")

# 加上欄位 created_by / created_at（如未有）
df["created_by"] = "admin"
df["created_at"] = datetime.utcnow()

# 轉成 dict 格式
records = df.to_dict(orient="records")

# 連接 MongoDB
client = MongoClient("mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/?retryWrites=true&w=majority")
db = client["tsl_app"]  # 指定資料庫
collection = db["book_words"]  # 新建 collection 名稱

# 匯入資料
collection.insert_many(records)
print("✅ 資料已匯入 MongoDB 的 tsl_app.book1_words")

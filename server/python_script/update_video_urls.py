#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 book_words 資料庫中的影片連結
從 updateword.csv 檔案讀取資料並更新對應的記錄
"""

import pandas as pd
import pymongo
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime
import sys

# 設定 MongoDB 連接
MONGO_URL = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority"

def connect_to_mongodb():
    """連接到 MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client['tsl_app']
        collection = db['book_words']
        
        # 測試連接
        client.admin.command('ping')
        print("✅ 成功連接到 MongoDB")
        return client, collection
    except Exception as e:
        print(f"❌ MongoDB 連接失敗: {e}")
        return None, None

def read_csv_file(file_path):
    """讀取 CSV 檔案"""
    try:
        df = pd.read_csv(file_path)
        print(f"✅ 成功讀取 CSV 檔案，共 {len(df)} 筆記錄")
        print("CSV 欄位:", list(df.columns))
        return df
    except Exception as e:
        print(f"❌ 讀取 CSV 檔案失敗: {e}")
        return None

def update_video_urls(collection, df):
    """更新影片連結到資料庫"""
    updated_count = 0
    failed_count = 0
    
    print("\n🔄 開始更新資料庫...")
    
    for index, row in df.iterrows():
        try:
            # 將字符串 _id 轉換為 ObjectId
            object_id = ObjectId(row['_id'])
            filter_condition = {"_id": object_id}
            
            # 更新的資料
            update_data = {
                "$set": {
                    "video_url": row['video_url'],
                    "updated_at": datetime.now().isoformat()
                }
            }
            
            # 執行更新
            result = collection.update_one(filter_condition, update_data)
            
            if result.matched_count > 0:
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✅ 更新成功: {row['content']} ({row['_id']})")
                else:
                    print(f"ℹ️  無需更新: {row['content']} (影片連結相同)")
            else:
                failed_count += 1
                print(f"❌ 找不到記錄: {row['content']} ({row['_id']})")
                
        except Exception as e:
            failed_count += 1
            print(f"❌ 更新失敗: {row['content']} - {e}")
    
    return updated_count, failed_count

def verify_updates(collection, df):
    """驗證更新結果"""
    print("\n🔍 驗證更新結果...")
    
    for index, row in df.iterrows():
        try:
            # 將字符串 _id 轉換為 ObjectId 來查詢
            object_id = ObjectId(row['_id'])
            doc = collection.find_one({"_id": object_id})
            
            if doc:
                if doc.get('video_url') == row['video_url']:
                    print(f"✅ 驗證通過: {row['content']}")
                else:
                    print(f"❌ 驗證失敗: {row['content']} - 影片連結不符")
            else:
                print(f"❌ 找不到記錄: {row['content']}")
        except Exception as e:
            print(f"❌ 驗證錯誤: {row['content']} - {e}")

def main():
    """主函數"""
    print("🚀 開始更新 book_words 資料庫的影片連結")
    print("=" * 50)
    
    # 設定檔案路徑
    csv_file_path = "updateword.csv"
    
    # 檢查檔案是否存在
    if not os.path.exists(csv_file_path):
        print(f"❌ 找不到檔案: {csv_file_path}")
        return
    
    # 連接資料庫
    client, collection = connect_to_mongodb()
    if client is None or collection is None:
        return
    
    try:
        # 讀取 CSV 檔案
        df = read_csv_file(csv_file_path)
        if df is None:
            return
        
        # 顯示要更新的資料摘要
        print(f"\n📋 更新摘要:")
        print(f"   - 總共 {len(df)} 筆記錄需要更新")
        print(f"   - 涵蓋冊數: {sorted(df['volume'].unique())}")
        print(f"   - 涵蓋課數: {sorted(df['lesson'].unique())}")
        
        # 確認是否繼續
        response = input("\n⚠️  確定要繼續更新嗎？(y/N): ")
        if response.lower() != 'y':
            print("❌ 取消更新操作")
            return
        
        # 執行更新
        updated_count, failed_count = update_video_urls(collection, df)
        
        # 驗證更新結果
        verify_updates(collection, df)
        
        # 顯示最終結果
        print("\n" + "=" * 50)
        print("📊 更新結果統計:")
        print(f"   ✅ 成功更新: {updated_count} 筆")
        print(f"   ❌ 失敗: {failed_count} 筆")
        print(f"   📝 總計: {len(df)} 筆")
        
        if updated_count > 0:
            print("\n🎉 資料庫更新完成！")
        else:
            print("\n⚠️  沒有任何記錄被更新")
            
    except Exception as e:
        print(f"❌ 發生未預期的錯誤: {e}")
    
    finally:
        # 關閉資料庫連接
        if client:
            client.close()
            print("🔌 已關閉資料庫連接")

if __name__ == "__main__":
    main()

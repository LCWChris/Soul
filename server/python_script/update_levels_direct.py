#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接使用MongoDB連接更新詞匯分級
"""

import json
import pymongo
from datetime import datetime

def update_vocabulary_levels_direct():
    """直接通過MongoDB連接更新詞匯分級"""
    
    # MongoDB 連接配置
    MONGODB_URI = 'mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority'
    
    try:
        print("正在連接MongoDB...")
        client = pymongo.MongoClient(MONGODB_URI)
        db = client['tsl_app']
        collection = db['book_words']
        
        print("正在讀取分級後的詞匯數據...")
        with open('book_words_leveled_20250816_233048.json', 'r', encoding='utf-8') as f:
            leveled_data = json.load(f)
        
        print(f"準備更新 {len(leveled_data)} 個詞匯的分級...")
        
        # 統計變量
        success_count = 0
        error_count = 0
        not_found_count = 0
        
        for i, word in enumerate(leveled_data):
            try:
                # 嘗試多種匹配條件
                filter_conditions = [
                    # 條件1：完全匹配
                    {
                        "content": word["content"],
                        "volume": word["volume"],
                        "lesson": word["lesson"]
                    },
                    # 條件2：只匹配內容和冊數
                    {
                        "content": word["content"],
                        "volume": word["volume"]
                    },
                    # 條件3：只匹配內容
                    {
                        "content": word["content"]
                    }
                ]
                
                updated = False
                for filter_condition in filter_conditions:
                    # 設置更新數據
                    update_data = {
                        "$set": {
                            "learning_level": word["learning_level"],
                            "level": word["level"],
                            "searchable_text": word["searchable_text"],
                            "updated_at": datetime.now().isoformat()
                        }
                    }
                    
                    result = collection.update_many(filter_condition, update_data)
                    
                    if result.modified_count > 0:
                        success_count += result.modified_count
                        updated = True
                        break
                
                if not updated:
                    not_found_count += 1
                    print(f"未找到匹配記錄: {word['content']} (Volume {word['volume']}, Lesson {word['lesson']})")
                
                # 進度顯示
                if (i + 1) % 50 == 0:
                    print(f"已處理: {i + 1}/{len(leveled_data)} 個詞匯")
                
            except Exception as error:
                error_count += 1
                print(f"更新詞匯 '{word['content']}' 時發生錯誤: {str(error)}")
        
        print(f"\n更新完成！")
        print(f"成功更新: {success_count} 個詞匯")
        print(f"未找到記錄: {not_found_count} 個詞匯")
        print(f"錯誤數量: {error_count}")
        
        # 驗證更新結果
        print("\n驗證分級分布...")
        pipeline = [
            {
                "$group": {
                    "_id": "$learning_level",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        stats = list(collection.aggregate(pipeline))
        print("數據庫中的分級分布:")
        for stat in stats:
            print(f"  {stat['_id']}: {stat['count']} 個詞匯")
        
    except Exception as e:
        print(f"操作失敗: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()
            print("MongoDB 連接已關閉")

if __name__ == "__main__":
    update_vocabulary_levels_direct()

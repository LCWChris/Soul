#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
驗證影片連結更新結果
"""

import pymongo
from bson import ObjectId

# 連接資料庫
client = pymongo.MongoClient('mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority')
collection = client['tsl_app']['book_words']

print("🔍 驗證影片連結更新結果")
print("=" * 40)

# 檢查幾個更新後的記錄
test_cases = [
    ('68a0a075c7933293a5cac88c', '什麼'),
    ('68a0a075c7933293a5cac88a', '吃'),
    ('68a0a075c7933293a5cac87a', '爸爸'),
    ('68a0a075c7933293a5cac882', '家人'),
]

for test_id, word in test_cases:
    try:
        doc = collection.find_one({'_id': ObjectId(test_id)})
        if doc:
            video_url = doc.get('video_url', '')
            has_video = bool(video_url and video_url.strip())
            print(f"✅ {word}: {'有影片' if has_video else '無影片'}")
            if has_video:
                print(f"   📹 {video_url}")
        else:
            print(f"❌ 找不到 {word}")
    except Exception as e:
        print(f"❌ 查詢錯誤 {word}: {e}")

print("\n📊 統計資訊:")

# 統計總數
total_words = collection.count_documents({})
print(f"📚 總詞彙數: {total_words}")

# 統計有影片的詞彙
pipeline = [
    {
        "$match": {
            "video_url": {
                "$exists": True,
                "$ne": "",
                "$ne": None
            }
        }
    },
    {
        "$count": "total"
    }
]

result = list(collection.aggregate(pipeline))
with_video = result[0]['total'] if result else 0
print(f"📹 有影片的詞彙: {with_video}")
print(f"📈 影片覆蓋率: {(with_video/total_words*100):.1f}%")

client.close()
print("\n🎉 驗證完成！")

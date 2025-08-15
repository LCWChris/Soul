"""
詞彙分類資料庫設計 - 為詞彙添加分類標籤
"""

from pymongo import MongoClient
import pandas as pd

def connect_to_mongo():
    """連接到 MongoDB"""
    try:
        mongo_url = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority"
        client = MongoClient(mongo_url)
        db = client.tsl_app
        collection = db.book_words
        
        client.admin.command('ping')
        print("✅ MongoDB 連接成功")
        return collection
        
    except Exception as e:
        print(f"❌ MongoDB 連接失敗: {e}")
        return None

def add_category_tags():
    """為詞彙添加分類標籤"""
    collection = connect_to_mongo()
    if collection is None:
        return
    
    # 定義分類規則
    category_rules = {
        # 主題分類
        'family_life': {
            'keywords': ['爸爸', '媽媽', '哥哥', '姊姊', '弟弟', '妹妹', '爺爺', '奶奶', 
                        '家人', '家', '家庭', '兒子', '女兒', '叔叔', '姑姑'],
            'theme': '家庭生活'
        },
        'daily_actions': {
            'keywords': ['走', '跑', '跳', '坐', '站', '洗', '穿', '脫', '吃', '喝', '睡', 
                        '起床', '刷牙', '洗臉', '洗手', '洗頭', '洗澡', '穿衣服'],
            'theme': '日常動作'
        },
        'people_relations': {
            'keywords': ['我', '你', '他', '她', '我們', '你們', '他們', '老師', '同學', 
                        '朋友', '人', '大家'],
            'theme': '人物關係'
        },
        'numbers_time': {
            'keywords': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', 
                        '早上', '中午', '下午', '晚上', '昨天', '今天', '明天', '時間', '點'],
            'theme': '數字時間'
        },
        'animals_nature': {
            'keywords': ['狗', '貓', '魚', '鳥', '熊', '獅子', '大象', '猴子', '企鵝', 
                        '兔子', '青蛙', '蜜蜂', '松鼠', '馬', '牛', '豬', '雞', '晴天', '下雨', '風'],
            'theme': '動物自然'
        },
        'emotions': {
            'keywords': ['開心', '快樂', '難過', '生氣', '害怕', '擔心', '愛', '喜歡', 
                        '不喜歡', '想', '希望'],
            'theme': '情感表達'
        },
        'food_drink': {
            'keywords': ['飯', '菜', '肉', '魚', '蛋', '水果', '蘋果', '香蕉', '湯', '水', 
                        '餐', '食物', '晚餐', '午餐', '早餐'],
            'theme': '食物飲品'
        },
        'body_health': {
            'keywords': ['頭', '臉', '眼', '手', '腳', '身體', '肚子', '背', '頭髮', 
                        '生病', '醫生', '醫院', '藥'],
            'theme': '身體健康'
        },
        'objects': {
            'keywords': ['書', '筆', '包', '衣服', '帽子', '眼鏡', '手錶', '桌子', 
                        '椅子', '杯子', '碗', '玩具'],
            'theme': '物品工具'
        },
        'places': {
            'keywords': ['學校', '公園', '動物園', '圖書館', '醫院', '餐廳', '店', 
                        '市場', '家', '這裡', '那裡', '哪裡'],
            'theme': '地點場所'
        }
    }
    
    # 學習難度分類
    level_mapping = {
        '第1冊': 'beginner',
        '第2冊': 'beginner', 
        '第3冊': 'beginner',
        '第4冊': 'intermediate',
        '第5冊': 'intermediate',
        '第6冊': 'intermediate',
        '第7冊': 'intermediate',
        '第8冊': 'advanced',
        '第9冊': 'advanced',
        '第10冊': 'advanced'
    }
    
    # 情境分類
    context_mapping = {
        'beginner': 'home_school',
        'intermediate': 'social_public',
        'advanced': 'professional'
    }
    
    updated_count = 0
    total_words = collection.count_documents({})
    
    print(f"🔄 開始為 {total_words} 個詞彙添加分類標籤...")
    
    # 獲取所有詞彙
    all_words = collection.find({})
    
    for word in all_words:
        title = word.get('title', '')
        volume = word.get('volume', '')
        
        # 確定主題分類
        word_categories = []
        for category, rules in category_rules.items():
            for keyword in rules['keywords']:
                if keyword in title:
                    word_categories.append(rules['theme'])
                    break
        
        # 如果沒有找到分類，歸類為"其他"
        if not word_categories:
            word_categories = ['其他']
        
        # 確定學習難度
        learning_level = level_mapping.get(volume, 'beginner')
        
        # 確定情境
        context = context_mapping.get(learning_level, 'home_school')
        
        # 頻率分類（基於常用程度）
        frequency = 'medium'
        if any(keyword in title for keyword in ['我', '你', '他', '吃', '喝', '走', '坐']):
            frequency = 'high'
        elif learning_level == 'advanced':
            frequency = 'low'
        
        # 更新資料庫
        update_data = {
            '$set': {
                'categories': word_categories,
                'learning_level': learning_level,
                'context': context,
                'frequency': frequency,
                'searchable_text': f"{title} {' '.join(word_categories)} {learning_level} {context}".lower()
            }
        }
        
        result = collection.update_one(
            {'_id': word['_id']},
            update_data
        )
        
        if result.modified_count > 0:
            updated_count += 1
            if updated_count % 100 == 0:
                print(f"   已處理 {updated_count} 個詞彙...")
    
    print(f"✅ 分類標籤添加完成！共更新 {updated_count} 個詞彙")
    
    # 統計結果
    print("\n📊 分類統計:")
    pipeline = [
        {'$unwind': '$categories'},
        {'$group': {'_id': '$categories', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    
    category_stats = list(collection.aggregate(pipeline))
    for stat in category_stats:
        print(f"   {stat['_id']}: {stat['count']} 個詞彙")
    
    return updated_count

def create_category_indexes():
    """建立搜尋索引"""
    collection = connect_to_mongo()
    if collection is None:
        return
    
    try:
        # 建立分類索引
        collection.create_index([("categories", 1)])
        collection.create_index([("learning_level", 1)])
        collection.create_index([("context", 1)])
        collection.create_index([("frequency", 1)])
        
        # 建立文字搜尋索引
        collection.create_index([("searchable_text", "text")])
        collection.create_index([("title", "text")])
        
        print("✅ 搜尋索引建立完成")
        
    except Exception as e:
        print(f"⚠️ 索引建立警告: {e}")

def test_categorization():
    """測試分類功能"""
    collection = connect_to_mongo()
    if collection is None:
        return
    
    print("\n🔍 分類功能測試:")
    
    # 測試不同查詢
    test_queries = [
        {"categories": "家庭生活"},
        {"learning_level": "beginner"},
        {"context": "home_school"},
        {"frequency": "high"}
    ]
    
    for query in test_queries:
        count = collection.count_documents(query)
        key, value = list(query.items())[0]
        print(f"   {key}='{value}': {count} 個詞彙")

if __name__ == "__main__":
    print("🏷️ 詞彙分類系統實施")
    print("=" * 40)
    
    # 添加分類標籤
    updated = add_category_tags()
    
    if updated > 0:
        # 建立索引
        create_category_indexes()
        
        # 測試功能
        test_categorization()
        
        print(f"\n🎉 詞彙分類系統實施完成！")
        print("現在可以使用以下欄位進行查詢:")
        print("- categories: 主題分類")
        print("- learning_level: 學習難度 (beginner/intermediate/advanced)")
        print("- context: 使用情境")
        print("- frequency: 使用頻率 (high/medium/low)")
        print("- searchable_text: 全文搜尋")

"""
詞彙分析工具 - 分析 MongoDB 中的詞彙分類
"""

from pymongo import MongoClient
import pandas as pd
from collections import Counter
import re

def connect_to_mongo():
    """連接到 MongoDB"""
    try:
        mongo_url = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority"
        client = MongoClient(mongo_url)
        db = client.tsl_app
        collection = db.book_words
        
        # 測試連接
        client.admin.command('ping')
        print("✅ MongoDB 連接成功")
        return collection
        
    except Exception as e:
        print(f"❌ MongoDB 連接失敗: {e}")
        return None

def analyze_vocabulary_categories():
    """分析詞彙分類"""
    collection = connect_to_mongo()
    if collection is None:
        return
    
    # 獲取所有詞彙
    all_words = list(collection.find({}))
    print(f"📊 總詞彙數量: {len(all_words)}")
    
    # 分析冊數分布
    volume_stats = Counter()
    lesson_stats = Counter()
    theme_stats = Counter()
    level_stats = Counter()
    
    # 詞彙內容分析
    word_categories = {
        '人物稱謂': [],
        '家庭關係': [],
        '身體部位': [],
        '動作行為': [],
        '情感狀態': [],
        '時間相關': [],
        '地點場所': [],
        '動物': [],
        '食物飲品': [],
        '日常用品': [],
        '顏色': [],
        '數字': [],
        '天氣': [],
        '學習相關': [],
        '運動活動': [],
        '其他': []
    }
    
    # 定義分類關鍵詞
    keywords = {
        '人物稱謂': ['我', '你', '他', '她', '老師', '同學', '朋友', '人'],
        '家庭關係': ['爸爸', '媽媽', '哥哥', '姊姊', '弟弟', '妹妹', '爺爺', '奶奶', '叔叔', '姑姑', '家人', '兒子', '女兒'],
        '身體部位': ['頭', '臉', '眼', '手', '腳', '身體', '肚子', '背', '毛', '頭髮'],
        '動作行為': ['走', '跑', '跳', '坐', '站', '躺', '吃', '喝', '睡', '洗', '穿', '脫', '看', '聽', '說', '讀', '寫', '玩', '學', '工作', '游泳', '跳舞', '唱歌'],
        '情感狀態': ['開心', '快樂', '難過', '生氣', '害怕', '擔心', '愛', '喜歡', '不喜歡', '想', '希望', '感動', '驚訝', '緊張', '放心'],
        '時間相關': ['早上', '中午', '下午', '晚上', '昨天', '今天', '明天', '星期', '時間', '點', '半', '現在', '以前', '以後'],
        '地點場所': ['家', '學校', '公園', '動物園', '圖書館', '醫院', '餐廳', '店', '市場', '外面', '裡面', '這裡', '那裡', '哪裡'],
        '動物': ['狗', '貓', '魚', '鳥', '熊', '獅子', '大象', '猴子', '企鵝', '兔子', '青蛙', '蜜蜂', '松鼠', '馬', '牛', '豬', '雞'],
        '食物飲品': ['飯', '菜', '肉', '魚', '蛋', '水果', '蘋果', '香蕉', '湯', '水', '牛奶', '麵', '餅', '糖', '餐', '食物'],
        '日常用品': ['書', '筆', '包', '衣服', '帽子', '眼鏡', '手錶', '桌子', '椅子', '杯子', '碗', '錢', '玩具'],
        '顏色': ['紅', '橙', '黃', '綠', '藍', '靛', '紫', '白', '黑', '顏色'],
        '數字': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '元', '歲', '次', '個', '斤'],
        '天氣': ['晴', '雨', '雲', '風', '冷', '熱', '溫暖', '天氣', '雷', '彩虹'],
        '學習相關': ['書', '讀', '寫', '學', '教', '課', '考', '功課', '手語', '英文', '數學'],
        '運動活動': ['跑步', '游泳', '打球', '騎車', '爬山', '運動', '比賽', '輸', '贏']
    }
    
    for word in all_words:
        # 統計基本信息
        if 'volume' in word:
            volume_stats[word['volume']] += 1
        if 'lesson' in word:
            lesson_stats[f"{word.get('volume', '未知')}冊{word['lesson']}課"] += 1
        if 'theme' in word:
            theme_stats[word['theme']] += 1
        if 'level' in word:
            level_stats[word['level']] += 1
            
        # 詞彙內容分類
        title = word.get('title', '')
        categorized = False
        
        for category, category_keywords in keywords.items():
            for keyword in category_keywords:
                if keyword in title:
                    word_categories[category].append(title)
                    categorized = True
                    break
            if categorized:
                break
        
        if not categorized:
            word_categories['其他'].append(title)
    
    # 輸出分析結果
    print("\n" + "="*50)
    print("📚 冊數分布:")
    for volume, count in sorted(volume_stats.items()):
        print(f"  第{volume}冊: {count} 個詞彙")
    
    print("\n📈 主題分布:")
    for theme, count in theme_stats.most_common(10):
        if theme:
            print(f"  {theme}: {count} 個詞彙")
    
    print("\n🎯 詞彙分類分析:")
    for category, words in word_categories.items():
        if words:
            print(f"  {category}: {len(words)} 個詞彙")
            # 顯示前5個詞彙作為示例
            examples = words[:5]
            print(f"    示例: {', '.join(examples)}")
    
    print("\n💡 建議的使用者分類方案:")
    print("1. 基礎分類 - 按學習進度")
    print("   - 初級 (第1-3冊)")
    print("   - 中級 (第4-7冊)")  
    print("   - 高級 (第8-10冊)")
    
    print("\n2. 主題分類 - 按生活場景")
    sorted_categories = sorted([(cat, len(words)) for cat, words in word_categories.items() if words], key=lambda x: x[1], reverse=True)
    for i, (category, count) in enumerate(sorted_categories[:8], 1):
        print(f"   {i}. {category} ({count}個詞彙)")
    
    print("\n3. 學習方式分類")
    print("   - 日常必學 (高頻詞彙)")
    print("   - 情境對話 (場景相關)")
    print("   - 進階表達 (複雜概念)")
    
    return word_categories, volume_stats, theme_stats

if __name__ == "__main__":
    analyze_vocabulary_categories()

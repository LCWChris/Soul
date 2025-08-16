"""
詞彙分類建議系統 - 基於使用者體驗的分類方案
"""

class VocabularyCategorizationSystem:
    """詞彙分類系統"""
    
    def __init__(self):
        self.categories = self.define_categories()
    
    def define_categories(self):
        """定義分類系統"""
        return {
            # 1. 學習進度分類 (Level-based)
            'learning_levels': {
                'beginner': {
                    'name': '初學者',
                    'description': '基本生活詞彙',
                    'volumes': ['第1冊', '第2冊', '第3冊'],
                    'total_words': 306,  # 84+86+136
                    'features': ['日常動作', '家庭稱謂', '基本物品']
                },
                'intermediate': {
                    'name': '進階者',
                    'description': '擴展詞彙與情境表達',
                    'volumes': ['第4冊', '第5冊', '第6冊', '第7冊'],
                    'total_words': 242,  # 65+60+54+63
                    'features': ['天氣描述', '情感表達', '購物用語']
                },
                'advanced': {
                    'name': '熟練者',
                    'description': '複雜概念與抽象表達',
                    'volumes': ['第8冊', '第9冊', '第10冊'],
                    'total_words': 196,  # 62+63+71
                    'features': ['抽象概念', '複雜情境', '專業詞彙']
                }
            },
            
            # 2. 主題分類 (Topic-based)
            'topics': {
                'family_life': {
                    'name': '家庭生活',
                    'icon': '🏠',
                    'keywords': ['家人', '家庭', '親情', '日常'],
                    'estimated_words': 120,
                    'priority': 1
                },
                'daily_actions': {
                    'name': '日常動作',
                    'icon': '🏃‍♂️',
                    'keywords': ['動作', '行為', '活動'],
                    'estimated_words': 64,
                    'priority': 2
                },
                'numbers_time': {
                    'name': '數字時間',
                    'icon': '🕐',
                    'keywords': ['數字', '時間', '日期'],
                    'estimated_words': 88,  # 59+29
                    'priority': 3
                },
                'animals_nature': {
                    'name': '動物自然',
                    'icon': '🦁',
                    'keywords': ['動物', '自然', '天氣'],
                    'estimated_words': 60,  # 39+21
                    'priority': 4
                },
                'people_relationships': {
                    'name': '人物關係',
                    'icon': '👥',
                    'keywords': ['人物', '稱謂', '關係'],
                    'estimated_words': 57,  # 38+19
                    'priority': 5
                },
                'body_health': {
                    'name': '身體健康',
                    'icon': '💪',
                    'keywords': ['身體', '健康', '醫療'],
                    'estimated_words': 33,
                    'priority': 6
                },
                'food_drink': {
                    'name': '食物飲品',
                    'icon': '🍽️',
                    'keywords': ['食物', '飲品', '餐廳'],
                    'estimated_words': 22,
                    'priority': 7
                },
                'objects_tools': {
                    'name': '物品工具',
                    'icon': '📱',
                    'keywords': ['物品', '工具', '日用品'],
                    'estimated_words': 15,
                    'priority': 8
                }
            },
            
            # 3. 情境分類 (Context-based)
            'contexts': {
                'home': {
                    'name': '居家情境',
                    'scenarios': ['起床', '用餐', '家務', '休息'],
                    'difficulty': 'easy'
                },
                'school': {
                    'name': '學校情境',
                    'scenarios': ['上課', '同學互動', '學習活動'],
                    'difficulty': 'easy'
                },
                'social': {
                    'name': '社交情境',
                    'scenarios': ['朋友聚會', '公園活動', '購物'],
                    'difficulty': 'medium'
                },
                'public': {
                    'name': '公共場所',
                    'scenarios': ['餐廳', '醫院', '圖書館'],
                    'difficulty': 'medium'
                },
                'advanced': {
                    'name': '進階情境',
                    'scenarios': ['工作場合', '正式場合', '抽象討論'],
                    'difficulty': 'hard'
                }
            },
            
            # 4. 學習方式分類 (Learning-style-based)
            'learning_styles': {
                'visual': {
                    'name': '視覺學習',
                    'description': '適合圖像記憶的詞彙',
                    'types': ['具體物品', '動作', '顏色']
                },
                'contextual': {
                    'name': '情境學習',
                    'description': '需要情境理解的詞彙',
                    'types': ['情感', '抽象概念', '關係']
                },
                'practice': {
                    'name': '實作學習',
                    'description': '需要手勢練習的詞彙',
                    'types': ['動作動詞', '表情', '互動']
                }
            }
        }
    
    def get_user_experience_recommendations(self):
        """獲取使用者體驗建議"""
        return {
            'app_structure': {
                'main_navigation': [
                    {'id': 'by_level', 'name': '按程度學習', 'icon': '📚'},
                    {'id': 'by_topic', 'name': '主題分類', 'icon': '🏷️'},
                    {'id': 'by_context', 'name': '情境對話', 'icon': '💬'},
                    {'id': 'favorites', 'name': '我的收藏', 'icon': '⭐'}
                ],
                'quick_access': [
                    {'name': '今日必學', 'count': 10},
                    {'name': '常用詞彙', 'count': 50},
                    {'name': '最近學習', 'count': 'dynamic'}
                ]
            },
            
            'learning_paths': [
                {
                    'name': '新手入門',
                    'duration': '2-4週',
                    'sequence': ['家庭生活', '日常動作', '人物關係'],
                    'target_words': 100
                },
                {
                    'name': '生活應用',
                    'duration': '4-8週', 
                    'sequence': ['數字時間', '食物飲品', '動物自然'],
                    'target_words': 200
                },
                {
                    'name': '進階表達',
                    'duration': '8-12週',
                    'sequence': ['身體健康', '物品工具', '抽象概念'],
                    'target_words': 300
                }
            ],
            
            'personalization': {
                'adaptive_difficulty': '根據學習進度調整詞彙難度',
                'interest_tracking': '記錄使用者偏好的主題',
                'progress_analytics': '分析學習成效和薄弱環節',
                'social_features': '與其他學習者比較進度'
            }
        }
    
    def generate_app_features(self):
        """生成應用功能建議"""
        return {
            'core_features': [
                {
                    'name': '智能分類瀏覽',
                    'description': '多維度詞彙分類系統',
                    'implementation': '標籤式導航 + 搜尋篩選'
                },
                {
                    'name': '個人學習計畫',
                    'description': '客製化學習路徑',
                    'implementation': '進度追蹤 + 適應性推薦'
                },
                {
                    'name': '情境式學習',
                    'description': '場景化詞彙練習',
                    'implementation': '對話模擬 + 角色扮演'
                },
                {
                    'name': '視覺化學習',
                    'description': '圖片輔助記憶',
                    'implementation': '高品質圖片 + 動畫演示'
                }
            ],
            
            'advanced_features': [
                {
                    'name': 'AI 學習助手',
                    'description': '智能推薦和複習提醒',
                    'implementation': '機器學習演算法'
                },
                {
                    'name': '社群學習',
                    'description': '學習者互動和分享',
                    'implementation': '論壇 + 學習小組'
                },
                {
                    'name': '遊戲化學習',
                    'description': '提升學習動機',
                    'implementation': '成就系統 + 排行榜'
                }
            ]
        }

def print_recommendations():
    """輸出建議報告"""
    system = VocabularyCategorizationSystem()
    
    print("🎯 手語詞彙分類系統建議")
    print("=" * 50)
    
    print("\n📚 1. 學習進度分類")
    for level, info in system.categories['learning_levels'].items():
        print(f"   {info['name']}: {info['total_words']} 個詞彙")
        print(f"   - 內容: {info['description']}")
        print(f"   - 特色: {', '.join(info['features'])}")
        print()
    
    print("🏷️ 2. 主題分類")
    topics = system.categories['topics']
    sorted_topics = sorted(topics.items(), key=lambda x: x[1]['priority'])
    for topic_id, info in sorted_topics:
        print(f"   {info['icon']} {info['name']}: ~{info['estimated_words']} 個詞彙")
    
    print("\n💬 3. 情境分類")
    for context_id, info in system.categories['contexts'].items():
        print(f"   {info['name']} ({info['difficulty']})")
        print(f"   - 場景: {', '.join(info['scenarios'])}")
    
    ux_rec = system.get_user_experience_recommendations()
    
    print("\n🎨 4. 使用者體驗建議")
    print("   主導航:")
    for nav in ux_rec['app_structure']['main_navigation']:
        print(f"   - {nav['icon']} {nav['name']}")
    
    print("\n📈 5. 學習路徑建議")
    for path in ux_rec['learning_paths']:
        print(f"   {path['name']} ({path['duration']})")
        print(f"   - 目標: {path['target_words']} 個詞彙")
        print(f"   - 順序: {' → '.join(path['sequence'])}")
    
    features = system.generate_app_features()
    
    print("\n🛠️ 6. 核心功能建議")
    for feature in features['core_features']:
        print(f"   • {feature['name']}")
        print(f"     {feature['description']}")
    
    print("\n🚀 7. 進階功能建議")
    for feature in features['advanced_features']:
        print(f"   • {feature['name']}")
        print(f"     {feature['description']}")

if __name__ == "__main__":
    print_recommendations()

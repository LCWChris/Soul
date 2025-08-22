#!/usr/bin/env python3
"""
合併並更新 book_words 資料庫
將 lesson_words.xlsx 的正確資料與 tsl_app.book_words.csv 合併，
保留正確的圖片連結和分級資訊，重新匯入資料庫
"""

import pandas as pd
import pymongo
from datetime import datetime
import re
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

class BookWordsUpdater:
    def __init__(self):
        # MongoDB 連接 (需要設定您的連接字串)
        self.mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017/tsl_app')
        self.client = None
        self.db = None
        self.collection = None
        
    def connect_mongodb(self):
        """連接 MongoDB"""
        try:
            self.client = pymongo.MongoClient(self.mongo_url)
            self.db = self.client['tsl_app']  # 假設資料庫名稱是 tsl_app
            self.collection = self.db['book_words']
            print("✅ MongoDB 連接成功")
            return True
        except Exception as e:
            print(f"❌ MongoDB 連接失敗: {e}")
            return False
    
    def load_data_files(self):
        """載入兩個資料檔案"""
        try:
            print("📖 載入資料檔案...")
            
            # 載入現有的 book_words 資料
            self.book_words_df = pd.read_csv('tsl_app.book_words.csv')
            print(f"   tsl_app.book_words.csv: {len(self.book_words_df)} 筆資料")
            
            # 載入正確的 lesson_words 資料
            self.lesson_words_df = pd.read_excel('lesson_words.xlsx')
            print(f"   lesson_words.xlsx: {len(self.lesson_words_df)} 筆資料")
            
            print("📋 lesson_words.xlsx 欄位:")
            for col in self.lesson_words_df.columns:
                print(f"   - {col}")
                
            print("📋 book_words.csv 欄位:")
            for col in self.book_words_df.columns:
                print(f"   - {col}")
            
            return True
            
        except Exception as e:
            print(f"❌ 載入資料檔案失敗: {e}")
            return False
    
    def merge_and_clean_data(self):
        """合併並清理資料"""
        try:
            print("\n🔧 開始合併和清理資料...")
            
            # 以 lesson_words 為主要資料源，因為它的連結是正確的
            merged_data = []
            
            for _, lesson_row in self.lesson_words_df.iterrows():
                title = str(lesson_row.get('title', '')).strip()
                
                if not title or title == 'nan':
                    continue
                
                # 在 book_words 中尋找對應的詞彙
                matching_book_words = self.book_words_df[
                    self.book_words_df['title'].str.strip() == title
                ]
                
                # 建立合併後的記錄
                merged_record = {
                    'volume': int(lesson_row.get('volume', 1)),
                    'lesson': int(lesson_row.get('lesson', 1)),
                    'title': title,
                    'page': lesson_row.get('page'),
                    'image_url': lesson_row.get('image_url', ''),
                    'video_url': lesson_row.get('video_url', ''),
                    'created_by': 'admin',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                }
                
                # 如果在 book_words 中找到匹配，使用其分級和分類資訊
                if not matching_book_words.empty:
                    book_row = matching_book_words.iloc[0]
                    
                    # 使用 book_words 的分級分類資訊
                    merged_record.update({
                        'level': book_row.get('level', '初級'),
                        'theme': book_row.get('theme'),
                        'category': book_row.get('category', '綜合'),
                        'content': title,  # 內容就是標題
                        'context': book_row.get('context', 'home_school'),
                        'frequency': book_row.get('frequency', 'medium'),
                        'learning_level': book_row.get('learning_level', 'beginner'),
                        'categories': [
                            book_row.get('categories[0]', ''),
                            book_row.get('categories[1]', ''),
                            book_row.get('categories[2]', '')
                        ],
                        'searchable_text': f"{title} {book_row.get('categories[0]', '')} {book_row.get('learning_level', 'beginner')} {book_row.get('context', 'home_school')}"
                    })
                else:
                    # 如果沒有找到匹配，設定預設值
                    learning_level = self.determine_learning_level(merged_record['volume'])
                    category = self.determine_category(title)
                    
                    merged_record.update({
                        'level': '初級' if merged_record['volume'] <= 3 else '中級' if merged_record['volume'] <= 7 else '高級',
                        'theme': None,
                        'category': category,
                        'content': title,
                        'context': 'home_school',
                        'frequency': 'medium',
                        'learning_level': learning_level,
                        'categories': [category, '', ''],
                        'searchable_text': f"{title} {category} {learning_level} home_school"
                    })
                
                merged_data.append(merged_record)
            
            self.merged_df = pd.DataFrame(merged_data)
            print(f"✅ 合併完成，共 {len(self.merged_df)} 筆資料")
            
            return True
            
        except Exception as e:
            print(f"❌ 合併資料失敗: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def determine_learning_level(self, volume):
        """根據冊數決定學習級別"""
        if volume <= 3:
            return 'beginner'
        elif volume <= 7:
            return 'intermediate'
        else:
            return 'advanced'
    
    def determine_category(self, title):
        """根據詞彙內容判斷分類"""
        # 簡單的分類邏輯，可以根據需要擴展
        action_words = ['起床', '刷牙', '洗臉', '穿衣服', '讀書', '去', '吃', '喝', '走', '跑', '坐', '站']
        emotion_words = ['開心', '難過', '生氣', '害怕', '驚訝', '愛', '喜歡']
        family_words = ['爸爸', '媽媽', '哥哥', '姊姊', '弟弟', '妹妹', '爺爺', '奶奶']
        object_words = ['書', '桌子', '椅子', '杯子', '碗', '筷子', '車子', '房子']
        
        if any(word in title for word in action_words):
            return '日常動作'
        elif any(word in title for word in emotion_words):
            return '情感表達'
        elif any(word in title for word in family_words):
            return '人物關係'
        elif any(word in title for word in object_words):
            return '物品工具'
        else:
            return '綜合'
    
    def backup_and_clear_collection(self):
        """備份並清空現有集合"""
        try:
            print("\n💾 備份現有資料...")
            
            # 備份現有資料
            existing_data = list(self.collection.find())
            if existing_data:
                backup_filename = f"book_words_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                import json
                with open(backup_filename, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=2, default=str)
                print(f"✅ 備份完成: {backup_filename}")
            
            # 清空集合
            result = self.collection.delete_many({})
            print(f"🗑️  已刪除 {result.deleted_count} 筆舊資料")
            
            return True
            
        except Exception as e:
            print(f"❌ 備份失敗: {e}")
            return False
    
    def insert_merged_data(self):
        """將合併後的資料匯入資料庫"""
        try:
            print("\n📝 匯入新資料...")
            
            # 轉換 DataFrame 為字典列表
            records = self.merged_df.to_dict('records')
            
            # 清理 NaN 值
            for record in records:
                for key, value in record.items():
                    if pd.isna(value):
                        record[key] = None
            
            # 批量插入
            result = self.collection.insert_many(records)
            print(f"✅ 成功匯入 {len(result.inserted_ids)} 筆資料")
            
            return True
            
        except Exception as e:
            print(f"❌ 匯入資料失敗: {e}")
            return False
    
    def generate_summary_report(self):
        """生成摘要報告"""
        try:
            print("\n📊 生成摘要報告...")
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_filename = f"book_words_update_report_{timestamp}.txt"
            
            with open(report_filename, 'w', encoding='utf-8') as f:
                f.write(f"Book Words 資料庫更新報告\n")
                f.write(f"更新時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 50 + "\n\n")
                
                f.write(f"總資料筆數: {len(self.merged_df)}\n\n")
                
                # 按冊數統計
                f.write("各冊詞彙數量:\n")
                volume_counts = self.merged_df['volume'].value_counts().sort_index()
                for volume, count in volume_counts.items():
                    f.write(f"  第{volume}冊: {count}筆\n")
                
                f.write("\n")
                
                # 按分類統計
                f.write("分類統計:\n")
                category_counts = self.merged_df['category'].value_counts()
                for category, count in category_counts.items():
                    f.write(f"  {category}: {count}筆\n")
                
                f.write("\n")
                
                # 學習級別統計
                f.write("學習級別統計:\n")
                level_counts = self.merged_df['learning_level'].value_counts()
                for level, count in level_counts.items():
                    f.write(f"  {level}: {count}筆\n")
                
                f.write("\n")
                
                # 有圖片連結的統計
                has_image = self.merged_df['image_url'].notna() & (self.merged_df['image_url'] != '')
                f.write(f"有圖片連結: {has_image.sum()}筆\n")
                f.write(f"無圖片連結: {len(self.merged_df) - has_image.sum()}筆\n")
            
            print(f"📄 報告已生成: {report_filename}")
            
            # 輸出到控制台
            print("\n📊 更新統計:")
            print(f"   總資料筆數: {len(self.merged_df)}")
            print(f"   各冊分佈: {dict(volume_counts)}")
            print(f"   有圖片連結: {has_image.sum()}/{len(self.merged_df)}")
            
            return True
            
        except Exception as e:
            print(f"❌ 生成報告失敗: {e}")
            return False
    
    def run_update_process(self):
        """執行完整的更新流程"""
        print("🎯 開始 Book Words 資料庫更新流程...")
        
        # 1. 載入資料檔案
        if not self.load_data_files():
            return False
        
        # 2. 合併和清理資料
        if not self.merge_and_clean_data():
            return False
        
        # 3. 連接資料庫
        if not self.connect_mongodb():
            print("⚠️  無法連接 MongoDB，將只生成合併後的檔案")
            # 仍然可以生成合併後的資料檔案
            self.save_merged_data_file()
            self.generate_summary_report()
            return True
        
        # 4. 備份並清空現有資料
        if not self.backup_and_clear_collection():
            return False
        
        # 5. 匯入新資料
        if not self.insert_merged_data():
            return False
        
        # 6. 生成報告
        self.generate_summary_report()
        
        # 7. 儲存合併後的檔案
        self.save_merged_data_file()
        
        print("\n🎉 資料庫更新完成！")
        return True
    
    def save_merged_data_file(self):
        """儲存合併後的資料檔案"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 儲存為 CSV
            csv_filename = f"book_words_merged_{timestamp}.csv"
            self.merged_df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
            print(f"💾 合併後資料已儲存: {csv_filename}")
            
            # 儲存為 Excel
            excel_filename = f"book_words_merged_{timestamp}.xlsx"
            self.merged_df.to_excel(excel_filename, index=False)
            print(f"💾 合併後資料已儲存: {excel_filename}")
            
        except Exception as e:
            print(f"❌ 儲存檔案失敗: {e}")

if __name__ == "__main__":
    updater = BookWordsUpdater()
    updater.run_update_process()

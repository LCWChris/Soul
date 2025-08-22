#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
詞匯分級分類器
根據多個標準將詞匯分為初級、中級、高級三個等級
"""

import json
import pandas as pd
import re
from datetime import datetime

class VocabularyLevelClassifier:
    def __init__(self):
        # 定義分級標準
        self.beginner_criteria = {
            'volumes': [1, 2, 3],  # 初級冊數
            'basic_words': [
                '起床', '早安', '晚安', '你好', '再見', '謝謝', '對不起', 
                '爸爸', '媽媽', '家', '學校', '吃', '喝', '睡覺', '玩',
                '紅色', '藍色', '黃色', '大', '小', '好', '不好',
                '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'
            ],
            'categories': ['日常動作', '問候語', '家庭', '顏色', '數字', '基本形容詞']
        }
        
        self.intermediate_criteria = {
            'volumes': [4, 5, 6, 7, 8],  # 中級冊數
            'complex_concepts': [
                '感情', '情緒', '思考', '計劃', '比較', '選擇', '決定',
                '工作', '學習', '運動', '旅行', '購物', '烹飪'
            ],
            'categories': ['情感', '職業', '活動', '地點', '時間概念']
        }
        
        self.advanced_criteria = {
            'volumes': [9, 10, 11, 12],  # 高級冊數
            'abstract_concepts': [
                '哲學', '科學', '藝術', '文化', '歷史', '政治', '經濟',
                '環境', '技術', '創新', '分析', '評估', '創造'
            ],
            'categories': ['抽象概念', '學術詞匯', '專業術語', '複雜描述']
        }

    def classify_word_complexity(self, word):
        """根據詞匯複雜度分類"""
        # 確保word是字符串
        word = str(word) if word is not None and not pd.isna(word) else ''
        word_length = len(word)
        
        # 基於字數的初步分類
        if word_length <= 2:
            base_level = 'beginner'
        elif word_length <= 4:
            base_level = 'intermediate'
        else:
            base_level = 'advanced'
            
        return base_level

    def classify_by_volume_lesson(self, volume, lesson):
        """根據冊數和課程分類"""
        if volume in self.beginner_criteria['volumes']:
            return 'beginner'
        elif volume in self.intermediate_criteria['volumes']:
            return 'intermediate'
        elif volume in self.advanced_criteria['volumes']:
            return 'advanced'
        else:
            # 對於超出範圍的冊數，根據課程難度
            if lesson <= 5:
                return 'beginner'
            elif lesson <= 10:
                return 'intermediate'
            else:
                return 'advanced'

    def classify_by_content(self, content, category):
        """根據內容和類別分類"""
        # 確保content和category是字符串
        content = str(content) if content is not None and not pd.isna(content) else ''
        category = str(category) if category is not None and not pd.isna(category) else ''
        
        content_lower = content.lower()
        category_lower = category.lower()
        
        # 檢查是否包含基礎詞匯
        for basic_word in self.beginner_criteria['basic_words']:
            if basic_word in content:
                return 'beginner'
        
        # 檢查類別
        for cat in self.beginner_criteria['categories']:
            if cat in category:
                return 'beginner'
                
        for cat in self.intermediate_criteria['categories']:
            if cat in category:
                return 'intermediate'
                
        for cat in self.advanced_criteria['categories']:
            if cat in category:
                return 'advanced'
        
        # 檢查複雜概念
        for concept in self.intermediate_criteria['complex_concepts']:
            if concept in content:
                return 'intermediate'
                
        for concept in self.advanced_criteria['abstract_concepts']:
            if concept in content:
                return 'advanced'
        
        return None

    def classify_by_frequency_context(self, frequency, context):
        """根據使用頻率和上下文分類"""
        # 確保frequency和context是字符串
        frequency = str(frequency) if frequency is not None and not pd.isna(frequency) else 'medium'
        context = str(context) if context is not None and not pd.isna(context) else 'general'
        
        if frequency == 'high' or context in ['home', 'family', 'basic']:
            return 'beginner'
        elif frequency == 'medium' or context in ['school', 'work', 'social']:
            return 'intermediate'
        elif frequency == 'low' or context in ['academic', 'professional', 'technical']:
            return 'advanced'
        return None

    def determine_final_level(self, word_data):
        """綜合多個標準確定最終等級"""
        scores = {'beginner': 0, 'intermediate': 0, 'advanced': 0}
        
        # 1. 根據冊數課程分類 (權重: 3)
        volume_level = self.classify_by_volume_lesson(
            word_data.get('volume', 1), 
            word_data.get('lesson', 1)
        )
        scores[volume_level] += 3
        
        # 2. 根據內容複雜度分類 (權重: 2)
        complexity_level = self.classify_word_complexity(word_data.get('content', ''))
        scores[complexity_level] += 2
        
        # 3. 根據內容和類別分類 (權重: 2)
        content_level = self.classify_by_content(
            word_data.get('content', ''), 
            word_data.get('category', '')
        )
        if content_level:
            scores[content_level] += 2
        
        # 4. 根據頻率和上下文分類 (權重: 1)
        freq_context_level = self.classify_by_frequency_context(
            word_data.get('frequency', 'medium'),
            word_data.get('context', 'general')
        )
        if freq_context_level:
            scores[freq_context_level] += 1
        
        # 返回得分最高的等級
        return max(scores, key=scores.get)

    def process_vocabulary_file(self, input_file, output_file):
        """處理詞匯文件並重新分級"""
        print(f"正在讀取詞匯文件: {input_file}")
        
        # 讀取JSON文件
        with open(input_file, 'r', encoding='utf-8') as f:
            vocabulary_data = json.load(f)
        
        print(f"總共有 {len(vocabulary_data)} 個詞匯需要分級")
        
        # 統計分級結果
        level_counts = {'beginner': 0, 'intermediate': 0, 'advanced': 0}
        processed_data = []
        
        for i, word_data in enumerate(vocabulary_data):
            # 確定新的等級
            new_level = self.determine_final_level(word_data)
            
            # 更新learning_level欄位
            word_data['learning_level'] = new_level
            
            # 也更新level欄位以保持一致性
            level_mapping = {
                'beginner': '初級',
                'intermediate': '中級', 
                'advanced': '高級'
            }
            word_data['level'] = level_mapping[new_level]
            
            # 更新searchable_text
            searchable_parts = [
                str(word_data.get('content', '')) if word_data.get('content') is not None and not pd.isna(word_data.get('content')) else '',
                str(word_data.get('category', '')) if word_data.get('category') is not None and not pd.isna(word_data.get('category')) else '',
                new_level,
                str(word_data.get('context', '')) if word_data.get('context') is not None and not pd.isna(word_data.get('context')) else ''
            ]
            word_data['searchable_text'] = ' '.join(filter(None, searchable_parts))
            
            # 更新時間戳
            word_data['updated_at'] = datetime.now().isoformat()
            
            processed_data.append(word_data)
            level_counts[new_level] += 1
            
            # 進度顯示
            if (i + 1) % 50 == 0:
                print(f"已處理: {i + 1}/{len(vocabulary_data)} 個詞匯")
        
        # 保存結果
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
        # 輸出統計結果
        print(f"\n分級完成！結果保存到: {output_file}")
        print("\n分級統計:")
        print(f"初級 (beginner): {level_counts['beginner']} 個詞匯")
        print(f"中級 (intermediate): {level_counts['intermediate']} 個詞匯") 
        print(f"高級 (advanced): {level_counts['advanced']} 個詞匯")
        print(f"總計: {sum(level_counts.values())} 個詞匯")
        
        # 保存統計報告
        report_file = output_file.replace('.json', '_分級報告.txt')
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"詞匯分級統計報告\n")
            f.write(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"="*50 + "\n\n")
            f.write(f"總詞匯數: {sum(level_counts.values())}\n\n")
            f.write(f"分級分布:\n")
            f.write(f"初級 (beginner): {level_counts['beginner']} 個 ({level_counts['beginner']/sum(level_counts.values())*100:.1f}%)\n")
            f.write(f"中級 (intermediate): {level_counts['intermediate']} 個 ({level_counts['intermediate']/sum(level_counts.values())*100:.1f}%)\n")
            f.write(f"高級 (advanced): {level_counts['advanced']} 個 ({level_counts['advanced']/sum(level_counts.values())*100:.1f}%)\n")
        
        print(f"統計報告保存到: {report_file}")
        
        return processed_data, level_counts

def main():
    """主函數"""
    classifier = VocabularyLevelClassifier()
    
    # 輸入和輸出文件路徑
    input_file = "book_words_final_20250816_225454.json"
    output_file = f"book_words_leveled_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    try:
        # 處理詞匯分級
        processed_data, level_counts = classifier.process_vocabulary_file(input_file, output_file)
        
        print("\n詞匯分級處理完成！")
        print("您可以使用新生成的文件來更新數據庫。")
        
    except FileNotFoundError:
        print(f"錯誤: 找不到輸入文件 {input_file}")
    except Exception as e:
        print(f"處理過程中發生錯誤: {str(e)}")

if __name__ == "__main__":
    main()

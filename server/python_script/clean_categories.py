#!/usr/bin/env python3
"""
清理分類資料腳本
修正資料庫中的分類顯示問題
"""

import pandas as pd
import json
import numpy as np

def clean_categories_data():
    """清理分類資料"""
    print("🧹 開始清理分類資料...")
    
    # 讀取資料
    df = pd.read_csv('book_words_final_20250816_225454.csv')
    print(f"📖 載入 {len(df)} 筆資料")
    
    # 分析 categories 欄位並提取主要分類
    def extract_main_category(categories_str):
        """從 categories 字串中提取主要分類"""
        if pd.isna(categories_str) or categories_str == '':
            return '綜合'
        
        try:
            # 嘗試解析為列表
            if categories_str.startswith('[') and categories_str.endswith(']'):
                # 移除括號並分割
                clean_str = categories_str.strip('[]').replace("'", "").replace('"', '')
                categories = [cat.strip() for cat in clean_str.split(',')]
                
                # 找到第一個非空、非nan的分類
                for cat in categories:
                    if cat and cat.lower() != 'nan' and cat != '':
                        return cat
            
            return '綜合'
        except:
            return '綜合'
    
    # 清理 category 欄位
    print("🔧 清理 category 欄位...")
    df['category_clean'] = df['categories'].apply(extract_main_category)
    
    # 更新 category 欄位
    df['category'] = df['category_clean']
    
    # 清理 categories 欄位 - 建立乾淨的陣列
    def create_clean_categories(main_category):
        """建立乾淨的分類陣列"""
        return [main_category, '', '']
    
    df['categories_clean'] = df['category'].apply(create_clean_categories)
    df['categories'] = df['categories_clean'].apply(lambda x: str(x))
    
    # 清理其他欄位中的 nan 值
    print("🔧 清理其他欄位...")
    
    # 清理所有欄位的 NaN 值
    df = df.fillna('')
    
    # 清理學習等級
    df['learning_level'] = df['learning_level'].replace('nan', 'beginner')
    df.loc[df['learning_level'] == '', 'learning_level'] = 'beginner'
    
    # 清理情境
    df['context'] = df['context'].replace('nan', 'home_school')
    df.loc[df['context'] == '', 'context'] = 'home_school'
    
    # 清理頻率
    df['frequency'] = df['frequency'].replace('nan', 'medium')
    df.loc[df['frequency'] == '', 'frequency'] = 'medium'
    
    # 清理主題
    df['theme'] = df['theme'].replace('nan', '')
    
    # 清理 image_url 和 video_url
    df['image_url'] = df['image_url'].replace('nan', '')
    df['video_url'] = df['video_url'].replace('nan', '')
    
    # 移除輔助欄位
    df = df.drop(['category_clean', 'categories_clean'], axis=1)
    
    # 顯示清理結果
    print("\n📊 清理結果:")
    print("category 欄位分佈:")
    print(df['category'].value_counts())
    
    print(f"\n有效分類數量: {df['category'].nunique()}")
    print(f"無問題資料: {len(df[~df['category'].isin(['', 'nan', np.nan])])} 筆")
    
    return df

def save_cleaned_data(df):
    """儲存清理後的資料"""
    timestamp = "20250816_cleaned"
    
    # 儲存 CSV
    csv_file = f'book_words_cleaned_{timestamp}.csv'
    df.to_csv(csv_file, index=False, encoding='utf-8')
    print(f"💾 CSV 已儲存: {csv_file}")
    
    # 儲存 JSON
    json_file = f'book_words_cleaned_{timestamp}.json'
    data = df.to_dict('records')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON 已儲存: {json_file}")
    
    return json_file

def main():
    """主程序"""
    print("🚀 分類資料清理工具")
    
    # 清理資料
    cleaned_df = clean_categories_data()
    
    # 儲存資料
    json_file = save_cleaned_data(cleaned_df)
    
    print(f"\n🎉 清理完成！")
    print(f"📋 下一步: 執行資料庫更新")
    print(f"   node update_cleaned_db.js")

if __name__ == "__main__":
    main()

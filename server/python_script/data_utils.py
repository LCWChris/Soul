"""
資料處理萬用工具 - Data Processing Utilities
支援 Excel、CSV、MongoDB 等多種資料操作
"""

import pandas as pd
from pymongo import MongoClient
from datetime import datetime
import os
import json

class DataProcessor:
    """資料處理核心類別"""
    
    def __init__(self, mongo_uri=None):
        self.mongo_uri = mongo_uri or "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/?retryWrites=true&w=majority"
        self.client = None
        
    def connect_mongo(self, db_name="tsl_app"):
        """連接 MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[db_name]
            print(f"✅ 已連接 MongoDB: {db_name}")
            return True
        except Exception as e:
            print(f"❌ MongoDB 連接失敗: {e}")
            return False
    
    def close_mongo(self):
        """關閉 MongoDB 連接"""
        if self.client:
            self.client.close()
            print("🔗 MongoDB 連接已關閉")
    
    # ==================== Excel/CSV 操作 ====================
    
    def read_file(self, filename, sheet_name=None):
        """讀取 Excel 或 CSV 文件"""
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filename, encoding='utf-8')
            else:
                df = pd.read_excel(filename, sheet_name=sheet_name)
            
            print(f"✅ 讀取 {filename}: {len(df)} 筆記錄, {len(df.columns)} 個欄位")
            return df
            
        except Exception as e:
            print(f"❌ 讀取失敗 {filename}: {e}")
            return None
    
    def save_file(self, df, filename, sheet_name='Sheet1'):
        """保存 DataFrame 到 Excel 或 CSV"""
        try:
            if filename.endswith('.csv'):
                df.to_csv(filename, index=False, encoding='utf-8-sig')
            else:
                df.to_excel(filename, sheet_name=sheet_name, index=False)
            
            print(f"💾 已保存 {filename}: {len(df)} 筆記錄")
            return True
            
        except Exception as e:
            print(f"❌ 保存失敗 {filename}: {e}")
            return False
    
    def merge_files(self, file1, file2, key1, key2, how='left', output_name=None):
        """合併兩個文件"""
        df1 = self.read_file(file1)
        df2 = self.read_file(file2)
        
        if df1 is None or df2 is None:
            return None
        
        merged = pd.merge(df1, df2, left_on=key1, right_on=key2, how=how)
        matched = merged[key2].notna().sum()
        
        print(f"📊 合併結果: {matched}/{len(merged)} ({matched/len(merged)*100:.1f}%)")
        
        if output_name:
            self.save_file(merged, output_name)
        
        return merged
    
    def analyze_file(self, filename):
        """分析文件結構"""
        df = self.read_file(filename)
        if df is None:
            return
        
        print(f"\n📋 文件分析: {filename}")
        print(f"   記錄數: {len(df)}")
        print(f"   欄位數: {len(df.columns)}")
        print(f"   欄位列表: {list(df.columns)}")
        print(f"   記憶體使用: {df.memory_usage(deep=True).sum() / 1024:.1f} KB")
        
        # 顯示各欄位的資料類型和非空值數量
        print(f"\n📊 欄位詳情:")
        for col in df.columns:
            dtype = df[col].dtype
            non_null = df[col].notna().sum()
            null_pct = (len(df) - non_null) / len(df) * 100
            print(f"   {col}: {dtype} | 非空:{non_null} | 空值:{null_pct:.1f}%")
        
        return df
    
    # ==================== MongoDB 操作 ====================
    
    def mongo_import(self, df, collection_name, clear_first=False):
        """匯入數據到 MongoDB"""
        if not self.client:
            if not self.connect_mongo():
                return False
        
        collection = self.db[collection_name]
        
        # 清空集合
        if clear_first:
            deleted = collection.delete_many({}).deleted_count
            print(f"🗑️  已清空 {deleted} 筆舊記錄")
        
        # 添加時間戳
        df = df.copy()
        df['created_at'] = datetime.utcnow()
        df['updated_at'] = datetime.utcnow()
        
        # 匯入數據
        records = df.to_dict('records')
        result = collection.insert_many(records)
        
        print(f"✅ 已匯入 {len(result.inserted_ids)} 筆記錄到 {collection_name}")
        return True
    
    def mongo_export(self, collection_name, query={}, filename=None):
        """從 MongoDB 匯出數據"""
        if not self.client:
            if not self.connect_mongo():
                return None
        
        collection = self.db[collection_name]
        cursor = collection.find(query)
        df = pd.DataFrame(list(cursor))
        
        if '_id' in df.columns:
            df = df.drop('_id', axis=1)
        
        print(f"📤 從 {collection_name} 匯出 {len(df)} 筆記錄")
        
        if filename:
            self.save_file(df, filename)
        
        return df
    
    def mongo_stats(self, collection_name):
        """MongoDB 集合統計"""
        if not self.client:
            if not self.connect_mongo():
                return
        
        collection = self.db[collection_name]
        count = collection.count_documents({})
        
        print(f"📊 {collection_name} 統計:")
        print(f"   總記錄數: {count}")
        
        if count > 0:
            # 取樣本分析欄位
            sample = collection.find_one()
            fields = list(sample.keys())
            print(f"   欄位數: {len(fields)}")
            print(f"   欄位列表: {fields}")
    
    # ==================== 資料清理工具 ====================
    
    def clean_data(self, df, operations=None):
        """數據清理"""
        df_clean = df.copy()
        
        if operations is None:
            operations = ['remove_duplicates', 'fill_null', 'trim_strings']
        
        if 'remove_duplicates' in operations:
            before = len(df_clean)
            df_clean = df_clean.drop_duplicates()
            after = len(df_clean)
            if before != after:
                print(f"🧹 移除重複記錄: {before - after} 筆")
        
        if 'fill_null' in operations:
            numeric_cols = df_clean.select_dtypes(include=['number']).columns
            string_cols = df_clean.select_dtypes(include=['object']).columns
            
            df_clean[numeric_cols] = df_clean[numeric_cols].fillna(0)
            df_clean[string_cols] = df_clean[string_cols].fillna('')
            print("🧹 已填補空值")
        
        if 'trim_strings' in operations:
            string_cols = df_clean.select_dtypes(include=['object']).columns
            df_clean[string_cols] = df_clean[string_cols].apply(lambda x: x.str.strip() if x.dtype == 'object' else x)
            print("🧹 已清理字串空格")
        
        return df_clean
    
    def standardize_columns(self, df, column_mapping=None):
        """標準化欄位名稱"""
        if column_mapping is None:
            # 預設映射規則
            column_mapping = {
                'word': 'title',
                'image': 'image_url',
                'video': 'video_url',
                'level': 'level',
                'category': 'category'
            }
        
        # 智能匹配欄位名稱
        rename_dict = {}
        for col in df.columns:
            col_lower = str(col).lower()
            for key, value in column_mapping.items():
                if key in col_lower:
                    rename_dict[col] = value
                    break
        
        if rename_dict:
            df_renamed = df.rename(columns=rename_dict)
            print(f"🏷️  重新命名欄位: {rename_dict}")
            return df_renamed
        
        return df
    
    # ==================== 批次處理工具 ====================
    
    def batch_process(self, file_pattern, operation_func, output_dir='output'):
        """批次處理文件"""
        import glob
        
        files = glob.glob(file_pattern)
        if not files:
            print(f"❌ 找不到符合模式的文件: {file_pattern}")
            return
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        results = []
        for file in files:
            print(f"\n🔄 處理文件: {file}")
            try:
                result = operation_func(file)
                results.append(result)
                print(f"✅ 完成: {file}")
            except Exception as e:
                print(f"❌ 失敗: {file} - {e}")
        
        return results
    
    def generate_report(self, data_info, output_file='data_report.txt'):
        """生成數據處理報告"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"數據處理報告\n")
            f.write(f"=" * 40 + "\n")
            f.write(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for key, value in data_info.items():
                f.write(f"{key}: {value}\n")
        
        print(f"📄 報告已保存: {output_file}")

# ==================== 快速使用函數 ====================

def quick_merge(file1, file2, key1, key2, output='merged.xlsx'):
    """快速合併兩個文件"""
    processor = DataProcessor()
    return processor.merge_files(file1, file2, key1, key2, output_name=output)

def quick_import_to_mongo(excel_file, collection_name, clear_first=True):
    """快速匯入 Excel 到 MongoDB"""
    processor = DataProcessor()
    df = processor.read_file(excel_file)
    if df is not None:
        return processor.mongo_import(df, collection_name, clear_first)
    return False

def quick_export_from_mongo(collection_name, output_file):
    """快速從 MongoDB 匯出到 Excel"""
    processor = DataProcessor()
    return processor.mongo_export(collection_name, filename=output_file)

def quick_analyze(filename):
    """快速分析文件"""
    processor = DataProcessor()
    return processor.analyze_file(filename)

# ==================== 使用範例 ====================

if __name__ == "__main__":
    print("📊 資料處理萬用工具")
    print("=" * 30)
    
    # 使用範例
    processor = DataProcessor()
    
    # 1. 分析文件
    print("\n1. 文件分析範例:")
    # processor.analyze_file("your_file.xlsx")
    
    # 2. 合併文件範例
    print("\n2. 文件合併範例:")
    # result = processor.merge_files("file1.xlsx", "file2.xlsx", "key1", "key2", output_name="merged.xlsx")
    
    # 3. MongoDB 操作範例
    print("\n3. MongoDB 操作範例:")
    # processor.connect_mongo()
    # processor.mongo_stats("book_words")
    # processor.close_mongo()
    
    print("\n✅ 工具載入完成，可以開始使用各種功能！")

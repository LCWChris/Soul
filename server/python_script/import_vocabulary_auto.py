import pandas as pd
from pymongo import MongoClient
from datetime import datetime

def import_vocabulary_direct():
    """
    直接清空並匯入詞彙整合數據（自動確認）
    """
    
    print("📚 詞彙整合數據匯入工具 (自動模式)")
    print("=" * 40)
    
    # 讀取詞彙整合文件
    filename = "詞彙整合_含圖片連結.xlsx"
    
    try:
        print(f"🔄 讀取文件: {filename}")
        df = pd.read_excel(filename)
        print(f"✅ 文件讀取成功，共 {len(df)} 筆記錄")
    except Exception as e:
        print(f"❌ 文件讀取失敗: {e}")
        return
    
    # 顯示原始欄位
    print(f"\n📋 原始欄位: {list(df.columns)}")
    
    # 數據處理
    print(f"\n🔄 數據處理中...")
    
    # 重命名欄位以符合資料庫結構
    column_mapping = {}
    for col in df.columns:
        col_str = str(col).lower()
        if 'title' in col_str or '標題' in col_str or 'word' in col_str:
            column_mapping[col] = 'title'
        elif 'image' in col_str or '圖片' in col_str:
            column_mapping[col] = 'image_url'
        elif 'video' in col_str or '影片' in col_str:
            column_mapping[col] = 'video_url'
        elif 'level' in col_str or '級別' in col_str or '程度' in col_str:
            column_mapping[col] = 'level'
        elif 'unit' in col_str or 'lesson' in col_str or '單元' in col_str:
            column_mapping[col] = 'unit'
        elif 'page' in col_str or '頁' in col_str:
            column_mapping[col] = 'page'
        elif 'volume' in col_str or '冊' in col_str:
            column_mapping[col] = 'volume'
        elif 'theme' in col_str or '主題' in col_str:
            column_mapping[col] = 'theme'
    
    # 應用欄位映射
    df_processed = df.rename(columns=column_mapping)
    
    # 添加必要欄位
    if 'title' not in df_processed.columns:
        # 尋找最可能是標題的欄位
        for col in df_processed.columns:
            if df_processed[col].dtype == 'object':
                df_processed['title'] = df_processed[col]
                break
    
    # 設定預設值
    if 'category' not in df_processed.columns:
        df_processed['category'] = '綜合'
    
    if 'content' not in df_processed.columns:
        df_processed['content'] = df_processed.get('title', '')
    
    if 'video_url' not in df_processed.columns:
        df_processed['video_url'] = None
    
    # 添加管理欄位
    current_time = datetime.utcnow()
    df_processed['created_by'] = 'admin'
    df_processed['created_at'] = current_time
    df_processed['updated_at'] = current_time
    
    # 統計
    total_records = len(df_processed)
    has_image = df_processed.get('image_url', pd.Series()).notna().sum()
    
    print(f"📊 處理統計:")
    print(f"   總記錄數: {total_records}")
    print(f"   有圖片: {has_image}")
    print(f"   圖片完整率: {has_image/total_records*100:.1f}%")
    
    # 轉換為記錄格式
    records = df_processed.to_dict(orient="records")
    
    # 連接資料庫
    try:
        print(f"\n🔗 連接 MongoDB...")
        client = MongoClient("mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/?retryWrites=true&w=majority")
        db = client["tsl_app"]
        collection = db["book_words"]
        
        # 檢查現有數據
        existing_count = collection.count_documents({})
        print(f"📊 現有記錄數: {existing_count}")
        
        # 自動清空現有數據
        if existing_count > 0:
            print(f"🗑️  清空現有數據...")
            delete_result = collection.delete_many({})
            print(f"✅ 已刪除 {delete_result.deleted_count} 筆舊記錄")
        
        # 匯入新數據
        print(f"📥 匯入新數據...")
        insert_result = collection.insert_many(records)
        
        print(f"✅ 成功匯入 {len(insert_result.inserted_ids)} 筆記錄")
        
        # 驗證結果
        final_count = collection.count_documents({})
        print(f"📊 最終記錄數: {final_count}")
        
        # 顯示示例
        print(f"\n📖 數據示例:")
        samples = collection.find({}).limit(3)
        for i, record in enumerate(samples, 1):
            title = record.get('title', 'N/A')
            level = record.get('level', 'N/A')
            has_img = '✅' if record.get('image_url') else '❌'
            print(f"   {i}. {title} | 級別:{level} | 圖片:{has_img}")
        
    except Exception as e:
        print(f"❌ 資料庫操作失敗: {e}")
        return
    
    finally:
        if 'client' in locals():
            client.close()
    
    print(f"\n🎉 匯入完成！")

if __name__ == "__main__":
    import_vocabulary_direct()

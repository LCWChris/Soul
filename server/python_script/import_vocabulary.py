import pandas as pd
from pymongo import MongoClient
from datetime import datetime

def clear_and_import_vocabulary():
    """
    清空 book_words 資料庫並匯入詞彙整合_含圖片連結.xlsx 的內容
    """
    
    print("📚 詞彙整合數據匯入工具")
    print("=" * 35)
    
    # 檢查並讀取詞彙整合文件
    filename = "詞彙整合_含圖片連結.xlsx"
    
    try:
        print(f"🔄 讀取文件: {filename}")
        df = pd.read_excel(filename)
        print(f"✅ 文件讀取成功，共 {len(df)} 筆記錄")
    except FileNotFoundError:
        print(f"❌ 找不到文件: {filename}")
        return
    except Exception as e:
        print(f"❌ 文件讀取失敗: {e}")
        return
    
    # 顯示文件結構
    print(f"\n📋 原始數據欄位 ({len(df.columns)} 個):")
    for i, col in enumerate(df.columns.tolist(), 1):
        print(f"   {i:2d}. {col}")
    
    # 顯示前幾筆數據
    print(f"\n📖 前3筆數據預覽:")
    print(df.head(3))
    
    # 數據處理和標準化
    print(f"\n🔄 數據處理中...")
    
    # 檢查必要欄位並重命名
    column_mapping = {}
    
    # 尋找可能的欄位名稱並進行映射
    for col in df.columns:
        col_lower = str(col).lower()
        if any(keyword in col_lower for keyword in ['word', '單詞', '詞彙', 'title', '標題']):
            column_mapping[col] = 'title'
        elif any(keyword in col_lower for keyword in ['image', '圖片', 'img', 'picture']):
            column_mapping[col] = 'image_url'
        elif any(keyword in col_lower for keyword in ['video', '影片', '視頻']):
            column_mapping[col] = 'video_url'
        elif any(keyword in col_lower for keyword in ['level', '級別', '程度']):
            column_mapping[col] = 'level'
        elif any(keyword in col_lower for keyword in ['category', '分類', '類別']):
            column_mapping[col] = 'category'
        elif any(keyword in col_lower for keyword in ['unit', '單元', 'lesson', '課']):
            column_mapping[col] = 'unit'
        elif any(keyword in col_lower for keyword in ['page', '頁面', '頁數']):
            column_mapping[col] = 'page'
        elif any(keyword in col_lower for keyword in ['content', '內容', '描述', 'description']):
            column_mapping[col] = 'content'
    
    print(f"\n🔄 欄位映射:")
    for old_col, new_col in column_mapping.items():
        print(f"   {old_col} → {new_col}")
    
    # 重命名欄位
    df_processed = df.rename(columns=column_mapping)
    
    # 確保必要欄位存在
    required_fields = {
        'title': '標題',
        'image_url': None,
        'video_url': None,
        'level': '初級',
        'category': '綜合',
        'content': None
    }
    
    for field, default_value in required_fields.items():
        if field not in df_processed.columns:
            df_processed[field] = default_value
            print(f"   添加欄位: {field} (預設值: {default_value})")
    
    # 使用 title 作為 content 的預設值（如果 content 為空）
    if df_processed['content'].isna().all():
        df_processed['content'] = df_processed['title']
        print("   使用 title 作為 content 的預設值")
    
    # 添加管理欄位
    current_time = datetime.utcnow()
    df_processed['created_by'] = 'admin'
    df_processed['created_at'] = current_time
    df_processed['updated_at'] = current_time
    
    # 統計數據
    total_records = len(df_processed)
    has_image = df_processed['image_url'].notna().sum() if 'image_url' in df_processed.columns else 0
    has_video = df_processed['video_url'].notna().sum() if 'video_url' in df_processed.columns else 0
    
    print(f"\n📊 處理後數據統計:")
    print(f"   總記錄數: {total_records}")
    print(f"   有圖片: {has_image}")
    print(f"   有影片: {has_video}")
    print(f"   圖片完整率: {has_image/total_records*100:.1f}%")
    
    # 顯示最終欄位結構
    print(f"\n📋 最終數據欄位 ({len(df_processed.columns)} 個):")
    for i, col in enumerate(df_processed.columns.tolist(), 1):
        print(f"   {i:2d}. {col}")
    
    # 轉換為字典格式
    records = df_processed.to_dict(orient="records")
    
    # 連接 MongoDB 並執行操作
    try:
        print(f"\n🔗 連接 MongoDB...")
        client = MongoClient("mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/?retryWrites=true&w=majority")
        db = client["tsl_app"]
        collection = db["book_words"]
        
        # 檢查現有數據
        existing_count = collection.count_documents({})
        print(f"📊 資料庫現有記錄數: {existing_count}")
        
        if existing_count > 0:
            # 確認是否要刪除現有數據
            print(f"\n⚠️  即將刪除資料庫中的 {existing_count} 筆現有記錄")
            confirm = input("確定要繼續嗎？(輸入 'YES' 確認): ").strip()
            
            if confirm != 'YES':
                print("❌ 操作已取消")
                return
            
            # 刪除現有數據
            print("🗑️  刪除現有數據...")
            delete_result = collection.delete_many({})
            print(f"✅ 已刪除 {delete_result.deleted_count} 筆記錄")
        
        # 匯入新數據
        print(f"📥 匯入新數據...")
        insert_result = collection.insert_many(records)
        
        print(f"✅ 成功匯入 {len(insert_result.inserted_ids)} 筆記錄到 tsl_app.book_words")
        
        # 驗證匯入結果
        final_count = collection.count_documents({})
        print(f"📊 匯入後資料庫總記錄數: {final_count}")
        
        # 顯示一些示例記錄
        print(f"\n📖 匯入數據示例:")
        sample_records = collection.find({}).limit(5)
        for i, record in enumerate(sample_records, 1):
            title = record.get('title', 'N/A')
            has_img = '✅' if record.get('image_url') else '❌'
            has_vid = '✅' if record.get('video_url') else '❌'
            level = record.get('level', 'N/A')
            print(f"   {i}. {title} | 級別:{level} | 圖片:{has_img} | 影片:{has_vid}")
        
        # 統計各級別數據
        print(f"\n📊 各級別統計:")
        level_stats = collection.aggregate([
            {"$group": {"_id": "$level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ])
        
        for stat in level_stats:
            level = stat['_id'] or '未分類'
            count = stat['count']
            print(f"   {level}: {count} 筆")
        
    except Exception as e:
        print(f"❌ 資料庫操作失敗: {e}")
        return
    
    finally:
        if 'client' in locals():
            client.close()
    
    print(f"\n🎉 詞彙整合數據匯入完成！")
    
    # 生成處理報告
    report_filename = f"匯入報告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(f"詞彙整合數據匯入報告\n")
        f.write(f"=" * 30 + "\n")
        f.write(f"匯入時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"來源文件: {filename}\n")
        f.write(f"匯入記錄數: {total_records}\n")
        f.write(f"有圖片記錄數: {has_image}\n")
        f.write(f"有影片記錄數: {has_video}\n")
        f.write(f"圖片完整率: {has_image/total_records*100:.1f}%\n")
        f.write(f"目標資料庫: tsl_app.book_words\n")
        f.write(f"操作狀態: 成功\n")
    
    print(f"📄 處理報告已保存至: {report_filename}")

if __name__ == "__main__":
    clear_and_import_vocabulary()

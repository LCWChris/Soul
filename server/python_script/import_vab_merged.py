import pandas as pd
import os
from pymongo import MongoClient
from datetime import datetime
import sys

def connect_to_mongo():
    """
    連接到 MongoDB 資料庫
    """
    # 從環境變數讀取 MongoDB 連接字串
    mongo_url = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority"
    
    try:
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

def get_merge_strategy():
    """
    讓使用者選擇合併策略
    """
    print("\n🔄 請選擇合併策略:")
    print("1. 完全覆蓋 - 刪除所有現有資料，重新匯入")
    print("2. 智能合併 - 更新已存在的詞彙，新增不存在的詞彙")
    print("3. 只新增 - 僅新增資料庫中不存在的詞彙")
    print("4. 預覽模式 - 只顯示將要進行的操作，不實際執行")
    
    while True:
        try:
            choice = input("\n請輸入選項 (1-4): ").strip()
            if choice in ['1', '2', '3', '4']:
                return int(choice)
            else:
                print("❌ 請輸入有效選項 (1-4)")
        except KeyboardInterrupt:
            print("\n\n👋 操作已取消")
            sys.exit(0)

def prepare_vocabulary_data(df):
    """
    準備詞彙資料，標準化格式
    """
    processed_data = []
    current_time = datetime.utcnow().isoformat()
    
    for index, row in df.iterrows():
        # 建立標準化的文檔
        doc = {
            "volume": int(row['volume']) if pd.notna(row['volume']) else 1,
            "lesson": int(row['lesson']) if pd.notna(row['lesson']) else 1,
            "title": str(row['title']).strip() if pd.notna(row['title']) else "",
            "page": int(row['page']) if pd.notna(row['page']) else 1,
            "level": str(row['level']).strip() if pd.notna(row['level']) else "",
            "theme": str(row['theme']).strip() if pd.notna(row['theme']) else "",
            "image_url": str(row['image_url']).strip() if pd.notna(row['image_url']) and str(row['image_url']) != 'nan' else "",
            "video_url": str(row['video_url']).strip() if pd.notna(row['video_url']) and str(row['video_url']) != 'nan' else "",
            "created_by": str(row['created_by']).strip() if pd.notna(row['created_by']) else "import_script",
            "created_at": row['created_at'] if pd.notna(row['created_at']) else current_time,
            "updated_at": current_time
        }
        
        # 跳過空標題
        if not doc["title"]:
            continue
            
        processed_data.append(doc)
    
    return processed_data

def strategy_1_complete_override(collection, data):
    """
    策略1: 完全覆蓋
    """
    print(f"\n🔄 執行策略1: 完全覆蓋")
    
    # 刪除所有現有資料
    delete_result = collection.delete_many({})
    print(f"🗑️  已刪除 {delete_result.deleted_count} 筆現有資料")
    
    # 插入新資料
    if data:
        insert_result = collection.insert_many(data)
        print(f"✅ 已插入 {len(insert_result.inserted_ids)} 筆新資料")
        return len(insert_result.inserted_ids)
    
    return 0

def strategy_2_smart_merge(collection, data):
    """
    策略2: 智能合併
    """
    print(f"\n🔄 執行策略2: 智能合併")
    
    updated_count = 0
    inserted_count = 0
    
    for doc in data:
        # 查找是否已存在相同的詞彙
        existing = collection.find_one({
            "title": doc["title"],
            "volume": doc["volume"],
            "lesson": doc["lesson"]
        })
        
        if existing:
            # 更新現有資料
            result = collection.update_one(
                {"_id": existing["_id"]},
                {"$set": doc}
            )
            if result.modified_count > 0:
                updated_count += 1
                print(f"🔄 更新: {doc['title']} (第{doc['volume']}冊 第{doc['lesson']}課)")
        else:
            # 插入新資料
            collection.insert_one(doc)
            inserted_count += 1
            print(f"✅ 新增: {doc['title']} (第{doc['volume']}冊 第{doc['lesson']}課)")
    
    print(f"\n📊 合併結果:")
    print(f"   更新: {updated_count} 筆")
    print(f"   新增: {inserted_count} 筆")
    
    return updated_count + inserted_count

def strategy_3_insert_only(collection, data):
    """
    策略3: 只新增
    """
    print(f"\n🔄 執行策略3: 只新增不存在的詞彙")
    
    inserted_count = 0
    skipped_count = 0
    
    for doc in data:
        # 查找是否已存在相同的詞彙
        existing = collection.find_one({
            "title": doc["title"],
            "volume": doc["volume"],
            "lesson": doc["lesson"]
        })
        
        if not existing:
            # 插入新資料
            collection.insert_one(doc)
            inserted_count += 1
            print(f"✅ 新增: {doc['title']} (第{doc['volume']}冊 第{doc['lesson']}課)")
        else:
            skipped_count += 1
            print(f"⏭️  跳過: {doc['title']} (已存在)")
    
    print(f"\n📊 新增結果:")
    print(f"   新增: {inserted_count} 筆")
    print(f"   跳過: {skipped_count} 筆")
    
    return inserted_count

def strategy_4_preview_mode(collection, data):
    """
    策略4: 預覽模式
    """
    print(f"\n👀 預覽模式: 分析將要進行的操作")
    
    update_list = []
    insert_list = []
    
    for doc in data:
        # 查找是否已存在相同的詞彙
        existing = collection.find_one({
            "title": doc["title"],
            "volume": doc["volume"],
            "lesson": doc["lesson"]
        })
        
        if existing:
            update_list.append(doc)
        else:
            insert_list.append(doc)
    
    print(f"\n📊 預覽結果:")
    print(f"   將更新: {len(update_list)} 筆詞彙")
    print(f"   將新增: {len(insert_list)} 筆詞彙")
    
    if update_list:
        print(f"\n🔄 將更新的詞彙 (前10筆):")
        for i, doc in enumerate(update_list[:10]):
            print(f"   {i+1:2d}. {doc['title']} (第{doc['volume']}冊 第{doc['lesson']}課)")
        if len(update_list) > 10:
            print(f"   ... 還有 {len(update_list) - 10} 筆")
    
    if insert_list:
        print(f"\n✅ 將新增的詞彙 (前10筆):")
        for i, doc in enumerate(insert_list[:10]):
            print(f"   {i+1:2d}. {doc['title']} (第{doc['volume']}冊 第{doc['lesson']}課)")
        if len(insert_list) > 10:
            print(f"   ... 還有 {len(insert_list) - 10} 筆")
    
    return 0

def main():
    """
    主要執行函數
    """
    print("📚 vab_merged_with_links.xlsx 資料庫匯入工具")
    print("=" * 60)
    
    # 檢查檔案是否存在
    filename = "vab_merged_with_links.xlsx"
    if not os.path.exists(filename):
        print(f"❌ 找不到檔案: {filename}")
        print("請確保檔案位於當前目錄中")
        return
    
    # 讀取 Excel 檔案
    try:
        print(f"📂 讀取檔案: {filename}")
        df = pd.read_excel(filename)
        print(f"✅ 檔案讀取成功，共 {len(df)} 筆記錄")
    except Exception as e:
        print(f"❌ 檔案讀取失敗: {e}")
        return
    
    # 顯示檔案結構
    print(f"\n📋 檔案結構:")
    print(f"   欄位: {list(df.columns)}")
    print(f"   有圖片連結的詞彙: {df['image_url'].notna().sum()} 筆")
    print(f"   有影片連結的詞彙: {df['video_url'].notna().sum()} 筆")
    
    # 連接資料庫
    collection = connect_to_mongo()
    if collection is None:
        return
    
    # 檢查現有資料
    existing_count = collection.count_documents({})
    print(f"📊 資料庫現有詞彙: {existing_count} 筆")
    
    # 準備資料
    print(f"\n🔄 準備資料中...")
    processed_data = prepare_vocabulary_data(df)
    print(f"✅ 處理完成，有效資料: {len(processed_data)} 筆")
    
    # 選擇合併策略
    strategy = get_merge_strategy()
    
    # 執行對應策略
    if strategy == 1:
        processed_count = strategy_1_complete_override(collection, processed_data)
    elif strategy == 2:
        processed_count = strategy_2_smart_merge(collection, processed_data)
    elif strategy == 3:
        processed_count = strategy_3_insert_only(collection, processed_data)
    elif strategy == 4:
        processed_count = strategy_4_preview_mode(collection, processed_data)
    
    # 顯示最終結果
    if strategy != 4:
        final_count = collection.count_documents({})
        print(f"\n🎉 匯入完成!")
        print(f"   處理詞彙: {processed_count} 筆")
        print(f"   資料庫總計: {final_count} 筆詞彙")
    else:
        print(f"\n👀 預覽完成，未實際執行任何操作")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程式已中止")
    except Exception as e:
        print(f"\n❌ 執行出錯: {e}")
        import traceback
        traceback.print_exc()

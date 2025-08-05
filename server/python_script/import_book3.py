import pandas as pd
from datetime import datetime

def export_book3_to_xlsx():
    """
    將合併後的 Book 3 數據處理並輸出為 xlsx 檔案
    """
    print("📊 Book 3 數據輸出 Excel 工具")
    print("=" * 35)
    
    # 讀取合併後的文件
    try:
        df = pd.read_excel("Book_3_Vocabulary_List_merged.xlsx")
        print(f"✅ 讀取合併文件成功，共 {len(df)} 筆記錄")
    except FileNotFoundError:
        print("❌ 找不到 Book_3_Vocabulary_List_merged.xlsx")
        print("   請先執行 merge.py 來生成合併文件")
        return
    
    # 顯示原始數據結構
    print(f"\n📋 原始數據欄位:")
    for i, col in enumerate(df.columns.tolist(), 1):
        print(f"   {i:2d}. {col}")
    
    # 統計數據
    has_link = df['url'].notna().sum()
    no_link = len(df) - has_link
    
    print(f"\n📊 數據統計:")
    print(f"   總記錄數: {len(df)}")
    print(f"   有圖片連結: {has_link}")
    print(f"   無圖片連結: {no_link}")
    print(f"   完整率: {has_link/len(df)*100:.1f}%")
    
    # 數據處理
    print("\n🔄 數據處理中...")
    
    # 添加標識欄位
    df['book'] = 3
    df['book_name'] = 'Book 3'
    df['level'] = '高級'
    df['category'] = '綜合'
    
    # 重命名欄位以符合標準結構
    df = df.rename(columns={
        'word': 'title',
        'url': 'image_url',
        'public_id': 'cloudinary_id'
    })
    
    # 添加標準欄位
    df['video_url'] = None  # Book 3 沒有影片
    df['content'] = df['title']  # 使用標題作為內容
    
    # 添加狀態欄位
    df['has_image'] = df['image_url'].notna()
    df['has_video'] = False
    df['status'] = df.apply(lambda row: '完整' if row['has_image'] else '缺圖片', axis=1)
    
    # 添加時間戳
    current_time = datetime.now()
    df['created_by'] = 'admin'
    df['created_at'] = current_time
    df['updated_at'] = current_time
    df['processed_date'] = current_time.strftime('%Y-%m-%d')
    
    # 重新排列欄位順序
    column_order = [
        'book', 'book_name', 'unit', 'page', 'title', 'content', 
        'level', 'category', 'image_url', 'video_url', 'cloudinary_id',
        'has_image', 'has_video', 'status',
        'created_by', 'created_at', 'updated_at', 'processed_date'
    ]
    
    # 只保留存在的欄位
    available_columns = [col for col in column_order if col in df.columns]
    df_final = df[available_columns]
    
    # 生成輸出檔案名稱
    timestamp = current_time.strftime('%Y%m%d_%H%M%S')
    output_filename = f"Book_3_Processed_{timestamp}.xlsx"
    
    # 保存到 Excel（包含多個工作表）
    print("💾 保存到 Excel 檔案...")
    
    with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
        # 主要數據表
        df_final.to_excel(writer, sheet_name='Book_3_Data', index=False)
        
        # 統計摘要表
        summary_data = {
            '項目': [
                '總記錄數', 
                '有圖片', 
                '無圖片', 
                '完整記錄率', 
                '處理日期',
                '檔案來源'
            ],
            '數值': [
                len(df_final),
                has_link,
                no_link,
                f"{has_link/len(df_final)*100:.1f}%",
                current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'Book_3_Vocabulary_List_merged.xlsx'
            ]
        }
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='統計摘要', index=False)
        
        # 缺失圖片的記錄
        missing_images = df_final[df_final['has_image'] == False][['unit', 'page', 'title']]
        if not missing_images.empty:
            missing_images.to_excel(writer, sheet_name='缺失圖片', index=False)
        
        # 完整記錄（有圖片的）
        complete_records = df_final[df_final['has_image'] == True][['unit', 'page', 'title', 'image_url']]
        if not complete_records.empty:
            complete_records.to_excel(writer, sheet_name='完整記錄', index=False)
    
    print(f"✅ 處理完成！檔案已保存至: {output_filename}")
    
    # 顯示結果統計
    sheet_count = 2 + (1 if not missing_images.empty else 0) + (1 if not complete_records.empty else 0)
    
    print(f"\n📊 輸出結果:")
    print(f"   檔案名稱: {output_filename}")
    print(f"   工作表數量: {sheet_count} 個")
    print(f"   - Book_3_Data: 主要數據 ({len(df_final)} 筆)")
    print(f"   - 統計摘要: 處理統計")
    if not missing_images.empty:
        print(f"   - 缺失圖片: 需要補充的記錄 ({len(missing_images)} 筆)")
    if not complete_records.empty:
        print(f"   - 完整記錄: 有圖片的記錄 ({len(complete_records)} 筆)")
    
    # 顯示最終欄位
    print(f"\n📋 最終數據欄位 ({len(df_final.columns)} 個):")
    for i, col in enumerate(df_final.columns.tolist(), 1):
        print(f"   {i:2d}. {col}")
    
    # 顯示缺失圖片的單詞
    if not missing_images.empty:
        print(f"\n⚠️  缺失圖片的單詞:")
        for i, word in enumerate(missing_images['title'].values, 1):
            print(f"   {i:2d}. {word}")
    
    print(f"\n🎉 Book 3 數據已成功輸出至 Excel 檔案！")
    return output_filename

if __name__ == "__main__":
    export_book3_to_xlsx()

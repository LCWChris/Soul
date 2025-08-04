import pandas as pd
from datetime import datetime

def merge_excel_files(file1_name, file2_name, match_col1, match_col2, output_name=None):
    """
    合併兩個 Excel 文件的萬用函數
    
    Args:
        file1_name: 第一個文件名
        file2_name: 第二個文件名  
        match_col1: 第一個文件的匹配欄位
        match_col2: 第二個文件的匹配欄位
        output_name: 輸出文件名(可選)
    """
    
    try:
        # 讀取文件
        df1 = pd.read_excel(file1_name)
        df2 = pd.read_excel(file2_name)
        
        print(f"✅ {file1_name}: {len(df1)} 筆記錄")
        print(f"✅ {file2_name}: {len(df2)} 筆記錄")
        
        # 執行合併
        merged_df = pd.merge(df1, df2, left_on=match_col1, right_on=match_col2, how='left')
        
        # 統計結果
        total = len(merged_df)
        matched = merged_df[match_col2].notna().sum()
        
        print(f"📊 合併結果: {matched}/{total} ({matched/total*100:.1f}%)")
        
        # 添加時間戳
        merged_df['created_at'] = datetime.utcnow()
        merged_df['updated_at'] = datetime.utcnow()
        
        # 保存文件
        if not output_name:
            output_name = f"merged_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        merged_df.to_excel(output_name, index=False)
        print(f"💾 已保存至: {output_name}")
        
        return merged_df
        
    except Exception as e:
        print(f"❌ 合併失敗: {e}")
        return None

if __name__ == "__main__":
    # 使用範例
    result = merge_excel_files(
        "Book_3_Vocabulary_List.xlsx", 
        "cloudinary_link.xlsx",
        "word", 
        "public_id",
        "Book_3_merged.xlsx"
    )

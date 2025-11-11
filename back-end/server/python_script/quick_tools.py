"""
常用資料處理操作 - 快捷腳本
提供最常用的數據處理功能
"""

from data_utils import DataProcessor, quick_merge, quick_import_to_mongo, quick_analyze
import sys

def main_menu():
    """主選單"""
    print("📊 資料處理快捷工具")
    print("=" * 25)
    print("1. 分析 Excel 文件")
    print("2. 合併兩個 Excel 文件") 
    print("3. 匯入 Excel 到 MongoDB")
    print("4. 從 MongoDB 匯出數據")
    print("5. 清理數據")
    print("6. 批次處理文件")
    print("0. 退出")
    print("-" * 25)

def analyze_excel():
    """分析 Excel 文件"""
    filename = input("請輸入文件名: ").strip()
    quick_analyze(filename)

def merge_excel():
    """合併 Excel 文件"""
    file1 = input("第一個文件名: ").strip()
    file2 = input("第二個文件名: ").strip()
    key1 = input("第一個文件的匹配欄位: ").strip()
    key2 = input("第二個文件的匹配欄位: ").strip()
    output = input("輸出文件名 (預設: merged.xlsx): ").strip() or "merged.xlsx"
    
    quick_merge(file1, file2, key1, key2, output)

def import_to_mongo():
    """匯入到 MongoDB"""
    filename = input("Excel 文件名: ").strip()
    collection = input("集合名稱 (預設: book_words): ").strip() or "book_words"
    clear = input("是否清空現有數據? (y/N): ").strip().lower() == 'y'
    
    quick_import_to_mongo(filename, collection, clear)

def export_from_mongo():
    """從 MongoDB 匯出"""
    processor = DataProcessor()
    collection = input("集合名稱: ").strip()
    output = input("輸出文件名: ").strip()
    
    processor.mongo_export(collection, filename=output)

def clean_data():
    """清理數據"""
    processor = DataProcessor()
    filename = input("文件名: ").strip()
    output = input("輸出文件名 (預設: cleaned_data.xlsx): ").strip() or "cleaned_data.xlsx"
    
    df = processor.read_file(filename)
    if df is not None:
        df_clean = processor.clean_data(df)
        df_standard = processor.standardize_columns(df_clean)
        processor.save_file(df_standard, output)

def batch_process():
    """批次處理"""
    processor = DataProcessor()
    pattern = input("文件模式 (如: *.xlsx): ").strip()
    
    def process_func(filename):
        df = processor.read_file(filename)
        if df is not None:
            df_clean = processor.clean_data(df)
            output_name = f"processed_{filename}"
            processor.save_file(df_clean, output_name)
            return output_name
        return None
    
    processor.batch_process(pattern, process_func)

def run_interactive():
    """互動式操作"""
    while True:
        try:
            main_menu()
            choice = input("請選擇操作 (0-6): ").strip()
            
            if choice == '0':
                print("👋 再見！")
                break
            elif choice == '1':
                analyze_excel()
            elif choice == '2':
                merge_excel()
            elif choice == '3':
                import_to_mongo()
            elif choice == '4':
                export_from_mongo()
            elif choice == '5':
                clean_data()
            elif choice == '6':
                batch_process()
            else:
                print("❌ 無效選項，請重新選擇")
            
            input("\n按 Enter 繼續...")
            print("\n" + "="*50 + "\n")
            
        except KeyboardInterrupt:
            print("\n👋 程序已中斷")
            break
        except Exception as e:
            print(f"❌ 發生錯誤: {e}")
            input("按 Enter 繼續...")

# 常用預設操作
def quick_vocabulary_import():
    """快速匯入詞彙數據"""
    print("🚀 快速詞彙匯入")
    return quick_import_to_mongo("詞彙整合_含圖片連結.xlsx", "book_words", True)

def quick_book3_merge():
    """快速合併 Book 3 數據"""
    print("🚀 快速 Book 3 合併")
    return quick_merge("Book_3_Vocabulary_List.xlsx", "cloudinary_link.xlsx", 
                      "word", "public_id", "Book_3_merged.xlsx")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 命令行模式
        command = sys.argv[1].lower()
        
        if command == "vocab":
            quick_vocabulary_import()
        elif command == "book3":
            quick_book3_merge()
        elif command == "analyze" and len(sys.argv) > 2:
            quick_analyze(sys.argv[2])
        else:
            print("可用命令:")
            print("  python quick_tools.py vocab    # 快速匯入詞彙")
            print("  python quick_tools.py book3    # 快速合併 Book 3")
            print("  python quick_tools.py analyze file.xlsx  # 分析文件")
    else:
        # 互動模式
        run_interactive()

import cloudinary
import cloudinary.api
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 配置 Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'dchrdlxgf'),  # 預設為您的 cloud name
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def get_all_images():
    """
    獲取 Cloudinary 中所有圖片的資訊
    """
    try:
        print("🔍 開始抓取 Cloudinary 圖片資訊...")
        
        all_images = []
        next_cursor = None
        page = 1
        
        while True:
            print(f"📄 正在抓取第 {page} 頁...")
            
            # 呼叫 Cloudinary API
            if next_cursor:
                result = cloudinary.api.resources(
                    resource_type="image",
                    type="upload",
                    max_results=100,  # 每次最多100張
                    next_cursor=next_cursor
                )
            else:
                result = cloudinary.api.resources(
                    resource_type="image",
                    type="upload",
                    max_results=100
                )
            
            # 處理每張圖片
            for resource in result['resources']:
                image_info = {
                    'public_id': resource['public_id'],
                    'filename': resource['public_id'].split('/')[-1],  # 檔案名稱
                    'url': resource['secure_url'],  # 安全連結
                    'format': resource.get('format', ''),
                    'width': resource.get('width', 0),
                    'height': resource.get('height', 0),
                    'bytes': resource.get('bytes', 0),
                    'created_at': resource.get('created_at', ''),
                    'folder': '/'.join(resource['public_id'].split('/')[:-1]) if '/' in resource['public_id'] else ''
                }
                all_images.append(image_info)
            
            print(f"✅ 第 {page} 頁完成，累計 {len(all_images)} 張圖片")
            
            # 檢查是否還有下一頁
            if 'next_cursor' in result:
                next_cursor = result['next_cursor']
                page += 1
            else:
                break
        
        print(f"🎉 完成！總共找到 {len(all_images)} 張圖片")
        return all_images
        
    except Exception as e:
        print(f"❌ 錯誤: {str(e)}")
        return []

def save_to_excel(images_data, filename="cloudinary_images.xlsx"):
    """
    將圖片資訊儲存到 Excel 檔案
    """
    try:
        df = pd.DataFrame(images_data)
        
        # 確保輸出目錄存在
        output_dir = "cloudinary_export"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        output_path = os.path.join(output_dir, filename)
        
        # 儲存到 Excel
        df.to_excel(output_path, index=False)
        print(f"💾 檔案已儲存到: {output_path}")
        
        # 顯示統計資訊
        print("\n📊 統計資訊:")
        print(f"   總圖片數: {len(df)}")
        if len(df) > 0:
            print(f"   檔案格式: {df['format'].value_counts().to_dict()}")
            print(f"   資料夾分佈: {df['folder'].value_counts().head(10).to_dict()}")
        
        return output_path
        
    except Exception as e:
        print(f"❌ 儲存檔案時發生錯誤: {str(e)}")
        return None

def save_to_json(images_data, filename="cloudinary_images.json"):
    """
    將圖片資訊儲存到 JSON 檔案
    """
    try:
        import json
        
        output_dir = "cloudinary_export"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        output_path = os.path.join(output_dir, filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(images_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 JSON 檔案已儲存到: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ 儲存 JSON 檔案時發生錯誤: {str(e)}")
        return None

def filter_vocabulary_images(images_data):
    """
    篩選出詞彙相關的圖片
    """
    vocabulary_images = []
    
    for img in images_data:
        # 根據資料夾或檔案名稱篩選詞彙圖片
        if any(keyword in img['public_id'].lower() for keyword in ['vocabulary', 'word', 'vocab', 'learning']):
            vocabulary_images.append(img)
    
    print(f"🎯 找到 {len(vocabulary_images)} 張詞彙相關圖片")
    return vocabulary_images

def generate_download_script(images_data):
    """
    生成圖片下載腳本
    """
    try:
        script_content = """#!/usr/bin/env python3
# -*- coding: utf-8 -*-
\"\"\"
Cloudinary 圖片下載腳本
自動下載所有圖片到本地
\"\"\"

import requests
import os
from urllib.parse import urlparse

def download_image(url, filename, folder="downloads"):
    \"\"\"下載圖片\"\"\"
    try:
        if not os.path.exists(folder):
            os.makedirs(folder)
        
        response = requests.get(url)
        if response.status_code == 200:
            filepath = os.path.join(folder, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"✅ 已下載: {filename}")
            return True
        else:
            print(f"❌ 下載失敗: {filename}")
            return False
    except Exception as e:
        print(f"❌ 錯誤: {filename} - {str(e)}")
        return False

# 圖片清單
images = [
"""
        
        for img in images_data:
            script_content += f'    {{"url": "{img["url"]}", "filename": "{img["filename"]}.{img["format"]}"}},\n'
        
        script_content += """]

if __name__ == "__main__":
    print("🚀 開始下載圖片...")
    success_count = 0
    
    for img in images:
        if download_image(img["url"], img["filename"]):
            success_count += 1
    
    print(f"🎉 完成！成功下載 {success_count}/{len(images)} 張圖片")
"""
        
        output_dir = "cloudinary_export"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        script_path = os.path.join(output_dir, "download_images.py")
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        print(f"📜 下載腳本已生成: {script_path}")
        return script_path
        
    except Exception as e:
        print(f"❌ 生成下載腳本時發生錯誤: {str(e)}")
        return None

def main():
    """
    主程式
    """
    print("=" * 60)
    print("🖼️  Cloudinary 圖片資訊抓取工具")
    print("=" * 60)
    
    # 檢查 Cloudinary 配置
    if not cloudinary.config().cloud_name:
        print("❌ 請設定 Cloudinary 配置")
        print("   可以在 .env 檔案中設定:")
        print("   CLOUDINARY_CLOUD_NAME=your_cloud_name")
        print("   CLOUDINARY_API_KEY=your_api_key")
        print("   CLOUDINARY_API_SECRET=your_api_secret")
        return
    
    print(f"☁️  Cloud Name: {cloudinary.config().cloud_name}")
    
    # 抓取所有圖片
    all_images = get_all_images()
    
    if not all_images:
        print("❌ 沒有找到任何圖片")
        return
    
    # 儲存完整清單
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_file = f"cloudinary_all_images_{timestamp}.xlsx"
    json_file = f"cloudinary_all_images_{timestamp}.json"
    
    save_to_excel(all_images, excel_file)
    save_to_json(all_images, json_file)
    
    # 篩選詞彙圖片
    vocab_images = filter_vocabulary_images(all_images)
    if vocab_images:
        vocab_excel = f"cloudinary_vocabulary_images_{timestamp}.xlsx"
        save_to_excel(vocab_images, vocab_excel)
    
    # 生成下載腳本
    generate_download_script(all_images)
    
    print("\n🎯 處理完成！")
    print("📁 檔案輸出在 cloudinary_export/ 目錄中")

if __name__ == "__main__":
    main()

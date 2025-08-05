import cloudinary
import cloudinary.api
import pandas as pd
import re

cloudinary.config(
    cloud_name='dbmrnpwxd',
    api_key='861285683337524',
    api_secret='gIQ_tgM4L33AeLXq_gNNFfB0Q3A',
    secure=True
)

# 列出根目錄
root_folders = cloudinary.api.root_folders()
print("📁 根目錄資料夾:")
for folder in root_folders['folders']:
    print("-", folder['name'])

# 列出某個資料夾底下的子資料夾
target_folder = "vol_image"  # 👈 你可以改成其他資料夾名稱
subfolders = cloudinary.api.subfolders(target_folder)
print(f"\n📁 {target_folder} 的子資料夾:")
for folder in subfolders['folders']:
    print("-", folder['name'])


resources = []
next_cursor = None

while True:
    result = cloudinary.api.resources(
        type="upload",
        resource_type="image",
        max_results=100,
        next_cursor=next_cursor
    )
    resources.extend(result['resources'])
    next_cursor = result.get("next_cursor")
    if not next_cursor:
        break

# 只保留 public_id 的中文部分（去掉路徑和 "_" 後的內容）
def extract_chinese(text):
    filename = text.split('/')[-1]
    filename = filename.split('_')[0]
    chinese = ''.join(re.findall(r'[\u4e00-\u9fff]+', filename))
    return chinese

data = [{
    "public_id": extract_chinese(r["public_id"]),
    "url": r["secure_url"]
} for r in resources]

df = pd.DataFrame(data)
df.to_excel("cloudinary_第一冊.xlsx", index=False)
print("✅ 已輸出 cloudinary_第一冊.xlsx")

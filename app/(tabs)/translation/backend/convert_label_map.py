import json

with open("label_map.json", "r") as f:
    original = json.load(f)

index_to_label = {str(v["index"]): k for k, v in original.items()}

with open("label_id_map.json", "w") as f:
    json.dump(index_to_label, f, ensure_ascii=False, indent=2)

print("✅ 已成功轉換 label_map.json → label_id_map.json")
#此程式檔只是拿來轉換原本的label_map，與後端API無關
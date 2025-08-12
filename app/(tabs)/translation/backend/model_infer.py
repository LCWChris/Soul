import os
import sys
import torch
import json

# 加入目前路徑讓 Python 能找到 feature_loader
sys.path.append(os.path.dirname(__file__))

from feature_loader import extract_frames  # ✅ 特徵擷取
from model_def import get_model           # ✅ 模型結構定義

# 載入 label_map 並建立 index 對 label 的映射
with open("label_map.json", "r") as f:
    label_map_raw = json.load(f)

# 建立 index -> label 的映射字典
index_to_label = {
    v["index"]: k for k, v in label_map_raw.items()
}

# 載入模型
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = get_model(num_classes=len(index_to_label))
model.load_state_dict(torch.load("wlasl_resnet_lstm_best.pth", map_location=device))
model = model.to(device)
model.eval()

# 主推論函數
def predict(video_path: str) -> str:
    try:
        frames_tensor = extract_frames(video_path)
        if frames_tensor.shape[0] == 0:
            return "影格不足，無法預測"
        
        frames_tensor = frames_tensor.unsqueeze(0).to(device)  # shape: (1, T, C, H, W)

        with torch.no_grad():
            outputs = model(frames_tensor)  # shape: (1, num_classes)
            probabilities = torch.softmax(outputs, dim=1)[0]

            # 取前三名索引與機率
            top3_probs, top3_indices = torch.topk(probabilities, k=3)
            top3_results = [
                {
                    "label": index_to_label.get(idx.item(), "未知手語"),
                    "confidence": round(prob.item(), 4)
                }
                for idx, prob in zip(top3_indices, top3_probs)
            ]

            return top3_results

    except Exception as e:
        return f"❌ 推論失敗：{e}"


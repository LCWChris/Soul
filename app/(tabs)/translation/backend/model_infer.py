import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras

# 確保能找到 feature_loader.py
sys.path.append(os.path.dirname(__file__))

# 💥 關鍵修正：將 'extract_features_for_inference' 改為 'extract_feature_sequence'
from feature_loader import extract_feature_sequence, MAX_SEQ_LENGTH 

# ----------------------------------------------------
# 1. 標籤映射
# ----------------------------------------------------
FINAL_CLASS_NAMES = [
    '一起', '他', '你', '你們', '你好', 
    '同學', '大家好', '老師', '讀書', '起床'
]
NUM_CLASSES = len(FINAL_CLASS_NAMES)


# ----------------------------------------------------
# 2. 載入模型 (Keras)
# ----------------------------------------------------
MODEL_PATH = "final_best_model.h5" 

try:
    # 載入 Keras 模型
    model = keras.models.load_model(MODEL_PATH)
    print(f"✅ Keras 模型 {MODEL_PATH} 載入成功。")
except Exception as e:
    print(f"❌ 錯誤：無法載入 Keras 模型 {MODEL_PATH}。請確保檔案存在。")
    print(f"錯誤訊息: {e}")
    class DummyModel:
        def predict(self, x, verbose=0): return np.zeros((1, NUM_CLASSES))
    model = DummyModel()


# ----------------------------------------------------
# 3. 主推論函數
# ----------------------------------------------------

def predict(video_path: str) -> list:
    """
    對影片路徑進行預測，返回 Top-3 結果列表。
    """
    try:
        # 1. 提取特徵序列 (呼叫正確的函數)
        features = extract_feature_sequence(video_path)
        
        if features is None or features.shape[0] == 0:
            return [{"label": "影格不足或手部未偵測", "confidence": 0.0}]
        
        # 2. 準備輸入 (shape: (1, 40, 594))
        input_tensor = np.expand_dims(features, axis=0) 

        # 3. 預測
        outputs = model.predict(input_tensor, verbose=0)[0]
        
        # 4. Top-3
        probabilities = outputs
        top3_indices = np.argsort(probabilities)[::-1][:3]
        
        top3_results = [
            {
                "label": FINAL_CLASS_NAMES[idx],
                "confidence": round(probabilities[idx].item(), 4)
            }
            for idx in top3_indices
        ]

        return top3_results

    except Exception as e:
        print(f"❌ 嚴重推論錯誤: {e}")
        return [{"label": f"❌ 伺服器推論失敗: {str(e)}", "confidence": 0.0, "error": str(e)}]
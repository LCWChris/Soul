# //Soul/app/(tabs)/translation/backend/model_infer.py
# (v9 - 匹配 '..._f.h5' 權重檔)

import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.sequence import pad_sequences # 💥 確保導入
import warnings

# 確保能找到 feature_loader.py
sys.path.append(os.path.dirname(__file__))

# 💥 (v9) 導入 v9 的提取器和常數
from feature_loader import (
    extract_feature_sequence, 
    MAX_SEQ_LENGTH, 
    CLASS_NAMES, # 💥 [FIX] 修正：名稱應為 CLASS_NAMES (原為 FINAL_CLASS_NAMES)
    int_to_label
)

# ----------------------------------------------------
# 2. 載入模型 (💥 TCN v9-f 模型)
# ----------------------------------------------------
# 💥 [v9 修正] 確保載入您「效果很好」的權重檔
MODEL_PATH = os.path.join(os.path.dirname(__file__), "final_best_TCN_v9_model_f.h5") 
model = None

def load_v9_model():
    """在 FastAPI 啟動時調用"""
    global model
    print(f"正在從 {MODEL_PATH} 載入模型...")
    if not os.path.exists(MODEL_PATH):
        print(f"❌ 嚴重錯誤：找不到模型檔案 {MODEL_PATH}")
        return False
        
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore") # 忽略 Keras 載入警告
            model = keras.models.load_model(MODEL_PATH)
        print("✅ Keras (v9) 模型載入成功。")
        return True
    except Exception as e:
        print(f"❌ 嚴重錯誤：無法載入模型 {MODEL_PATH}。")
        print(f"錯誤訊息: {e}")
        return False


# ----------------------------------------------------
# 3. 主推論函數 (💥 v9 匹配版)
# ----------------------------------------------------

def predict(video_path: str) -> list:
    """
    (v9 匹配版) 對影片路徑進行預測，返回 Top-3 結果列表。
    """
    global model
    if model is None:
        return [{"label": "模型尚未載入", "confidence": 0.0}]

    try:
        # 1. 提取特徵序列 (返回原始序列)
        features = extract_feature_sequence(video_path)
        
        if features is None or features.shape[0] == 0:
            return [{"label": "影格不足或手部未偵測", "confidence": 0.0}]
        
        # 2. 💥 [v9 修正] 在此處執行 Padding (匹配 v9 腳本)
        padded_features = pad_sequences([features], maxlen=MAX_SEQ_LENGTH, padding='post', dtype='float32')
        
        # 3. 預測
        outputs = model.predict(padded_features, verbose=0)[0]
        
        # 4. Top-3
        probabilities = outputs
        top3_indices = np.argsort(probabilities)[::-1][:3]
        
        top3_results = [
            {
                # 💥 [FIX] 修正：使用 CLASS_NAMES (原為 FINAL_CLASS_NAMES)
                "label": CLASS_NAMES[idx],
                "confidence": round(probabilities[idx].item(), 4)
            }
            for idx in top3_indices
        ]

        return top3_results

    except Exception as e:
        print(f"❌ 嚴重推論錯誤: {e}")
        return [{"label": f"❌ 伺服器推論失敗: {str(e)}", "confidence": 0.0, "error": str(e)}]
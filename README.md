# Soul - Model Branch

此專案為 Soul 專案的 `model` 分支，包含模型訓練與推論相關程式碼及訓練好的模型權重。

## 專案結構
tsl/
└── wlasl_resnet_lstm_best.pth # 訓練好的模型權重
    Feature_Extraction.py # 特徵擷取程式
    resnet_model.py # ResNet 模型定義

## 環境需求

- Python 3.8+
- PyTorch 1.8+
- 其他依賴套件請參考 `requirements.txt`

## 使用說明

1. 安裝相依套件：

```bash
pip install -r requirements.txt
```
2. 執行特徵擷取：

```bash
python Feature_Extraction.py
```
3. 載入並使用訓練好的模型：
```python
import torch

model = torch.load('wlasl_resnet_lstm_best.pth')
model.eval()
```

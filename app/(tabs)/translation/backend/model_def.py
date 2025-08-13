import torch
import torch.nn as nn
import torchvision.models as models

class FeatureResNetLSTM(nn.Module):
    def __init__(self, num_classes=100):
        super(FeatureResNetLSTM, self).__init__()

        resnet = models.resnet18(weights=None)  # 與 pretrained=False 等效
        layers = list(resnet.children())[:-2]  # 去掉 avgpool 和 fc
        self.feature_extractor = nn.Sequential(*layers)

        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))  # 平均池化為 (B, 512, 1, 1)
        self.lstm = nn.LSTM(input_size=512, hidden_size=256, batch_first=True)
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):  # x: (B, T, C, H, W)
        B, T, C, H, W = x.size()
        x = x.view(B * T, C, H, W)
        x = self.feature_extractor(x)           # (B*T, 512, H', W')
        x = self.avgpool(x)                     # (B*T, 512, 1, 1)
        x = x.view(B, T, 512)                   # (B, T, 512)

        out, _ = self.lstm(x)                   # (B, T, 256)
        out = out[:, -1, :]                     # (B, 256)
        return self.fc(out)                     # (B, num_classes)

def get_model(num_classes=100):
    return FeatureResNetLSTM(num_classes=num_classes)

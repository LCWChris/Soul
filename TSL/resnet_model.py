import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
from torchvision import models, transforms


class WLASLFeatureSequenceDataset(Dataset):
    def __init__(self, root_dir, label_map, max_frames=16, image_size=(224, 224)):
        self.samples = []
        self.max_frames = max_frames
        self.image_size = image_size
        self.label_map = label_map

        for label_name in os.listdir(root_dir):
            label_dir = os.path.join(root_dir, label_name)
            if not os.path.isdir(label_dir) or label_name not in label_map:
                continue
            label_idx = label_map[label_name]
            for video_folder in os.listdir(label_dir):
                video_dir = os.path.join(label_dir, video_folder)
                if os.path.isdir(video_dir):
                    self.samples.append((video_dir, label_idx))

        print(f"Dataset samples: {len(self.samples)}")

        # 加入 ImageNet 正規化
        self.transform = transforms.Compose([
            transforms.Resize(self.image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
        ])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        video_dir, label = self.samples[idx]
        frame_files = sorted(os.listdir(video_dir))
        frames = []
        valid_frame_count = 0

        for frame_file in frame_files[:self.max_frames]:
            frame_path = os.path.join(video_dir, frame_file)
            try:
                image = Image.open(frame_path).convert('RGB')
                frame = self.transform(image)
                if frame.shape != (3, *self.image_size):
                    continue
                frames.append(frame)
                valid_frame_count += 1
            except Exception:
                continue

        # 即使有效影格很少，也回傳，但會有標記
        while len(frames) < self.max_frames:
            frames.append(torch.zeros((3, *self.image_size)))

        sequence = torch.stack(frames[:self.max_frames], dim=0)  # (T, C, H, W)
        valid_ratio = valid_frame_count / self.max_frames
        return sequence, torch.tensor(label), valid_ratio

    def collate_fn(self, batch):
        sequences, labels, valid_ratios = zip(*batch)
        sequences = torch.stack(sequences)
        labels = torch.tensor(labels)
        valid_ratios = torch.tensor(valid_ratios)
        return sequences, labels, valid_ratios


class ResNetLSTM(nn.Module):
    def __init__(self, hidden_dim, num_classes):
        super().__init__()
        resnet = models.resnet18(pretrained=True)
        self.feature_extractor = nn.Sequential(*list(resnet.children())[:-1])
        for param in self.feature_extractor.parameters():
            param.requires_grad = False  # 凍結特徵抽取層

        self.lstm = nn.LSTM(512, hidden_dim, batch_first=True)
        self.dropout = nn.Dropout(p=0.5)
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        B, T, C, H, W = x.shape
        x = x.view(B * T, C, H, W)
        with torch.no_grad():
            features = self.feature_extractor(x).view(B, T, -1)
        lstm_out, _ = self.lstm(features)
        out = self.dropout(lstm_out[:, -1, :])
        return self.fc(out)


def evaluate(model, val_loader, device):
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for sequences, labels, valid_ratios in val_loader:
            sequences, labels = sequences.to(device), labels.to(device)
            outputs = model(sequences)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
    acc = correct / total if total > 0 else 0
    print(f"Validation Accuracy: {acc:.4f}")
    return acc


def train_model(train_loader, val_loader, num_classes, device, epochs=10):
    model = ResNetLSTM(hidden_dim=256, num_classes=num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    criterion = nn.CrossEntropyLoss()

    best_val_acc = 0
    best_model_state = None

    for epoch in range(epochs):
        model.train()
        total_loss, correct, total = 0, 0, 0
        total_valid_ratio = 0

        for batch_idx, (sequences, labels, valid_ratios) in enumerate(train_loader):
            sequences, labels = sequences.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(sequences)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            total_valid_ratio += valid_ratios.sum().item()

            if batch_idx % 10 == 0:
                batch_acc = correct / total if total > 0 else 0
                avg_valid_ratio = total_valid_ratio / total if total > 0 else 0
                print(f"Epoch {epoch+1}/{epochs} | Batch {batch_idx}/{len(train_loader)} | "
                      f"Loss: {loss.item():.4f} | Acc: {batch_acc:.4f} | Avg Valid Ratio: {avg_valid_ratio:.4f}")

        epoch_acc = correct / total if total > 0 else 0
        avg_valid_ratio_epoch = total_valid_ratio / total if total > 0 else 0
        print(f"Epoch {epoch+1} Summary | Train Loss: {total_loss:.4f} | Train Acc: {epoch_acc:.4f} | "
              f"Avg Valid Ratio: {avg_valid_ratio_epoch:.4f}")

        # 驗證
        val_acc = evaluate(model, val_loader, device)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict()

    print(f"Best Validation Accuracy: {best_val_acc:.4f}")
    model.load_state_dict(best_model_state)
    return model


# 路徑與設定
train_dir = './wlasl_features/train'
val_dir = './wlasl_features/val'
label_map = {name: idx for idx, name in enumerate(sorted(os.listdir(train_dir)))}
batch_size = 8
num_epochs = 40
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 資料加載
train_dataset = WLASLFeatureSequenceDataset(train_dir, label_map)
val_dataset = WLASLFeatureSequenceDataset(val_dir, label_map)
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, collate_fn=train_dataset.collate_fn)
val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, collate_fn=val_dataset.collate_fn)

# 訓練
model = train_model(train_loader, val_loader, num_classes=len(label_map), device=device, epochs=num_epochs)

# 儲存模型
torch.save(model.state_dict(), "wlasl_resnet_lstm_best.pth")
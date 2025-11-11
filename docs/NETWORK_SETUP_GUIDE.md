# 🚀 跨設備 API 配置指南

## 📱 快速設定步驟

### 1. 選擇您的使用場景

在 `constants/api.js` 中，修改 `DEVELOPMENT_MODE`：

```javascript
const NETWORK_CONFIG = {
  DEVELOPMENT_MODE: 'CROSS_DEVICE', // 👈 修改這裡
  // 選項：'LOCAL' | 'CROSS_DEVICE' | 'WIFI'
}
```

### 2. 使用場景說明

| 模式 | 使用時機 | 描述 |
|------|----------|------|
| `LOCAL` | 同一台電腦測試 | 使用 localhost，適合模擬器/瀏覽器 |
| `CROSS_DEVICE` | 跨設備開發 | 使用手機熱點 IP，適合手機/平板測試 |
| `WIFI` | WiFi 網路開發 | 使用家用/辦公室 WiFi IP |

### 3. 🔧 如何找到您的 IP 地址

#### Windows:
```bash
ipconfig
```
尋找 "無線區域網路介面卡 Wi-Fi" 或 "行動熱點" 的 IPv4 地址

#### Mac/Linux:
```bash
ifconfig
```
尋找 en0 或 wlan0 的 inet 地址

### 4. 📝 更新 IP 地址

在 `constants/api.js` 中更新對應的 IP：

```javascript
IPS: {
  HOTSPOT: 'http://172.20.10.3:3001',      // 👈 更新您的熱點 IP
  WIFI_HOME: 'http://192.168.1.100:3001',  // 👈 更新您的 WiFi IP
}
```

## 🔍 故障排除

### 問題：取得單詞失敗

1. **檢查伺服器是否啟動**
   ```bash
   cd server
   node server.js
   ```

2. **測試 API 連接**
   - 在瀏覽器訪問：`http://您的IP:3001/api/test`
   - 應該看到：`{"status":"success","message":"伺服器連接正常"}`

3. **檢查網路連接**
   - 確保設備連接到相同網路
   - 手機熱點：手機和測試設備都連到同一個熱點
   - WiFi：所有設備連到同一個 WiFi

### 問題：IP 地址經常變動

#### 解決方案 1：設定靜態 IP
- 在路由器設定中為您的電腦分配固定 IP

#### 解決方案 2：使用動態檢測
- 將來可以實作自動 IP 偵測功能

## 📊 網路狀態檢查

在 app 中，如果出現連接問題：
1. 會自動顯示錯誤提示
2. 點擊 "檢查網路連接" 會進行診斷
3. 查看 console 日誌了解詳細情況

## 🛠️ 開發小技巧

### 伺服器端日誌
伺服器啟動時會顯示：
```
🚀 Server is running at http://172.20.10.3:3001
```

### 客戶端日誌
app 中會顯示：
```
🔍 當前 API 配置: http://172.20.10.3:3001
📡 請求 URL: http://172.20.10.3:3001/api/book_words
✅ API 連接成功，獲取到 150 個單詞
```

## 📋 常用測試端點

- **基本連接測試**: `GET /api/test`
- **伺服器狀態**: `GET /api/status`
- **單詞列表**: `GET /api/book_words`

---

🎯 **記住**: 只需要修改 `DEVELOPMENT_MODE` 就能快速切換不同的網路配置！

MacOS:
ipconfig getifaddr en0 ->check ip

brew install ngrok -> connect

設定 ngrok 的 authtoken（只要設定一次）
前往註冊（免費）
打開以下網址 → https://dashboard.ngrok.com/signup
複製你的 authtoken，登入後到這頁：https://dashboard.ngrok.com/get-started/your-authtoken
你會看到一段指令，在 Terminal 執行它
ngrok config add-authtoken 30o0QI89ZKsJzIzx34NPdRzFLs2_259yBR7RP6RPGiT4iwuga

設定成功會看到：
Authtoken saved to configuration file: ~/.ngrok2/ngrok.yml

啟動 ngrok
ngrok http 8000
如果python model的FastAPI是使用其他port，更改8000為你使用的port
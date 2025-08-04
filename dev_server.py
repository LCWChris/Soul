import subprocess
import time
from pyngrok import ngrok
from dotenv import load_dotenv, set_key
from pathlib import Path
import os
import signal

# 設定路徑
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
FASTAPI_DIR = BASE_DIR / "app" / "(tabs)" / "translation" / "backend"
FASTAPI_APP = "main:app"
FASTAPI_PORT = 8000

# 切換到 FastAPI 目錄再啟動
os.chdir(FASTAPI_DIR)
print(f"📂 切換目錄到：{FASTAPI_DIR}")
print("🚀 啟動 FastAPI server...")

fastapi_proc = subprocess.Popen([
    "uvicorn", FASTAPI_APP, "--port", str(FASTAPI_PORT), "--reload"
])

time.sleep(2)

public_url = ngrok.connect(FASTAPI_PORT, bind_tls=True).public_url
print(f"✅ ngrok URL: {public_url}")

# 更新 .env
load_dotenv(dotenv_path=ENV_PATH)
set_key(ENV_PATH, "EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL", public_url)
print(f"✅ 已更新 .env 中的 EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL")

print("🌐 FastAPI 與 ngrok 隧道啟動中，按 Ctrl+C 結束")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("🛑 停止中...")
    fastapi_proc.send_signal(signal.SIGINT)
    ngrok.kill()
    print("✅ 已結束 uvicorn 與 ngrok")

#soul/dev_server.py
import subprocess
import time
from pyngrok import ngrok
from dotenv import load_dotenv, set_key
from pathlib import Path
import os
import signal
import sys

# 設定路徑
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
FASTAPI_DIR = BASE_DIR / "app" / "(tabs)" / "translation" / "backend"
SERVER_DIR = BASE_DIR / "server"

# 服務設定
FASTAPI_APP = "main:app"
FASTAPI_PORT = 8000
NODE_SERVER_PORT = 3001

print("🚀 Soul Learning Platform - 多服務啟動器")
print("=" * 50)

def start_fastapi():
    """啟動 FastAPI 服務"""
    os.chdir(FASTAPI_DIR)
    print(f"📂 切換目錄到：{FASTAPI_DIR}")
    print(f"🚀 啟動 FastAPI server (Port {FASTAPI_PORT})...")

    python_path = sys.executable
    proc = subprocess.Popen([
        python_path, "-m", "uvicorn", FASTAPI_APP,
        "--port", str(FASTAPI_PORT), "--reload", "--host", "0.0.0.0"
    ])
    return proc

def start_node_server():
    """啟動 Node.js Express 服務"""
    os.chdir(SERVER_DIR)
    print(f"📂 切換目錄到：{SERVER_DIR}")
    print(f"🟢 啟動 Node.js server (Port {NODE_SERVER_PORT})...")

    proc = subprocess.Popen([
        "node", "server.js"
    ], env={**os.environ, "PORT": str(NODE_SERVER_PORT)})
    return proc

# 啟動兩個服務
print("🔄 啟動服務中...")
fastapi_proc = start_fastapi()
time.sleep(2)

node_proc = start_node_server()
time.sleep(3)

# 建立 ngrok 隧道
print("\n🌐 建立 ngrok 隧道...")
try:
    fastapi_tunnel = ngrok.connect(str(FASTAPI_PORT), bind_tls=True)
    fastapi_url = fastapi_tunnel.public_url
    print(f"✅ FastAPI ngrok URL: {fastapi_url}")

    node_tunnel = ngrok.connect(str(NODE_SERVER_PORT), bind_tls=True)
    node_url = node_tunnel.public_url
    print(f"✅ Node.js ngrok URL: {node_url}")

    # 更新 .env 檔案（無引號模式）
    print("\n📝 更新 .env 檔案...")
    load_dotenv(dotenv_path=ENV_PATH)
    if fastapi_url:
        set_key(ENV_PATH, "EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL", fastapi_url, quote_mode="never")
        print(f"✅ 已更新 EXPO_PUBLIC_TRANSLATE_API_BACKEND_URL: {fastapi_url}")
    if node_url:
        set_key(ENV_PATH, "EXPO_PUBLIC_IP", node_url, quote_mode="never")
        print(f"✅ 已更新 EXPO_PUBLIC_IP: {node_url}")

    print("\n" + "=" * 60)
    print("🎉 所有服務已成功啟動！")
    print("=" * 60)
    print(f"📱 FastAPI (手語翻譯): {fastapi_url}")
    print(f"🗄️  Node.js (資料庫/Webhook): {node_url}")
    print(f"🔗 Webhook URL: {node_url}/api/webhook")
    print("=" * 60)
    print("💡 請重新啟動 Expo (npx expo start -c) 以載入最新 .env")
    print("按 Ctrl+C 停止所有服務")

except Exception as e:
    print(f"❌ ngrok 連接失敗: {e}")
    print("請檢查 ngrok 是否正確安裝並登入")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 正在停止所有服務...")

    try:
        fastapi_proc.terminate()
        print("✅ FastAPI 已停止")
    except:
        pass

    try:
        node_proc.terminate()
        print("✅ Node.js 已停止")
    except:
        pass

    try:
        ngrok.kill()
        print("✅ ngrok 隧道已關閉")
    except:
        pass

    print("🎯 所有服務已停止")

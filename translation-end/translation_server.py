# translation_server.py
# 專門用於啟動 FastAPI 翻譯服務 (不使用 ngrok)
# 適合：Render/Railway 等雲端平台部署

import subprocess
import sys
from pathlib import Path
import os
import signal

# 設定路徑（已改為 monorepo 結構下的 translation-end/backend）
BASE_DIR = Path(__file__).resolve().parent
FASTAPI_DIR = BASE_DIR / "backend"

# 服務設定
FASTAPI_APP = "main:app"
FASTAPI_PORT = int(os.getenv("PORT", 8000))  # 使用環境變數或預設 8000

print("🐍 FastAPI Translation Server")
print("=" * 50)
print(f"📂 工作目錄: {FASTAPI_DIR}")
print(f"🔌 Port: {FASTAPI_PORT}")
print("=" * 50)

def start_fastapi():
    """啟動 FastAPI 服務"""
    os.chdir(FASTAPI_DIR)
    print(f"📂 切換目錄到：{FASTAPI_DIR}")
    print(f"🚀 啟動 FastAPI server (Port {FASTAPI_PORT})...")

    python_path = sys.executable
    
    # 使用 0.0.0.0 讓服務可以被外部訪問
    proc = subprocess.Popen([
        python_path, "-m", "uvicorn", FASTAPI_APP,
        "--port", str(FASTAPI_PORT),
        "--host", "0.0.0.0",
        "--reload"  # 開發時自動重載
    ])
    return proc

# 啟動服務
print("🔄 啟動 FastAPI 服務...")
fastapi_proc = start_fastapi()

print("\n" + "=" * 60)
print("🎉 FastAPI 服務已啟動！")
print("=" * 60)
print(f"📱 本地訪問: http://localhost:{FASTAPI_PORT}")
print(f"📱 API 文檔: http://localhost:{FASTAPI_PORT}/docs")
print(f"🌐 網路訪問: http://0.0.0.0:{FASTAPI_PORT}")
print("=" * 60)
print("💡 這個腳本不使用 ngrok，適合雲端平台部署")
print("💡 如需測試，請使用 dev_translation.py")
print("按 Ctrl+C 停止服務")
print("=" * 60)

try:
    # 等待服務運行
    fastapi_proc.wait()
except KeyboardInterrupt:
    print("\n🛑 正在停止服務...")
    
    try:
        fastapi_proc.terminate()
        print("✅ FastAPI 已停止")
    except:
        pass
    
    print("🎯 服務已停止")

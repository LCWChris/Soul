# c:/Code/Soul/translation-end/dev_translation.py
import subprocess
import time
from pyngrok import ngrok
import os
import signal
import sys
from pathlib import Path

# --- Configuration ---
# The script is inside translation-end, and the FastAPI app is in the 'backend' subdirectory.
BASE_DIR = Path(__file__).resolve().parent
APP_DIR = BASE_DIR / "backend"
FASTAPI_APP = "main:app"  # Assuming your file is main.py and instance is app
FASTAPI_PORT = 8000

print("🚀 Soul Translation Service - Development Launcher")
print("=" * 50)

def start_fastapi():
    """Starts the FastAPI service."""
    if not APP_DIR.exists() or not (APP_DIR / "main.py").exists():
        print(f"❌ Error: Cannot find the application directory or main.py.")
        print(f"   - Searched in: {APP_DIR}")
        sys.exit(1)
        
    os.chdir(APP_DIR)
    print(f"📂 Working directory changed to: {APP_DIR}")
    print(f"🚀 Starting FastAPI server (Port {FASTAPI_PORT})...")

    # Use sys.executable to ensure we're using the same python interpreter
    python_path = sys.executable
    # Use Popen to run in the background
    proc = subprocess.Popen([
        python_path, "-m", "uvicorn", FASTAPI_APP,
        "--port", str(FASTAPI_PORT), "--host", "0.0.0.0"
    ])
    return proc

# --- Main Execution ---
fastapi_proc = None
try:
    # 1. Start FastAPI server
    fastapi_proc = start_fastapi()
    print("✅ FastAPI process started. Waiting for it to initialize...")
    time.sleep(5)  # Give server time to start

    # 2. Create ngrok tunnel
    print("\n🌐 Creating ngrok tunnel...")
    # Assumes you have configured your ngrok authtoken using the CLI:
    # ngrok config add-authtoken <YOUR_TOKEN>
    
    fastapi_tunnel = ngrok.connect(str(FASTAPI_PORT), bind_tls=True)
    fastapi_url = fastapi_tunnel.public_url
    
    print("\n" + "=" * 60)
    print("🎉 Service is live!")
    print("=" * 60)
    print(f"🔗 FastAPI Public URL: {fastapi_url}")
    print("=" * 60)
    print("💡 Copy the URL above and paste it into the Soul app's developer settings.")
    print("   Press Ctrl+C here to stop the server and ngrok tunnel.")
    print("=" * 60)

    # Keep the script running
    while True:
        time.sleep(1)

except Exception as e:
    print(f"\n❌ An error occurred: {e}")
    print("Please check if ngrok is installed and your authtoken is set.")

finally:
    print("\n🛑 Shutting down services...")

    if fastapi_proc:
        try:
            # Terminate the process gracefully
            if sys.platform == "win32":
                fastapi_proc.send_signal(signal.CTRL_C_EVENT)
            else:
                fastapi_proc.terminate()
            fastapi_proc.wait(timeout=5)
            print("✅ FastAPI server stopped.")
        except Exception as e:
            print(f"⚠️ Could not stop FastAPI server gracefully, killing it. Error: {e}")
            fastapi_proc.kill()
            print("✅ FastAPI server killed.")

    try:
        ngrok.kill()
        print("✅ ngrok tunnel closed.")
    except Exception as e:
        print(f"⚠️ Error closing ngrok: {e}")

    print("🎯 All services have been shut down.")

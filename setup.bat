@echo off
chcp 65001 >nul
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Soul Learning Platform                    ║
echo ║                        環境設置腳本                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 正在檢查系統環境...

:: 檢查 Python 版本
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤：未找到 Python，請先安裝 Python 3.12
    pause
    exit /b 1
)

echo ✅ Python 已安裝

:: 檢查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤：未找到 Node.js，請先安裝 Node.js 18+
    pause
    exit /b 1
)

echo ✅ Node.js 已安裝

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📦 步驟 1/5：建立 Python 虛擬環境
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if exist .venv (
    echo ⚠️  虛擬環境已存在，是否要重新建立？ [Y/N]
    set /p choice="請選擇: "
    if /i "%choice%"=="Y" (
        echo 🗑️  刪除舊的虛擬環境...
        rmdir /s /q .venv
    ) else (
        echo ⏭️  跳過虛擬環境建立
        goto activate_venv
    )
)

echo 🏗️  建立新的虛擬環境...
python -m venv .venv
if %errorlevel% neq 0 (
    echo ❌ 虛擬環境建立失敗！
    pause
    exit /b 1
)
echo ✅ 虛擬環境建立成功！

:activate_venv
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔧 步驟 2/5：啟動虛擬環境
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

call .venv\Scripts\activate
if %errorlevel% neq 0 (
    echo ❌ 虛擬環境啟動失敗！
    pause
    exit /b 1
)
echo ✅ 虛擬環境已啟動！

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ⬆️  步驟 3/5：升級 pip
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo ⚠️  pip 升級失敗，但會繼續安裝...
) else (
    echo ✅ pip 升級成功！
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📦 步驟 4/5：安裝 Python 依賴套件
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo 📋 正在安裝以下套件：
echo    • fastapi (網頁框架)
echo    • mediapipe (手語識別)
echo    • tensorflow (機器學習)
echo    • 以及其他依賴套件...
echo.

pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Python 套件安裝失敗！
    echo 🔧 嘗試個別安裝核心套件...
    pip install fastapi uvicorn[standard] python-multipart mediapipe opencv-python numpy python-dotenv pyngrok
    if %errorlevel% neq 0 (
        echo ❌ 核心套件安裝也失敗，請檢查網路連線
        pause
        exit /b 1
    )
)
echo ✅ Python 套件安裝成功！

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📦 步驟 5/5：安裝 Node.js 依賴套件
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npm install
cd server
npm install
if %errorlevel% neq 0 (
    echo ❌ Node.js 套件安裝失敗！
    pause
    exit /b 1
)
cd ..
echo ✅ Node.js 套件安裝成功！

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔍 驗證安裝
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo 🔍 檢查關鍵套件...
python -c "import mediapipe; print('✅ mediapipe 安裝成功')" 2>nul || echo "⚠️  mediapipe 可能有問題"
python -c "import fastapi; print('✅ fastapi 安裝成功')" 2>nul || echo "⚠️  fastapi 可能有問題"
python -c "import cv2; print('✅ opencv-python 安裝成功')" 2>nul || echo "⚠️  opencv-python 可能有問題"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        🎉 設置完成！                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ 所有依賴套件已安裝完成
echo ✅ 虛擬環境已設置完成
echo.
echo 🚀 接下來的啟動步驟：
echo.
echo    1️⃣  啟動後端服務：
echo        python dev_server.py
echo.
echo    2️⃣  啟動前端服務（開新的終端）：
echo        npx expo start
echo.
echo 💡 提示：
echo    • 每次開發前都要先啟動虛擬環境：.\.venv\Scripts\activate
echo    • 記得檢查 .env 檔案是否設置正確
echo    • 如果遇到問題，請查看終端錯誤訊息
echo.

pause

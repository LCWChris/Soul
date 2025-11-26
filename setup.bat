@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cls

echo.
echo ====================================================
echo              Soul Environment Settings
echo ====================================================
echo.

echo 🔍 正在檢查系統環境...

:: 檢查 Python 版本
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤：未找到 Python，請先安裝 Python 3.12+
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python 已安裝 (版本: %PYTHON_VERSION%)

:: 檢查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤：未找到 Node.js，請先安裝 Node.js 18+
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
echo ✅ Node.js 已安裝 (版本: %NODE_VERSION%)

:: 檢查 npm
echo 正在檢查 npm...
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  警告：未找到 npm，這可能會影響後續安裝
    echo    請確認 Node.js 安裝是否包含 npm，或手動安裝 npm
    echo    繼續執行安裝，但可能會失敗...
    set NPM_VERSION=未知
) else (
    echo ✅ npm 已安裝
)

echo.
echo ====================================================
echo 📦 步驟 1/5：建立 Python 虛擬環境
echo ====================================================

if exist .venv (
    echo ⚠️  虛擬環境已存在，是否要重新建立？ [Y/N]
    set /p choice="請選擇: "
    if /i "!choice!"=="Y" (
        echo 🗑️  刪除舊的虛擬環境...
        rmdir /s /q .venv
    ) else (
        echo ⏭️  跳過虛擬環境建立
        goto activate_venv
    )
)

echo 🏗️  建立新的虛擬環境...
call python -m venv .venv
if %errorlevel% neq 0 (
    echo ⚠️  虛擬環境建立失敗！請手動建立虛擬環境
    echo    命令：python -m venv .venv
    goto skip_venv
)
echo ✅ 虛擬環境建立成功！

:activate_venv
echo.
echo ====================================================
echo 🔧 步驟 2/5：啟動虛擬環境
echo ====================================================

call .venv\Scripts\activate
if %errorlevel% neq 0 (
    echo ⚠️  虛擬環境啟動失敗！請手動啟動虛擬環境
    echo    命令：.venv\Scripts\activate
    goto skip_venv
)
echo ✅ 虛擬環境已啟動！

:skip_venv

echo.
echo ====================================================
echo ⬆️  步驟 3/5：升級 pip
echo ====================================================

python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo ⚠️  pip 升級失敗，但會繼續安裝...
) else (
    echo ✅ pip 升級成功！
)

echo.
echo ====================================================
echo 📦 步驟 4/6：安裝翻譯後端 Python 依賴套件
echo ====================================================

if not exist "translation-end" (
    echo ⚠️  警告：找不到 translation-end 目錄！
    echo    請確認專案結構正確
    goto skip_translation
)

echo 🔄 正在安裝翻譯後端的 Python 套件...
echo 📋 套件包含：
echo    - fastapi (網頁框架)
echo    - mediapipe (手語識別)
echo    - tensorflow (機器學習)
echo    - opencv-python (影像處理)
echo    - 以及其他依賴套件...
echo.

cd translation-end
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ⚠️  翻譯後端 Python 套件安裝失敗！
    echo 🔧 嘗試個別安裝核心套件...
    call pip install fastapi uvicorn[standard] python-multipart mediapipe opencv-python numpy python-dotenv tensorflow
    if %errorlevel% neq 0 (
        echo ⚠️  核心套件安裝也失敗，請稍後手動安裝
        echo    命令：cd translation-end ^&^& pip install -r requirements.txt
    ) else (
        echo ✅ 翻譯後端 Python 套件安裝成功！
    )
) else (
    echo ✅ 翻譯後端 Python 套件安裝成功！
)
cd ..

:skip_translation

echo.
echo ====================================================
echo 📦 步驟 5/6：安裝後端服務 Node.js 依賴套件
echo ====================================================

if not exist "back-end\server" (
    echo ⚠️  警告：找不到 back-end\server 目錄！
    echo    請確認專案結構正確
    goto skip_backend
)

echo 🔄 正在安裝後端服務的 Node.js 套件...
echo 📋 套件包含：
echo    - express (後端框架)
echo    - mongoose (MongoDB 連接)
echo    - 以及其他依賴套件...
echo.

cd back-end\server
call npm install
if %errorlevel% neq 0 (
    echo ⚠️  後端服務 Node.js 套件安裝失敗！
    echo 🔧 嘗試清除 cache 後重新安裝...
    call npm cache clean --force 2>nul
    call npm install
    if %errorlevel% neq 0 (
        echo ⚠️  重試後仍然失敗，請稍後手動安裝
        echo    命令：cd back-end\server ^&^& npm install
    ) else (
        echo ✅ 後端服務 Node.js 套件安裝成功！
    )
) else (
    echo ✅ 後端服務 Node.js 套件安裝成功！
)
cd ..\..

:skip_backend

echo.
echo ====================================================
echo 📦 步驟 6/6：安裝前端 React Native 依賴套件
echo ====================================================

if not exist "front-end" (
    echo ⚠️  警告：找不到 front-end 目錄！
    echo    請確認專案結構正確
    goto skip_frontend
)

echo 🔄 正在安裝前端的 Node.js 套件...
echo 📋 套件包含：
echo    - expo (React Native 框架)
echo    - expo-router (路由管理)
echo    - 以及其他依賴套件...
echo.
echo ⏰ 這可能需要較長時間（5-10分鐘），請耐心等待...
echo.

cd front-end
call npm install
if %errorlevel% neq 0 (
    echo ⚠️  前端 Node.js 套件安裝失敗！
    echo 🔧 嘗試清除 cache 後重新安裝...
    call npm cache clean --force 2>nul
    call npm install
    if %errorlevel% neq 0 (
        echo ⚠️  重試後仍然失敗，請稍後手動安裝
        echo    命令：cd front-end ^&^& npm install
    ) else (
        echo ✅ 前端 Node.js 套件安裝成功！
    )
) else (
    echo ✅ 前端 Node.js 套件安裝成功！
)
cd ..

:skip_frontend

echo.
echo ====================================================
echo 🔍 驗證安裝
echo ====================================================
echo.

echo 📦 檢查 Python 關鍵套件...
call python -c "import mediapipe; print('   ✅ mediapipe')" 2>nul || echo "   ⚠️  mediapipe 可能有問題"
call python -c "import fastapi; print('   ✅ fastapi')" 2>nul || echo "   ⚠️  fastapi 可能有問題"
call python -c "import cv2; print('   ✅ opencv-python')" 2>nul || echo "   ⚠️  opencv-python 可能有問題"
call python -c "import tensorflow; print('   ✅ tensorflow')" 2>nul || echo "   ⚠️  tensorflow 可能有問題"

echo.
echo 📦 檢查專案目錄結構...
if exist "translation-end\requirements.txt" (echo    ✅ translation-end) else (echo    ❌ translation-end)
if exist "back-end\server\package.json" (echo    ✅ back-end\server) else (echo    ❌ back-end\server)
if exist "front-end\package.json" (echo    ✅ front-end) else (echo    ❌ front-end)
if exist "front-end\node_modules" (echo    ✅ front-end 套件已安裝) else (echo    ⚠️  front-end 套件可能未完全安裝)

echo.
echo ====================================================
echo                    🎉 環境設置完成！
echo ====================================================
echo.
echo ✅ Python 虛擬環境已建立
echo ✅ 翻譯後端 (translation-end) Python 套件已安裝
echo ✅ 資料庫後端 (back-end/server) Node.js 套件已安裝
echo ✅ 前端應用 (front-end) Node.js 套件已安裝
echo.
echo ====================================================
echo 🚀 啟動服務的步驟
echo ====================================================
echo.
echo 1️⃣  啟動翻譯 API 服務 (終端 1)
echo    cd translation-end
echo    ..\\.venv\Scripts\activate
echo    python main.py
echo.
echo 2️⃣  啟動資料庫後端服務 (終端 2)
echo    cd back-end\server
echo    node server.js
echo.
echo 3️⃣  啟動前端應用 (終端 3)
echo    cd front-end
echo    npx expo start
echo.
echo ====================================================
echo 📝 重要提示
echo ====================================================
echo.
echo ⚙️  環境變數設定：
echo    - translation-end\.env - 翻譯 API 設定
echo    - back-end\.env - 資料庫連線設定
echo    - front-end\.env - 前端 API 連線設定
echo.
echo 💡 開發提示：
echo    - 每次啟動翻譯服務前要先啟動虛擬環境
echo    - 三個服務要分別在不同終端執行
echo    - 確保 MongoDB 資料庫已啟動
echo    - 建議使用 VS Code 的多終端功能
echo.
echo 🔧 如果遇到問題：
echo    1. 檢查上方的套件驗證結果
echo    2. 確認 .env 檔案是否正確設置
echo    3. 查看各服務的終端錯誤訊息
echo    4. 嘗試重新執行 setup.bat
echo.

pause

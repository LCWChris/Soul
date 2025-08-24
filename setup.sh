#!/bin/bash

# Soul Learning Platform 環境設置腳本 (Mac/Linux)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Soul Learning Platform                    ║"
echo "║                        環境設置腳本                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo

echo "🔍 正在檢查系統環境..."

# 檢查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤：未找到 Python3，請先安裝 Python 3.8+"
    exit 1
fi
echo "✅ Python3 已安裝"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤：未找到 Node.js，請先安裝 Node.js 18+"
    exit 1
fi
echo "✅ Node.js 已安裝"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 步驟 1/5：建立 Python 虛擬環境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".venv" ]; then
    echo "⚠️  虛擬環境已存在，是否要重新建立？ [y/N]"
    read -r choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        echo "🗑️  刪除舊的虛擬環境..."
        rm -rf .venv
    else
        echo "⏭️  跳過虛擬環境建立"
        source .venv/bin/activate
        echo "✅ 虛擬環境已啟動！"
        goto_pip=true
    fi
fi

if [ "$goto_pip" != true ]; then
    echo "🏗️  建立新的虛擬環境..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "❌ 虛擬環境建立失敗！"
        exit 1
    fi
    echo "✅ 虛擬環境建立成功！"

    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 步驟 2/5：啟動虛擬環境"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    source .venv/bin/activate
    if [ $? -ne 0 ]; then
        echo "❌ 虛擬環境啟動失敗！"
        exit 1
    fi
    echo "✅ 虛擬環境已啟動！"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⬆️  步驟 3/5：升級 pip"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

python -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo "⚠️  pip 升級失敗，但會繼續安裝..."
else
    echo "✅ pip 升級成功！"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 步驟 4/5：安裝 Python 依賴套件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 正在安裝以下套件："
echo "   • fastapi (網頁框架)"
echo "   • mediapipe (手語識別)"
echo "   • tensorflow (機器學習)"
echo "   • 以及其他依賴套件..."
echo

pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Python 套件安裝失敗！"
    echo "🔧 嘗試個別安裝核心套件..."
    pip install fastapi uvicorn[standard] python-multipart mediapipe opencv-python numpy python-dotenv pyngrok
    if [ $? -ne 0 ]; then
        echo "❌ 核心套件安裝也失敗，請檢查網路連線"
        exit 1
    fi
fi
echo "✅ Python 套件安裝成功！"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 步驟 5/5：安裝 Node.js 依賴套件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔄 正在安裝主目錄的 Node.js 套件..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 主目錄 Node.js 套件安裝失敗！"
    exit 1
fi
echo "✅ 主目錄 Node.js 套件安裝成功！"

echo "🔄 正在安裝 server 目錄的 Node.js 套件..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ server 目錄 Node.js 套件安裝失敗！"
    cd ..
    exit 1
fi
cd ..
echo "✅ 所有 Node.js 套件安裝成功！"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 驗證安裝"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 檢查關鍵套件..."
python -c "import mediapipe; print('✅ mediapipe 安裝成功')" 2>/dev/null || echo "⚠️  mediapipe 可能有問題"
python -c "import fastapi; print('✅ fastapi 安裝成功')" 2>/dev/null || echo "⚠️  fastapi 可能有問題"
python -c "import cv2; print('✅ opencv-python 安裝成功')" 2>/dev/null || echo "⚠️  opencv-python 可能有問題"

echo
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                        🎉 設置完成！                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo
echo "✅ 所有依賴套件已安裝完成"
echo "✅ 虛擬環境已設置完成"
echo
echo "🚀 接下來的啟動步驟："
echo
echo "   1️⃣  啟動後端服務："
echo "       python dev_server.py"
echo
echo "   2️⃣  啟動前端服務（開新的終端）："
echo "       npx expo start"
echo
echo "💡 提示："
echo "   • 每次開發前都要先啟動虛擬環境：source .venv/bin/activate"
echo "   • 記得檢查 .env 檔案是否設置正確"
echo "   • 如果遇到問題，請查看終端錯誤訊息"
echo

echo "按任意鍵繼續..."
read -r

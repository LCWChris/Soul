#!/bin/bash

# 設置顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Soul Learning Platform                    ║"
echo "║                        環境設置腳本                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🔍 正在檢查系統環境...${NC}"

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 錯誤：未找到 Python，請先安裝 Python 3.12${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python 已安裝${NC}"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 錯誤：未找到 Node.js，請先安裝 Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 已安裝${NC}"

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 步驟 1/5：建立 Python 虛擬環境${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  虛擬環境已存在，是否要重新建立？ [y/N]${NC}"
    read -p "請選擇: " choice
    case "$choice" in 
        y|Y ) 
            echo -e "${YELLOW}🗑️  刪除舊的虛擬環境...${NC}"
            rm -rf .venv
            ;;
        * ) 
            echo -e "${CYAN}⏭️  跳過虛擬環境建立${NC}"
            ;;
    esac
fi

if [ ! -d ".venv" ]; then
    echo -e "${CYAN}🏗️  建立新的虛擬環境...${NC}"
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 虛擬環境建立失敗！${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 虛擬環境建立成功！${NC}"
fi

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 步驟 2/5：啟動虛擬環境${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

source .venv/bin/activate
echo -e "${GREEN}✅ 虛擬環境已啟動！${NC}"

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⬆️  步驟 3/5：升級 pip${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

python -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  pip 升級失敗，但會繼續安裝...${NC}"
else
    echo -e "${GREEN}✅ pip 升級成功！${NC}"
fi

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 步驟 4/5：安裝 Python 依賴套件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}📋 正在安裝以下套件：${NC}"
echo "   • fastapi (網頁框架)"
echo "   • mediapipe (手語識別)"
echo "   • tensorflow (機器學習)"
echo "   • 以及其他依賴套件..."
echo

pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Python 套件安裝失敗！${NC}"
    echo -e "${YELLOW}🔧 嘗試個別安裝核心套件...${NC}"
    pip install fastapi uvicorn[standard] python-multipart mediapipe opencv-python numpy python-dotenv pyngrok
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 核心套件安裝也失敗，請檢查網路連線${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Python 套件安裝成功！${NC}"

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 步驟 5/5：安裝 Node.js 依賴套件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Node.js 套件安裝失敗！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 套件安裝成功！${NC}"

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 驗證安裝${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}🔍 檢查關鍵套件...${NC}"
python -c "import mediapipe; print('✅ mediapipe 安裝成功')" 2>/dev/null || echo "⚠️  mediapipe 可能有問題"
python -c "import fastapi; print('✅ fastapi 安裝成功')" 2>/dev/null || echo "⚠️  fastapi 可能有問題"
python -c "import cv2; print('✅ opencv-python 安裝成功')" 2>/dev/null || echo "⚠️  opencv-python 可能有問題"

echo
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                        🎉 設置完成！                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo
echo -e "${GREEN}✅ 所有依賴套件已安裝完成${NC}"
echo -e "${GREEN}✅ 虛擬環境已設置完成${NC}"
echo
echo -e "${CYAN}🚀 接下來的啟動步驟：${NC}"
echo
echo -e "${YELLOW}   1️⃣  啟動後端服務：${NC}"
echo "       python dev_server.py"
echo
echo -e "${YELLOW}   2️⃣  啟動前端服務（開新的終端）：${NC}"
echo "       npx expo start"
echo
echo -e "${BLUE}💡 提示：${NC}"
echo "   • 每次開發前都要先啟動虛擬環境：source .venv/bin/activate"
echo "   • 記得檢查 .env 檔案是否設置正確"
echo "   • 如果遇到問題，請查看終端錯誤訊息"
echo

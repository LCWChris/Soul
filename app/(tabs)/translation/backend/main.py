# soul/app/(tabs)/translation/backend/main.py
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # 新增: 引入 BaseModel
import os
import uuid
# 💥 確保能正確導入新的 model_infer.py
from model_infer import predict
from dotenv import load_dotenv
import motor.motor_asyncio
from datetime import datetime
import requests

# 讀取 .env（可設定 MONGO_URL）
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL")
if MONGO_URL:
    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = mongo_client.tsl_app
    vocab_collection = db.vocabularies

# ----------------------------------------------------
# 輔助函數：標準化模型輸出
# ----------------------------------------------------

def format_model_output(top3: list) -> dict:
    """
    將 model_infer.py 的 Top-3 輸出轉換為前端期待的單一 JSON 結構。
    """
    if not top3 or "label" not in top3[0] or "error" in top3[0]:
        # 推論失敗 (例如 "影格不足或手部未偵測") 或嚴重錯誤
        best_label = top3[0].get("label", "無法識別") if top3 else "無法識別"
        
        # ⚠️ 關鍵：返回 0.0% 讓前端 10% 邏輯啟動
        return {
            "translation": best_label,
            "confidence_score": 0.0
        }
    
    # 成功推論，取 Top-1
    best = top3[0]
    
    # ⚠️ 關鍵：將 0.xx 轉換為 0.0 ~ 100.0 的百分比
    confidence_percent = round(best['confidence'] * 100, 1)
    
    return {
        "translation": best['label'],
        "confidence_score": confidence_percent
    }

# ----------------------------------------------------
# 路由定義
# ----------------------------------------------------

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    # 處理檔案上傳的翻譯 (此路由現在也返回標準化 JSON)
    file_path = None
    try:
        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        top3 = predict(file_path)

        print("🔍 Top-3 預測：", top3)
        return JSONResponse(content=format_model_output(top3))

    except Exception as e:
        print(f"❌ 檔案翻譯錯誤: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

@app.post("/translate-by-url")
async def translate_by_url(request: Request):
    # 處理 URL 下載的翻譯 (此路由現在返回標準化 JSON)
    file_path = None
    try:
        data = await request.json()
        video_url = data.get("video_url")

        if not video_url:
            raise HTTPException(status_code=400, detail="video_url 缺失")

        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        # 下載影片
        r = requests.get(video_url, timeout=30) # 設置下載超時
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail=f"下載影片失敗，狀態碼: {r.status_code}")
            
        with open(file_path, "wb") as f:
            f.write(r.content)

        top3 = predict(file_path)
        
        print("🌐 Cloudinary URL 翻譯 Top-3：", top3)
        return JSONResponse(content=format_model_output(top3))

    except Exception as e:
        print(f"❌ URL 翻譯錯誤: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

@app.post("/save-cloudinary-url")
async def save_cloudinary_url(request: Request):
    # 影片儲存 API 保持不變
    try:
        data = await request.json()
        title = data.get("title")
        video_url = data.get("video_url")

        print(f"✅ 收到影片標題：{title}")
        print(f"✅ Cloudinary 影片網址：{video_url}")

        if MONGO_URL:
            record = {
                "title": title,
                "video_url": video_url,
                "created_by": "frontend",
                "created_at": datetime.utcnow().isoformat(),
            }
            result = await vocab_collection.insert_one(record)
            print(f"✅ MongoDB 已儲存，_id: {result.inserted_id}")

        return JSONResponse(content={"message": "URL 已儲存"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
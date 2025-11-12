# //Soul/app/(tabs)/translation/backend/main.py
# (v9 - 💥 轉檔 30fps + 像素過濾 💥)

from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import requests
import ffmpeg # 💥 [v9] 導入 ffmpeg
import warnings

# 💥 導入 v9 的模型載入器和預測器
from model_infer import load_v9_model, predict

from dotenv import load_dotenv
import motor.motor_asyncio
from datetime import datetime

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
# 1. 啟動時載入 v9 模型
# ----------------------------------------------------
@app.on_event("startup")
def startup_event():
    if not load_v9_model():
        print("--- 警告: v9 模型載入失敗，API 將無法正常運作 ---")

# ----------------------------------------------------
# 2. 輔助函數：標準化模型輸出 (v9)
# ----------------------------------------------------

def format_model_output(top3: list) -> dict:
    if not top3 or "label" not in top3[0] or "error" in top3[0]:
        best_label = top3[0].get("label", "無法識別") if top3 else "無法識別"
        return {
            "translation": best_label,
            "confidence_score": 0.0
        }
    
    best = top3[0]
    confidence_percent = round(best['confidence'] * 100, 1)
    
    return {
        "translation": best['label'],
        "confidence_score": confidence_percent
    }

# ----------------------------------------------------
# 3. FastAPI 路由
# ----------------------------------------------------

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    # (此路由用於本地檔案上傳，假設也需要轉檔)
    file_path = None
    transcoded_path = None
    try:
        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)
        transcoded_path = os.path.join(save_dir, f"30fps_{filename}")

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # 💥 [v9] 執行 30 FPS 轉檔
        print(f"正在將 {file_path} 轉檔為 30 FPS...")
        ffmpeg.input(file_path).output(transcoded_path, r=30).run(overwrite_output=True, quiet=True)
        print("轉檔完成。")

        top3 = predict(transcoded_path) # 💥 呼叫 v9 的 predict

        print("🔍 Top-3 預測：", top3)
        return JSONResponse(content=format_model_output(top3))

    except Exception as e:
        print(f"❌ 檔案翻譯錯誤: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if file_path and os.path.exists(file_path): os.remove(file_path)
        if transcoded_path and os.path.exists(transcoded_path): os.remove(transcoded_path)

@app.post("/translate-by-url")
async def translate_by_url(request: Request):
    file_path = None
    transcoded_path = None
    try:
        data = await request.json()
        video_url = data.get("video_url")

        if not video_url:
            raise HTTPException(status_code=400, detail="video_url 缺失")

        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)
        transcoded_path = os.path.join(save_dir, f"30fps_{filename}")

        r = requests.get(video_url, timeout=30)
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail=f"下載影片失敗，狀態碼: {r.status_code}")
            
        with open(file_path, "wb") as f:
            f.write(r.content)

        # 💥 [v9] 執行 30 FPS 轉檔
        print(f"正在將 {file_path} 轉檔為 30 FPS...")
        ffmpeg.input(file_path).output(transcoded_path, r=30).run(overwrite_output=True, quiet=True)
        print("轉檔完成。")
        
        top3 = predict(transcoded_path) # 💥 呼叫 v9 的 predict
        
        print("🌐 Cloudinary URL 翻譯 Top-3：", top3)
        return JSONResponse(content=format_model_output(top3))

    except Exception as e:
        print(f"❌ URL 翻譯錯誤: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if file_path and os.path.exists(file_path): os.remove(file_path)
        if transcoded_path and os.path.exists(transcoded_path): os.remove(transcoded_path)

@app.post("/save-cloudinary-url")
async def save_cloudinary_url(request: Request):
    # (此路由保持不變)
    try:
        data = await request.json()
        title = data.get("title")
        video_url = data.get("video_url")
        if MONGO_URL:
            record = { "title": title, "video_url": video_url, "created_by": "frontend", "created_at": datetime.utcnow().isoformat() }
            await vocab_collection.insert_one(record)
        return JSONResponse(content={"message": "URL 已儲存"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})